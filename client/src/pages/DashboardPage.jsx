import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import {
  Plus,
  ArrowRight,
  RefreshCw,
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
        title: `FY2026 Q3 Operating Budget Allocation (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      {/* Compact Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1f293d]">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Budget Negotiations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage department budgets, negotiation rounds, and approval decisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchNegotiations}
            disabled={loading}
            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-[#141c2c] hover:bg-[#1a2436] border border-[#243048] transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <Link
              to="/create"
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New negotiation</span>
            </Link>
          )}
        </div>
      </div>

      {/* Simplified Enterprise Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#111827] border border-[#1f293d] rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-[#1f293d]">
        <div className="p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Total Negotiations
          </span>
          <div className="text-2xl font-semibold text-white font-mono mt-1">
            {stats.total}
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Running
          </span>
          <div className="text-2xl font-semibold text-blue-400 font-mono mt-1">
            {stats.running}
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Awaiting Approval
          </span>
          <div className="text-2xl font-semibold text-amber-400 font-mono mt-1">
            {stats.awaitingApproval}
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Approved
          </span>
          <div className="text-2xl font-semibold text-emerald-400 font-mono mt-1">
            {stats.finalized}
          </div>
        </div>
      </div>

      {/* Main Negotiation Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading && negotiations.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Loading negotiations...
            </div>
          ) : negotiations.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="text-sm font-medium text-slate-300">
                No budget negotiations found
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Create a new negotiation or load the sample scenario to evaluate multi-agent rounds and approval flows.
              </p>
              {isAdmin && (
                <div className="pt-2">
                  <button
                    onClick={handleSeed}
                    disabled={seeding}
                    className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors"
                  >
                    <span>{seeding ? 'Generating...' : 'Load Demo Scenario'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d131f] text-slate-400 uppercase tracking-wider font-medium border-b border-[#1f293d] text-[11px]">
                <tr>
                  <th className="px-5 py-3">Negotiation</th>
                  <th className="px-5 py-3">Company Budget</th>
                  <th className="px-5 py-3">Departments</th>
                  <th className="px-5 py-3">Round Progress</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]">
                {negotiations.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-[#162032] transition-colors group cursor-pointer"
                    onClick={() => navigate(`/negotiations/${item._id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-100 group-hover:text-blue-400 transition-colors text-xs sm:text-sm">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {item.description || 'No description provided'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono font-medium text-slate-200">
                      {formatCurrency(item.companyBudget)}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center flex-wrap gap-1.5">
                        {item.departments?.map((d, i) => (
                          <span
                            key={d._id || i}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#0b0f17] text-slate-300 border border-[#1f293d]"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: d.color || '#3b82f6' }}
                            />
                            {d.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {item.currentRound} / {item.maxRounds}
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/negotiations/${item._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 text-xs font-medium text-blue-400 hover:text-blue-300"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
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

