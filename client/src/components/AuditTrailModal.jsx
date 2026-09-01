import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FileText,
  X,
  Clock,
  User,
  Bot,
  Shield,
  CheckCircle,
  AlertCircle,
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

  const getActorIcon = (actor) => {
    switch (actor) {
      case 'ADMIN':
        return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
      case 'CFO_AGENT':
        return <Bot className="w-3.5 h-3.5 text-purple-400" />;
      case 'DEPARTMENT_AGENT':
        return <Bot className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getEventBadge = (type) => {
    if (type.includes('APPROVED') || type.includes('AGREEMENT') || type.includes('FINALIZED')) {
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
    }
    if (type.includes('AWAITING') || type.includes('CONCESSION') || type.includes('DEADLOCK')) {
      return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
    }
    if (type.includes('REJECTED') || type.includes('FAILED') || type.includes('CANCELLED')) {
      return 'bg-red-950/80 text-red-300 border-red-800/60';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Immutable Negotiation Audit Trail
              </h3>
              <p className="text-xs text-slate-400">
                Chronological ledger of all agent moves, validations, and administrative governance actions.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh events"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading && events.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Loading audit trail events...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No audit events logged yet.
            </div>
          ) : (
            events.map((evt, idx) => {
              const isExpanded = expandedId === evt._id;
              const hasDetails = evt.details && Object.keys(evt.details).length > 0;

              return (
                <div
                  key={evt._id || idx}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-0.5">{getActorIcon(evt.actor)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getEventBadge(
                              evt.eventType
                            )}`}
                          >
                            {evt.eventType.replace(/_/g, ' ')}
                          </span>
                          {evt.roundNumber && (
                            <span className="text-slate-400 font-mono text-[10px]">
                              [Round {evt.roundNumber}]
                            </span>
                          )}
                          <span className="text-slate-500 text-[10px]">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed font-sans">
                          {evt.message}
                        </p>
                      </div>
                    </div>

                    {hasDetails && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : evt._id)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                        title="View payload"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded JSON details */}
                  {isExpanded && hasDetails && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <pre className="bg-slate-900/90 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 overflow-x-auto">
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
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
          <span>Total Audit Records: {events.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailModal;
