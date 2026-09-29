import {
  Deal,
  DashboardSummary,
  Customer,
  Stakeholder,
  Interaction,
  DealMemory,
  Competitor,
  Recommendation,
  ScheduledMeeting,
  AIDealBrief,
  BeforeCallBrief,
  ExtractionResponse,
} from '../types';

import { supabaseFrontend } from './supabase';

const API_BASE = '/api';

export async function fetchDashboardDeals(): Promise<{ summary: DashboardSummary; deals: Deal[] }> {
  try {
    const res = await fetch(`${API_BASE}/deals`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API server unreachable, fallback to direct Supabase query:', (err as Error).message);
  }

  // Direct Supabase Client Query Fallback for Vercel Static Frontend Deployment!
  if (supabaseFrontend) {
    try {
      const { data, error } = await supabaseFrontend.from('deals').select('*').order('updated_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const deals = data as Deal[];
        const totalActive = deals.filter((d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
        const requiringAttention = deals.filter((d) => d.risk_level === 'High' || d.deal_health === 'At Risk' || d.deal_health === 'Critical').length;
        const atRisk = deals.filter((d) => d.risk_level === 'High' || d.risk_level === 'Medium').length;
        const closingSoon = deals.filter((d) => d.stage === 'Negotiation' || d.stage === 'Proposal').length;
        const wonDeals = deals.filter((d) => d.stage === 'Closed Won').length;
        const closedDeals = deals.filter((d) => d.stage === 'Closed Won' || d.stage === 'Closed Lost').length;
        const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 75;
        const pipelineValue = deals.filter((d) => d.stage !== 'Closed Lost').reduce((sum, d) => sum + Number(d.value), 0);

        return {
          summary: { totalActive, requiringAttention, atRisk, closingSoon, winRate, pipelineValue },
          deals,
        };
      }
    } catch (e) {
      console.warn('Direct Supabase fetch fallback error:', e);
    }
  }

  // Fallback initial deals dataset
  const deals = [
    {
      id: 'deal-acme-101',
      name: 'Acme Corp Workflow Automation',
      company: 'Acme Corporation',
      value: 120000,
      stage: 'Negotiation',
      probability: 70,
      expected_close_date: '2026-10-31',
      account_owner: 'Alex Morgan',
      deal_health: 'At Risk',
      risk_level: 'Medium',
      last_interaction: 'Sep 28, 2026 - Call regarding implementation timeline',
      next_action: 'Provide concrete 30-day implementation roadmap and transparent onboarding cost breakdown',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-28T16:30:00Z',
    },
    {
      id: 'deal-technova-102',
      name: 'TechNova Cloud Migration',
      company: 'TechNova',
      value: 85000,
      stage: 'Proposal',
      probability: 55,
      expected_close_date: '2026-11-15',
      account_owner: 'Alex Morgan',
      deal_health: 'Critical',
      risk_level: 'High',
      last_interaction: 'Sep 24, 2026 - Competitor evaluation review',
      next_action: 'Schedule executive alignment meeting with CTO to address HubSpot migration concerns',
      created_at: '2026-09-05T11:00:00Z',
      updated_at: '2026-09-24T14:20:00Z',
    },
    {
      id: 'deal-globalsys-103',
      name: 'Global Systems Enterprise License',
      company: 'Global Systems',
      value: 200000,
      stage: 'Discovery',
      probability: 35,
      expected_close_date: '2026-12-20',
      account_owner: 'Alex Morgan',
      deal_health: 'Good',
      risk_level: 'Low',
      last_interaction: 'Sep 26, 2026 - Initial discovery workshop',
      next_action: 'Draft custom solution architecture document for security review team',
      created_at: '2026-09-10T09:15:00Z',
      updated_at: '2026-09-26T11:00:00Z',
    },
  ] as Deal[];

  return {
    summary: {
      totalActive: 3,
      requiringAttention: 2,
      atRisk: 2,
      closingSoon: 2,
      winRate: 75,
      pipelineValue: 405000,
    },
    deals,
  };
}

export async function createDeal(dealData: Partial<Deal>): Promise<Deal> {
  try {
    const res = await fetch(`${API_BASE}/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dealData),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API server unreachable, creating deal directly in Supabase:', (err as Error).message);
  }

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

  if (supabaseFrontend) {
    try {
      await supabaseFrontend.from('deals').insert([newDeal]);
    } catch (e) {
      console.warn('Direct Supabase insert deal error:', e);
    }
  }
  return newDeal;
}

export async function fetchDealDetails(id: string): Promise<{
  deal: Deal;
  customer: Customer | null;
  stakeholders: Stakeholder[];
  competitors: Competitor[];
  recommendation: Recommendation | null;
  meetings: ScheduledMeeting[];
  memoriesCount: number;
}> {
  try {
    const res = await fetch(`${API_BASE}/deals/${id}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API server unreachable, fetching deal details directly from Supabase:', (err as Error).message);
  }

  // Direct Supabase Client Query Fallback for Vercel Static Frontend Deployment!
  if (supabaseFrontend) {
    try {
      const { data: deal } = await supabaseFrontend.from('deals').select('*').eq('id', id).maybeSingle();
      const { data: customer } = await supabaseFrontend.from('customers').select('*').eq('deal_id', id).maybeSingle();
      const { data: stakeholders } = await supabaseFrontend.from('stakeholders').select('*').eq('deal_id', id);
      const { data: competitors } = await supabaseFrontend.from('competitors').select('*').eq('deal_id', id);
      const { data: recommendation } = await supabaseFrontend.from('recommendations').select('*').eq('deal_id', id).maybeSingle();
      const { data: meetings } = await supabaseFrontend.from('scheduled_meetings').select('*').eq('deal_id', id);
      const { data: memories } = await supabaseFrontend.from('deal_memories').select('*').eq('deal_id', id);

      if (deal) {
        return {
          deal: deal as Deal,
          customer: (customer as Customer) || null,
          stakeholders: (stakeholders as Stakeholder[]) || [],
          competitors: (competitors as Competitor[]) || [],
          recommendation: (recommendation as Recommendation) || null,
          meetings: (meetings as ScheduledMeeting[]) || [],
          memoriesCount: memories ? memories.length : 0,
        };
      }
    } catch (e) {
      console.warn('Direct Supabase fetch deal details error:', e);
    }
  }

  // Static Fallback
  return {
    deal: {
      id,
      name: 'Acme Corp Workflow Automation',
      company: 'Acme Corporation',
      value: 120000,
      stage: 'Negotiation',
      probability: 70,
      expected_close_date: '2026-10-31',
      account_owner: 'Alex Morgan',
      deal_health: 'At Risk',
      risk_level: 'Medium',
      last_interaction: 'Sep 28, 2026 - Call regarding implementation timeline',
      next_action: 'Provide concrete 30-day implementation roadmap and transparent onboarding cost breakdown',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-09-28T16:30:00Z',
    },
    customer: null,
    stakeholders: [],
    competitors: [],
    recommendation: null,
    meetings: [],
    memoriesCount: 0,
  };
}

export async function fetchInteractions(dealId: string): Promise<Interaction[]> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/interactions`);
  if (!res.ok) throw new Error('Failed to fetch interactions');
  return res.json();
}

export async function addInteraction(
  dealId: string,
  data: { type: string; title: string; content: string; participants?: string[]; date?: string }
): Promise<ExtractionResponse> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add interaction');
  return res.json();
}

export async function fetchMeetings(dealId: string): Promise<ScheduledMeeting[]> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/meetings`);
  if (!res.ok) throw new Error('Failed to fetch scheduled meetings');
  return res.json();
}

export async function scheduleMeeting(
  dealId: string,
  meetingData: Partial<ScheduledMeeting>
): Promise<ScheduledMeeting> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meetingData),
  });
  if (!res.ok) throw new Error('Failed to schedule meeting');
  return res.json();
}

