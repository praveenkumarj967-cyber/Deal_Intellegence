import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { getSupabaseClient } from './supabaseClient.js';
import {
  Deal,
  Customer,
  Stakeholder,
  Interaction,
  DealMemory,
  Competitor,
  Recommendation,
  ScheduledMeeting,
  initialDeals,
  initialCustomers,
  initialStakeholders,
  initialInteractions,
  initialMemories,
  initialCompetitors,
  initialRecommendations,
  initialMeetings,
} from './seedData.js';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

interface StoreSchema {
  deals: Deal[];
  customers: Record<string, Customer>;
  stakeholders: Record<string, Stakeholder[]>;
  interactions: Record<string, Interaction[]>;
  memories: Record<string, DealMemory[]>;
  competitors: Record<string, Competitor[]>;
  recommendations: Record<string, Recommendation>;
  meetings: Record<string, ScheduledMeeting[]>;
  chatLogs: Record<string, Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>>;
}

class DBStore {
  private pgPool: pg.Pool | null = null;
  private isPostgresAvailable = false;
  private localData!: StoreSchema;

  constructor() {
    this.initLocalStore();
    this.initPostgres();
  }

  private initLocalStore() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_FILE)) {
      try {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        this.localData = JSON.parse(raw);
        if (!this.localData.meetings) {
          this.localData.meetings = { ...initialMeetings };
        }
        console.log('Loaded persistent deal store from server/data/store.json');
        return;
      } catch (err) {
        console.warn('Error reading store.json, re-initializing with seed data');
      }
    }

    this.resetToSeed();
  }

  public resetToSeed() {
    this.localData = {
      deals: [...initialDeals],
      customers: { ...initialCustomers },
      stakeholders: { ...initialStakeholders },
      interactions: { ...initialInteractions },
      memories: { ...initialMemories },
      competitors: { ...initialCompetitors },
      recommendations: { ...initialRecommendations },
      meetings: { ...initialMeetings },
      chatLogs: {},
    };
    this.saveLocalStore();
    console.log('Initialized deal store with demo seed dataset');
  }

  private saveLocalStore() {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.localData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save store.json:', err);
    }
  }

  private async initPostgres() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return;

    try {
      this.pgPool = new pg.Pool({ connectionString: dbUrl, connectionTimeoutMillis: 3000 });
      const client = await this.pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isPostgresAvailable = true;
      console.log('Successfully connected to PostgreSQL database');
    } catch (err) {
      console.warn('PostgreSQL connection unavailable, using persistent JSON engine:', (err as Error).message);
      this.isPostgresAvailable = false;
    }
  }

  // DEALS
  public async getDeals(): Promise<Deal[]> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('deals').select('*').order('updated_at', { ascending: false });
        if (!error && data && data.length > 0) return data as Deal[];
      } catch (e) {
        console.warn('Supabase query error for getDeals, using store:', (e as Error).message);
      }
    }

    if (this.isPostgresAvailable && this.pgPool) {
      try {
        const res = await this.pgPool.query('SELECT * FROM deals ORDER BY updated_at DESC');
        return res.rows;
      } catch (e) {
        console.error('PG query error', e);
      }
    }
    return this.localData.deals;
  }

  public async getDealById(id: string): Promise<Deal | null> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('deals').select('*').eq('id', id).single();
        if (!error && data) return data as Deal;
      } catch (e) {}
    }

    if (this.isPostgresAvailable && this.pgPool) {
      try {
        const res = await this.pgPool.query('SELECT * FROM deals WHERE id = $1', [id]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (e) {}
    }
    return this.localData.deals.find((d) => d.id === id) || null;
  }

  public async createDeal(dealData: Partial<Deal>): Promise<Deal> {
    const newDeal: Deal = {
      id: dealData.id || `deal-${Date.now()}`,
      name: dealData.name || 'New Deal Opportunity',
      company: dealData.company || 'Prospect Company',
      value: dealData.value || 50000,
      stage: dealData.stage || 'Discovery',
      probability: dealData.probability || 30,
      expected_close_date: dealData.expected_close_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      account_owner: dealData.account_owner || 'Alex Morgan',
      deal_health: dealData.deal_health || 'Good',
      risk_level: dealData.risk_level || 'Low',
      last_interaction: dealData.last_interaction || 'Deal Created',
      next_action: dealData.next_action || 'Conduct initial discovery call',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('deals').insert([newDeal]).select();
        if (error) {
          console.error('⚠️ Supabase insert deal error:', error.message, error.details);
        } else {
          console.log('✅ Deal inserted into Supabase successfully:', newDeal.id);
        }
      } catch (e) {
        console.warn('Supabase insert deal error:', (e as Error).message);
      }
    }

    this.localData.deals.unshift(newDeal);
    this.saveLocalStore();
    return newDeal;
  }

  public async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | null> {
    const index = this.localData.deals.findIndex((d) => d.id === id);
    if (index === -1) return null;

    const updated = {
      ...this.localData.deals[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const sb = getSupabaseClient();
    if (sb) {
      try {
        await sb.from('deals').update(updated).eq('id', id);
      } catch (e) {}
    }

    this.localData.deals[index] = updated;
    this.saveLocalStore();
    return updated;
  }

  // CUSTOMER PROFILE
  public async getCustomerByDealId(dealId: string): Promise<Customer | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('customers').select('*').eq('deal_id', dealId).single();
        if (!error && data) return data as Customer;
      } catch (e) {}
    }

    const cust = this.localData.customers[dealId];
    if (cust) return cust;

    const deal = await this.getDealById(dealId);
    if (!deal) return null;

    const defaultCust: Customer = {
      id: `cust-${dealId}`,
      deal_id: dealId,
      company_name: deal.company,
      industry: 'Enterprise Technology',
      budget: `$${deal.value.toLocaleString()}`,
      timeline: 'Q4 2026',
      current_solution: 'Legacy solution',
      pain_points: ['Manual processes', 'Limited reporting visibility'],
      company_requirements: ['Modern automated platform', 'Rapid deployment'],
      priorities: ['Efficiency improvement', 'Cost effectiveness'],
    };
    this.localData.customers[dealId] = defaultCust;
    this.saveLocalStore();
    return defaultCust;
  }

  public async updateCustomer(dealId: string, updates: Partial<Customer>): Promise<Customer> {
    let existing = await this.getCustomerByDealId(dealId);
    if (!existing) {
      existing = {
        id: `cust-${dealId}`,
        deal_id: dealId,
        company_name: 'Company',
        industry: 'Technology',
        budget: 'TBD',
        timeline: 'TBD',
        current_solution: 'N/A',
        pain_points: [],
        company_requirements: [],
        priorities: [],
      };
    }
    const updated = { ...existing, ...updates };

    if (supabase) {
      try {
        await supabase.from('customers').upsert([updated]);
      } catch (e) {}
    }

    this.localData.customers[dealId] = updated;
    this.saveLocalStore();
    return updated;
  }

  // STAKEHOLDERS
  public async getStakeholdersByDealId(dealId: string): Promise<Stakeholder[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('stakeholders').select('*').eq('deal_id', dealId);
        if (!error && data && data.length > 0) return data as Stakeholder[];
      } catch (e) {}
    }
    return this.localData.stakeholders[dealId] || [];
  }

  public async addStakeholder(dealId: string, stakeholder: Partial<Stakeholder>): Promise<Stakeholder> {
    const list = this.localData.stakeholders[dealId] || [];
    const newSh: Stakeholder = {
      id: `sh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      deal_id: dealId,
      name: stakeholder.name || 'Key Contact',
      title: stakeholder.title || 'Stakeholder',
      role: stakeholder.role || 'User',
      email: stakeholder.email || '',
      sentiment: stakeholder.sentiment || 'Neutral',
      notes: stakeholder.notes || '',
    };

    if (supabase) {
      try {
        await supabase.from('stakeholders').insert([newSh]);
      } catch (e) {}
    }

    list.push(newSh);
    this.localData.stakeholders[dealId] = list;
    this.saveLocalStore();
    return newSh;
  }

  // INTERACTIONS
  public async getInteractionsByDealId(dealId: string): Promise<Interaction[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('interactions')
          .select('*')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as Interaction[];
      } catch (e) {}
    }

    const list = this.localData.interactions[dealId] || [];
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async addInteraction(dealId: string, interactionData: Partial<Interaction>): Promise<Interaction> {
    const list = this.localData.interactions[dealId] || [];
    const newInt: Interaction = {
      id: `int-${Date.now()}`,
      deal_id: dealId,
      type: interactionData.type || 'Call',
      title: interactionData.title || `${interactionData.type || 'Call'} Interaction`,
      content: interactionData.content || '',
      participants: interactionData.participants || ['Alex Morgan'],
      date: interactionData.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        await supabase.from('interactions').insert([newInt]);
      } catch (e) {
        console.warn('Supabase insert interaction error:', (e as Error).message);
      }
    }

    list.unshift(newInt);
    this.localData.interactions[dealId] = list;

    // Also update deal last_interaction
    await this.updateDeal(dealId, {
      last_interaction: `${newInt.date} - ${newInt.type}: ${newInt.title}`,
    });

    this.saveLocalStore();
    return newInt;
  }

  // MEMORIES
  public async getMemoriesByDealId(dealId: string): Promise<DealMemory[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('deal_memories')
          .select('*')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as DealMemory[];
      } catch (e) {}
    }

    const list = this.localData.memories[dealId] || [];
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async addMemories(dealId: string, memories: Partial<DealMemory>[]): Promise<DealMemory[]> {
    const list = this.localData.memories[dealId] || [];
    const createdList: DealMemory[] = [];

    for (const mem of memories) {
      const newMem: DealMemory = {
        id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        deal_id: dealId,
        interaction_id: mem.interaction_id,
        memory_type: mem.memory_type || 'Customer statement',
        content: mem.content || '',
        importance: mem.importance || 'Medium',
        date: mem.date || new Date().toISOString().split('T')[0],
        source_type: mem.source_type || 'Interaction',
        resolved: mem.resolved || false,
        created_at: new Date().toISOString(),
      };
      list.unshift(newMem);
      createdList.push(newMem);
    }

    if (supabase && createdList.length > 0) {
      try {
        await supabase.from('deal_memories').insert(createdList);
      } catch (e) {}
    }

    this.localData.memories[dealId] = list;
    this.saveLocalStore();
    return createdList;
  }

  public async searchMemories(dealId: string, query: string): Promise<DealMemory[]> {
    const memories = await this.getMemoriesByDealId(dealId);
    if (!query || !query.trim()) return memories;

    const q = query.toLowerCase().trim();
    const keywords = q.split(/\s+/).filter((k) => k.length > 2);

    return memories.filter((m) => {
      const content = m.content.toLowerCase();
      const type = m.memory_type.toLowerCase();
      if (content.includes(q) || type.includes(q)) return true;
      return keywords.some((k) => content.includes(k) || type.includes(k));
    });
  }

  // COMPETITORS
  public async getCompetitorsByDealId(dealId: string): Promise<Competitor[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('competitors').select('*').eq('deal_id', dealId);
        if (!error && data && data.length > 0) return data as Competitor[];
      } catch (e) {}
    }
    return this.localData.competitors[dealId] || [];
  }

  public async addOrUpdateCompetitor(dealId: string, compData: Partial<Competitor>): Promise<Competitor> {
    const list = this.localData.competitors[dealId] || [];
    const name = compData.name || 'Competitor';
    const existingIndex = list.findIndex((c) => c.name.toLowerCase() === name.toLowerCase());

    let comp: Competitor;
    if (existingIndex >= 0) {
      comp = {
        ...list[existingIndex],
        ...compData,
      };
      list[existingIndex] = comp;
    } else {
      comp = {
        id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        deal_id: dealId,
        name,
        mentioned_date: compData.mentioned_date || new Date().toISOString().split('T')[0],
        customer_sentiment: compData.customer_sentiment || 'Neutral',
        consideration_reason: compData.consideration_reason || 'Evaluating alternative vendors',
        address_strategy: compData.address_strategy || 'Differentiate on speed of onboarding, ease of use, and total cost of ownership',
      };
      list.push(comp);
    }

    if (supabase) {
      try {
        await supabase.from('competitors').upsert([comp]);
      } catch (e) {}
    }

    this.localData.competitors[dealId] = list;
    this.saveLocalStore();
    return comp;
  }

  // RECOMMENDATION & RISK
  public async getRecommendationByDealId(dealId: string): Promise<Recommendation | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('recommendations').select('*').eq('deal_id', dealId).single();
        if (!error && data) return data as Recommendation;
      } catch (e) {}
    }
    return this.localData.recommendations[dealId] || null;
  }

  public async updateRecommendation(dealId: string, recData: Partial<Recommendation>): Promise<Recommendation> {
    const existing = this.localData.recommendations[dealId];
    const newRec: Recommendation = {
      id: existing?.id || `rec-${dealId}`,
      deal_id: dealId,
      recommendation: recData.recommendation || existing?.recommendation || 'Follow up with customer stakeholder.',
      reason: recData.reason || existing?.reason || 'Based on recent interaction history.',
      confidence: recData.confidence ?? existing?.confidence ?? 80,
      risk_level: recData.risk_level || existing?.risk_level || 'Medium',
      risk_reason: recData.risk_reason || existing?.risk_reason || 'Unresolved customer objections detected.',
      risk_mitigation: recData.risk_mitigation || existing?.risk_mitigation || 'Schedule a alignment meeting.',
      status: 'Active',
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        await supabase.from('recommendations').upsert([newRec]);
      } catch (e) {}
    }

    this.localData.recommendations[dealId] = newRec;

    // Sync deal level risk_level and next_action
    await this.updateDeal(dealId, {
      risk_level: newRec.risk_level,
      next_action: newRec.recommendation,
    });

    this.saveLocalStore();
    return newRec;
  }

  // MEETINGS SCHEDULER
  public async getMeetingsByDealId(dealId: string): Promise<ScheduledMeeting[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('scheduled_meetings')
          .select('*')
          .eq('deal_id', dealId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as ScheduledMeeting[];
      } catch (e) {}
    }
    const list = this.localData.meetings[dealId] || [];
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async scheduleMeeting(dealId: string, meetingData: Partial<ScheduledMeeting>): Promise<ScheduledMeeting> {
    const list = this.localData.meetings[dealId] || [];
    const newMeeting: ScheduledMeeting = {
      id: `mtg-${Date.now()}`,
      deal_id: dealId,
      title: meetingData.title || 'Implementation Alignment Meeting',
      date: meetingData.date || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      time: meetingData.time || '14:00',
      duration: meetingData.duration || '30 min',
      participants: meetingData.participants || ['Alex Morgan', 'Sarah Johnson'],
      agenda: meetingData.agenda || 'Review implementation roadmap, onboarding milestones, and technical requirements.',
      meeting_link: meetingData.meeting_link || `https://meet.google.com/nexus-${Math.random().toString(36).substr(2, 6)}`,
      status: 'Scheduled',
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        await supabase.from('scheduled_meetings').insert([newMeeting]);
      } catch (e) {
        console.warn('Supabase insert meeting error:', (e as Error).message);
      }
    }

    list.unshift(newMeeting);
    this.localData.meetings[dealId] = list;

    // Log a meeting interaction automatically
    await this.addInteraction(dealId, {
      type: 'Meeting',
      title: `Scheduled: ${newMeeting.title}`,
      content: `Meeting scheduled for ${newMeeting.date} at ${newMeeting.time}. Agenda: ${newMeeting.agenda}`,
      participants: newMeeting.participants,
      date: newMeeting.date,
    });

    this.saveLocalStore();
    return newMeeting;
  }

  // CHAT LOGS
  public async getChatHistory(dealId: string) {
    return this.localData.chatLogs[dealId] || [];
  }

  public async addChatMessage(dealId: string, role: 'user' | 'assistant', content: string) {
    const logs = this.localData.chatLogs[dealId] || [];
    logs.push({ role, content, timestamp: new Date().toISOString() });
    this.localData.chatLogs[dealId] = logs;
    this.saveLocalStore();
  }
}

export const dbStore = new DBStore();
