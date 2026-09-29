export interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: 'Discovery' | 'Demo' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  probability: number;
  expected_close_date: string;
  account_owner: string;
  deal_health: 'Good' | 'At Risk' | 'Critical';
  risk_level: 'Low' | 'Medium' | 'High';
  last_interaction: string;
  next_action: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  deal_id: string;
  company_name: string;
  industry: string;
  budget: string;
  timeline: string;
  current_solution: string;
  pain_points: string[];
  company_requirements: string[];
  priorities: string[];
}

export interface Stakeholder {
  id: string;
  deal_id: string;
  name: string;
  title: string;
  role: string;
  email: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Concerned';
  notes: string;
}

export interface Interaction {
  id: string;
  deal_id: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Demo' | 'Negotiation' | 'Note';
  title: string;
  content: string;
  participants: string[];
  date: string;
  created_at: string;
}

export interface DealMemory {
  id: string;
  deal_id: string;
  interaction_id?: string;
  memory_type: 
    | 'Customer statement'
    | 'Objection'
    | 'Requirement'
    | 'Competitor mention'
    | 'Pricing discussion'
    | 'Stakeholder information'
    | 'Action item'
    | 'Sales tactic'
    | 'Outcome';
  content: string;
  importance: 'Low' | 'Medium' | 'High' | 'Critical';
  date: string;
  source_type: string;
  resolved: boolean;
  metadata?: any;
  created_at: string;
}

export interface Competitor {
  id: string;
  deal_id: string;
  name: string;
  mentioned_date: string;
  customer_sentiment: string;
  consideration_reason: string;
  address_strategy: string;
}

export interface Recommendation {
  id: string;
  deal_id: string;
  recommendation: string;
  reason: string;
  confidence: number;
  risk_level: 'Low' | 'Medium' | 'High';
  risk_reason: string;
  risk_mitigation: string;
  status: string;
  created_at: string;
}

export interface ScheduledMeeting {
  id: string;
  deal_id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  participants: string[];
  agenda: string;
  meeting_link: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  created_at: string;
}

export interface DashboardSummary {
  totalActive: number;
  requiringAttention: number;
  atRisk: number;
  closingSoon: number;
  winRate: number;
  pipelineValue: number;
}

export interface AIDealBrief {
  summary: string;
  keyStakeholders: string[];
  mainObjections: string[];
  competitors: string[];
  buyingSignals: string[];
  currentRisk: 'Low' | 'Medium' | 'High';
  riskExplanation: string;
  recommendedStrategy: string;
  recommendedNextAction: string;
}

export interface BeforeCallBrief {
  headline: string;
  whatHappened: string;
  whatMatters: string[];
  whatWorkedPreviously: string;
  avoid: string;
  recommendedApproach: string;
  suggestedTalkingPoints: string[];
}

export interface ExtractionResponse {
  success: boolean;
  interaction: Interaction;
  extractedMemories: DealMemory[];
  extractionSummary: {
    buyingSignals: string[];
    risksExtracted: string[];
    actionItems: string[];
  };
  updatedRecommendation: Recommendation;
}
