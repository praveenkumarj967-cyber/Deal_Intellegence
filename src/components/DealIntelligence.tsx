import React, { useState, useEffect } from 'react';
import {
  Deal,
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
import {
  fetchDealDetails,
  fetchInteractions,
  fetchMemories,
  addInteraction,
  fetchMeetings,
  scheduleMeeting,
  fetchDealBrief,
  fetchBeforeCallBrief,
  sendDealChat,
} from '../services/api';
import {
  ArrowLeft,
  Brain,
  Sparkles,
  Zap,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  MessageSquare,
  Send,
  Users,
  Target,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  HelpCircle,
  X,
  Bot,
  Lightbulb,
  Building2,
  ChevronRight,
  ChevronDown,
  Calendar,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  ExternalLink,
  Volume2,
  Radio,
  PlusCircle,
} from 'lucide-react';

interface DealIntelligenceProps {
  dealId: string;
  onBack: () => void;
}

export const DealIntelligence: React.FC<DealIntelligenceProps> = ({ dealId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [memories, setMemories] = useState<DealMemory[]>([]);
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMemories, setFilteredMemories] = useState<DealMemory[]>([]);

  // Modals & Panels
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [isBeforeCallOpen, setIsBeforeCallOpen] = useState(false);
  const [isExtractionResultOpen, setIsExtractionResultOpen] = useState(false);
  const [extractionData, setExtractionData] = useState<ExtractionResponse | null>(null);

  // Live Virtual Meeting Room Modal State
  const [isLiveMeetingOpen, setIsLiveMeetingOpen] = useState(false);
  const [activeMeetingObj, setActiveMeetingObj] = useState<ScheduledMeeting | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  // Live Real-Time Conversation Speaker Input State inside Meeting
  const [liveSpeaker, setLiveSpeaker] = useState('Sarah Johnson (VP Ops)');
  const [liveSpeakerText, setLiveSpeakerText] = useState('');
  const [activeSpeakerName, setActiveSpeakerName] = useState('Sarah Johnson');

  // Live Transcript Feed & AI Agent Realtime Observations
  const [liveTranscript, setLiveTranscript] = useState<Array<{ speaker: string; text: string; time: string }>>([
    { speaker: 'Alex Morgan (AE)', text: 'Hi Sarah, hi Mike! Thanks for jumping on today to review our 30-day implementation roadmap.', time: '00:05' },
    { speaker: 'Sarah Johnson (VP Ops)', text: 'Thanks Alex. As I mentioned earlier, our biggest priority is ensuring full deployment happens within 30 days so reporting turnarounds do not slip.', time: '00:18' },
    { speaker: 'Mike Chen (Engineering)', text: 'From an API standpoint, your integration docs look clean. We just need confirmation on dedicated technical support during week 1 setup.', time: '00:32' },
    { speaker: 'Alex Morgan (AE)', text: 'Absolutely. We will assign a dedicated Lead Implementation Engineer for your account throughout the 30-day rollout.', time: '00:45' },
  ]);

  const [liveAIObservations, setLiveAIObservations] = useState<string[]>([
    'Customer VP Ops Sarah Johnson emphasized strict 30-day onboarding deadline.',
    'Engineering lead Mike Chen validated API integration architecture.',
    'Assigned dedicated Lead Engineer to eliminate deployment risk.',
  ]);

  // Content for Briefs
  const [briefData, setBriefData] = useState<AIDealBrief | null>(null);
  const [beforeCallData, setBeforeCallData] = useState<BeforeCallBrief | null>(null);

  // Add Interaction Form State
  const [interactionType, setInteractionType] = useState<Interaction['type']>('Call');
  const [interactionTitle, setInteractionTitle] = useState('');
  const [interactionContent, setInteractionContent] = useState('');
  const [interactionParticipants, setInteractionParticipants] = useState('Alex Morgan, Sarah Johnson');
  const [submittingInteraction, setSubmittingInteraction] = useState(false);

  // Schedule Meeting Form State
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [meetingDuration, setMeetingDuration] = useState('30 min');
  const [meetingAttendees, setMeetingAttendees] = useState('Alex Morgan, Sarah Johnson (VP Ops), Mike Chen (Eng)');
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);

  // AI Chat Assistant State
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; memories?: DealMemory[] }>>([
    {
      role: 'assistant',
      text: 'Hello Alex! I am your Deal Intelligence Assistant. I have indexed all historical customer statements, objections, stakeholders, and competitor mentions for this deal. Ask me anything!',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Load All Deal Data
  const loadData = async () => {
    try {
      setLoading(true);
      const details = await fetchDealDetails(dealId);
      setDeal(details.deal);
      setCustomer(details.customer);
      setStakeholders(details.stakeholders);
      setCompetitors(details.competitors);
      setRecommendation(details.recommendation);
      setMeetings(details.meetings || []);

      const ints = await fetchInteractions(dealId);
      setInteractions(ints);

      const mems = await fetchMemories(dealId);
      setMemories(mems.memories);
      setFilteredMemories(mems.memories);
    } catch (err) {
      console.error('Failed to load deal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dealId]);

  // Live Call Timer Effect
  useEffect(() => {
    let timer: any;
    if (isLiveMeetingOpen) {
      timer = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDurationSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isLiveMeetingOpen]);

  // Handle Memory Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMemories(memories);
    } else {
      const q = searchQuery.toLowerCase();
      const matched = memories.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.memory_type.toLowerCase().includes(q) ||
          m.importance.toLowerCase().includes(q)
      );
      setFilteredMemories(matched);
    }
  }, [searchQuery, memories]);

  // Open Live Virtual Meeting Room Modal
  const handleJoinLiveMeeting = (mtg?: ScheduledMeeting) => {
    const activeMtg = mtg || (meetings.length > 0 ? meetings[0] : null);
    setActiveMeetingObj(activeMtg);
    setIsLiveMeetingOpen(true);
  };

  // Add Live Speaker Line During Call (Real-Time Conversation Note Taking & Autonomous Agent Action)
  const handleAddLiveSpeakerLine = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!liveSpeakerText.trim()) return;

    const timeStr = formatCallTime(callDurationSeconds);
    const newTurn = {
      speaker: liveSpeaker,
      text: liveSpeakerText.trim(),
      time: timeStr,
    };

    setLiveTranscript((prev) => [...prev, newTurn]);

    // Update active speaker
    if (liveSpeaker.includes('Sarah')) setActiveSpeakerName('Sarah Johnson');
    else if (liveSpeaker.includes('Mike')) setActiveSpeakerName('Mike Chen');
    else setActiveSpeakerName('Alex Morgan');

    // Autonomous AI Agent Action on the fly during the meeting!
    const textLower = liveSpeakerText.toLowerCase();
    if (textLower.includes('sign') || textLower.includes('contract') || textLower.includes('ready')) {
      setLiveAIObservations((prev) => [
        `🔥 BUYING SIGNAL DETECTED: ${liveSpeaker} indicated readiness to sign contract!`,
        ...prev,
      ]);
    } else if (textLower.includes('cost') || textLower.includes('price') || textLower.includes('discount')) {
      setLiveAIObservations((prev) => [
        `⚠️ COMMERCIAL OBJECTION: ${liveSpeaker} raised commercial pricing terms during call.`,
        ...prev,
      ]);
    } else {
      setLiveAIObservations((prev) => [
        `📝 AI Note Indexed: ${liveSpeaker} stated "${liveSpeakerText.substring(0, 60)}..."`,
        ...prev,
      ]);
    }

    setLiveSpeakerText('');
  };

  // End Call & Auto-Extract Memories
  const handleEndCallAndExtract = async () => {
    const transcriptText = liveTranscript
      .map((t) => `${t.speaker}: "${t.text}"`)
      .join('\n');

    setIsLiveMeetingOpen(false);

    try {
      setSubmittingInteraction(true);
      const response = await addInteraction(dealId, {
        type: 'Meeting',
        title: activeMeetingObj?.title || 'Live Customer Meeting Transcript',
        content: `Full Live Meeting Transcript:\n${transcriptText}`,
        participants: ['Alex Morgan', 'Sarah Johnson', 'Mike Chen'],
        date: new Date().toISOString().split('T')[0],
      });

      setExtractionData(response);
      setIsExtractionResultOpen(true);
      await loadData();
    } catch (err) {
      console.error('Failed to process call notes:', err);
    } finally {
      setSubmittingInteraction(false);
    }
  };

  // Open Schedule Meeting Modal prefilled with Next Best Action
  const handleOpenScheduleMeeting = () => {
    const defaultDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    setMeetingTitle(recommendation?.recommendation || '30-Day Implementation Planning Call');
    setMeetingDate(defaultDate);
    setMeetingTime('14:00');
    setMeetingDuration('30 min');
    setMeetingAttendees('Alex Morgan, Sarah Johnson (VP Ops), Mike Chen (Eng)');
    setMeetingAgenda(recommendation?.reason || 'Review 30-day implementation roadmap and transparent onboarding cost breakdown.');
    setIsScheduleMeetingOpen(true);
  };

  // Submit Schedule Meeting Form
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingDate) return;

    try {
      setSchedulingMeeting(true);
      const attendeesList = meetingAttendees.split(',').map((a) => a.trim());

      const createdMtg = await scheduleMeeting(dealId, {
        title: meetingTitle,
        date: meetingDate,
        time: meetingTime,
        duration: meetingDuration,
        participants: attendeesList,
        agenda: meetingAgenda,
        meeting_link: 'https://meet.google.com/new',
      });

      setIsScheduleMeetingOpen(false);
      await loadData();

      // Automatically launch Live Virtual Meeting Room with NexusAI Agent attending!
      handleJoinLiveMeeting(createdMtg);
    } catch (err) {
      console.error('Failed to schedule meeting:', err);
    } finally {
      setSchedulingMeeting(false);
    }
  };

  // Handle Submission of New Customer Conversation / Interaction
  const handleInteractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionContent.trim()) return;

    try {
      setSubmittingInteraction(true);
      const participantsList = interactionParticipants.split(',').map((p) => p.trim());
      
      const response = await addInteraction(dealId, {
        type: interactionType,
        title: interactionTitle || `${interactionType} with Customer`,
        content: interactionContent,
        participants: participantsList,
        date: new Date().toISOString().split('T')[0],
      });

      setExtractionData(response);
      setIsAddInteractionOpen(false);
      setIsExtractionResultOpen(true);

      // Reset Form
      setInteractionTitle('');
      setInteractionContent('');

      // Reload fresh data from backend
      await loadData();
    } catch (err) {
      console.error('Error submitting interaction:', err);
    } finally {
      setSubmittingInteraction(false);
    }
  };

  // Handle "BRIEF ME" Click
  const handleOpenBeforeCallBrief = async () => {
    try {
      const data = await fetchBeforeCallBrief(dealId);
      setBeforeCallData(data);
      setIsBeforeCallOpen(true);
    } catch (err) {
      console.error('Failed to load before call brief:', err);
    }
  };

  // Handle AI Deal Brief Click
  const handleOpenDealBrief = async () => {
    try {
      const data = await fetchDealBrief(dealId);
      setBriefData(data);
      setIsBriefModalOpen(true);
    } catch (err) {
      console.error('Failed to load deal brief:', err);
    }
  };

  // Handle Chat Submit
  const handleSendChatWithQuery = async (queryText: string) => {
    if (!queryText.trim() || chatLoading) return;

    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: queryText }]);
    setChatLoading(true);

    try {
      const res = await sendDealChat(dealId, queryText);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.answer, memories: res.retrievedMemories },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I encountered an error retrieving deal intelligence.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendChatWithQuery(chatInput);
  };

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400">Syncing Deal Memory & Intelligence Core...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <p className="text-base font-bold text-white">Deal details are loading or not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-glow transition-all"
        >
          Return to Sales Dashboard
        </button>
      </div>
    );
  }

  const pipelineStages = ['Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closed Won'];
  const currentStageIndex = pipelineStages.indexOf(deal.stage);

  return (
    <div className="space-y-6 pb-24">
      {/* 1. TOP BAR & ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
            title="Return to Sales Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{deal.company}</h1>
              <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ${deal.value.toLocaleString()}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {deal.risk_level} Risk
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{deal.name} • Account Owner: {deal.account_owner}</p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          {/* JOIN LIVE MEETING ROOM BUTTON */}
          <button
            onClick={() => handleJoinLiveMeeting()}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-glow-emerald transition-all transform hover:scale-105"
          >
            <Video className="w-4 h-4 animate-pulse" />
            <span>Join Live Meeting Room</span>
          </button>

          {/* SCHEDULE MEETING BUTTON */}
          <button
            onClick={handleOpenScheduleMeeting}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-semibold text-xs rounded-xl transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>

          {/* BRIEF ME BUTTON */}
          <button
            onClick={handleOpenBeforeCallBrief}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-glow-purple transition-all transform hover:scale-105"
          >
            <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>BRIEF ME</span>
          </button>

          {/* AI DEAL BRIEF */}
          <button
            onClick={handleOpenDealBrief}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            <Brain className="w-4 h-4 text-blue-400" />
            <span>AI Deal Brief</span>
          </button>

          {/* ADD CONVERSATION BUTTON */}
          <button
            onClick={() => setIsAddInteractionOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-glow transition-all transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Conversation</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION A: DEAL OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3 rounded-xl glass-card border border-slate-800">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Company</span>
          <p className="text-sm font-bold text-white truncate">{deal.company}</p>
        </div>

        <div className="p-3 rounded-xl glass-card border border-slate-800">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Deal Value</span>
          <p className="text-sm font-bold text-emerald-400">${deal.value.toLocaleString()}</p>
        </div>

        <div className="p-3 rounded-xl glass-card border border-slate-800">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Sales Stage</span>
          <p className="text-sm font-bold text-blue-400">{deal.stage}</p>
        </div>

        <div className="p-3 rounded-xl glass-card border border-slate-800">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Probability</span>
          <p className="text-sm font-bold text-purple-400">{deal.probability}%</p>
        </div>

        <div className="p-3 rounded-xl glass-card border border-slate-800">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Expected Close</span>
          <p className="text-xs font-bold text-slate-200">{deal.expected_close_date}</p>
        </div>

        <div className="p-3 rounded-xl glass-card border border-slate-800">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Account Owner</span>
          <p className="text-xs font-bold text-slate-200">{deal.account_owner}</p>
        </div>

        <div className="p-3 rounded-xl glass-card border border-slate-800">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Deal Health</span>
          <p className="text-xs font-bold text-amber-400">{deal.deal_health}</p>
        </div>

        <div className="p-3 rounded-xl glass-card border border-slate-800">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Memories Indexed</span>
          <p className="text-sm font-bold text-blue-400">{memories.length} Memories</p>
        </div>
      </div>

      {/* 3. STAGE PIPELINE TIMELINE */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Sales Pipeline Stage Progress</span>
        </h4>

        <div className="grid grid-cols-5 gap-2">
          {pipelineStages.map((stg, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div
                key={stg}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-blue-600/20 border-blue-500/60 shadow-glow text-white'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  Stage {idx + 1}
                </div>
                <div className="text-xs font-extrabold">{stg}</div>
                {isCurrent && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-semibold bg-blue-500 text-white rounded-full">
                    Current Stage
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* NEXT BEST ACTION CARD WITH LIVE JOIN & SCHEDULE */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/60 via-slate-900 to-indigo-950/40 border-2 border-blue-500/50 shadow-glow-blue space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  NEXT BEST ACTION
                </h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {recommendation?.confidence || 82}% Confidence
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-600/15 border border-blue-500/30 space-y-3">
              <p className="text-sm font-bold text-white leading-relaxed">
                "{recommendation?.recommendation || deal.next_action}"
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleJoinLiveMeeting()}
                  className="py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-glow-emerald transition-all"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Live Call Now</span>
                </button>
                <button
                  onClick={handleOpenScheduleMeeting}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Call</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                WHY? (REASONING FROM DEAL HISTORY)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                {recommendation?.reason || 'Based on customer interaction history and unresolved objections.'}
              </p>
            </div>
          </div>

          {/* SCHEDULED MEETINGS CARD */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Scheduled Meetings ({meetings.length})</span>
              </h3>
              <button
                onClick={handleOpenScheduleMeeting}
                className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Schedule New</span>
              </button>
            </div>

            {meetings.length === 0 ? (
              <p className="text-xs text-slate-500">No upcoming meetings scheduled.</p>
            ) : (
              <div className="space-y-3">
                {meetings.map((mtg) => (
                  <div key={mtg.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{mtg.title}</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {mtg.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-blue-400" /> {mtg.date}</span>
                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-blue-400" /> {mtg.time} ({mtg.duration})</span>
                    </div>

                    <p className="text-[11px] text-slate-300"><span className="text-slate-500">Agenda:</span> {mtg.agenda}</p>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleJoinLiveMeeting(mtg)}
                        className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-glow-emerald transition-all"
                      >
                        <Video className="w-3.5 h-3.5 mr-1" />
                        <span>Join Meeting with NexusAI Agent (Listening & Recording)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DEAL RISK DETECTION CARD */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            recommendation?.risk_level === 'High'
              ? 'bg-rose-950/30 border-rose-500/40'
              : recommendation?.risk_level === 'Medium'
              ? 'bg-amber-950/30 border-amber-500/40'
              : 'bg-emerald-950/30 border-emerald-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className={`w-5 h-5 ${
                  recommendation?.risk_level === 'High' ? 'text-rose-400' : 'text-amber-400'
                }`} />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                  DEAL RISK DETECTION
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border uppercase ${
                recommendation?.risk_level === 'High'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {recommendation?.risk_level || deal.risk_level} RISK
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-300">Risk Reason:</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {recommendation?.risk_reason || 'Implementation timeframe concern has appeared in 3 interactions and has not yet been resolved.'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-xs font-semibold text-blue-300">Recommended Risk Mitigation:</p>
              <p className="text-xs text-slate-300 mt-0.5">
                {recommendation?.risk_mitigation || 'Provide a detailed 30-day implementation plan before the next call.'}
              </p>
            </div>
          </div>

          {/* CUSTOMER PROFILE & STAKEHOLDERS */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Customer Profile & Stakeholders</span>
            </h3>

            {/* Pain Points */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pain Points:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {customer?.pain_points?.map((pt, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-lg">
                    {pt}
                  </span>
                ))}
              </div>
            </div>

            {/* Stakeholder Roster */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Key Stakeholders:</span>
              <div className="space-y-2 mt-2">
                {stakeholders.map((sh) => (
                  <div key={sh.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{sh.name} <span className="text-slate-400 font-normal">— {sh.title}</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sh.notes}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                      sh.role === 'Decision Maker' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {sh.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Company Requirements */}
            {customer?.company_requirements && customer.company_requirements.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Requirements:</span>
                <ul className="mt-1 space-y-1 text-xs text-slate-300">
                  {customer.company_requirements.map((req, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* COMPETITOR INTELLIGENCE SECTION */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span>Competitor Intelligence</span>
            </h3>

            {competitors.length === 0 ? (
              <p className="text-xs text-slate-500">No competitors mentioned yet.</p>
            ) : (
              competitors.map((comp) => (
                <div key={comp.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-purple-300">{comp.name}</span>
                    <span className="text-[10px] text-slate-400">Mentioned: {comp.mentioned_date}</span>
                  </div>
                  <p className="text-xs text-slate-300"><span className="text-slate-500">Reason considering:</span> {comp.consideration_reason}</p>
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200">
                    <span className="font-bold">Counter Strategy:</span> {comp.address_strategy}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (7 cols): PERSISTENT DEAL MEMORY + MEMORY SEARCH */}
        <div className="lg:col-span-7 space-y-6">

          {/* MEMORY SEARCH BAR */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Search className="w-4 h-4 text-blue-400" />
                <span>Search Persistent Deal Memory</span>
              </h3>
              <span className="text-[10px] text-slate-400">{filteredMemories.length} Memories Found</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder='Search deal memory e.g. "Sarah", "Salesforce", "implementation", "pricing"...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick Example Queries */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold">Example Memory Queries:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "What objections did Sarah raise?",
                  "When was Salesforce first mentioned?",
                  "What pricing concerns did the customer have?",
                  "What worked during previous meetings?",
                  "Who is the decision maker?",
                ].map((queryText) => (
                  <button
                    key={queryText}
                    onClick={() => {
                      const keyword = queryText.includes('Sarah')
                        ? 'Sarah'
                        : queryText.includes('Salesforce')
                        ? 'Salesforce'
                        : queryText.includes('pricing')
                        ? 'pricing'
                        : queryText.includes('worked')
                        ? 'demo'
                        : 'Decision Maker';
                      setSearchQuery(keyword);
                    }}
                    className="px-2.5 py-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg border border-slate-700 transition-colors"
                  >
                    "{queryText}"
                  </button>
                ))}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-2 py-1 text-[10px] font-semibold text-rose-400 hover:underline ml-1"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PERSISTENT MEMORY TIMELINE */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center space-x-2">
                <Brain className="w-4.5 h-4.5 text-blue-400" />
                <span>Persistent Deal Memory Timeline</span>
              </h3>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Indexed in Database
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredMemories.length === 0 ? (
                <p className="text-xs text-center text-slate-500 py-8">
                  No memories match search query "{searchQuery}".
                </p>
              ) : (
                filteredMemories.map((mem) => {
                  const getTypeStyle = (type: string) => {
                    if (type === 'Objection') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                    if (type === 'Requirement') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
                    if (type === 'Competitor mention') return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
                    if (type === 'Pricing discussion') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                    if (type === 'Outcome') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                    return 'bg-slate-800 text-slate-300 border-slate-700';
                  };

                  return (
                    <div
                      key={mem.id}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getTypeStyle(mem.memory_type)}`}>
                            {mem.memory_type}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {mem.date} • {mem.source_type}
                          </span>
                        </div>

                        {mem.importance === 'Critical' && (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-rose-500 text-white rounded">
                            CRITICAL
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        "{mem.content}"
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* HISTORICAL CONVERSATION & INTERACTION LIST */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Conversations & Interactions ({interactions.length})</span>
              </h3>
              <button
                onClick={() => setIsAddInteractionOpen(true)}
                className="text-[11px] font-bold text-blue-400 hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Conversation</span>
              </button>
            </div>

            <div className="space-y-2">
              {interactions.map((int) => (
                <div key={int.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-bold text-white">{int.title}</span>
                    <span className="text-[10px] text-slate-500">{int.date} ({int.type})</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{int.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 5. LIVE VIRTUAL MEETING ROOM MODAL (WITH REALTIME SPEAKER INPUT & AGENT OBSERVATIONS) */}
      {isLiveMeetingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
          <div className="w-full max-w-5xl h-[90vh] rounded-2xl glass-panel border-2 border-emerald-500/50 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Room Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  <span>LIVE NOTE TAKING ACTIVE</span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {activeMeetingObj?.title || '30-Day Implementation & Roadmap Alignment Call'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {deal.company} • Call Duration: <span className="text-emerald-400 font-mono font-bold">{formatCallTime(callDurationSeconds)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold inline-flex items-center space-x-1"
                >
                  <span>Open Google Meet Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={handleEndCallAndExtract}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call & Extract Memories</span>
                </button>
              </div>
            </div>

            {/* Room Content: Video Stage + Live AI Note Taking & Speaker Input */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              
              {/* Left Video Stage & Speaker Controls (7 cols) */}
              <div className="lg:col-span-7 p-4 bg-slate-950 flex flex-col justify-between space-y-4 overflow-y-auto">
                {/* 3 Participant Cards */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Card 1: Sarah Johnson (VP Ops) */}
                  <div className={`relative rounded-2xl bg-slate-900 border-2 p-3 transition-all flex flex-col items-center justify-center ${
                    activeSpeakerName === 'Sarah Johnson' ? 'border-emerald-500/80 shadow-glow-emerald bg-emerald-950/20' : 'border-slate-800'
                  }`}>
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80"
                      alt="Sarah Johnson"
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/40"
                    />
                    <div className="mt-2 text-center">
                      <p className="text-xs font-bold text-white">Sarah Johnson</p>
                      <p className="text-[10px] text-slate-400">VP Operations (Decision Maker)</p>
                    </div>

                    {activeSpeakerName === 'Sarah Johnson' && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold flex items-center space-x-1">
                        <Volume2 className="w-3 h-3 text-emerald-400 animate-bounce" />
                        <span>Speaking</span>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Mike Chen (Engineering) */}
                  <div className={`relative rounded-2xl bg-slate-900 border-2 p-3 transition-all flex flex-col items-center justify-center ${
                    activeSpeakerName === 'Mike Chen' ? 'border-purple-500/80 shadow-glow-purple bg-purple-950/20' : 'border-slate-800'
                  }`}>
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"
                      alt="Mike Chen"
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-500/40"
                    />
                    <div className="mt-2 text-center">
                      <p className="text-xs font-bold text-white">Mike Chen</p>
                      <p className="text-[10px] text-slate-400">Engineering Manager</p>
                    </div>

                    {activeSpeakerName === 'Mike Chen' && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold flex items-center space-x-1">
                        <Volume2 className="w-3 h-3 text-purple-400 animate-bounce" />
                        <span>Speaking</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Real-Time Live Speaker Note Input Box (Agent Notes Everyone's Conversation in Realtime!) */}
                <form onSubmit={handleAddLiveSpeakerLine} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>Live Note Taking: Add Speaker Statement</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">AI Agent Listening...</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={liveSpeaker}
                      onChange={(e) => setLiveSpeaker(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="Sarah Johnson (VP Ops)">Sarah Johnson (VP Ops)</option>
                      <option value="Mike Chen (Engineering)">Mike Chen (Eng)</option>
                      <option value="Alex Morgan (AE)">Alex Morgan (AE)</option>
                      <option value="David Vance (Procurement)">David Vance (Procurement)</option>
                    </select>

                    <input
                      type="text"
                      placeholder="e.g. 'If we get 30-day onboarding in writing, we sign Friday.'"
                      value={liveSpeakerText}
                      onChange={(e) => setLiveSpeakerText(e.target.value)}
                      className="col-span-2 px-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex space-x-1">
                      {[
                        "Sarah: We can sign Friday if 30-day plan is guaranteed.",
                        "Mike: Architecture review passed SOC2 compliance.",
                        "Sarah: Comparing onboarding support vs Salesforce.",
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLiveSpeakerText(preset.split(': ')[1])}
                          className="px-2 py-1 text-[9px] bg-slate-950 hover:bg-slate-800 text-blue-300 rounded border border-slate-800 truncate max-w-[150px]"
                        >
                          Preset {idx + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-glow-emerald flex items-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Note Speaker Statement</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side: Live AI Diarization Transcript + Autonomous Real-Time Observations (5 cols) */}
              <div className="lg:col-span-5 p-4 bg-slate-900/95 border-l border-slate-800 flex flex-col justify-between space-y-4">
                
                {/* Real-Time Transcript Stream */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>Live Meeting Transcript Stream ({liveTranscript.length})</span>
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">Realtime</span>
                  </div>

                  <div className="h-52 overflow-y-auto space-y-2.5 pr-1 text-xs">
                    {liveTranscript.map((t, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-blue-300">{t.speaker}</span>
                          <span className="text-slate-500">{t.time}</span>
                        </div>
                        <p className="text-slate-200 text-[11px] leading-relaxed">"{t.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Autonomous Real-Time AI Observations & Next Action Adaptation */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/60 via-indigo-950/50 to-slate-950 border border-blue-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-amber-300">
                      <Brain className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Agent Real-Time Observations</span>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-500/20 text-blue-300">
                      Adapting Intelligence
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto text-[11px] text-slate-200">
                    {liveAIObservations.map((obs, idx) => (
                      <p key={idx} className="leading-snug flex items-start space-x-1.5">
                        <span className="text-blue-400 font-bold">•</span>
                        <span>{obs}</span>
                      </p>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* 6. FLOATING / EMBEDDED AI CHAT ASSISTANT */}
      <div className="fixed bottom-4 right-4 z-40 w-80 md:w-96 glass-panel border-2 border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Chat Header */}
        <div
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="p-3.5 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 flex items-center justify-between cursor-pointer border-b border-slate-800"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Deal AI Assistant</h4>
              <p className="text-[9px] text-blue-300 font-medium">Memory Retrieval Active</p>
            </div>
          </div>

          <button className="text-slate-400 hover:text-white">
            {isChatOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Chat Body */}
        {isChatOpen && (
          <div className="p-3 space-y-3 bg-slate-950/95">
            {/* Quick Sample Questions */}
            <div className="space-y-1 border-b border-slate-800 pb-2">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Example Questions:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  "What is blocking this deal?",
                  "What does the customer care about most?",
                  "Which competitor are they considering?",
                  "What should I discuss in my next meeting?",
                  "What objections are still unresolved?",
                  "Summarize all interactions from the last 2 weeks.",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendChatWithQuery(q)}
                    className="px-2 py-1 text-[9px] bg-slate-900 hover:bg-blue-600/30 text-blue-300 hover:text-white rounded-md border border-slate-800 transition-colors text-left"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto space-y-3 pr-1 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-sm'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    
                    {msg.memories && msg.memories.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-blue-300">
                        <span className="font-bold">Retrieved Memories ({msg.memories.length}):</span>
                        {msg.memories.slice(0, 2).map((m) => (
                          <div key={m.id} className="mt-1 text-slate-400 truncate">
                            • [{m.memory_type}] {m.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center space-x-2 text-xs text-blue-400 py-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                  <span>Searching deal memory & generating answer...</span>
                </div>
              )}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendChat} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Ask about this deal history..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL: SCHEDULE MEETING */}
      {isScheduleMeetingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>Schedule Customer Meeting</span>
              </h3>
              <button onClick={() => setIsScheduleMeetingOpen(false)} className="text-slate-400 hover:text-white font-bold">
                ×
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30-Day Implementation Roadmap Alignment"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="14:00"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Duration</label>
                  <select
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="15 min">15 min</option>
                    <option value="30 min">30 min</option>
                    <option value="45 min">45 min</option>
                    <option value="60 min">60 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Attendees / Participants</label>
                <input
                  type="text"
                  value={meetingAttendees}
                  onChange={(e) => setMeetingAttendees(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Agenda & Next Action Objective</label>
                <textarea
                  rows={3}
                  placeholder="Outline topics to discuss..."
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleMeetingOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingMeeting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-glow-emerald flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{schedulingMeeting ? 'Scheduling...' : 'Confirm Meeting & Calendar Invite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD CONVERSATION FORM */}
      {isAddInteractionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Log New Conversation / Customer Interaction</span>
              </h3>
              <button onClick={() => setIsAddInteractionOpen(false)} className="text-slate-400 hover:text-white font-bold">
                ×
              </button>
            </div>

            <form onSubmit={handleInteractionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Conversation Type</label>
                  <select
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value as Interaction['type'])}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Call">Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Demo">Demo</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Email">Email</option>
                    <option value="Note">Note / Voice Transcript</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Participants</label>
                  <input
                    type="text"
                    value={interactionParticipants}
                    onChange={(e) => setInteractionParticipants(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Title / Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Implementation Timeline Follow-up"
                  value={interactionTitle}
                  onChange={(e) => setInteractionTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-300">Conversation / Notes Transcript</label>
                  <button
                    type="button"
                    onClick={() =>
                      setInteractionContent(
                        "Sarah said they are interested in moving forward, but implementation time is still the biggest concern. She wants a detailed 30-day implementation plan."
                      )
                    }
                    className="text-[10px] text-blue-400 hover:underline font-semibold"
                  >
                    + Insert Hackathon Demo Input
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed conversation notes, email body, or paste meeting transcript..."
                  value={interactionContent}
                  onChange={(e) => setInteractionContent(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Quick Conversation Templates */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400">Quick Templates:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[
                    "Sarah said they are interested in moving forward, but implementation time is still the biggest concern. She wants a detailed 30-day implementation plan.",
                    "David from procurement asked if we can provide a 15% annual billing discount to match Salesforce pricing.",
                    "Mike Chen confirmed their engineering team completed security compliance review and approved our architecture.",
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInteractionContent(tpl)}
                      className="px-2 py-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-blue-300 rounded border border-slate-700 truncate max-w-xs"
                    >
                      Template {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Submitting will automatically trigger the AI Extraction Pipeline: extracting Objections, Requirements, Stakeholders, Competitors, and updating Next Best Action recommendations in memory.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddInteractionOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInteraction}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-bold shadow-glow flex items-center space-x-2"
                >
                  {submittingInteraction ? (
                    <span>Extracting Intelligence...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Process & Save Memory</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI EXTRACTION RESULT OVERLAY */}
      {isExtractionResultOpen && extractionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-2xl p-6 rounded-2xl glass-panel border-2 border-emerald-500/50 shadow-glow-emerald space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">AI Extraction & Memory Update Complete</h3>
              </div>
              <button onClick={() => setIsExtractionResultOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Extracted Memories */}
              <div>
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Newly Extracted & Saved Memories ({extractionData.extractedMemories.length}):
                </h4>
                <div className="space-y-2">
                  {extractionData.extractedMemories.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-500/20 text-blue-300 mr-2">
                          {m.memory_type}
                        </span>
                        <span className="text-slate-200 font-semibold">{m.content}</span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-rose-500 text-white rounded">
                        {m.importance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Updated Recommendation */}
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 space-y-2">
                <h4 className="font-bold text-blue-300 uppercase tracking-wider">
                  Updated Recommendation & Strategy:
                </h4>
                <p className="text-sm font-bold text-white">
                  "{extractionData.updatedRecommendation.recommendation}"
                </p>
                <p className="text-xs text-slate-300">
                  <span className="font-bold text-blue-400">Reasoning:</span> {extractionData.updatedRecommendation.reason}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsExtractionResultOpen(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-glow"
              >
                Continue to Deal Intelligence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: "BRIEF ME" BEFORE YOUR NEXT CALL BRIEFING */}
      {isBeforeCallOpen && beforeCallData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-2xl p-6 rounded-2xl glass-panel border-2 border-purple-500/50 shadow-glow-purple space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
                <h3 className="text-base font-extrabold text-white">BEFORE YOUR NEXT CALL</h3>
              </div>
              <button onClick={() => setIsBeforeCallOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="font-bold text-purple-300 uppercase tracking-wider mb-1">What Happened:</h4>
                <p className="text-slate-200 leading-relaxed">{beforeCallData.whatHappened}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30">
                <h4 className="font-bold text-blue-300 uppercase tracking-wider mb-2">What Matters Most:</h4>
                <ul className="space-y-1.5 text-slate-200">
                  {beforeCallData.whatMatters.map((item, idx) => (
                    <li key={idx} className="font-semibold text-white">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <h4 className="font-bold text-emerald-300 uppercase tracking-wider mb-1">What Worked Previously:</h4>
                  <p className="text-slate-300">{beforeCallData.whatWorkedPreviously}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                  <h4 className="font-bold text-rose-300 uppercase tracking-wider mb-1">Avoid:</h4>
                  <p className="text-slate-300">{beforeCallData.avoid}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                <h4 className="font-bold text-amber-300 uppercase tracking-wider">Suggested Talking Points:</h4>
                <ul className="space-y-1 text-slate-200">
                  {beforeCallData.suggestedTalkingPoints.map((tp, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{tp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsBeforeCallOpen(false)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-glow"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FULL AI DEAL BRIEF */}
      {isBriefModalOpen && briefData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-2xl p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-extrabold text-white">EXECUTIVE AI DEAL BRIEF</h3>
              </div>
              <button onClick={() => setIsBriefModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1">Deal Summary:</h4>
                <p className="text-slate-200 leading-relaxed p-3 rounded-xl bg-slate-900 border border-slate-800">
                  {briefData.summary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="font-bold text-blue-300 uppercase tracking-wider mb-1">Main Objections:</h4>
                  <ul className="space-y-1 text-slate-300">
                    {briefData.mainObjections.map((o, idx) => (
                      <li key={idx}>• {o}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="font-bold text-emerald-300 uppercase tracking-wider mb-1">Buying Signals:</h4>
                  <ul className="space-y-1 text-slate-300">
                    {briefData.buyingSignals.map((b, idx) => (
                      <li key={idx}>• {b}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                <h4 className="font-bold text-blue-300 uppercase tracking-wider">Recommended Strategy:</h4>
                <p className="text-slate-200 leading-relaxed">{briefData.recommendedStrategy}</p>
                <div className="pt-2 border-t border-slate-800 text-white font-bold">
                  Recommended Action: "{briefData.recommendedNextAction}"
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsBriefModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
              >
                Close Executive Brief
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
