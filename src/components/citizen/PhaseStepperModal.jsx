import React, { useState } from 'react';

const STAGES = [
  { id: 1, name: 'Excavation', desc: 'Trenching and ground preparation' },
  { id: 2, name: 'Pipe Laying / Cabling', desc: 'Underground conduit or utility installation' },
  { id: 3, name: 'Asphalt Resurfacing', desc: 'Road leveling and bitumen laying' },
  { id: 4, name: 'Completed', desc: 'Final inspection, clearance and sign-off' }
];

export default function PhaseStepperModal({ project, onClose }) {
  const currentStageIndex = project.currentStageIndex ?? 1;
  const [selectedPhase, setSelectedPhase] = useState(STAGES[currentStageIndex]?.name || STAGES[0].name);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('Phase Feedback Logged:', {
      projectId: project.id,
      phase: selectedPhase,
      rating,
      comment: feedback || 'No additional comments provided',
      submittedAt: new Date().toISOString()
    });

    setSubmitted(true);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Ref: {project.id} | Department: {project.department}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Feature 2: Visual 4-Stage Stepper */}
        <div className="my-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Project Stage Progression
          </p>
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 -z-0 h-1 w-full -translate-y-1/2 bg-gray-200" />
            <div
              className="absolute left-0 top-1/2 -z-0 h-1 -translate-y-1/2 bg-emerald-600 transition-all duration-300"
              style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
            />
            {STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={stage.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'border-2 border-emerald-600 bg-white text-emerald-700 ring-4 ring-emerald-100'
                        : 'border border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`mt-2 text-center text-xs max-w-[85px] leading-tight ${
                      isCurrent ? 'font-bold text-gray-900' : 'text-gray-500 font-medium'
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature 2: Phase-Wise Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">Submit Specific Phase Feedback</h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-600">Select Phase to Report On</label>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Quality of Execution</label>
              <div className="mt-1 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-lg transition-transform hover:scale-110 ${
                      star <= rating ? 'text-amber-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-gray-500">{rating}/5</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Observation / Grievance (Optional)</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Debris not cleared after excavation, obstructing the sidewalk..."
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {submitted && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  ✓ Feedback recorded on grievance log!
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitted}
                className={`rounded-lg px-5 py-2 text-xs font-semibold text-white shadow transition-all ${
                  submitted ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submitted ? 'Submitted!' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}