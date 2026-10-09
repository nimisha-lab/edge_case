import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

const CIVIC_TAGS = ['#FastTrack', '#WaterCut', '#RoadHazard', '#TrafficDisruption'];

const LEVEL_LABELS = {
  FIELD_INSPECTOR: 'Field Inspector',
  ASSISTANT_ENGINEER: 'Assistant Engineer (AE)',
  EXECUTIVE_ENGINEER: 'Executive Engineer (EE)',
};

// Fallback demo dataset if API is under construction
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

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newWard, setNewWard] = useState('Ward 12');
  const [selectedFormTags, setSelectedFormTags] = useState(['#RoadHazard']);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Complaints with Auto-Fallback
  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.getComplaints();
      if (Array.isArray(data) && data.length > 0) {
        setIssues(data);
        setIsLiveConnected(true);
      } else {
        // API responded but empty
        setIssues(SEED_FALLBACK_ISSUES);
        setIsLiveConnected(true);
      }
    } catch (err) {
      console.warn('Backend endpoint unavailable. Running on demo fallback state.');
      setIsLiveConnected(false);
      setIssues(SEED_FALLBACK_ISSUES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  // Upvote Handler (Optimistic with API sync if available)
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
        console.warn('Backend upvote sync skipped, retained in local state.');
      }
    }
  };

  // Submit Complaint Handler
  const handlePostIssue = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    const hasFastTrack = selectedFormTags.includes('#FastTrack');

    const newIssuePayload = {
      id: `ISSUE-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      location: newLocation.trim() || 'Unspecified Corridor',
      ward: newWard,
      tags: selectedFormTags,
      upvotes: hasFastTrack ? 5 : 1,
      hasUpvoted: true,
      status: 'PENDING',
      assignedLevel: hasFastTrack ? 'ASSISTANT_ENGINEER' : 'FIELD_INSPECTOR',
      createdAt: new Date().toISOString()
    };

    if (isLiveConnected) {
      try {
        const created = await api.createComplaint(newIssuePayload);
        setIssues((prev) => [created || newIssuePayload, ...prev]);
      } catch (err) {
        console.warn('Backend post failed, adding to local session.');
        setIssues((prev) => [newIssuePayload, ...prev]);
      }
    } else {
      // Local fallback append
      setIssues((prev) => [newIssuePayload, ...prev]);
    }

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
      {/* Issues Feed Column */}
      <div className="space-y-4 lg:col-span-2">
        {/* Status / Sorting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setSortTab('TOP')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  sortTab === 'TOP'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                🔥 Top Upvoted
              </button>
              <button
                onClick={() => setSortTab('RECENT')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  sortTab === 'RECENT'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                ⏱ Most Recent
              </button>
            </div>

            {/* Subtle connectivity badge */}
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${
                isLiveConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isLiveConnected ? '● Live API' : '● Demo Simulation'}
            </span>
          </div>

          {/* Tag Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTagFilter('ALL')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium border ${
                tagFilter === 'ALL'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              All
            </button>
            {CIVIC_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                  tagFilter === t
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints List */}
        <div className="space-y-3">
          {sortedIssues.map((issue) => {
            const isEscalated =
              issue.assignedLevel === 'ASSISTANT_ENGINEER' ||
              issue.assignedLevel === 'EXECUTIVE_ENGINEER';

            return (
              <div
                key={issue.id}
                className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
              >
                {/* Live Upvote Button */}
                <button
                  type="button"
                  onClick={() => handleUpvote(issue.id)}
                  className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 transition-all ${
                    issue.hasUpvoted
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm">▲</span>
                  <span className="text-xs font-extrabold">{issue.upvotes ?? 0}</span>
                </button>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400">
                      #{issue.id?.toString().slice(-6) || 'ISSUE'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {issue.ward || 'Ward 12'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        issue.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : issue.status === 'IN_REVIEW'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {issue.status || 'PENDING'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        isEscalated
                          ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      Tier: {LEVEL_LABELS[issue.assignedLevel] || issue.assignedLevel || 'FIELD_INSPECTOR'}
                    </span>
                  </div>

                  <h4 className="mt-1 text-sm font-bold text-gray-900 leading-snug">{issue.title}</h4>

                  {issue.location && (
                    <p className="text-[11px] text-gray-500 mt-0.5">📍 {issue.location}</p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {Array.isArray(issue.tags) &&
                      issue.tags.map((t) => (
                        <span
                          key={t}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t === '#FastTrack'
                              ? 'bg-rose-100 text-rose-700 font-extrabold'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    <span className="text-[10px] text-gray-400 ml-auto">
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

      {/* Post Grievance Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm h-fit">
        <h3 className="text-sm font-bold text-gray-900">Post Grievance to Forum</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Issues tagged with #FastTrack auto-escalate to Assistant Engineer.
        </p>

        <form onSubmit={handlePostIssue} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Problem Description</label>
            <textarea
              required
              rows={3}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Severe road cavity after water line trenching..."
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Location / Landmark</label>
            <input
              type="text"
              required
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="e.g., Main Road, Cross 3"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Ward</label>
            <select
              value={newWard}
              onChange={(e) => setNewWard(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-xs text-gray-800 focus:outline-none"
            >
              <option value="Ward 12">Ward 12</option>
              <option value="Ward 08">Ward 08</option>
              <option value="Ward 03">Ward 03</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Attach Tags</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CIVIC_TAGS.map((tag) => {
                const active = selectedFormTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTagSelection(tag)}
                    className={`rounded-md px-2 py-1 text-[11px] font-bold transition-all ${
                      active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            className="w-full mt-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Broadcasting...' : 'Broadcast to Community'}
          </button>
        </form>
      </div>
    </div>
  );
}