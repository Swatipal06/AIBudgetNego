import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Shield,
  ArrowRight,
} from 'lucide-react';

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const CreateNegotiationPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('FY2026 Department Operating Budget Allocation');
  const [description, setDescription] = useState('Multi-department budget negotiation balancing platform engineering, global marketing, and sales expansion.');
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
      description: 'Platform infrastructure, cloud reliability, and security services.',
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
      description: 'Brand campaigns, user acquisition, and public events.',
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
      description: 'Enterprise pipeline, customer expansion, and retention.',
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Feasibility Calculation
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
      setError(`Cannot create negotiation: Combined minimum requirements (₹${feasibility.totalMin.toLocaleString('en-IN')}) exceed company budget limit (₹${feasibility.budgetNum.toLocaleString('en-IN')}).`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

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
        <div className="bg-[#111827] border border-[#1f293d] p-8 rounded-lg">
          <Shield className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-100">Administrator Access Required</h2>
          <p className="text-xs text-slate-400 mt-1">
            Only users with the Administrator role can configure new budget negotiations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back Link & Header */}
      <div className="space-y-3">
        <Link
          to="/"
          className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Negotiations</span>
        </Link>

        <div className="pb-3 border-b border-[#1f293d]">
          <h1 className="text-xl font-semibold text-white tracking-tight">
            New Negotiation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure company budget limit, rounds, and department agent constraints.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-md p-3.5 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">Validation Error</strong>
            {error}
          </div>
        </div>
      )}

      {/* Feasibility Summary Banner */}
      <div
        className={`p-4 rounded-lg border text-xs ${
          feasibility.isFeasible
            ? 'bg-[#0c1813] border-emerald-900/60'
            : 'bg-[#181112] border-red-900/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-2.5">
            <span
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                feasibility.isFeasible ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <div>
              <span
                className={`font-semibold ${
                  feasibility.isFeasible ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                {feasibility.isFeasible ? 'Feasible Configuration' : 'Mathematically Infeasible'}
              </span>
              <p className="text-slate-400 mt-0.5">
                {feasibility.isFeasible
                  ? `Total minimum requirements (${formatCurrency(feasibility.totalMin)}) are within the company budget (${formatCurrency(feasibility.budgetNum)}).`
                  : `Combined minimum requirements (${formatCurrency(feasibility.totalMin)}) exceed the budget limit by ${formatCurrency(feasibility.deficit)}.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono shrink-0 text-slate-300">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Total Demand</span>
              <span>{formatCurrency(feasibility.totalReq)}</span>
            </div>
            <div className="border-l border-[#1f293d] pl-4">
              <span className="text-slate-400 text-[10px] uppercase block">Min Floor</span>
              <span className={feasibility.isFeasible ? 'text-emerald-300' : 'text-red-400'}>
                {formatCurrency(feasibility.totalMin)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global Settings */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">
            Budget Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Negotiation Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Company Budget (₹)
              </label>
              <input
                type="number"
                required
                min={1}
                value={companyBudget}
                onChange={(e) => setCompanyBudget(Number(e.target.value))}
                className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md px-3 py-2 text-xs text-slate-100 font-mono font-medium focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description / Memo
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Max Negotiation Rounds
              </label>
              <input
                type="number"
                required
                min={1}
                max={20}
                value={maxRounds}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md px-3 py-2 text-xs text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Departments Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Department Agent Configurations ({departments.length})
              </h2>
              <p className="text-xs text-slate-400">
                Define the requested allocation, minimum acceptable floor, and negotiation strategy for each department.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddDepartment}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md bg-[#141c2c] hover:bg-[#1a2436] text-slate-200 text-xs font-medium transition-colors border border-[#243048]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="space-y-3">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="bg-[#111827] border border-[#1f293d] rounded-lg p-4 space-y-3"
                style={{ borderLeft: `3px solid ${dept.color}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="color"
                      value={dept.color}
                      onChange={(e) => handleDeptChange(index, 'color', e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                      title="Department Color"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Department Name"
                      value={dept.name}
                      onChange={(e) => handleDeptChange(index, 'name', e.target.value)}
                      className="text-sm font-semibold text-white bg-[#0b0f17] border border-[#1f293d] rounded-md px-2.5 py-1 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {departments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(index)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      title="Remove Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md px-2.5 py-1.5 text-xs font-mono font-medium text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Minimum Acceptable Floor (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={dept.requestedBudget}
                      value={dept.minAcceptableBudget}
                      onChange={(e) => handleDeptChange(index, 'minAcceptableBudget', Number(e.target.value))}
                      className="w-full bg-[#0b0f17] border border-amber-900/40 rounded-md px-2.5 py-1.5 text-xs font-mono font-medium text-amber-300 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Priority
                    </label>
                    <select
                      value={dept.priority}
                      onChange={(e) => handleDeptChange(index, 'priority', e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="HIGH">HIGH (Weight: 1.3)</option>
                      <option value="MEDIUM">MEDIUM (Weight: 1.0)</option>
                      <option value="LOW">LOW (Weight: 0.7)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Strategy
                    </label>
                    <select
                      value={dept.strategy}
                      onChange={(e) => handleDeptChange(index, 'strategy', e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
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
                      Hard Constraints (Mandatory items, comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Infrastructure maintenance, Compliance audits"
                      value={dept.hardConstraints}
                      onChange={(e) => handleDeptChange(index, 'hardConstraints', e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Soft Preferences (Negotiable items, comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Experimental sandbox, Roadshow travel"
                      value={dept.softPreferences}
                      onChange={(e) => handleDeptChange(index, 'softPreferences', e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#1f293d]">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !feasibility.isFeasible}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-md text-xs transition-colors disabled:opacity-50"
          >
            <span>{submitting ? 'Creating...' : 'Create Negotiation'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNegotiationPage;

