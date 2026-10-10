import React, { useState, useEffect } from 'react';
import ProjectDashboard from '../components/citizen/ProjectDashboard';
import ProblemForum from '../components/citizen/ProblemForum';
import LoginModal from '../components/common/LoginModal';

export default function CitizenPortal() {
  const [activeTab, setActiveTab] = useState('projects');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        // ignore JSON parse issue
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-x-hidden font-sans pb-20">
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none fixed -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="pointer-events-none fixed top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[160px]" />
      <div className="pointer-events-none fixed -bottom-40 left-10 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[150px]" />

      {/* Crystal Glass Floating Navigation Header */}
      <header className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl px-5 py-3.5 shadow-2xl shadow-black/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-sm shadow-lg shadow-emerald-500/25 ring-1 ring-white/20">
              SC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">SyncCivic</span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 tracking-wide">
                  PUBLIC TRANSPARENCY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Decentralized Municipal Oversight & Works Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Citizen View Tabs */}
            <div className="flex items-center rounded-xl bg-white/[0.04] p-1 border border-white/5 backdrop-blur-md">
              <button
                onClick={() => setActiveTab('projects')}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  activeTab === 'projects'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'
                }`}
              >
                Public Projects
              </button>
              <button
                onClick={() => setActiveTab('forum')}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  activeTab === 'forum'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'
                }`}
              >
                Upvoting Forum
              </button>
            </div>

            {/* Official Portal / Login Toggle (Feature 3) */}
            {currentUser ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5">
                <span className="text-[11px] font-mono text-emerald-300">
                  {currentUser.role || currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500/30"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-all duration-200 shadow-sm"
              >
                Official Login →
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
        {activeTab === 'projects' ? <ProjectDashboard /> : <ProblemForum />}
      </main>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}