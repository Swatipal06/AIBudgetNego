import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  getSocket,
  joinNegotiationRoom,
  leaveNegotiationRoom,
} from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import ApprovalGateBanner from '../components/ApprovalGateBanner';
import AuditTrailModal from '../components/AuditTrailModal';
import BudgetProgress from '../components/BudgetProgress';
import DepartmentCard from '../components/DepartmentCard';
import TimelineEvent from '../components/TimelineEvent';
import {
  Play,
  StopCircle,
  FileText,
  Clock,
  Sparkles,
  Layers,
  Activity,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const NegotiationDetailPage = () => {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();

  const [negotiation, setNegotiation] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [events, setEvents] = useState([]);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'charts' | 'rounds'

  const timelineEndRef = useRef(null);

  const fetchFullNegotiation = async () => {
    try {
      const [resNeg, resRounds, resEvents, resAlloc] = await Promise.all([
        api.get(`/negotiations/${id}`),
        api.get(`/negotiations/${id}/rounds`),
        api.get(`/negotiations/${id}/events`),
        api.get(`/negotiations/${id}/allocation`),
      ]);

      if (resNeg.success) {
        setNegotiation(resNeg.negotiation);
        setDepartments(resNeg.negotiation.departments || []);
      }
      if (resRounds.success) setRounds(resRounds.rounds || []);
      if (resEvents.success) setEvents(resEvents.events || []);
      if (resAlloc.success) setAllocation(resAlloc.allocation || null);
    } catch (err) {
      console.error('Failed loading negotiation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullNegotiation();
    joinNegotiationRoom(id);

    const socket = getSocket();
    if (socket) {
      const handleRoundStarted = (data) => {
        setNegotiation((prev) => (prev ? { ...prev, currentRound: data.roundNumber, status: 'RUNNING' } : prev));
      };

      const handleProposal = (data) => {
        fetchFullNegotiation();
      };

      const handleRoundCompleted = (data) => {
        fetchFullNegotiation();
      };

      const handleAwaitingApproval = (data) => {
        setNegotiation((prev) => (prev ? { ...prev, status: 'AWAITING_APPROVAL' } : prev));
        if (data.allocation) setAllocation(data.allocation);
        fetchFullNegotiation();
      };

      const handleApproved = (data) => {
        setNegotiation((prev) => (prev ? { ...prev, status: 'FINALIZED', approvedBy: data.approvedBy, approvedAt: data.approvedAt } : prev));
        if (data.allocation) setAllocation(data.allocation);
        fetchFullNegotiation();
      };

      const handleRejected = () => {
        fetchFullNegotiation();
      };

      socket.on('ROUND_STARTED', handleRoundStarted);
      socket.on('PROPOSAL_CREATED', handleProposal);
      socket.on('CONCESSION', handleProposal);
      socket.on('ROUND_COMPLETED', handleRoundCompleted);
      socket.on('AWAITING_APPROVAL', handleAwaitingApproval);
      socket.on('ALLOCATION_APPROVED', handleApproved);
      socket.on('ALLOCATION_REJECTED', handleRejected);
      socket.on('NEGOTIATION_FAILED', handleRejected);

      return () => {
        socket.off('ROUND_STARTED', handleRoundStarted);
        socket.off('PROPOSAL_CREATED', handleProposal);
        socket.off('CONCESSION', handleProposal);
        socket.off('ROUND_COMPLETED', handleRoundCompleted);
        socket.off('AWAITING_APPROVAL', handleAwaitingApproval);
        socket.off('ALLOCATION_APPROVED', handleApproved);
        socket.off('ALLOCATION_REJECTED', handleRejected);
        socket.off('NEGOTIATION_FAILED', handleRejected);
        leaveNegotiationRoom(id);
      };
    }
  }, [id]);

  const handleStartNegotiation = async () => {
    try {
      setStarting(true);
      await api.post(`/negotiations/${id}/start`);
      fetchFullNegotiation();
    } catch (err) {
      alert(`Start failed: ${err.message}`);
    } finally {
      setStarting(false);
    }
  };

  const handleCancelNegotiation = async () => {
    if (!window.confirm('Cancel this negotiation?')) return;
    try {
      await api.post(`/negotiations/${id}/cancel`);
      fetchFullNegotiation();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    }
  };

  // Latest round data
  const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const currentProposalsMap = {};
  if (latestRound) {
    latestRound.proposals?.forEach((p) => {
      currentProposalsMap[p.departmentName] = p;
    });
  }

  // Calculate current total allocated
  const currentTotalAllocated = latestRound
    ? latestRound.totalProposedAmount
    : departments.reduce((sum, d) => sum + d.requestedBudget, 0);

  // Prepare chart data for Recharts
  const barChartData = departments.map((d) => {
    const currentProp = currentProposalsMap[d.name];
    const currentOffer = currentProp ? currentProp.proposedAmount : d.requestedBudget;
    return {
      name: d.name,
      Requested: d.requestedBudget,
      'Min Acceptable': d.minAcceptableBudget,
      'Current Proposal': currentOffer,
    };
  });

  const pieChartData = departments.map((d) => {
    const currentProp = currentProposalsMap[d.name];
    const currentOffer = currentProp ? currentProp.proposedAmount : d.requestedBudget;
    return {
      name: d.name,
      value: currentOffer,
      color: d.color || '#3b82f6',
    };
  });

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  if (loading && !negotiation) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-400">
        Loading negotiation command center...
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center text-slate-400">
        Negotiation not found. <Link to="/" className="text-brand-400 underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <StatusBadge status={negotiation.status} />
              <span className="text-xs text-slate-400 font-mono">
                Round {negotiation.currentRound} of {negotiation.maxRounds}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">
                Created by {negotiation.createdBy?.name || 'Administrator'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              {negotiation.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              {negotiation.description || 'Enterprise Multi-Agent Budget Negotiation Session'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setAuditModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Audit Trail ({events.length})</span>
            </button>

            <button
              onClick={fetchFullNegotiation}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh Room"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {isAdmin && negotiation.status === 'PENDING' && (
              <button
                onClick={handleStartNegotiation}
                disabled={starting}
                className="flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold px-5 py-2 rounded-xl shadow-lg shadow-brand-500/20 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{starting ? 'Initializing Agents...' : 'Start Negotiation'}</span>
              </button>
            )}

            {isAdmin && negotiation.status === 'RUNNING' && (
              <button
                onClick={handleCancelNegotiation}
                className="flex items-center space-x-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Human Approval Gate Banner (Appears on AWAITING_APPROVAL and FINALIZED) */}
      <ApprovalGateBanner
        negotiation={negotiation}
        onActionComplete={fetchFullNegotiation}
      />

      {/* Budget Progress Bar */}
      <BudgetProgress
        companyBudget={negotiation.companyBudget}
        totalAllocated={currentTotalAllocated}
      />

      {/* Department Agent Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Participating Department Agents ({departments.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Autonomous decision-making with strict backend constraint clamping
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept._id}
              department={dept}
              currentProposal={currentProposalsMap[dept.name]}
            />
          ))}
        </div>
      </div>

      {/* Interactive Tabs: Timeline vs Charts vs Round History */}
      <div className="glass-panel rounded-3xl border-slate-800 overflow-hidden shadow-2xl">
        <div className="border-b border-slate-800 px-6 py-3 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-slate-800 text-brand-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Agent Stream ({events.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'charts'
                  ? 'bg-slate-800 text-brand-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Allocation Charts</span>
            </button>

            <button
              onClick={() => setActiveTab('rounds')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'rounds'
                  ? 'bg-slate-800 text-brand-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Round Matrix ({rounds.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Socket Stream Active
          </div>
        </div>

        {/* Tab 1: Live Timeline Stream */}
        {activeTab === 'timeline' && (
          <div className="p-6 space-y-3 max-h-[550px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Negotiation has not started yet. Click 'Start Negotiation' above to watch autonomous AI agents negotiate live.
              </div>
            ) : (
              events.map((evt, idx) => <TimelineEvent key={evt._id || idx} event={evt} />)
            )}
            <div ref={timelineEndRef} />
          </div>
        )}

        {/* Tab 2: Visual Charts & Analytics */}
        {activeTab === 'charts' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart */}
            <div className="lg:col-span-2 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Requested vs Min Acceptable vs Current Proposal</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      formatter={(val) => formatCurrency(val)}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Requested" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Min Acceptable" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Current Proposal" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-brand-400" />
                <span>Department Share Distribution</span>
              </h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                      paddingAngle={4}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      formatter={(val) => formatCurrency(val)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {pieChartData.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-slate-300">{entry.name}</span>
                    </div>
                    <span className="font-mono text-slate-200">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Round-by-Round Matrix */}
        {activeTab === 'rounds' && (
          <div className="p-6 space-y-4">
            {rounds.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No rounds completed yet.
              </div>
            ) : (
              rounds.map((rnd) => (
                <div
                  key={rnd._id}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-slate-100 font-mono">
                        Round {rnd.roundNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          rnd.agreementReached
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : rnd.deadlock
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        {rnd.agreementReached
                          ? 'Agreement Reached'
                          : rnd.deadlock
                          ? 'Deadlock Reached'
                          : 'Budget Conflict'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                      <span>Total: <strong className="text-slate-200">{formatCurrency(rnd.totalProposedAmount)}</strong></span>
                      <span>Remaining: <strong className={rnd.remainingBudget < 0 ? 'text-red-400' : 'text-emerald-400'}>{formatCurrency(rnd.remainingBudget)}</strong></span>
                    </div>
                  </div>

                  {/* Proposal Rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {rnd.proposals.map((p, pIdx) => (
                      <div key={pIdx} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <strong className="text-slate-200">{p.departmentName}</strong>
                          <span className="font-mono text-brand-300 font-bold">{formatCurrency(p.proposedAmount)}</span>
                        </div>
                        {p.reason && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                            "{p.reason}"
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Utility: {p.utility}%</span>
                          {p.concessionAmount > 0 && (
                            <span className="text-amber-400 font-sans">Concession: {formatCurrency(p.concessionAmount)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Audit Trail Modal */}
      <AuditTrailModal
        negotiationId={id}
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
      />
    </div>
  );
};

export default NegotiationDetailPage;
