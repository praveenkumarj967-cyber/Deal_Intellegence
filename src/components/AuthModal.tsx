import React, { useState } from 'react';
import { Brain, Lock, Mail, User, ShieldCheck, Sparkles, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { supabaseFrontend } from '../services/supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Enterprise AE' | 'Sales Manager' | 'RevOps Admin';
  avatar: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Enterprise AE' | 'Sales Manager' | 'RevOps Admin'>('Enterprise AE');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (supabaseFrontend) {
        if (isLogin) {
          const { data, error } = await supabaseFrontend.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.user) {
            const userObj: AuthUser = {
              id: data.user.id,
              name: data.user.user_metadata?.name || email.split('@')[0],
              email: data.user.email || email,
              role: data.user.user_metadata?.role || role,
              avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
            };
            localStorage.setItem('NEXUS_AUTH_USER', JSON.stringify(userObj));
            onAuthSuccess(userObj);
            onClose();
            return;
          }
        } else {
          const { data, error } = await supabaseFrontend.auth.signUp({
            email,
            password,
            options: { data: { name, role } },
          });
          if (error) throw error;
          if (data.user) {
            const userObj: AuthUser = {
              id: data.user.id,
              name: name || email.split('@')[0],
              email: data.user.email || email,
              role,
              avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
            };
            localStorage.setItem('NEXUS_AUTH_USER', JSON.stringify(userObj));
            onAuthSuccess(userObj);
            onClose();
            return;
          }
        }
      }

      // Fallback local auth demo login when Supabase auth is not configured or in offline mode
      const userObj: AuthUser = {
        id: `user-${Date.now()}`,
        name: isLogin ? (email ? email.split('@')[0] : 'Alex Morgan') : name || 'Alex Morgan',
        email: email || 'alex.morgan@nexus.ai',
        role,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
      };
      localStorage.setItem('NEXUS_AUTH_USER', JSON.stringify(userObj));
      onAuthSuccess(userObj);
      onClose();
    } catch (err) {
      setErrorMessage((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-glow mb-3">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isLogin ? 'Sign In to NexusAI' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin
              ? 'Access real-time deal memory & team intelligence'
              : 'Join your organization sales workspace'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="alex.morgan@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Role & Team Scope</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="Enterprise AE">Enterprise AE (Account Executive)</option>
              <option value="Sales Manager">Sales Manager (Team Lead)</option>
              <option value="RevOps Admin">RevOps Admin (Full Scope)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Workspace Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up here"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center space-x-2 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured with Supabase Auth & JWT Security</span>
        </div>
      </div>
    </div>
  );
};
