import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import {
  Scale,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  ShieldCheck,
  Eye,
  Radio,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [socketConnected, setSocketConnected] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      setSocketConnected(socket.connected);
      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      };
    }
  }, []);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      // Create seed demo scenario via API
      await api.post('/negotiations', {
        title: `FY2026 Q3 Operating Budget Allocation (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        description: 'Multi-department budget negotiation under strict 10L company cap.',
        companyBudget: 1000000,
        maxRounds: 5,
        departments: [
          {
            name: 'Engineering',
            requestedBudget: 500000,
            minAcceptableBudget: 400000,
            priority: 'HIGH',
            strategy: 'COMPROMISING',
            hardConstraints: ['Cloud Infra & 99.99% SLA (₹3L)', 'SOC-2 Compliance (₹1L)'],
            softPreferences: ['AI Experimentation Cluster (₹60k)'],
            color: '#3b82f6',
          },
          {
            name: 'Marketing',
            requestedBudget: 400000,
            minAcceptableBudget: 250000,
            priority: 'MEDIUM',
            strategy: 'COLLABORATIVE',
            hardConstraints: ['Global Q3 Product Launch (₹1.8L)', 'Analytics Stack (₹70k)'],
            softPreferences: ['Keynote Sponsorships (₹90k)'],
            color: '#10b981',
          },
          {
            name: 'Sales',
            requestedBudget: 300000,
            minAcceptableBudget: 200000,
            priority: 'MEDIUM',
            strategy: 'ASSERTIVE',
            hardConstraints: ['CRM Licenses & Commissions (₹1.5L)', 'Retention Programs (₹50k)'],
            softPreferences: ['International Roadshow (₹60k)'],
            color: '#f59e0b',
          },
        ],
      });
      navigate('/');
      window.location.reload();
    } catch (err) {
      alert(`Seed failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-brand-200 to-indigo-300 font-heading">
                  Negotiating Budget Agents
                </span>
                <span className="hidden sm:block text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                  Autonomous Multi-Agent AI System
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-slate-800 text-brand-400 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {isAdmin && (
              <Link
                to="/create"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/create')
                    ? 'bg-slate-800 text-brand-400 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Negotiation</span>
              </Link>
            )}

            {isAdmin && (
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 transition-colors"
                title="Create a standard ₹10L company demo scenario with Engineering, Marketing & Sales"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{seeding ? 'Seeding...' : 'Seed Demo Scenario'}</span>
              </button>
            )}
          </div>

          {/* User Profile, Role Badge & Socket indicator */}
          <div className="flex items-center space-x-3">
            {/* Live Socket Status */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                socketConnected
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                  : 'bg-red-950/50 text-red-300 border-red-800/60'
              }`}
              title={socketConnected ? 'Real-time WebSocket Live' : 'Reconnecting...'}
            >
              <Radio className={`w-3 h-3 ${socketConnected ? 'animate-pulse text-emerald-400' : 'text-red-400'}`} />
              <span>{socketConnected ? 'Live Real-Time' : 'Offline'}</span>
            </div>

            {/* Role Badge */}
            {user && (
              <div
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${
                  isAdmin
                    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/70 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{user.role}</span>
              </div>
            )}

            {/* User Dropdown / Logout */}
            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-400">{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
