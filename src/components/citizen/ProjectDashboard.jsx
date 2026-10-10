import React, { useState } from 'react';
import PhaseStepperModal from './PhaseStepperModal';

const INITIAL_PROJECTS = [
  {
    id: 'PRJ-2026-081',
    name: 'Main Arterial Water Pipeline Replacement',
    department: 'Water Supply',
    ward: 'Ward 12 - South',
    allottedBudget: 4500000,
    budgetSpent: 3150000,
    startDate: '2026-08-10',
    deliveryDate: '2026-11-20',
    status: 'In Progress',
    currentStageIndex: 1,
  },
  {
    id: 'PRJ-2026-094',
    name: 'Underground Cable Trenching & Ducting',
    department: 'Electricity Board',
    ward: 'Ward 08 - Central',
    allottedBudget: 2800000,
    budgetSpent: 2600000,
    startDate: '2026-07-01',
    deliveryDate: '2026-10-30',
    status: 'In Progress',
    currentStageIndex: 2,
  },
  {
    id: 'PRJ-2026-102',
    name: 'Stormwater Drain Widening & Desilting',
    department: 'Public Works (PWD)',
    ward: 'Ward 12 - South',
    allottedBudget: 1500000,
    budgetSpent: 300000,
    startDate: '2026-09-15',
    deliveryDate: '2026-12-15',
    status: 'Planned',
    currentStageIndex: 0,
  },
  {
    id: 'PRJ-2026-044',
    name: 'Sector 4 Bitumen Road Resurfacing',
    department: 'Public Works (PWD)',
    ward: 'Ward 03 - North',
    allottedBudget: 3200000,
    budgetSpent: 3200000,
    startDate: '2026-05-01',
    deliveryDate: '2026-08-15',
    status: 'Completed',
    currentStageIndex: 3,
  }
];

export default function ProjectDashboard() {
  const [projects] = useState(INITIAL_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeModalProject, setActiveModalProject] = useState(null);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || p.department === deptFilter;
    const matchesWard = wardFilter === 'ALL' || p.ward === wardFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesDept && matchesWard && matchesStatus;
  });

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6">
      {/* Crystal Glass Filter Bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Civic Infrastructure Telemetry
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live audit of capital expenditure, execution schedules, and phase milestones
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by project or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs text-white placeholder-slate-500 backdrop-blur-md focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
          </div>
        </div>

        {/* Minimalist Dropdowns */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/50 p-2.5 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Departments</option>
            <option value="Water Supply">Water Supply</option>
            <option value="Electricity Board">Electricity Board</option>
            <option value="Public Works (PWD)">Public Works (PWD)</option>
          </select>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/50 p-2.5 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Wards</option>
            <option value="Ward 12 - South">Ward 12 - South</option>
            <option value="Ward 08 - Central">Ward 08 - Central</option>
            <option value="Ward 03 - North">Ward 03 - North</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="col-span-2 sm:col-span-1 rounded-xl border border-white/10 bg-slate-900/50 p-2.5 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Lifecycle Statuses</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Crystal Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((p) => {
          const spendPercent = Math.min(100, Math.round((p.budgetSpent / p.allottedBudget) * 100));

          return (
            <div
              key={p.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-emerald-500/5"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300 tracking-wide">
                    {p.department}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{p.ward}</span>
                </div>

                {/* Title & Ref */}
                <h3 className="mt-4 text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                  {p.name}
                </h3>
                <p className="text-[10px] font-mono text-slate-500 mt-1 tracking-wider">{p.id}</p>

                {/* Minimalist Progress Meter */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-400">Budget Depletion</span>
                    <span className="font-mono font-bold text-emerald-400">{spendPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        spendPercent > 90
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-sm shadow-amber-500/50'
                          : 'bg-gradient-to-r from-teal-500 to-emerald-400 shadow-sm shadow-emerald-500/50'
                      }`}
                      style={{ width: `${spendPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>{formatCurrency(p.budgetSpent)}</span>
                    <span className="text-slate-500">Cap: {formatCurrency(p.allottedBudget)}</span>
                  </div>
                </div>

                {/* Metadata Pill */}
                <div className="mt-6 grid grid-cols-2 gap-2 border-t border-white/5 pt-4 text-[11px]">
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase font-mono">Commissioned</span>
                    <span className="font-mono text-slate-300">{p.startDate}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase font-mono">Target Sign-Off</span>
                    <span className="font-mono text-slate-300">{p.deliveryDate}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setActiveModalProject(p)}
                className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-emerald-500 hover:text-slate-950 border border-white/10 hover:border-emerald-400 py-2.5 text-xs font-semibold text-slate-200 transition-all duration-200 group-hover:border-emerald-500/40"
              >
                <span>Audit Stage & Feedback</span>
                <span>→</span>
              </button>
            </div>
          );
        })}
      </div>

      {activeModalProject && (
        <PhaseStepperModal
          project={activeModalProject}
          onClose={() => setActiveModalProject(null)}
        />
      )}
    </div>
  );
}