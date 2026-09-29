import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  TrendingUp,
  Brain,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeDealsCount?: number;
  atRiskCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  activeDealsCount = 5,
  atRiskCount = 2,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Sales Dashboard', icon: LayoutDashboard },
    { id: 'deals', label: 'All Deals', icon: Briefcase, badge: activeDealsCount },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'analytics', label: 'Analytics & Memory', icon: BarChart3 },
    { id: 'settings', label: 'Agent Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        {/* Navigation Menu */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Main Workspace
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Deal Memory Intelligence Card Widget */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-blue-500/20 shadow-lg space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Brain className="w-16 h-16 text-blue-400" />
          </div>

          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Deal Intelligence
            </h4>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Memory engine active across <span className="text-blue-400 font-semibold">{activeDealsCount} deals</span>.
          </p>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">At Risk Deals:</span>
            <span className="px-2 py-0.5 font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {atRiskCount} Deals
            </span>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>PostgreSQL + AI Core</span>
        </div>
        <span className="text-emerald-400 font-medium">Online</span>
      </div>
    </aside>
  );
};
