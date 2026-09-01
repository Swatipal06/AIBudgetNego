import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  UserCheck,
  Calendar,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

export const ApprovalGateBanner = ({ negotiation, onActionComplete }) => {
  const { isAdmin, user } = useAuth();
  const [approvalNote, setApprovalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  if (!negotiation) return null;

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve and finalize this budget allocation? This action is binding.')) {
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/negotiations/${negotiation._id}/approve`, {
        approvalNote: approvalNote || 'Approved by Administrator under enterprise governance review.',
      });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      alert('Please provide a reason for rejecting this proposed allocation.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/negotiations/${negotiation._id}/reject`, {
        approvalNote: rejectNote,
      });
      setShowRejectModal(false);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // State 1: AWAITING_APPROVAL
  if (negotiation.status === 'AWAITING_APPROVAL') {
    return (
      <div className="glass-panel-amber rounded-2xl p-6 my-6 border-amber-500/50 shadow-2xl relative overflow-hidden animate-pulse-subtle">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-700/60">
                  Governance Step Required
                </span>
                <span className="text-xs text-amber-300/80">Human-In-The-Loop Gate</span>
              </div>
              <h3 className="text-xl font-bold text-amber-100 mt-1">
                Proposed Allocation Awaiting Administrator Approval
              </h3>
              <p className="text-sm text-amber-200/80 mt-1 max-w-2xl">
                The multi-agent AI system has formulated a feasible allocation proposal. 
                In accordance with enterprise governance, AI proposes and human administrators confirm. 
                Review the numbers below and confirm to make binding.
              </p>
            </div>
          </div>

          {/* Action Controls */}
          {isAdmin ? (
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <input
                type="text"
                placeholder="Optional approval note / memo..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="w-full sm:w-64 bg-slate-900/90 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/40 text-sm transition-all transform active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Confirming...' : 'Approve Allocation'}</span>
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={submitting}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900/80 rounded-xl border border-slate-700 text-xs text-slate-300">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Pending review by an authorized administrator ({user?.role || 'Viewer'} view only)</span>
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h4 className="text-lg font-bold text-slate-100">Reject Proposed Allocation</h4>
              <p className="text-xs text-slate-400 mt-1">
                Please document why this allocation is rejected. This will be permanently recorded in the audit trail.
              </p>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Engineering minimum requirements revised; renegotiation required..."
                rows={4}
                className="w-full mt-4 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500"
              />
              <div className="flex items-center justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // State 2: FINALIZED
  if (negotiation.status === 'FINALIZED') {
    return (
      <div className="glass-panel-emerald rounded-2xl p-6 my-6 border-emerald-500/50 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/60">
                  Legally Binding Allocation
                </span>
                <span className="text-xs text-emerald-300/80">Final Confirmed State</span>
              </div>
              <h3 className="text-xl font-bold text-emerald-100 mt-1">
                Budget Allocation Finalized & Approved
              </h3>
              <p className="text-sm text-emerald-200/80 mt-1">
                {negotiation.approvalNote || 'Approved by corporate governance administration.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-900/80 px-4 py-3 rounded-xl border border-emerald-900/40 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Approved by: <strong className="text-white">{negotiation.approvedBy?.name || 'Administrator'}</strong></span>
            </div>
            {negotiation.approvedAt && (
              <div className="flex items-center space-x-1.5 text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-4 pt-1 sm:pt-0">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{new Date(negotiation.approvedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ApprovalGateBanner;
