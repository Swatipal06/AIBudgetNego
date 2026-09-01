import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import {
  Scale,
  PlusCircle,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Layers,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [negotiations, setNegotiations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    awaitingApproval: 0,
    finalized: 0,
    settled: 0,
    deadlock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/negotiations');
      if (res.success) {
        setNegotiations(res.negotiations);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error loading negotiations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegotiations();

    const socket = getSocket();
    if (socket) {
      const handleUpdate = () => {
        fetchNegotiations();
      };
      socket.on('negotiation_list_update', handleUpdate);
      return () => socket.off('negotiation_list_update', handleUpdate);
    }
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await api.post('/negotiations', {
        title: `FY2026 Q3 Enterprise Operating Budget (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        description: 'Multi-department budget negotiation under strict ₹10,00,000 corporate ceiling.',
        companyBudget: 1000000,
        maxRounds: 5,
        departments: [
          {
            name: 'Engineering',
            requestedBudget: 500000,
            minAcceptableBudget: 400000,
            priority: 'HIGH',
            strategy: 'COMPROMISING',
            hardConstraints: ['Mandatory Cloud Infrastructure & 99.99% SLA Uptime (₹4L)'],
            softPreferences: ['Experimental LLM Cluster (₹60k)', 'Extra CI/CD Runners (₹40k)'],
            color: '#3b82f6',
          },
          {
            name: 'Marketing',
            requestedBudget: 400000,
            minAcceptableBudget: 250000,
            priority: 'MEDIUM',
            strategy: 'COLLABORATIVE',
            hardConstraints: ['Global Q3 Ad Launch (₹2.5L)'],
            softPreferences: ['Keynote Tech Sponsorships (₹90k)'],
            color: '#10b981',
          },
          {
            name: 'Sales',
            requestedBudget: 300000,
            minAcceptableBudget: 200000,
            priority: 'MEDIUM',
            strategy: 'ASSERTIVE',
            hardConstraints: ['CRM Licenses & Commission Pool (₹2L)'],
            softPreferences: ['International Roadshow (₹60k)'],
            color: '#f59e0b',
          },
        ],
      });
      if (res.success) {
        navigate(`/negotiations/${res.negotiation._id}`);
      }
    } catch (err) {
      alert(`Seed failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 relative overflow-hidden">
        <div className="space-y-1 relative">
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Budget Arbitration System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            Executive Negotiation Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Deterministic backend orchestration of AI department agents with human-in-the-loop governance. 
            AI proposes, the backend validates, and administrators confirm.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isAdmin && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-900/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{seeding ? 'Generating...' : 'Launch Demo Scenario'}</span>
            </button>
          )}

          {isAdmin && (
            <Link
              to="/create"
              className="flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Negotiation</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Negotiations
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono mt-2">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-agent workspaces</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Running Live
            </span>
            <Play className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-indigo-300 font-mono mt-2">
            {stats.running}
          </div>
          <div className="text-[11px] text-indigo-400/80 mt-1">Agents negotiating</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-amber-900/40 bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Awaiting Approval
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-amber-300 font-mono mt-2">
            {stats.awaitingApproval}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">Pending admin confirmation</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-emerald-900/40 bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Finalized & Binding
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-300 font-mono mt-2">
            {stats.finalized}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Approved corporate budgets</div>
        </div>
      </div>

      {/* Negotiations Table Section */}
      <div className="glass-panel rounded-3xl border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Corporate Budget Negotiations
            </h2>
            <p className="text-xs text-slate-400">
              Real-time directory of multi-agent negotiation sessions
            </p>
          </div>
          <button
            onClick={fetchNegotiations}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading && negotiations.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Loading negotiation sessions...
            </div>
          ) : negotiations.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4">
              <Scale className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-slate-300 text-sm font-semibold">
                No budget negotiations found
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Launch the pre-configured enterprise demo scenario to see Engineering, Marketing, and Sales agents negotiate live.
              </p>
              {isAdmin && (
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Demo Scenario Now</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Negotiation Title</th>
                  <th className="px-6 py-3.5">Company Budget</th>
                  <th className="px-6 py-3.5">Departments</th>
                  <th className="px-6 py-3.5">Round Progress</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {negotiations.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/negotiations/${item._id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-100 group-hover:text-brand-300 transition-colors text-sm">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {item.description || 'No description'}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-slate-200">
                      {formatCurrency(item.companyBudget)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        {item.departments?.map((d, i) => (
                          <span
                            key={d._id || i}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                            style={{ borderLeftColor: d.color, borderLeftWidth: '3px' }}
                          >
                            {d.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-300">
                      {item.currentRound} / {item.maxRounds} Rounds
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/negotiations/${item._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-400 hover:text-brand-300 bg-brand-950/40 px-3 py-1.5 rounded-lg border border-brand-800/50 hover:bg-brand-900/60 transition-colors"
                      >
                        <span>Enter Room</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
