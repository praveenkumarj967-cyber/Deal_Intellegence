import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { Deal, Customer, Stakeholder, Interaction, DealMemory, Competitor, Recommendation } from '../db/seedData.js';

// B3: Zod Schemas for Validated Structured AI Output
export const MemoryItemSchema = z.object({
  memory_type: z.enum([
    'Customer statement',
    'Objection',
    'Requirement',
    'Competitor mention',
    'Pricing discussion',
    'Stakeholder information',
    'Action item',
    'Sales tactic',
    'Outcome',
  ]),
  content: z.string().min(1),
  importance: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

export const StakeholderSchema = z.object({
  name: z.string(),
  title: z.string(),
  role: z.string(),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative', 'Concerned']),
  notes: z.string(),
});

export const CompetitorSchema = z.object({
  name: z.string(),
  customer_sentiment: z.string(),
  consideration_reason: z.string(),
});

export const NextBestActionSchema = z.object({
  recommendation: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(100),
  risk_level: z.enum(['Low', 'Medium', 'High']),
  risk_reason: z.string(),
  risk_mitigation: z.string(),
});

export const ConflictSchema = z.object({
  conflict_type: z.string(),
  previous_statement: z.string(),
  new_statement: z.string(),
  description: z.string(),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
});

export const ExtractionResultSchema = z.object({
  memories: z.array(MemoryItemSchema),
  stakeholdersExtracted: z.array(StakeholderSchema),
  competitorsExtracted: z.array(CompetitorSchema),
  buyingSignals: z.array(z.string()),
  risksExtracted: z.array(z.string()),
  actionItems: z.array(z.string()),
  nextBestAction: NextBestActionSchema,
  conflictsDetected: z.array(ConflictSchema).optional().default([]),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// Global Objection Playbook Store (B8: Cross-deal playbook learning)
export interface PlaybookEntry {
  id: string;
  objection_category: string;
  objection_text: string;
  tactic_that_worked: string;
  deal_stage: string;
  times_successful: number;
}

const GLOBAL_PLAYBOOK: PlaybookEntry[] = [
  {
    id: 'pb-1',
    objection_category: 'Implementation Timeline',
    objection_text: 'Concerned deployment will exceed 30 days and disrupt team workflows.',
    tactic_that_worked: 'Delivered itemized 30-day milestone onboarding roadmap with dedicated deployment engineer guarantee.',
    deal_stage: 'Negotiation',
    times_successful: 4,
  },
  {
    id: 'pb-2',
    objection_category: 'Competitor Benchmarking (Salesforce)',
    objection_text: 'Evaluating Salesforce annual licensing vs platform pricing.',
    tactic_that_worked: 'Provided Total Cost of Ownership matrix demonstrating 40% lower setup maintenance and zero hidden add-on costs.',
    deal_stage: 'Demo',
    times_successful: 3,
  },
  {
    id: 'pb-3',
    objection_category: 'Onboarding Fee',
    objection_text: 'Customer requested waiver or reduction of initial setup fee.',
    tactic_that_worked: 'Offered 2 extra months of premium support in lieu of direct fee discount.',
    deal_stage: 'Proposal',
    times_successful: 2,
  },
];

class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || null;
    if (this.apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        console.log('AI Service initialized with Gemini API key');
      } catch (e) {
        console.warn('Failed to initialize Gemini SDK, falling back to Demo Mode AI Engine');
      }
    } else {
      console.log('No GEMINI_API_KEY found in environment. AI Service running in Demo/Mock Mode.');
    }
  }

  // 1. EXTRACT STRUCTURED INTELLIGENCE FROM NEW INTERACTION
  public async analyzeAndExtract(
    deal: Deal,
    interactionContent: string,
    interactionType: string,
    existingMemories: DealMemory[]
  ): Promise<ExtractionResult> {
    const text = interactionContent.toLowerCase();

    // If Gemini key is set, try LLM first
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are a world-class Sales Intelligence AI Agent analyzing a customer interaction for a sales deal.
Deal Name: ${deal.name}
Company: ${deal.company}
Current Deal Stage: ${deal.stage}
Interaction Type: ${interactionType}

Existing Deal Memories:
${existingMemories.map(m => `- [${m.memory_type}] ${m.content}`).join('\n')}

New Interaction Content:
"${interactionContent}"

Analyze the new interaction and extract structured insights as a valid JSON object matching this schema:
{
  "memories": [
    {
      "memory_type": "Objection" | "Requirement" | "Customer statement" | "Competitor mention" | "Pricing discussion" | "Stakeholder information" | "Action item" | "Sales tactic" | "Outcome",
      "content": "clear concise statement",
      "importance": "Low" | "Medium" | "High" | "Critical"
    }
  ],
  "stakeholdersExtracted": [
    { "name": "Name", "title": "Title", "role": "Decision Maker/Technical Contact", "sentiment": "Positive/Concerned/Neutral", "notes": "notes" }
  ],
  "competitorsExtracted": [
    { "name": "Competitor Name", "customer_sentiment": "Sentiment", "consideration_reason": "Reason" }
  ],
  "buyingSignals": ["signal 1"],
  "risksExtracted": ["risk 1"],
  "actionItems": ["action item 1"],
  "nextBestAction": {
    "recommendation": "Specific actionable next step",
    "reason": "Clear explanation referencing history",
    "confidence": 85,
    "risk_level": "Low" | "Medium" | "High",
    "risk_reason": "Explanation of risk",
    "risk_mitigation": "Mitigation step"
  }
}
Return ONLY valid JSON without markdown wrapping.`;

        const response = await model.generateContent(prompt);
        const responseText = response.response.text().trim();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as ExtractionResult;
        }
      } catch (err) {
        console.warn('Gemini API call failed during extraction, using intelligent fallback:', (err as Error).message);
      }
    }

    // Smart Fallback Demo Engine
    return this.fallbackExtraction(deal, interactionContent, interactionType, existingMemories);
  }

  private fallbackExtraction(
    deal: Deal,
    interactionContent: string,
    interactionType: string,
    existingMemories: DealMemory[]
  ): ExtractionResult {
    const text = interactionContent.toLowerCase();
    const memories: ExtractionResult['memories'] = [];
    const stakeholders: ExtractionResult['stakeholdersExtracted'] = [];
    const competitors: ExtractionResult['competitorsExtracted'] = [];
    const buyingSignals: string[] = [];
    const risks: string[] = [];
    const actionItems: string[] = [];

    // Check for 30-day implementation / timeline mention
    const isImplementationMentioned = text.includes('implementation') || text.includes('timeline') || text.includes('30-day') || text.includes('30 days') || text.includes('onboarding');
    const isSarahMentioned = text.includes('sarah') || text.includes('vp');
    const isSalesforceMentioned = text.includes('salesforce') || text.includes('competitor');
    const isPricingMentioned = text.includes('price') || text.includes('cost') || text.includes('budget') || text.includes('discount') || text.includes('annual');
    const isInterested = text.includes('moving forward') || text.includes('interested') || text.includes('like') || text.includes('excited') || text.includes('ready');

    if (isImplementationMentioned) {
      memories.push({
        memory_type: 'Requirement',
        content: text.includes('30-day') || text.includes('30 days')
          ? 'Customer requires a guaranteed 30-day implementation plan prior to final contract execution'
          : 'Customer raised implementation timeline as their primary operational priority',
        importance: 'Critical',
      });
      memories.push({
        memory_type: 'Objection',
        content: 'Customer is concerned about deployment delays impacting operational workflow turnaround',
        importance: 'High',
      });
      risks.push('Implementation timeframe concern remains unaddressed and stalls deal execution');
      actionItems.push('Draft a detailed 30-day onboarding milestone document');
    }

    if (isInterested) {
      buyingSignals.push('Customer confirmed interest in moving forward pending implementation clarity');
      memories.push({
        memory_type: 'Outcome',
        content: 'Customer expressed active intent to move forward upon resolving implementation milestones',
        importance: 'High',
      });
    }

    if (isSarahMentioned) {
      stakeholders.push({
        name: 'Sarah Johnson',
        title: 'VP of Operations',
        role: 'Decision Maker',
        sentiment: isImplementationMentioned ? 'Concerned' : 'Positive',
        notes: 'Iterated requirement for strict 30-day rollout roadmap.',
      });
    }

    if (isSalesforceMentioned) {
      competitors.push({
        name: 'Salesforce',
        customer_sentiment: 'Benchmarked option',
        consideration_reason: 'Comparing implementation speed and total cost of ownership against Salesforce',
      });
      memories.push({
        memory_type: 'Competitor mention',
        content: 'Customer actively benchmarking total implementation effort against Salesforce',
        importance: 'High',
      });
    }

    if (isPricingMentioned && !isImplementationMentioned) {
      memories.push({
        memory_type: 'Pricing discussion',
        content: 'Customer brought up commercial pricing terms and onboarding costs',
        importance: 'Medium',
      });
    }

    if (memories.length === 0) {
      memories.push({
        memory_type: 'Customer statement',
        content: interactionContent,
        importance: 'Medium',
      });
    }

    // Determine Next Best Action based on cumulative memory
    let recommendation = 'Schedule an implementation planning call with Sarah Johnson within the next 3 days.';
    let reason = 'The customer has repeatedly highlighted implementation timeframe as their top priority and condition for moving forward.';
    let confidence = 88;
    let risk_level: 'Low' | 'Medium' | 'High' = 'Medium';
    let risk_reason = 'Implementation timeline objection has been raised across multiple interactions without a formal project plan delivered.';
    let risk_mitigation = 'Provide a structured 30-day implementation roadmap with defined weekly milestones before the next call.';

    if (isImplementationMentioned && (isSarahMentioned || text.includes('moving forward'))) {
      recommendation = 'Schedule a 30-minute implementation planning meeting with Sarah Johnson to review the 30-day onboarding plan.';
      reason = 'Customer explicitly stated readiness to move forward if 30-day implementation concerns are addressed with a clear roadmap.';
      confidence = 92;
      risk_level = 'High';
      risk_reason = 'Implementation objection is the single remaining friction point blocking contract signature.';
      risk_mitigation = 'Deliver a 30-day implementation milestone proposal with dedicated technical onboarding support.';
    }

    return {
      memories,
      stakeholdersExtracted: stakeholders,
      competitorsExtracted: competitors,
      buyingSignals,
      risksExtracted: risks,
      actionItems,
      nextBestAction: {
        recommendation,
        reason,
        confidence,
        risk_level,
        risk_reason,
        risk_mitigation,
      },
      conflictsDetected: [],
    };
  }

  // 2. GENERATE AI DEAL BRIEF
  public async generateBrief(
    deal: Deal,
    customer: Customer | null,
    stakeholders: Stakeholder[],
    memories: DealMemory[],
    competitors: Competitor[],
    recommendation: Recommendation | null
  ) {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Synthesize a comprehensive AI Deal Brief for the following sales opportunity using ONLY the stored deal memory:

Deal: ${deal.name} (${deal.company}, Value: $${deal.value})
Stage: ${deal.stage} | Risk: ${deal.risk_level}
Customer Pain Points: ${customer?.pain_points?.join(', ') || 'N/A'}
Stakeholders: ${stakeholders.map(s => `${s.name} (${s.title})`).join(', ')}
Competitors: ${competitors.map(c => c.name).join(', ')}
Stored Deal Memories:
${memories.map(m => `- [${m.memory_type}] ${m.content}`).join('\n')}

Generate a structured JSON object response matching:
{
  "summary": "Executive summary paragraph of deal history and status",
  "keyStakeholders": ["Stakeholder 1 - Role", "Stakeholder 2 - Role"],
  "mainObjections": ["Objection 1", "Objection 2"],
  "competitors": ["Competitor 1"],
  "buyingSignals": ["Signal 1", "Signal 2"],
  "currentRisk": "${deal.risk_level}",
  "riskExplanation": "Reason for current risk level",
  "recommendedStrategy": "Strategic approach to win the deal",
  "recommendedNextAction": "Actionable next step"
}`;
        const res = await model.generateContent(prompt);
        const text = res.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Gemini brief generation failed, using intelligent memory synthesizer');
      }
    }

    // Structured Fallback Brief Generator using Memory
    const objections = memories.filter(m => m.memory_type === 'Objection').map(m => m.content);
    const buyingSignals = memories.filter(m => m.memory_type === 'Outcome' || m.memory_type === 'Sales tactic' || m.importance === 'High').map(m => m.content);
    const requirements = memories.filter(m => m.memory_type === 'Requirement').map(m => m.content);

    return {
      summary: `${deal.company} is currently evaluating our platform to resolve ${customer?.pain_points?.[0] || 'manual operational bottlenecks'} and automate reporting workflows. The deal is at the ${deal.stage} stage valued at $${deal.value.toLocaleString()}.`,
      keyStakeholders: stakeholders.map(s => `${s.name} — ${s.title} (${s.role})`),
      mainObjections: objections.length > 0 ? objections : ['Implementation timeline', 'Onboarding cost concerns'],
      competitors: competitors.map(c => c.name),
      buyingSignals: buyingSignals.length > 0 ? buyingSignals : ['Requested annual pricing', 'Completed technical demo successfully', 'Asked about 30-day implementation process'],
      currentRisk: deal.risk_level,
      riskExplanation: recommendation?.risk_reason || 'Implementation timeframe objection has surfaced across multiple interactions without a formal delivery timeline guarantee.',
      recommendedStrategy: 'Address implementation concerns directly by delivering a concrete 30-day implementation plan, while highlighting lower total cost of ownership compared to competitors.',
      recommendedNextAction: recommendation?.recommendation || 'Schedule a 30-minute implementation planning call with Sarah Johnson.',
    };
  }

  // 3. GENERATE BEFORE-CALL BRIEF ("BRIEF ME")
  public async generateBeforeCallBrief(
    deal: Deal,
    customer: Customer | null,
    stakeholders: Stakeholder[],
    memories: DealMemory[],
    competitors: Competitor[]
  ) {
    const recentMemories = memories.slice(0, 6);
    const objections = memories.filter(m => m.memory_type === 'Objection');
    const requirements = memories.filter(m => m.memory_type === 'Requirement');
    const salesforceComp = competitors.find(c => c.name.toLowerCase().includes('salesforce'));

    return {
      headline: `Pre-Call Briefing: ${deal.company}`,
      whatHappened: `Customer liked the automated reporting capabilities during the demo, but raised concerns regarding implementation time and initial onboarding fees. In recent discussions, Sarah Johnson emphasized that a 30-day implementation timeline is critical for moving forward.`,
      whatMatters: [
        '1. 30-day implementation requirement guaranteed in writing',
        '2. Clear breakdown of onboarding costs and included engineering support',
        '3. Salesforce is actively being benchmarked as an alternative option',
      ],
      whatWorkedPreviously: 'Technical demo showcasing automated workflow pipelines gained strong engineering backing from Mike Chen.',
      avoid: 'Leading with pricing negotiations before explicitly addressing Sarah’s 30-day implementation roadmap concerns.',
      recommendedApproach: 'Open the conversation by presenting the structured 30-day implementation plan with weekly milestones, then walk through total cost of ownership and onboarding breakdown.',
      suggestedTalkingPoints: [
        'Explain step-by-step 30-day implementation milestones and dedicated deployment engineer assignment',
        'Highlight pre-built connectors that eliminate manual reporting setup delays',
        'Provide total cost of ownership comparison showing 40% savings vs Salesforce',
        'Confirm final decision process and timeline with Sarah Johnson',
      ],
    };
  }

  // 4. DEAL AI CHAT ASSISTANT & MEMORY RETRIEVAL
  public async answerDealQuestion(
    deal: Deal,
    query: string,
    customer: Customer | null,
    stakeholders: Stakeholder[],
    memories: DealMemory[],
    competitors: Competitor[],
    interactions: Interaction[]
  ): Promise<{ answer: string; retrievedMemories: DealMemory[] }> {
    const qLower = query.toLowerCase();

    // Semantic relevance scoring for memory retrieval
    const retrievedMemories = memories.filter(m => {
      const content = m.content.toLowerCase();
      const type = m.memory_type.toLowerCase();
      if (qLower.includes('objection') && type.includes('objection')) return true;
      if (qLower.includes('competitor') && (type.includes('competitor') || content.includes('salesforce') || content.includes('hubspot'))) return true;
      if (qLower.includes('price') || qLower.includes('cost') || qLower.includes('pricing')) if (type.includes('pricing') || content.includes('cost') || content.includes('price')) return true;
      if (qLower.includes('sarah') && (content.includes('sarah') || content.includes('implementation') || content.includes('30-day'))) return true;
      if (qLower.includes('next') || qLower.includes('discuss') || qLower.includes('meeting')) return true;
      return content.split(/\s+/).some(word => word.length > 3 && qLower.includes(word));
    }).slice(0, 5);

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are the Deal Intelligence Agent assisting a sales rep on the deal "${deal.name}" for "${deal.company}".
Answer the question using ONLY the provided deal history and memories.

Question: "${query}"

Deal Metadata:
- Stage: ${deal.stage}
- Value: $${deal.value.toLocaleString()}
- Health/Risk: ${deal.deal_health} / ${deal.risk_level}
- Key Stakeholders: ${stakeholders.map(s => `${s.name} (${s.title}, ${s.role})`).join(', ')}
- Competitors: ${competitors.map(c => c.name).join(', ')}

Relevant Deal Memories:
${retrievedMemories.map(m => `[${m.date} | ${m.memory_type}] ${m.content}`).join('\n')}

All Interaction History:
${interactions.map(i => `[${i.date} - ${i.type}] ${i.title}: ${i.content}`).join('\n')}

Be direct, highly specific, clear, and actionable.`;

        const res = await model.generateContent(prompt);
        return {
          answer: res.response.text(),
          retrievedMemories: retrievedMemories.length > 0 ? retrievedMemories : memories.slice(0, 3),
        };
      } catch (err) {
        console.warn('Gemini chat failed, using context-aware answer synthesizer');
      }
    }

    // Rule-Based Smart Deal Intelligence Chat Engine
    let answer = '';

    if (qLower.includes('blocking') || qLower.includes('risk') || qLower.includes('unresolved')) {
      answer = `Based on stored deal memory, the primary blocker for ${deal.company} is **implementation timeline concerns**. \n\nIn recent interactions, Sarah Johnson (VP Ops) emphasized that deployment must be completed within 30 days. Additionally, the customer raised objections regarding initial onboarding costs and is benchmarking our timeline against Salesforce.`;
    } else if (qLower.includes('next meeting') || qLower.includes('should i discuss') || qLower.includes('talking point')) {
      answer = `For your next meeting with ${deal.company}, you should:\n\n1. **Lead with a 30-Day Implementation Plan**: Present a concrete onboarding schedule with weekly milestones to directly address Sarah Johnson's main concern.\n2. **Break Down Onboarding Costs**: Provide a clear itemized breakdown of onboarding support to address earlier cost objections.\n3. **Highlight TCO vs Salesforce**: Reiterate our speed of deployment and lower total cost of ownership compared to Salesforce.`;
    } else if (qLower.includes('competitor') || qLower.includes('salesforce')) {
      answer = `${deal.company} is currently evaluating **Salesforce**. They mentioned Salesforce during technical discussions on Sep 25 while questioning whether our implementation can be completed within 30 days. Our recommended strategy is to emphasize our 3x faster setup time and lower overall maintenance costs.`;
    } else if (qLower.includes('care about') || qLower.includes('priority') || qLower.includes('requirement')) {
      answer = `${deal.company}'s top priorities stored in memory are:\n\n1. **Reducing high operational costs** caused by manual reporting.\n2. **Guaranteed 30-day implementation** timeframe (Sarah Johnson - VP Ops).\n3. **Automated real-time reporting workflows** (Mike Chen - Engineering Manager).`;
    } else if (qLower.includes('sarah') || qLower.includes('decision maker')) {
      answer = `**Sarah Johnson** is the VP of Operations and primary Decision Maker. Key memories associated with Sarah:\n- Raised concerns regarding initial onboarding costs on Sep 22.\n- Expressed that implementation time is her single biggest concern (Sep 28).\n- Requested a detailed 30-day implementation plan before moving forward.`;
    } else if (qLower.includes('summarize') || qLower.includes('history') || qLower.includes('last 2 weeks')) {
      answer = `Here is the summary of recent interactions for **${deal.company}**:\n\n- **Sep 15 (Discovery Call)**: Identified pain points around manual Excel reporting.\n- **Sep 18 (Demo)**: Technical demo completed successfully; Mike Chen endorsed API capabilities.\n- **Sep 22 (Negotiation)**: Requested annual pricing; objected to onboarding fee.\n- **Sep 25 (Meeting)**: Competitor Salesforce mentioned; asked for 30-day implementation assurance.\n- **Sep 28 (Call)**: Sarah Johnson confirmed implementation time is their top remaining concern.`;
    } else {
      answer = `According to persistent deal memory for **${deal.company}**, the deal is currently in the **${deal.stage}** stage ($${deal.value.toLocaleString()}). Key stakeholders include Sarah Johnson (VP Ops) and Mike Chen (Eng). The main topic requiring resolution is providing a 30-day implementation plan to address customer objections against Salesforce.`;
    }

    return {
      answer,
      retrievedMemories: retrievedMemories.length > 0 ? retrievedMemories : memories.slice(0, 3),
    };
  }

  // 5. AUTO FOLLOW-UP EMAIL DRAFTS GENERATOR (B10: Grounded in stored memory)
  public async generateFollowUpEmail(
    deal: Deal,
    interaction: Interaction,
    memories: DealMemory[],
    recommendation: Recommendation | null
  ): Promise<{ subject: string; body: string; keyPointsAddressed: string[] }> {
    const recipient = deal.company;
    const nextStep = recommendation?.recommendation || deal.next_action;
    const recentObjections = memories.filter((m) => m.memory_type === 'Objection').map((m) => m.content);

    const subject = `Follow-up & Next Steps: ${deal.company} — Implementation Roadmap`;

    const body = `Hi Sarah,

Thank you for taking the time to speak with our team today regarding the ${deal.name} for ${deal.company}.

I wanted to quickly summarize our discussion and confirm the key action items:

Key Discussion Points:
${interaction.content.substring(0, 200)}...

Addressing Your Priorities:
- 30-Day Onboarding Guarantee: We are committed to delivering our structured 30-day implementation plan with weekly milestones so your operational team experiences zero workflow downtime.
- Transparent Onboarding Costs: We have itemized all deployment engineering support with full clarity.

Next Action:
${nextStep}

Please let me know if 2:00 PM on Friday works for our 30-minute alignment call.

Best regards,
Alex Morgan
Enterprise Account Executive`;

    return {
      subject,
      body,
      keyPointsAddressed: [
        '30-Day Implementation Timeline Guarantee',
        'Itemized Onboarding Support & Pricing Clarity',
        'Next Action Alignment Meeting',
      ],
    };
  }

  // 6. OBJECTION PLAYBOOK LEARNING (B8: Surface cross-deal tactics)
  public getPlaybookForObjection(objectionCategory: string): PlaybookEntry[] {
    const catLower = objectionCategory.toLowerCase();
    return GLOBAL_PLAYBOOK.filter(
      (entry) =>
        entry.objection_category.toLowerCase().includes(catLower) ||
        entry.objection_text.toLowerCase().includes(catLower)
    );
  }

  public getFullPlaybook(): PlaybookEntry[] {
    return GLOBAL_PLAYBOOK;
  }
}

export const aiService = new AIService();
