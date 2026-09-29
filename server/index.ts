import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbStore } from './db/dbStore.js';
import { aiService } from './services/aiService.js';
import { initServerSupabase, supabase } from './db/supabaseClient.js';
import { initialDeals, initialCustomers, initialStakeholders, initialInteractions, initialMemories, initialCompetitors, initialRecommendations, initialMeetings } from './db/seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. DASHBOARD ANALYTICS & ALL DEALS
app.get('/api/deals', async (req, res) => {
  try {
    const deals = await dbStore.getDeals();

    const totalActive = deals.filter((d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
    const requiringAttention = deals.filter((d) => d.risk_level === 'High' || d.deal_health === 'At Risk' || d.deal_health === 'Critical').length;
    const atRisk = deals.filter((d) => d.risk_level === 'High' || d.risk_level === 'Medium').length;
    const closingSoon = deals.filter((d) => d.stage === 'Negotiation' || d.stage === 'Proposal').length;
    
    const wonDeals = deals.filter((d) => d.stage === 'Closed Won').length;
    const closedDeals = deals.filter((d) => d.stage === 'Closed Won' || d.stage === 'Closed Lost').length;
    const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 75;

    const pipelineValue = deals
      .filter((d) => d.stage !== 'Closed Lost')
      .reduce((sum, d) => sum + Number(d.value), 0);

    res.json({
      summary: {
        totalActive,
        requiringAttention,
        atRisk,
        closingSoon,
        winRate,
        pipelineValue,
      },
      deals,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 2. CREATE NEW DEAL
app.post('/api/deals', async (req, res) => {
  try {
    const newDeal = await dbStore.createDeal(req.body);
    res.status(201).json(newDeal);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 3. GET SINGLE DEAL DETAILS
app.get('/api/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await dbStore.getDealById(id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const customer = await dbStore.getCustomerByDealId(id);
    const stakeholders = await dbStore.getStakeholdersByDealId(id);
    const competitors = await dbStore.getCompetitorsByDealId(id);
    const recommendation = await dbStore.getRecommendationByDealId(id);
    const memories = await dbStore.getMemoriesByDealId(id);
    const meetings = await dbStore.getMeetingsByDealId(id);

    res.json({
      deal,
      customer,
      stakeholders,
      competitors,
      recommendation,
      meetings,
      memoriesCount: memories.length,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 4. GET DEAL INTERACTIONS
app.get('/api/deals/:id/interactions', async (req, res) => {
  try {
    const { id } = req.params;
    const interactions = await dbStore.getInteractionsByDealId(id);
    res.json(interactions);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 5. POST NEW INTERACTION (AI EXTRACTION & MEMORY PIPELINE)
app.post('/api/deals/:id/interactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, content, participants, date } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Interaction content is required' });
    }

    const deal = await dbStore.getDealById(id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    // Step 1: Save interaction record
    const interaction = await dbStore.addInteraction(id, {
      type: type || 'Call',
      title: title || `${type || 'Call'} Interaction`,
      content,
      participants: participants || ['Alex Morgan'],
      date: date || new Date().toISOString().split('T')[0],
    });

    // Step 2: Retrieve existing deal memories
    const existingMemories = await dbStore.getMemoriesByDealId(id);

    // Step 3: Run AI extraction pipeline
    const extraction = await aiService.analyzeAndExtract(
      deal,
      content,
      interaction.type,
      existingMemories
    );

    // Step 4: Save extracted memories
    const newMemoriesToSave = extraction.memories.map((m) => ({
      interaction_id: interaction.id,
      memory_type: m.memory_type,
      content: m.content,
      importance: m.importance,
      date: interaction.date,
      source_type: interaction.type,
    }));
    const savedMemories = await dbStore.addMemories(id, newMemoriesToSave);

    // Step 5: Update extracted stakeholders
    for (const sh of extraction.stakeholdersExtracted) {
      await dbStore.addStakeholder(id, sh);
    }

    // Step 6: Update extracted competitors
    for (const comp of extraction.competitorsExtracted) {
      await dbStore.addOrUpdateCompetitor(id, comp);
    }

    // Step 7: Update deal recommendation, risk level & next best action
    const updatedRecommendation = await dbStore.updateRecommendation(id, extraction.nextBestAction);

    // Step 8: Update Customer requirements if critical
    const customer = await dbStore.getCustomerByDealId(id);
    if (customer && extraction.memories.some((m) => m.memory_type === 'Requirement')) {
      const newReqs = extraction.memories
        .filter((m) => m.memory_type === 'Requirement')
        .map((m) => m.content);
      const updatedReqs = Array.from(new Set([...(customer.company_requirements || []), ...newReqs]));
      await dbStore.updateCustomer(id, { company_requirements: updatedReqs });
    }

    res.status(201).json({
      success: true,
      interaction,
      extractedMemories: savedMemories,
      extractionSummary: {
        buyingSignals: extraction.buyingSignals,
        risksExtracted: extraction.risksExtracted,
        actionItems: extraction.actionItems,
      },
      updatedRecommendation,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 6. MEETINGS SCHEDULER
app.get('/api/deals/:id/meetings', async (req, res) => {
  try {
    const { id } = req.params;
    const meetings = await dbStore.getMeetingsByDealId(id);
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/deals/:id/meetings', async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await dbStore.scheduleMeeting(id, req.body);
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 7. MEMORY SEARCH & TIMELINE
app.get('/api/deals/:id/memories', async (req, res) => {
  try {
    const { id } = req.params;
    const query = (req.query.q as string) || '';

    if (query.trim()) {
      const searchResults = await dbStore.searchMemories(id, query);
      return res.json({ query, memories: searchResults });
    }

    const memories = await dbStore.getMemoriesByDealId(id);
    res.json({ query: '', memories });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 8. GET AI DEAL BRIEF
app.get('/api/deals/:id/brief', async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await dbStore.getDealById(id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const customer = await dbStore.getCustomerByDealId(id);
    const stakeholders = await dbStore.getStakeholdersByDealId(id);
    const memories = await dbStore.getMemoriesByDealId(id);
    const competitors = await dbStore.getCompetitorsByDealId(id);
    const recommendation = await dbStore.getRecommendationByDealId(id);

    const brief = await aiService.generateBrief(
      deal,
      customer,
      stakeholders,
      memories,
      competitors,
      recommendation
    );

    res.json(brief);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 9. GET "BRIEF ME" BEFORE-CALL BRIEFING
app.get('/api/deals/:id/before-call-brief', async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await dbStore.getDealById(id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const customer = await dbStore.getCustomerByDealId(id);
    const stakeholders = await dbStore.getStakeholdersByDealId(id);
    const memories = await dbStore.getMemoriesByDealId(id);
    const competitors = await dbStore.getCompetitorsByDealId(id);

    const beforeCallBrief = await aiService.generateBeforeCallBrief(
      deal,
      customer,
      stakeholders,
      memories,
      competitors
    );

    res.json(beforeCallBrief);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 10. NEXT BEST ACTION & RISK DETECTION
app.get('/api/deals/:id/recommendation', async (req, res) => {
  try {
    const { id } = req.params;
    const recommendation = await dbStore.getRecommendationByDealId(id);
    res.json(recommendation);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 11. RISKS
app.get('/api/deals/:id/risks', async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await dbStore.getDealById(id);
    const recommendation = await dbStore.getRecommendationByDealId(id);
    const memories = await dbStore.getMemoriesByDealId(id);

    const unresolvedObjections = memories.filter((m) => m.memory_type === 'Objection' && !m.resolved);

    res.json({
      dealId: id,
      riskLevel: recommendation?.risk_level || deal?.risk_level || 'Medium',
      reason: recommendation?.risk_reason || 'Customer objections regarding implementation timeline remain active.',
      recommendedMitigation: recommendation?.risk_mitigation || 'Deliver a structured 30-day onboarding plan.',
      unresolvedObjectionsCount: unresolvedObjections.length,
      unresolvedObjections: unresolvedObjections.map((o) => o.content),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 12. AI CHAT ASSISTANT
app.post('/api/deals/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message query is required' });
    }

    const deal = await dbStore.getDealById(id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const customer = await dbStore.getCustomerByDealId(id);
    const stakeholders = await dbStore.getStakeholdersByDealId(id);
    const memories = await dbStore.getMemoriesByDealId(id);
    const competitors = await dbStore.getCompetitorsByDealId(id);
    const interactions = await dbStore.getInteractionsByDealId(id);

    await dbStore.addChatMessage(id, 'user', message);

    const chatResponse = await aiService.answerDealQuestion(
      deal,
      message,
      customer,
      stakeholders,
      memories,
      competitors,
      interactions
    );

    await dbStore.addChatMessage(id, 'assistant', chatResponse.answer);

    res.json({
      answer: chatResponse.answer,
      retrievedMemories: chatResponse.retrievedMemories,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 13. SUPABASE CONNECT & AUTO-SEED ENDPOINT
app.get('/api/supabase/status', (req, res) => {
  res.json({
    connected: !!supabase,
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null,
  });
});

app.post('/api/supabase/connect', async (req, res) => {
  try {
    const { url, key } = req.body;
    if (!url || !key) return res.status(400).json({ error: 'Supabase URL and API Key are required' });

    const success = initServerSupabase(url, key);
    if (!success || !supabase) {
      return res.status(400).json({ error: 'Failed to connect to Supabase with provided credentials' });
    }

    // Try seeding initial demo tables into Supabase automatically
    try {
      await supabase.from('deals').upsert(initialDeals);
      await supabase.from('customers').upsert(Object.values(initialCustomers));
      for (const shList of Object.values(initialStakeholders)) {
        await supabase.from('stakeholders').upsert(shList);
      }
      for (const intList of Object.values(initialInteractions)) {
        await supabase.from('interactions').upsert(intList);
      }
      for (const memList of Object.values(initialMemories)) {
        await supabase.from('deal_memories').upsert(memList);
      }
      for (const compList of Object.values(initialCompetitors)) {
        await supabase.from('competitors').upsert(compList);
      }
      await supabase.from('recommendations').upsert(Object.values(initialRecommendations));
      for (const mtgList of Object.values(initialMeetings)) {
        await supabase.from('scheduled_meetings').upsert(mtgList);
      }
      console.log('✅ Automatically seeded demo datasets into Supabase!');
    } catch (seedErr) {
      console.warn('Supabase auto-seed warning (run supabase_schema.sql if tables do not exist yet):', (seedErr as Error).message);
    }

    res.json({
      success: true,
      message: 'Supabase connected and synced with live Realtime subscription support!',
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 14. RESET DEMO DATASET
app.post('/api/reset', (req, res) => {
  dbStore.resetToSeed();
  res.json({ message: 'Deal database reset to demo seed state' });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`NexusAI Deal Intelligence Server running on port ${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
  console.log(`==================================================`);
});
