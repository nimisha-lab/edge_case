import React, { useState } from 'react';

const CIVIC_TAGS = ['#FastTrack', '#WaterCut', '#RoadHazard', '#TrafficDisruption'];

const INITIAL_PROBLEMS = [
  {
    id: 'ISSUE-401',
    title: 'Open trench left unfenced near bus stand after road cutting',
    author: 'Karthik R.',
    ward: 'Ward 12 - South',
    upvotes: 42,
    hasUpvoted: false,
    tags: ['#FastTrack', '#RoadHazard'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'Auto-Escalated to AE'
  },
  {
    id: 'ISSUE-402',
    title: 'Water supply cutoff for 36 hours without prior SMS notification',
    author: 'Sunita M.',
    ward: 'Ward 08 - Central',
    upvotes: 21,
    hasUpvoted: false,
    tags: ['#WaterCut', '#FastTrack'],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: 'Auto-Escalated to AE'
  },
  {
    id: 'ISSUE-403',
    title: 'Single-lane roadblock causing 45 min jam during peak morning hours',
    author: 'Arun V.',
    ward: 'Ward 08 - Central',
    upvotes: 14,
    hasUpvoted: false,
    tags: ['#TrafficDisruption'],
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    status: 'Pending Inspector Review'
  }
];

export default function ProblemForum() {
  const [issues, setIssues] = useState(INITIAL_PROBLEMS);
  const [sortTab, setSortTab] = useState('TOP'); // 'TOP' | 'RECENT'
  const [tagFilter, setTagFilter] = useState('ALL');

  // New Issue Form State
  const [newTitle, setNewTitle] = useState('');
  const [newWard, setNewWard] = useState('Ward 12 - South');
  const [selectedFormTags, setSelectedFormTags] = useState(['#RoadHazard']);

  // Handle Instant Upvoting
  const toggleUpvote = (id) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextVoted = !item.hasUpvoted;
          const nextCount = nextVoted ? item.upvotes + 1 : item.upvotes - 1;
          const shouldEscalate = nextCount >= 20 || item.tags.includes('#FastTrack');
          return {
            ...item,
            hasUpvoted: nextVoted,
            upvotes: nextCount,
            status: shouldEscalate ? 'Auto-Escalated to AE' : item.status
          };
        }
        return item;
      })
    );
  };

  // Submit New Problem
  const handlePostIssue = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const hasFastTrack = selectedFormTags.includes('#FastTrack');
    const newIssue = {
      id: `ISSUE-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      author: 'Citizen (You)',
      ward: newWard,
      upvotes: hasFastTrack ? 5 : 1,
      hasUpvoted: true,
      tags: selectedFormTags,
      createdAt: new Date().toISOString(),
      status: hasFastTrack ? 'Auto-Escalated to AE (#FastTrack)' : 'Assigned to Field Inspector'
    };

    setIssues([newIssue, ...issues]);
    setNewTitle('');
    setSelectedFormTags(['#RoadHazard']);
  };

  const toggleTagSelection = (tag) => {
    setSelectedFormTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Filter & Sort Logic
  const filtered = issues.filter(
    (i) => tagFilter === 'ALL' || i.tags.includes(tagFilter)
  );

  const sortedIssues = [...filtered].sort((a, b) => {
    if (sortTab === 'TOP') return b.upvotes - a.upvotes;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Forum Feed Column */}
      <div className="space-y-4 lg:col-span-2">
        {/* Sorting Tabs & Tag Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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

        {/* Issue Cards */}
        <div className="space-y-3">
          {sortedIssues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
            >
              {/* Upvote Button */}
              <button
                onClick={() => toggleUpvote(issue.id)}
                className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 transition-all ${
                  issue.hasUpvoted
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm">▲</span>
                <span className="text-xs font-extrabold">{issue.upvotes}</span>
              </button>

              {/* Details */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400">{issue.id}</span>
                  <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {issue.ward}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      issue.status.includes('Escalated')
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {issue.status}
                  </span>
                </div>

                <h4 className="mt-1 text-sm font-bold text-gray-900 leading-snug">{issue.title}</h4>

                {/* Functional Tags */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {issue.tags.map((t) => (
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
                    Reported by {issue.author}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Grievance Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm h-fit">
        <h3 className="text-sm font-bold text-gray-900">Post Grievance to Forum</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Issues reaching 20+ upvotes or tagged #FastTrack auto-escalate to Assistant Engineer.
        </p>

        <form onSubmit={handlePostIssue} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Problem Description</label>
            <textarea
              required
              rows={3}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Road resurfacing unfinished after pipe trenching..."
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Ward</label>
            <select
              value={newWard}
              onChange={(e) => setNewWard(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-xs text-gray-800 focus:outline-none"
            >
              <option value="Ward 12 - South">Ward 12 - South</option>
              <option value="Ward 08 - Central">Ward 08 - Central</option>
              <option value="Ward 03 - North">Ward 03 - North</option>
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
            className="w-full mt-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
          >
            Broadcast to Community
          </button>
        </form>
      </div>
    </div>
  );
}