import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FileText,
  X,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export const AuditTrailModal = ({ negotiationId, isOpen, onClose }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchEvents = async () => {
    if (!negotiationId) return;
    try {
      setLoading(true);
      const res = await api.get(`/negotiations/${negotiationId}/events`);
      if (res.success) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error('Error fetching audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen, negotiationId]);

  if (!isOpen) return null;

  const getEventBadge = (type) => {
    if (type.includes('APPROVED') || type.includes('AGREEMENT') || type.includes('FINALIZED')) {
      return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50';
    }
    if (type.includes('AWAITING') || type.includes('CONCESSION') || type.includes('DEADLOCK')) {
      return 'bg-amber-950/40 text-amber-300 border-amber-800/50';
    }
    if (type.includes('REJECTED') || type.includes('FAILED') || type.includes('CANCELLED')) {
      return 'bg-red-950/40 text-red-300 border-red-800/50';
    }
    return 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-[#1f293d] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1f293d] flex items-center justify-between bg-[#0d131f]">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Negotiation Audit Log
            </h3>
            <p className="text-xs text-slate-400">
              Chronological ledger of agent proposals, rule checks, and governance decisions.
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1f293d] transition-colors"
              title="Refresh log"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1f293d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && events.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Loading audit records...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No audit records logged yet.
            </div>
          ) : (
            events.map((evt, idx) => {
              const isExpanded = expandedId === evt._id;
              const hasDetails = evt.details && Object.keys(evt.details).length > 0;

              return (
                <div
                  key={evt._id || idx}
                  className="bg-[#0b0f17] border border-[#1f293d] rounded-md p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getEventBadge(
                            evt.eventType
                          )}`}
                        >
                          {evt.eventType.replace(/_/g, ' ')}
                        </span>
                        {evt.actor && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            {evt.actor}
                          </span>
                        )}
                        {evt.roundNumber && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            [Round {evt.roundNumber}]
                          </span>
                        )}
                        <span className="text-slate-400 text-[10px]">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed">
                        {evt.message}
                      </p>
                    </div>

                    {hasDetails && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : evt._id)}
                        className="text-slate-400 hover:text-slate-200 p-1"
                        title="Toggle payload"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded JSON details */}
                  {isExpanded && hasDetails && (
                    <div className="mt-2.5 pt-2 border-t border-[#1f293d]">
                      <pre className="bg-[#0e1420] rounded p-2 text-[10px] font-mono text-slate-300 overflow-x-auto">
                        {JSON.stringify(evt.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#1f293d] bg-[#0d131f] flex items-center justify-between text-xs text-slate-400">
          <span>{events.length} records</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#162032] hover:bg-[#1f293d] text-slate-200 text-xs font-medium transition-colors border border-[#243048]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailModal;

