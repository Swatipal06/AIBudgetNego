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
  FileText,
  Clock,
  Activity,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
  X,
  ChevronLeft,
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 text-xs">
        Loading negotiation details...
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center text-slate-400 text-xs">
        Negotiation not found. <Link to="/" className="text-blue-400 underline ml-1">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back link & Compact Room Header */}
      <div className="space-y-3">
        <Link
          to="/"
          className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Negotiations</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1f293d]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={negotiation.status} />
              <span className="text-xs text-slate-400 font-mono">
                Round {negotiation.currentRound} of {negotiation.maxRounds}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">
                Created by {negotiation.createdBy?.name || 'Administrator'}
              </span>
            </div>

            <h1 className="text-xl font-semibold text-white tracking-tight">
              {negotiation.title}
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              {negotiation.description || 'Department budget negotiation session'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setAuditModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#141c2c] hover:bg-[#1a2436] text-slate-300 hover:text-white text-xs font-medium border border-[#243048] transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Log ({events.length})</span>
            </button>

            <button
              onClick={fetchFullNegotiation}
              className="p-1.5 rounded-md bg-[#141c2c] hover:bg-[#1a2436] text-slate-400 hover:text-white border border-[#243048] transition-colors"
              title="Refresh Room"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {isAdmin && negotiation.status === 'PENDING' && (
              <button
                onClick={handleStartNegotiation}
                disabled={starting}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-1.5 rounded-md transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{starting ? 'Starting...' : 'Start Negotiation'}</span>
              </button>
            )}

            {isAdmin && negotiation.status === 'RUNNING' && (
              <button
                onClick={handleCancelNegotiation}
                className="inline-flex items-center space-x-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Human Approval Gate Banner */}
      <ApprovalGateBanner
        negotiation={negotiation}
        onActionComplete={fetchFullNegotiation}
      />

      {/* Budget Progress Bar */}
      <BudgetProgress
        companyBudget={negotiation.companyBudget}
        totalAllocated={currentTotalAllocated}
      />

      {/* Department Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Participating Departments ({departments.length})
          </h2>
          <span className="text-xs text-slate-400">
            Autonomous agent proposals clamped by minimum budget floor
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept._id}
              department={dept}
              currentProposal={currentProposalsMap[dept.name]}
            />
          ))}
        </div>
      </div>

      {/* Tab Navigation: Timeline vs Charts vs Round History */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-lg overflow-hidden">
        <div className="border-b border-[#1f293d] px-4 py-2 bg-[#0d131f] flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-[#1a2436] text-white border border-[#243048]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Activity Stream ({events.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'charts'
                  ? 'bg-[#1a2436] text-white border border-[#243048]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab('rounds')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'rounds'
                  ? 'bg-[#1a2436] text-white border border-[#243048]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Round History ({rounds.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Real-time feed
          </div>
        </div>

        {/* Tab 1: Live Timeline Stream */}
        {activeTab === 'timeline' && (
          <div className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Negotiation has not started yet. Click 'Start Negotiation' above to initiate agent rounds.
              </div>
            ) : (
              events.map((evt, idx) => <TimelineEvent key={evt._id || idx} event={evt} />)
            )}
            <div ref={timelineEndRef} />
          </div>
        )}

        {/* Tab 2: Visual Charts & Analytics */}
        {activeTab === 'charts' && (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Bar Chart */}
            <div className="lg:col-span-2 bg-[#0b0f17] p-4 rounded-md border border-[#1f293d]">
              <h3 className="text-xs font-semibold text-slate-300 mb-4">
                Requested vs Minimum Acceptable vs Current Proposal
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1f293d', borderRadius: '6px', fontSize: '12px' }}
                      formatter={(val) => formatCurrency(val)}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="Requested" fill="#475569" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Min Acceptable" fill="#d97706" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Current Proposal" fill="#2563eb" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-[#0b0f17] p-4 rounded-md border border-[#1f293d] flex flex-col justify-between">
              <h3 className="text-xs font-semibold text-slate-300 mb-2">
                Department Share Distribution
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={38}
                      paddingAngle={3}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1f293d', borderRadius: '6px', fontSize: '12px' }}
                      formatter={(val) => formatCurrency(val)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2 border-t border-[#1f293d] pt-2">
                {pieChartData.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
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
          <div className="p-4 space-y-3">
            {rounds.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No rounds completed yet.
              </div>
            ) : (
              rounds.map((rnd) => (
                <div
                  key={rnd._id}
                  className="bg-[#0b0f17] border border-[#1f293d] rounded-md p-3.5 text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-[#1f293d] pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-100 font-mono text-xs">
                        Round {rnd.roundNumber}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          rnd.agreementReached
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                            : rnd.deadlock
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
                        }`}
                      >
                        {rnd.agreementReached
                          ? 'Agreement'
                          : rnd.deadlock
                          ? 'Deadlock'
                          : 'In Progress'}
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
                      <div key={pIdx} className="bg-[#111827] p-2.5 rounded border border-[#1f293d]">
                        <div className="flex items-center justify-between mb-1">
                          <strong className="text-slate-200 text-xs">{p.departmentName}</strong>
                          <span className="font-mono text-slate-100 font-semibold">{formatCurrency(p.proposedAmount)}</span>
                        </div>
                        {p.reason && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                            "{p.reason}"
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Utility: {p.utility}%</span>
                          {p.concessionAmount > 0 && (
                            <span className="text-amber-400">Concession: {formatCurrency(p.concessionAmount)}</span>
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

