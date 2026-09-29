import React, { useState } from 'react';
import {
  Deal,
  DashboardSummary,
} from '../types';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Activity,
  User,
  ChevronRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SalesDashboardProps {
  summary: DashboardSummary;
  deals: Deal[];
  onSelectDeal: (dealId: string) => void;
  onCreateDeal: (deal: Partial<Deal>) => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  summary,
  deals,
  onSelectDeal,
  onCreateDeal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Deal Form State
  const [newDealName, setNewDealName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [newValue, setNewValue] = useState('100000');
  const [newStage, setNewStage] = useState<Deal['stage']>('Discovery');
  const [newOwner, setNewOwner] = useState('Alex Morgan');

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.next_action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = stageFilter === 'ALL' || deal.stage === stageFilter;
    const matchesRisk = riskFilter === 'ALL' || deal.risk_level === riskFilter;

    return matchesSearch && matchesStage && matchesRisk;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newDealName.trim()) return;

    onCreateDeal({
      name: newDealName,
      company: newCompany,
      value: parseFloat(newValue) || 50000,
      stage: newStage,
      probability: newStage === 'Negotiation' ? 70 : newStage === 'Proposal' ? 55 : 35,
      account_owner: newOwner,
      risk_level: 'Medium',
      last_interaction: 'Created New Deal',
      next_action: 'Conduct discovery call and gather requirements',
      client_name: clientName || 'Primary Contact',
      client_email: clientEmail || `contact@${newCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    } as any);

    setNewDealName('');
    setNewCompany('');
    setClientName('');
    setClientEmail('');
    setIsModalOpen(false);
  };

  const chartData = [
    { name: 'Discovery', count: deals.filter((d) => d.stage === 'Discovery').length, fill: '#3b82f6' },
    { name: 'Demo', count: deals.filter((d) => d.stage === 'Demo').length, fill: '#8b5cf6' },
    { name: 'Proposal', count: deals.filter((d) => d.stage === 'Proposal').length, fill: '#ec4899' },
    { name: 'Negotiation', count: deals.filter((d) => d.stage === 'Negotiation').length, fill: '#f59e0b' },
    { name: 'Closed Won', count: deals.filter((d) => d.stage === 'Closed Won').length, fill: '#10b981' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <span>Sales Deal Dashboard</span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Active Intelligence Mode
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time pipeline monitoring with persistent deal memory & AI recommendations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Deal</span>
        </button>
      </div>

      {/* 6 Key Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Active Deals */}
        <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Deals</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{summary.totalActive}</p>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> Live pipeline
          </p>
        </div>

        {/* Card 2: Requiring Attention */}
        <div className="p-4 rounded-2xl glass-card border border-amber-500/30 bg-amber-500/5 space-y-1">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Attention</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-200">{summary.requiringAttention}</p>
          <p className="text-[11px] text-amber-400/80 font-medium">Unresolved risks</p>
        </div>

        {/* Card 3: Deals At Risk */}
        <div className="p-4 rounded-2xl glass-card border border-rose-500/30 bg-rose-500/5 space-y-1">
          <div className="flex items-center justify-between text-rose-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Deals At Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-200">{summary.atRisk}</p>
          <p className="text-[11px] text-rose-400/80 font-medium">High/Medium risk</p>
        </div>

        {/* Card 4: Closing Soon */}
        <div className="p-4 rounded-2xl glass-card border border-purple-500/30 bg-purple-500/5 space-y-1">
          <div className="flex items-center justify-between text-purple-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Closing Soon</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-200">{summary.closingSoon}</p>
          <p className="text-[11px] text-purple-300/80 font-medium">Proposal/Negotiation</p>
        </div>

        {/* Card 5: Win Rate */}
        <div className="p-4 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Win Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-200">{summary.winRate}%</p>
          <p className="text-[11px] text-emerald-400/80 font-medium">Historical conversion</p>
        </div>

        {/* Card 6: Pipeline Value */}
        <div className="p-4 rounded-2xl glass-card border border-blue-500/30 bg-blue-500/5 space-y-1">
          <div className="flex items-center justify-between text-blue-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-blue-200">${summary.pipelineValue.toLocaleString()}</p>
          <p className="text-[11px] text-blue-400/80 font-medium">Total active value</p>
        </div>
      </div>

      {/* Middle Row: Pipeline Stage Chart + Demo Highlight Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Deal Pipeline Stage Distribution</span>
            </h3>
            <span className="text-xs text-slate-400">{deals.length} Total Opportunities</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search deal name, company, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Stage Filter */}
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
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

          {/* Risk Filter */}
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deals Table Grid */}
      <div className="overflow-hidden rounded-2xl glass-panel border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Company & Deal Name</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4">Probability</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">Last Interaction</th>
                <th className="py-3.5 px-4">Next Recommended Action</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No deals match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => {
                  const getRiskBadge = (risk: string) => {
                    if (risk === 'High') return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                    if (risk === 'Medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  };

                  const getStageBadge = (stage: string) => {
                    if (stage === 'Closed Won') return 'bg-emerald-500/20 text-emerald-300';
                    if (stage === 'Negotiation') return 'bg-amber-500/20 text-amber-300';
                    if (stage === 'Proposal') return 'bg-purple-500/20 text-purple-300';
                    if (stage === 'Demo') return 'bg-blue-500/20 text-blue-300';
                    return 'bg-slate-800 text-slate-300';
                  };

                  return (
                    <tr
                      key={deal.id}
                      onClick={() => onSelectDeal(deal.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {deal.company}
                        </div>
                        <div className="text-[11px] text-slate-400">{deal.name}</div>
                      </td>

                      <td className="py-4 px-4 font-extrabold text-slate-200">
                        ${deal.value.toLocaleString()}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${getStageBadge(deal.stage)}`}>
                          {deal.stage}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${deal.probability}%` }}
                            ></div>
                          </div>
                          <span className="font-medium text-slate-300">{deal.probability}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md border font-semibold text-[10px] ${getRiskBadge(deal.risk_level)}`}>
                          {deal.risk_level} Risk
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-300 max-w-xs truncate">
                        {deal.last_interaction}
                      </td>

                      <td className="py-4 px-4 text-slate-300 max-w-xs">
                        <div className="truncate text-[11px] font-medium text-blue-300/90">
                          {deal.next_action}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDeal(deal.id);
                          }}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center space-x-1"
                        >
                          <span>Brief Deal</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Deal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Create New Deal Opportunity</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Financial"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Client Contact Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Client Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john.doe@apex.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise License Expansion"
                  value={newDealName}
                  onChange={(e) => setNewDealName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Deal Value ($)</label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as Deal['stage'])}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Discovery">Discovery</option>
                    <option value="Demo">Demo</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-semibold shadow-glow"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
