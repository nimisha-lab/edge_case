import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

const CIVIC_TAGS = ['#FastTrack', '#WaterCut', '#RoadHazard', '#TrafficDisruption'];

const LEVEL_LABELS = {
  FIELD_INSPECTOR: 'Field Inspector',
  ASSISTANT_ENGINEER: 'Assistant Engineer (AE)',
  EXECUTIVE_ENGINEER: 'Executive Engineer (EE)',
};

const SEED_FALLBACK_ISSUES = [
  {
    id: 'ISSUE-401',
    title: 'Open trench left unfenced near bus stand after road cutting',
    location: 'Main Road, Cross 3',
    ward: 'Ward 12',
    upvotes: 42,
    hasUpvoted: false,
    tags: ['#FastTrack', '#RoadHazard'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'IN_REVIEW',
    assignedLevel: 'ASSISTANT_ENGINEER'
  },
  {
    id: 'ISSUE-402',
    title: 'Water supply cutoff for 36 hours without prior SMS announcement',
    location: 'Sector 4, 2nd Avenue',
    ward: 'Ward 08',
    upvotes: 21,
    hasUpvoted: false,
    tags: ['#WaterCut', '#FastTrack'],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: 'IN_REVIEW',
    assignedLevel: 'ASSISTANT_ENGINEER'
  },
  {
    id: 'ISSUE-403',
    title: 'Single-lane roadblock causing 45 min jam during peak morning hours',
    location: 'Gandhi Road Junction',
    ward: 'Ward 08',
    upvotes: 14,
    hasUpvoted: false,
    tags: ['#TrafficDisruption'],
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    status: 'PENDING',
    assignedLevel: 'FIELD_INSPECTOR'
  }
];

export default function ProblemForum() {
  const [issues, setIssues] = useState(SEED_FALLBACK_ISSUES);
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const [sortTab, setSortTab] = useState('TOP');
  const [tagFilter, setTagFilter] = useState('ALL');

  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newWard, setNewWard] = useState('Ward 12');
  const [selectedFormTags, setSelectedFormTags] = useState(['#RoadHazard']);
  const [submitting, setSubmitting] = useState(false);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.getComplaints();
      if (Array.isArray(data) && data.length > 0) {
        setIssues(data);
        setIsLiveConnected(true);
      } else {
        setIssues(SEED_FALLBACK_ISSUES);
        setIsLiveConnected(true);
      }
    } catch {
      setIsLiveConnected(false);
      setIssues(SEED_FALLBACK_ISSUES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleUpvote = async (id) => {
    setIssues((current) =>
      current.map((item) => {
        if (item.id === id) {
          const nextVoted = !item.hasUpvoted;
          const nextCount = nextVoted ? (item.upvotes || 0) + 1 : Math.max(0, (item.upvotes || 0) - 1);
          const isFastTrack = item.tags && item.tags.includes('#FastTrack');
          const shouldEscalate = nextCount >= 20 || isFastTrack;

          return {
            ...item,
            upvotes: nextCount,
            hasUpvoted: nextVoted,
            assignedLevel: shouldEscalate ? 'ASSISTANT_ENGINEER' : item.assignedLevel
          };
        }
        return item;
      })
    );

    if (isLiveConnected) {
      try {
        await api.upvoteComplaint(id);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handlePostIssue = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    const hasFastTrack = selectedFormTags.includes('#FastTrack');

    const newIssuePayload = {
      id: `ISSUE-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      location: newLocation.trim() || 'Central Corridor',
      ward: newWard,
      tags: selectedFormTags,
      upvotes: hasFastTrack ? 5 : 1,
      hasUpvoted: true,
      status: 'PENDING',
      assignedLevel: hasFastTrack ? 'ASSISTANT_ENGINEER' : 'FIELD_INSPECTOR',
      createdAt: new Date().toISOString()
    };

    setIssues((prev) => [newIssuePayload, ...prev]);
    setNewTitle('');
    setNewLocation('');
    setSelectedFormTags(['#RoadHazard']);
    setSubmitting(false);
  };

  const toggleTagSelection = (tag) => {
    setSelectedFormTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = issues.filter(
    (i) => tagFilter === 'ALL' || (i.tags && i.tags.includes(tagFilter))
  );

  const sortedIssues = [...filtered].sort((a, b) => {
    if (sortTab === 'TOP') return (b.upvotes || 0) - (a.upvotes || 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Forum Feed */}
      <div className="space-y-4 lg:col-span-2">
        {/* Crystal Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/5">
              <button
                onClick={() => setSortTab('TOP')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  sortTab === 'TOP'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔥 Top Upvoted
              </button>
              <button
                onClick={() => setSortTab('RECENT')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  sortTab === 'RECENT'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⏱ Most Recent
              </button>
            </div>

            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                isLiveConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              {isLiveConnected ? '● LIVE API' : '● SIMULATION'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTagFilter('ALL')}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono border transition ${
                tagFilter === 'ALL'
                  ? 'bg-white text-slate-950 border-white font-bold'
                  : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              All
            </button>
            {CIVIC_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                className={`rounded-lg px-2.5 py-1 text-xs font-mono border transition ${
                  tagFilter === t
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Cards */}
        <div className="space-y-3">
          {sortedIssues.map((issue) => {
            const isEscalated =
              issue.assignedLevel === 'ASSISTANT_ENGINEER' ||
              issue.assignedLevel === 'EXECUTIVE_ENGINEER';

            return (
              <div
                key={issue.id}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-200 hover:border-emerald-500/30 hover:bg-white/[0.04] shadow-lg"
              >
                {/* Glow Upvote Pill */}
                <button
                  type="button"
                  onClick={() => handleUpvote(issue.id)}
                  className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 transition-all ${
                    issue.hasUpvoted
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/20'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-sm">▲</span>
                  <span className="text-xs font-mono font-bold">{issue.upvotes ?? 0}</span>
                </button>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      #{issue.id?.toString().slice(-6) || 'ISSUE'}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {issue.ward || 'Ward 12'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        issue.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                      }`}
                    >
                      {issue.status || 'PENDING'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        isEscalated
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 font-bold'
                          : 'bg-white/5 text-slate-400 border-white/5'
                      }`}
                    >
                      Tier: {LEVEL_LABELS[issue.assignedLevel] || issue.assignedLevel || 'FIELD_INSPECTOR'}
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    {issue.title}
                  </h4>

                  {issue.location && (
                    <p className="text-[11px] text-slate-400 mt-1">📍 {issue.location}</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {Array.isArray(issue.tags) &&
                      issue.tags.map((t) => (
                        <span
                          key={t}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            t === '#FastTrack'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-extrabold shadow-sm shadow-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    <span className="text-[10px] font-mono text-slate-500 ml-auto">
                      {issue.createdAt
                        ? new Date(issue.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Broadcast Grievance Form */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl h-fit">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          Broadcast Grievance
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
            AUTO-ESCALATION
          </span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Issues reaching 20+ upvotes or tagged with #FastTrack auto-escalate to Assistant Engineer.
        </p>

        <form onSubmit={handlePostIssue} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300">Observation</label>
            <textarea
              required
              rows={3}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Unfenced deep trench blocking school bus route..."
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Location Landmark</label>
            <input
              type="text"
              required
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="e.g. 4th Cross Road"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900/80 p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Ward Designation</label>
            <select
              value={newWard}
              onChange={(e) => setNewWard(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900/80 p-2.5 text-xs font-medium text-slate-300 focus:border-emerald-500/60 focus:outline-none"
            >
              <option value="Ward 12">Ward 12 - South</option>
              <option value="Ward 08">Ward 08 - Central</option>
              <option value="Ward 03">Ward 03 - North</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Tag Priority Classifier</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CIVIC_TAGS.map((tag) => {
                const active = selectedFormTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTagSelection(tag)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition-all border ${
                      active
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                        : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-300 transition-all duration-200"
          >
            {submitting ? 'Broadcasting...' : 'Broadcast to Community'}
          </button>
        </form>
      </div>
    </div>
  );
}