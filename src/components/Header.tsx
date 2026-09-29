import React, { useState } from 'react';
import { Brain, RefreshCw, Sparkles, Database, Search, ShieldCheck, Wifi, CheckCircle2, LogIn, LogOut, User } from 'lucide-react';
import { AuthUser } from './AuthModal';

interface HeaderProps {
  onResetDemo: () => void;
  activeDealName?: string;
  onNavigateHome: () => void;
  onOpenSupabaseModal?: () => void;
  isSupabaseConnected?: boolean;
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onResetDemo,
  activeDealName,
  onNavigateHome,
  currentUser,
  onOpenAuthModal,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-4">
        {/* Brand Logo */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-glow group-hover:scale-105 transition-transform duration-200">
            <Brain className="w-5 h-5 text-white animate-pulse-slow" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                NexusAI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Agent v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Autonomous Deal Intelligence & Realtime Memory
            </p>
          </div>
        </div>

        {activeDealName && (
          <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-800">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Deal:</span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-blue-300 border border-slate-700">
              {activeDealName}
            </span>
          </div>
        )}
      </div>

      {/* Middle & Right Header Elements */}
      <div className="flex items-center space-x-3">
        {/* Realtime Engine Status Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Realtime Sync Active</span>
          <Wifi className="w-3 h-3 text-emerald-400 animate-pulse ml-0.5" />
        </div>

        {/* Demo Reset Button */}
        <button
          onClick={onResetDemo}
          title="Reset initial deal dataset for demo walkthrough"
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        {/* User Account / Auth Section */}
        {currentUser ? (
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full ring-2 ring-blue-500/40 object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-950"></span>
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-slate-200">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400">{currentUser.role}</p>
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md transition-all ml-2"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

