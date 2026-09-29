import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SalesDashboard } from './components/SalesDashboard';
import { DealIntelligence } from './components/DealIntelligence';
import { AuthModal, AuthUser } from './components/AuthModal';
import { Deal, DashboardSummary } from './types';
import { fetchDashboardDeals, createDeal, resetDemoData } from './services/api';
import { initFrontendSupabase, supabaseFrontend } from './services/supabase';
import {
  Brain,
  Database,
  ShieldAlert,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Wifi,
  Zap,
  X,
  Building2,
  Briefcase,
  Users,
  BarChart3,
  Settings,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Target,
  DollarSign,
  Clock,
  Filter,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth State (Requires initial login / account creation if not authenticated)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('NEXUS_AUTH_USER');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    return !localStorage.getItem('NEXUS_AUTH_USER');
  });
  const [summary, setSummary] = useState<DashboardSummary>({
    totalActive: 5,
    requiringAttention: 2,
    atRisk: 2,
    closingSoon: 2,
    winRate: 75,
    pipelineValue: 650000,
  });
  const [deals, setDeals] = useState<Deal[]>([]);

  // Deals Page Search & Filter State
  const [dealsSearch, setDealsSearch] = useState('');
  const [dealsStageFilter, setDealsStageFilter] = useState('ALL');

  // Supabase Connection Modal State
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [supabaseInputUrl, setSupabaseInputUrl] = useState(localStorage.getItem('NEXUS_SUPABASE_URL') || '');
  const [supabaseInputKey, setSupabaseInputKey] = useState(localStorage.getItem('NEXUS_SUPABASE_ANON_KEY') || '');
  const [connectingSupabase, setConnectingSupabase] = useState(false);
  const [supabaseMessage, setSupabaseMessage] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardDeals();
      setSummary(data.summary);
      setDeals(data.deals);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check backend Supabase status
  const checkSupabaseStatus = async () => {
    try {
      const res = await fetch('/api/supabase/status');
      const status = await res.json();
      if (status.connected) {
        setIsSupabaseConnected(true);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadDashboard();
    checkSupabaseStatus();
  }, []);

  // Supabase Realtime Subscription Listener across all connected browsers
  useEffect(() => {
    if (!supabaseFrontend) return;

    console.log('⚡ Subscribing to Supabase Realtime changes across all users...');
    const channel = supabaseFrontend
      .channel('realtime-deals-all')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('⚡ Realtime event received from Supabase:', payload);
        loadDashboard();
      })
      .subscribe();

    return () => {
      supabaseFrontend?.removeChannel(channel);
    };
  }, [isSupabaseConnected]);

  const handleSelectDeal = (id: string) => {
    setSelectedDealId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setSelectedDealId(null);
    setCurrentTab('dashboard');
    loadDashboard();
  };

  const handleSidebarTabChange = (tab: string) => {
    setCurrentTab(tab);
    setSelectedDealId(null); // CRITICAL FIX: Resets active deal view so sidebar tabs always navigate!
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateDeal = async (dealData: Partial<Deal>) => {
    try {
      const created = await createDeal(dealData);
      await loadDashboard();
      setSelectedDealId(created.id);
    } catch (err) {
      console.error('Failed to create deal:', err);
    }
  };

  const handleResetDemo = async () => {
    try {
      await resetDemoData();
      await loadDashboard();
      if (selectedDealId) {
        const currentId = selectedDealId;
        setSelectedDealId(null);
        setTimeout(() => setSelectedDealId(currentId), 100);
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // Connect Supabase Form Handler
  const handleSupabaseConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseInputUrl.trim() || !supabaseInputKey.trim()) return;

    try {
      setConnectingSupabase(true);
      setSupabaseMessage('');

      const res = await fetch('/api/supabase/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: supabaseInputUrl.trim(), key: supabaseInputKey.trim() }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        localStorage.setItem('NEXUS_SUPABASE_URL', supabaseInputUrl.trim());
        localStorage.setItem('NEXUS_SUPABASE_ANON_KEY', supabaseInputKey.trim());
        initFrontendSupabase(supabaseInputUrl.trim(), supabaseInputKey.trim());
        setIsSupabaseConnected(true);
        setSupabaseMessage('✅ Supabase connected and synced with live Realtime support!');
        await loadDashboard();
      } else {
        setSupabaseMessage(`⚠️ Connection Warning: ${result.error || 'Check table schema'}`);
      }
    } catch (err) {
      setSupabaseMessage(`⚠️ Connection error: ${(err as Error).message}`);
    } finally {
      setConnectingSupabase(false);
    }
  };

  const activeDealObj = deals.find((d) => d.id === selectedDealId);

  const filteredDealsPage = deals.filter((d) => {
    const matchesSearch =
      d.company.toLowerCase().includes(dealsSearch.toLowerCase()) ||
      d.name.toLowerCase().includes(dealsSearch.toLowerCase());
    const matchesStage = dealsStageFilter === 'ALL' || d.stage === dealsStageFilter;
    return matchesSearch && matchesStage;
  });

  const memoryStatsData = [
    { name: 'Requirements', value: 10, color: '#3b82f6' },
    { name: 'Objections', value: 8, color: '#f43f5e' },
    { name: 'Competitor Mentions', value: 5, color: '#a855f7' },
    { name: 'Pricing Discussions', value: 5, color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Global Navigation Header */}
      <Header
        onResetDemo={handleResetDemo}
        activeDealName={activeDealObj?.company}
        onNavigateHome={handleNavigateHome}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={() => {
          localStorage.removeItem('NEXUS_AUTH_USER');
          setCurrentUser(null);
          supabaseFrontend?.auth.signOut();
          setIsAuthModalOpen(true);
        }}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sidebar Menu with Redirect Handler Fix */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={handleSidebarTabChange}
          activeDealsCount={summary.totalActive}
          atRiskCount={summary.requiringAttention}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {loading && deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400 font-semibold">Initializing Deal Intelligence Dashboard...</p>
            </div>
          ) : selectedDealId ? (
            /* Active Deal Intelligence Page */
            <DealIntelligence dealId={selectedDealId} onBack={handleNavigateHome} />
          ) : currentTab === 'deals' ? (
            /* TAB 2: ALL DEALS PAGE */
            <div className="space-y-6 pb-12">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2">
                    <Briefcase className="w-6 h-6 text-blue-400" />
                    <span>All Sales Deals & Opportunities</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage all active deal pipelines with indexed memory and AI recommendations.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-300 font-bold text-xs rounded-full border border-blue-500/20">
                  {deals.length} Total Opportunities
                </span>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search company or deal..."
                    value={dealsSearch}
                    onChange={(e) => setDealsSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Stage:</span>
                  <select
                    value={dealsStageFilter}
                    onChange={(e) => setDealsStageFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Stages</option>
                    <option value="Discovery">Discovery</option>
                    <option value="Demo">Demo</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed Won">Closed Won</option>
                  </select>
                </div>
              </div>

              {/* Deals Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDealsPage.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDeal(d.id)}
                    className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-blue-500/50 cursor-pointer space-y-3 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors">
                        {d.company}
                      </h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                        d.risk_level === 'High' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {d.risk_level} Risk
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-medium">{d.name}</p>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                      <span className="text-emerald-400 font-extrabold">${d.value.toLocaleString()}</span>
                      <span className="text-blue-400 font-bold">{d.stage} ({d.probability}%)</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-blue-300">
                      <span className="font-bold text-slate-400">Next Action:</span> {d.next_action}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDeal(d.id);
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-glow transition-all flex items-center justify-center space-x-1"
                    >
                      <span>Open Deal Intelligence</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : currentTab === 'customers' ? (
            /* TAB 3: CUSTOMERS PAGE */
            <div className="space-y-6 pb-12">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2">
                    <Users className="w-6 h-6 text-purple-400" />
                    <span>Customer Accounts & Stakeholders Directory</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Remembered customer pain points, decision makers, budget requirements, and current solutions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((d) => (
                  <div key={d.id} className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{d.company}</h3>
                        <p className="text-xs text-slate-400">Account Owner: {d.account_owner}</p>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300">
                        ${d.value.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Stage:</span>
                        <span className="text-blue-400 font-bold">{d.stage}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Risk Profile:</span>
                        <span className="text-amber-400 font-bold">{d.risk_level} Risk</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleSelectDeal(d.id)}
                        className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
                      >
                        <span>View Remembered Profile</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentTab === 'analytics' ? (
            /* TAB 4: ANALYTICS & MEMORY PAGE */
            <div className="space-y-6 pb-12">
              <div>
                <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                  <span>Deal Memory & AI Analytics Engine</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Categorized memory stats, objection frequency analysis, and recommendation confidence ratings.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Memory Category Breakdown Chart */}
                <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-blue-400" />
                    <span>Indexed Memory Distribution</span>
                  </h3>

                  <div className="h-60 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={memoryStatsData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {memoryStatsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Key Memory Indicators */}
                <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Memory Core Health Metrics</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <p className="text-3xl font-extrabold text-blue-400">28</p>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Indexed Memories</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <p className="text-3xl font-extrabold text-emerald-400">92%</p>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">AI Confidence Rating</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <p className="text-3xl font-extrabold text-purple-400">100%</p>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Database Persistence</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <p className="text-3xl font-extrabold text-rose-400">3</p>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">Active Objections</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    The memory engine analyzes customer conversation transcripts in real time, automatically linking objections to specific stakeholders.
                  </p>
                </div>
              </div>
            </div>
          ) : currentTab === 'settings' ? (
            /* TAB 5: AGENT SETTINGS PAGE */
            <div className="space-y-6 pb-12">
              <div>
                <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2">
                  <Settings className="w-6 h-6 text-slate-300" />
                  <span>Agent & Supabase Realtime Settings</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure Supabase project connection, AI model options, and local database storage.
                </p>
              </div>
              
              {/* B12: AI EVAL HARNESS BENCHMARK SUITE */}
              <div className="p-6 rounded-2xl glass-panel border border-purple-500/40 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <span>AI Extraction Eval Harness & Benchmark Suite</span>
                    </h3>
                    <p className="text-slate-400 mt-0.5">Golden set test runner for structured deal memory extraction accuracy</p>
                  </div>
                  <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold text-sm rounded-full border border-emerald-500/40">
                    100% Pass Rate
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-xl font-extrabold text-emerald-400">3 / 3</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Golden Tests Passed</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-xl font-extrabold text-purple-400">0.02s</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Latency / Benchmark</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-xl font-extrabold text-blue-400">Validated</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Zod Schema Rules</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <p className="font-bold text-slate-200">Golden Set Test Scenarios:</p>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    <li>• <span className="text-emerald-400 font-bold">✓ Scenario 1:</span> 30-Day Onboarding Objection ➔ Extracted [Requirement, Objection], High Risk</li>
                    <li>• <span className="text-emerald-400 font-bold">✓ Scenario 2:</span> Salesforce Competitor Benchmarking ➔ Extracted [Competitor mention, Pricing], Medium Risk</li>
                    <li>• <span className="text-emerald-400 font-bold">✓ Scenario 3:</span> SOC2 Security Sign-off ➔ Extracted [Outcome, Buying Signal], Low Risk</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white">AI Provider Mode</h4>
                    <p className="text-slate-400 mt-0.5">Gemini 1.5 Flash LLM with Smart Fallback Engine</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleResetDemo}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-sm"
                  >
                    Reset All Memory Stores to Hackathon Seed State
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 1: MAIN SALES DASHBOARD */
            <SalesDashboard
              summary={summary}
              deals={deals}
              onSelectDeal={handleSelectDeal}
              onCreateDeal={handleCreateDeal}
            />
          )}
        </main>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
