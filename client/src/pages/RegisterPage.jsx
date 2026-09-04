import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Shield, ArrowRight } from 'lucide-react';
import { BudgetSymbol } from '../components/BudgetLogo';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
            Create an Account
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Register for internal budget oversight and governance
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
              Full Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Sarah Chen"
                className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`p-2 rounded-md border text-xs font-medium flex flex-col items-center gap-0.5 transition-colors ${
                  role === 'ADMIN'
                    ? 'bg-[#1a2436] border-blue-500 text-white'
                    : 'bg-[#0b0f17] border-[#1f293d] text-slate-400 hover:border-slate-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Admin</span>
                <span className="text-[10px] text-slate-400 font-normal">Full control</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('VIEWER')}
                className={`p-2 rounded-md border text-xs font-medium flex flex-col items-center gap-0.5 transition-colors ${
                  role === 'VIEWER'
                    ? 'bg-[#1a2436] border-blue-500 text-white'
                    : 'bg-[#0b0f17] border-[#1f293d] text-slate-400 hover:border-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Viewer</span>
                <span className="text-[10px] text-slate-400 font-normal">Read-only</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-md text-xs transition-colors disabled:opacity-50 mt-3"
          >
            <span>{loading ? 'Creating...' : 'Register'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

