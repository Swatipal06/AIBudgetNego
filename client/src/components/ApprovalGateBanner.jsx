import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Check,
  X,
  AlertTriangle,
  Lock,
  UserCheck,
  Calendar,
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
    if (!window.confirm('Approve and finalize this budget allocation? This decision is final.')) {
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/negotiations/${negotiation._id}/approve`, {
        approvalNote: approvalNote || 'Approved under enterprise review.',
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
      <div className="bg-[#181510] border border-amber-900/60 rounded-lg p-5 my-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-amber-300">
                  Action Required
                </span>
                <span className="text-xs text-slate-400">• Human Approval Gate</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mt-0.5">
                Proposed Allocation Awaiting Approval
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                The negotiation has reached a feasible consensus. Review the final department allocations below and confirm or reject.
              </p>
            </div>
          </div>

          {/* Action Controls */}
          {isAdmin ? (
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
              <input
                type="text"
                placeholder="Optional approval memo..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="w-full sm:w-56 bg-[#0b0f17] border border-[#243048] rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-1.5 rounded-md text-xs transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{submitting ? 'Approving...' : 'Approve'}</span>
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1 bg-[#141c2c] hover:bg-red-950/50 border border-[#243048] hover:border-red-800 text-slate-300 hover:text-red-300 font-medium px-3 py-1.5 rounded-md text-xs transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#0b0f17] rounded-md border border-[#1f293d] text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending administrator review ({user?.role || 'Viewer'})</span>
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-[#1f293d] rounded-lg p-5 max-w-md w-full shadow-xl">
              <h4 className="text-sm font-semibold text-slate-100">Reject Proposed Allocation</h4>
              <p className="text-xs text-slate-400 mt-1">
                Provide a reason for rejection. This will be recorded in the audit trail.
              </p>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Budget ceiling revised; department requirements updated..."
                rows={3}
                className="w-full mt-3 bg-[#0b0f17] border border-[#243048] rounded-md p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center justify-end space-x-2.5 mt-3.5">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
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
      <div className="bg-[#0c1813] border border-emerald-900/60 rounded-lg p-4 my-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-emerald-300">
                  Approved
                </span>
                <span className="text-xs text-slate-400">• Confirmed Allocation</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {negotiation.approvalNote || 'Approved under enterprise review.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              By: <strong className="text-slate-200">{negotiation.approvedBy?.name || 'Administrator'}</strong>
            </span>
            {negotiation.approvedAt && (
              <span>• {new Date(negotiation.approvedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ApprovalGateBanner;