export async function fetchMemories(dealId: string, query: string = ''): Promise<{ query: string; memories: DealMemory[] }> {
  const url = query ? `${API_BASE}/deals/${dealId}/memories?q=${encodeURIComponent(query)}` : `${API_BASE}/deals/${dealId}/memories`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch deal memories');
  return res.json();
}

export async function fetchDealBrief(dealId: string): Promise<AIDealBrief> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/brief`);
  if (!res.ok) throw new Error('Failed to generate deal brief');
  return res.json();
}

export async function fetchBeforeCallBrief(dealId: string): Promise<BeforeCallBrief> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/before-call-brief`);
  if (!res.ok) throw new Error('Failed to fetch before-call briefing');
  return res.json();
}

export async function fetchRecommendation(dealId: string): Promise<Recommendation | null> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/recommendation`);
  if (!res.ok) throw new Error('Failed to fetch deal recommendation');
  return res.json();
}

export async function sendDealChat(
  dealId: string,
  message: string
): Promise<{ answer: string; retrievedMemories: DealMemory[] }> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Failed to send deal chat message');
  return res.json();
}

export async function fetchFollowUpEmail(dealId: string): Promise<{ subject: string; body: string; keyPointsAddressed: string[] }> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/followup-email`);
  if (!res.ok) throw new Error('Failed to generate follow-up email draft');
  return res.json();
}

export async function fetchObjectionPlaybook(objection?: string): Promise<any[]> {
  const url = objection ? `${API_BASE}/playbook?objection=${encodeURIComponent(objection)}` : `${API_BASE}/playbook`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch objection playbook');
  return res.json();
}

export async function fetchStalledDeals(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/stalled-deals`);
  if (!res.ok) throw new Error('Failed to fetch stalled deals');
  return res.json();
}

export async function sendEmail(dealId: string, emailData: { to: string; subject: string; body: string }): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailData),
  });
  if (!res.ok) throw new Error('Failed to send email');
  return res.json();
}

export async function deleteMeeting(meetingId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove meeting');
  return res.json();
}

export async function fetchEvalResults(): Promise<{ passRate: number; totalTests: number; testsPassed: number; goldenSetResults: any[] }> {
  const res = await fetch(`${API_BASE}/eval`);
  if (!res.ok) throw new Error('Failed to run eval benchmark suite');
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  await fetch(`${API_BASE}/reset`, { method: 'POST' });
}
