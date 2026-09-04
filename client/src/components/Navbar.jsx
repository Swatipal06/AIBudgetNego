import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import {
  Plus,
  LogOut,
  Shield,
  User,
  Radio,
  Sparkles,
} from 'lucide-react';
import { BudgetSymbol } from './BudgetLogo';
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
      await api.post('/negotiations', {
        title: `FY2026 Q3 Operating Budget Allocation (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        description: 'Multi-department budget negotiation under strict 10L corporate cap.',
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
    <nav className="border-b border-[#1f293d] bg-[#0d131f] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
                <BudgetSymbol className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">
                Budget Negotiations
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-[#1a2436] text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141d2c]'
                }`}
              >
                Dashboard
              </Link>

              {isAdmin && (
                <Link
                  to="/create"
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive('/create')
                      ? 'bg-[#1a2436] text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#141d2c]'
                  }`}
                >
                  New Negotiation
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Tools & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Subtle Seed Demo Button */}
            {isAdmin && (
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs text-slate-300 hover:text-white bg-[#141c2c] hover:bg-[#1a2436] border border-[#243048] transition-colors"
                title="Create a standard ₹10L company demo scenario with Engineering, Marketing & Sales"
              >
                <Sparkles className="w-3 h-3 text-slate-400" />
                <span>{seeding ? 'Seeding...' : 'Seed Demo'}</span>
              </button>
            )}

            {/* Socket connection indicator */}
            <div
              className="flex items-center space-x-1.5 px-2 py-1 text-xs text-slate-400"
              title={socketConnected ? 'Live Connection Active' : 'Connecting...'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  socketConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline text-[11px]">
                {socketConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* User Profile */}
            {user && (
              <div className="flex items-center space-x-3 pl-3 border-l border-[#1f293d]">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-[#1a2436] border border-[#243048] flex items-center justify-center text-xs font-medium text-slate-300">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-medium text-slate-200 leading-none">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-none">
                      {user.role}
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1a2436] transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
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

