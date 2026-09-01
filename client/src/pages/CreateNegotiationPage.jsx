import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Scale,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const CreateNegotiationPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('FY2026 Department Operating Budget Negotiation');
  const [description, setDescription] = useState('Multi-agent budget negotiation balancing technical scalability, global growth, and sales acquisition.');
  const [companyBudget, setCompanyBudget] = useState(1000000);
  const [maxRounds, setMaxRounds] = useState(5);
  const [departments, setDepartments] = useState([
    {
      name: 'Engineering',
      requestedBudget: 500000,
      minAcceptableBudget: 400000,
      priority: 'HIGH',
      strategy: 'COMPROMISING',
      hardConstraints: 'Mandatory Cloud Infrastructure (₹3L), SOC-2 Security Compliance (₹1L)',
      softPreferences: 'Experimental LLM Cluster (₹60k), Additional CI/CD Runners (₹40k)',
      color: '#3b82f6',
      description: 'Core platform engineering, site reliability, and cloud architecture.',
    },
    {
      name: 'Marketing',
      requestedBudget: 400000,
      minAcceptableBudget: 250000,
      priority: 'MEDIUM',
      strategy: 'COLLABORATIVE',
      hardConstraints: 'Global Q3 Product Launch (₹1.8L), Analytics Stack (₹70k)',
      softPreferences: 'Keynote Tech Sponsorships (₹90k), Influencer Campaign (₹60k)',
      color: '#10b981',
      description: 'Global brand reach, customer acquisition, and performance campaigns.',
    },
    {
      name: 'Sales',
      requestedBudget: 300000,
      minAcceptableBudget: 200000,
      priority: 'MEDIUM',
      strategy: 'ASSERTIVE',
      hardConstraints: 'CRM Licenses & Quota Commission Pool (₹1.5L), Retention (₹50k)',
      softPreferences: 'International Roadshow (₹60k), Client Hospitality (₹40k)',
      color: '#f59e0b',
      description: 'Revenue generation, enterprise deals, and customer onboarding.',
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Live Deterministic Feasibility Calculation
  const feasibility = useMemo(() => {
    const totalMin = departments.reduce((sum, d) => sum + (Number(d.minAcceptableBudget) || 0), 0);
    const totalReq = departments.reduce((sum, d) => sum + (Number(d.requestedBudget) || 0), 0);
    const budgetNum = Number(companyBudget) || 0;
    const isFeasible = totalMin <= budgetNum;
    const deficit = totalMin > budgetNum ? totalMin - budgetNum : 0;

    return {
      totalMin,
      totalReq,
      budgetNum,
      isFeasible,
      deficit,
      demandSurplus: totalReq > budgetNum ? totalReq - budgetNum : 0,
    };
  }, [departments, companyBudget]);

  const handleAddDepartment = () => {
    const nextIdx = departments.length;
    setDepartments([
      ...departments,
      {
        name: `Department ${nextIdx + 1}`,
        requestedBudget: 200000,
        minAcceptableBudget: 150000,
        priority: 'MEDIUM',
        strategy: 'COMPROMISING',
        hardConstraints: 'Core Operational Minimums',
        softPreferences: 'Discretionary Expansion',
        color: DEFAULT_COLORS[nextIdx % DEFAULT_COLORS.length],
        description: '',
      },
    ]);
  };

  const handleRemoveDepartment = (index) => {
    if (departments.length <= 1) {
      alert('At least one department is required.');
      return;
    }
    setDepartments(departments.filter((_, i) => i !== index));
  };

  const handleDeptChange = (index, field, value) => {
    const updated = [...departments];
    updated[index][field] = value;
    setDepartments(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feasibility.isFeasible) {
      setError(`Cannot create negotiation: Combined minimum acceptable requirements (₹${feasibility.totalMin.toLocaleString('en-IN')}) exceed total company budget (₹${feasibility.budgetNum.toLocaleString('en-IN')}).`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Parse string constraints to array
      const payloadDepartments = departments.map((d) => ({
        ...d,
        requestedBudget: Number(d.requestedBudget),
        minAcceptableBudget: Number(d.minAcceptableBudget),
        hardConstraints: typeof d.hardConstraints === 'string'
          ? d.hardConstraints.split(',').map((s) => s.trim()).filter(Boolean)
          : d.hardConstraints,
        softPreferences: typeof d.softPreferences === 'string'
          ? d.softPreferences.split(',').map((s) => s.trim()).filter(Boolean)
          : d.softPreferences,
      }));

      const res = await api.post('/negotiations', {
        title,
        description,
        companyBudget: Number(companyBudget),
        maxRounds: Number(maxRounds),
        departments: payloadDepartments,
      });

      if (res.success) {
        navigate(`/negotiations/${res.negotiation._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create negotiation');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="glass-panel p-8 rounded-3xl border-slate-800">
          <Shield className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-100">Administrator Access Required</h2>
          <p className="text-xs text-slate-400 mt-2">
            Only authenticated users with the ADMIN role can configure and initialize new budget negotiations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5" />
            <span>Negotiation Orchestrator Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            Create Multi-Agent Budget Negotiation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Configure dynamic department agents, hard minimum floors, strategic priorities, and total company budget ceilings.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Configuration Validation Error</strong>
            {error}
          </div>
        </div>
      )}

      {/* Live Feasibility Widget */}
      <div
        className={`glass-panel p-5 rounded-2xl border transition-all ${
          feasibility.isFeasible
            ? 'border-emerald-700/60 bg-emerald-950/20'
            : 'border-red-700/60 bg-red-950/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                feasibility.isFeasible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {feasibility.isFeasible ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    feasibility.isFeasible
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-red-950 text-red-300 border-red-800'
                  }`}
                >
                  {feasibility.isFeasible ? 'Feasible Configuration' : 'Mathematically Infeasible'}
                </span>
                <span className="text-[11px] text-slate-400">Deterministic Feasibility Gate</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {feasibility.isFeasible
                  ? `Total Minimum Floor: ${formatCurrency(feasibility.totalMin)} is within Company Budget ${formatCurrency(feasibility.budgetNum)}. Multi-agent negotiation can safely proceed.`
                  : `Combined minimum acceptable requirements (${formatCurrency(feasibility.totalMin)}) exceed company budget by ${formatCurrency(feasibility.deficit)}. Negotiation cannot proceed.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div className="text-right">
              <span className="text-slate-400 text-[10px] uppercase block">Total Demand</span>
              <span className="font-bold text-slate-200">{formatCurrency(feasibility.totalReq)}</span>
            </div>
            <div className="text-right border-l border-slate-800 pl-4">
              <span className="text-slate-400 text-[10px] uppercase block">Minimum Floor</span>
              <span className={`font-bold ${feasibility.isFeasible ? 'text-emerald-300' : 'text-red-400'}`}>
                {formatCurrency(feasibility.totalMin)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Global Settings */}
        <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Scale className="w-4 h-4 text-brand-400" />
            <span>Corporate Budget Parameters</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Negotiation Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Company Budget (₹)
              </label>
              <input
                type="number"
                required
                min={1}
                value={companyBudget}
                onChange={(e) => setCompanyBudget(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono font-bold focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corporate Strategic Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Negotiation Rounds
              </label>
              <input
                type="number"
                required
                min={1}
                max={20}
                value={maxRounds}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Departments Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Department Agent Configurations ({departments.length})
              </h2>
              <p className="text-xs text-slate-400">
                Each agent has its own priorities, hard constraints, and negotiation persona.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddDepartment}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
            >
              <Plus className="w-4 h-4 text-brand-400" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="space-y-4">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="glass-panel p-5 rounded-2xl border-slate-800 relative space-y-4"
                style={{ borderLeft: `4px solid ${dept.color}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={dept.color}
                      onChange={(e) => handleDeptChange(index, 'color', e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      title="Department Color"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Department Name"
                      value={dept.name}
                      onChange={(e) => handleDeptChange(index, 'name', e.target.value)}
                      className="text-base font-bold text-white bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {departments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(index)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Requested Budget (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={dept.requestedBudget}
                      onChange={(e) => handleDeptChange(index, 'requestedBudget', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-amber-400 mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Min Acceptable Budget (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={dept.requestedBudget}
                      value={dept.minAcceptableBudget}
                      onChange={(e) => handleDeptChange(index, 'minAcceptableBudget', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-amber-900/60 rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Strategic Priority
                    </label>
                    <select
                      value={dept.priority}
                      onChange={(e) => handleDeptChange(index, 'priority', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="HIGH">HIGH (Weight: 1.3)</option>
                      <option value="MEDIUM">MEDIUM (Weight: 1.0)</option>
                      <option value="LOW">LOW (Weight: 0.7)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Negotiation Strategy
                    </label>
                    <select
                      value={dept.strategy}
                      onChange={(e) => handleDeptChange(index, 'strategy', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="COMPROMISING">COMPROMISING (Balanced)</option>
                      <option value="COLLABORATIVE">COLLABORATIVE (High concessions)</option>
                      <option value="ASSERTIVE">ASSERTIVE (Firm hold)</option>
                      <option value="CONSERVATIVE">CONSERVATIVE (Slow concessions)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Hard Constraints (Comma-separated, mandatory)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Infrastructure maintenance, Compliance audits"
                      value={dept.hardConstraints}
                      onChange={(e) => handleDeptChange(index, 'hardConstraints', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Soft Preferences (Comma-separated, negotiable)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Experimental sandbox, Roadshow travel"
                      value={dept.softPreferences}
                      onChange={(e) => handleDeptChange(index, 'softPreferences', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !feasibility.isFeasible}
            className="flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 text-sm transition-all transform active:scale-95 disabled:opacity-50"
          >
            <span>{submitting ? 'Initializing...' : 'Create & Enter Negotiation Room'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNegotiationPage;
