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

const API_BASE = '/api';

export async function fetchDashboardDeals(): Promise<{ summary: DashboardSummary; deals: Deal[] }> {
  const res = await fetch(`${API_BASE}/deals`);
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export async function createDeal(dealData: Partial<Deal>): Promise<Deal> {
  const res = await fetch(`${API_BASE}/deals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dealData),
  });
  if (!res.ok) throw new Error('Failed to create deal');
  return res.json();
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
  const res = await fetch(`${API_BASE}/deals/${id}`);
  if (!res.ok) throw new Error('Failed to fetch deal details');
  return res.json();
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

export async function fetchEvalResults(): Promise<{ passRate: number; totalTests: number; testsPassed: number; goldenSetResults: any[] }> {
  const res = await fetch(`${API_BASE}/eval`);
  if (!res.ok) throw new Error('Failed to run eval benchmark suite');
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  await fetch(`${API_BASE}/reset`, { method: 'POST' });
}
