import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Shield, User, ArrowRight } from 'lucide-react';
import { BudgetSymbol } from '../components/BudgetLogo';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role) => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full space-y-6 bg-[#111827] p-7 rounded-lg border border-[#1f293d]">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-blue-600 mb-3 shadow-sm">
            <BudgetSymbol className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100 tracking-tight">
            Sign in to Budget Negotiations
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Internal allocation & negotiation management portal
          </p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-md p-2.5 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah.chen@enterprise.ai"
                className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-md text-xs transition-colors disabled:opacity-50 mt-1"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Evaluation 1-Click Logins */}
        <div className="pt-3.5 border-t border-[#1f293d]">
          <span className="text-[11px] font-medium text-slate-400 block text-center mb-2.5">
            1-Click Evaluation Logins
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuick('ADMIN')}
              disabled={loading}
              className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-md bg-[#141c2c] hover:bg-[#1a2436] border border-[#243048] text-slate-200 text-xs font-medium transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => handleQuick('VIEWER')}
              disabled={loading}
              className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-md bg-[#141c2c] hover:bg-[#1a2436] border border-[#243048] text-slate-300 text-xs font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Viewer</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Need an account?{' '}
          <Link to="/register" className="text-blue-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

