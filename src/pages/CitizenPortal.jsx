import React, { useState } from 'react';
import ProjectDashboard from '../components/citizen/ProjectDashboard';
import ProblemForum from '../components/citizen/ProblemForum';

export default function CitizenPortal() {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      {/* Top Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-sm shadow-sm">
              SC
            </span>
            <div>
              <span className="text-base font-extrabold tracking-tight text-gray-900">SyncCivic</span>
              <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Citizen Portal
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('projects')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'projects'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Public Projects
            </button>
            <button
              onClick={() => setActiveTab('forum')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'forum'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Upvoting Forum
            </button>
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 pt-6">
        {activeTab === 'projects' ? <ProjectDashboard /> : <ProblemForum />}
      </main>
    </div>
  );
}