import React, { useState } from 'react';

const STAGES = [
  { id: 1, name: 'Excavation', desc: 'Trenching and ground preparation' },
  { id: 2, name: 'Conduit / Utility', desc: 'Underground conduit or utility installation' },
  { id: 3, name: 'Bitumen Layering', desc: 'Road leveling and bitumen laying' },
  { id: 4, name: 'Commissioned', desc: 'Final inspection, clearance and sign-off' }
];

export default function PhaseStepperModal({ project, onClose }) {
  const currentStageIndex = project.currentStageIndex ?? 1;
  const [selectedPhase, setSelectedPhase] = useState(STAGES[currentStageIndex]?.name || STAGES[0].name);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0E131F]/90 p-7 shadow-2xl backdrop-blur-2xl text-slate-100">
        {/* Glow highlight */}
        <div className="pointer-events-none absolute -top-20 left-1/3 h-40 w-40 rounded-full bg-emerald-500/20 blur-[80px]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{project.name}</h2>
            <p className="text-xs font-mono text-emerald-400 mt-0.5">
              Ref ID: {project.id} • {project.department}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {/* Minimalist Glass Stepper */}
        <div className="my-7">
          <p className="mb-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Lifecycle Phase Progress
          </p>
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 -z-0 h-0.5 w-full -translate-y-1/2 bg-white/10" />
            <div
              className="absolute left-0 top-1/2 -z-0 h-0.5 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-sm shadow-emerald-500"
              style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
            />
            {STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={stage.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-mono font-bold transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : isCurrent
                        ? 'border-2 border-emerald-400 bg-slate-900 text-emerald-400 ring-4 ring-emerald-500/20 shadow-md shadow-emerald-500/40'
                        : 'border border-white/10 bg-slate-900/80 text-slate-500'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`mt-2 text-center text-[11px] max-w-[85px] leading-tight ${
                      isCurrent ? 'font-bold text-emerald-300' : 'text-slate-400 font-medium'
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Frosted Feedback Section */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Submit Phase Grievance / Rating
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-slate-400">Target Phase</label>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900/80 p-2 text-xs font-medium text-slate-200 focus:border-emerald-500/60 focus:outline-none"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400">Execution Score</label>
              <div className="mt-1.5 flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-lg transition-transform hover:scale-125 ${
                      star <= rating ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-white/20'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 font-mono text-xs text-slate-400">{rating}/5</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400">Ground Observation</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Unfinished road cutting, missing barrier..."
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {submitted && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  ✓ Grievance registered on telemetry log!
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
              >
                Dismiss
              </button>
              <button
                type="submit"
                className={`rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-lg ${
                  submitted
                    ? 'bg-emerald-600 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {submitted ? 'Recorded!' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}