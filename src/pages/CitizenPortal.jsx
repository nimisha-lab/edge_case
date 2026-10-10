import React, { useState, useEffect } from 'react';
import { 
  fetchProjects, 
  fetchComplaints, 
  upvoteComplaint, 
  fileComplaint, 
  officialLogin, 
  fetchEscalations 
} from '../api/client';
import GrievanceRankings from '../components/GrievanceRankings';

export default function CitizenPortal() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [projects, setProjects] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Grievance Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWard, setNewWard] = useState('Ward 42');
  const [newCategory, setNewCategory] = useState('Sanitation');

  // Official Modal State
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [officialEmail, setOfficialEmail] = useState('');
  const [officialPass, setOfficialPass] = useState('');
  const [officialToken, setOfficialToken] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projData, compData] = await Promise.all([
        fetchProjects(),
        fetchComplaints()
      ]);
      setProjects(projData || []);
      setComplaints(compData || []);
    } catch (err) {
      console.error(err);
    }
  }

  const handleUpvote = async (id) => {
    setComplaints((prev) =>
      prev.map((c) => (c._id === id || c.id === id ? { ...c, upvotes: (c.upvotes || 0) + 1 } : c))
    );
    try {
      await upvoteComplaint(id);
    } catch (err) {
      console.warn('Sync delayed');
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGrievance = {
      id: `temp-${Date.now()}`,
      _id: `temp-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      ward: newWard,
      category: newCategory,
      upvotes: 0,
      status: 'Submitted',
      createdAt: new Date().toISOString()
    };

    // 1. Immediately prepend to state so it shows on screen
    setComplaints((prev) => [newGrievance, ...prev]);

    // 2. Clear form inputs
    setNewTitle('');
    setNewWard('');
    setNewCategory('Roads');
    setNewDesc('');

    // 3. Optional backend call (if you have an API wired)
    try {
      if (typeof createComplaint === 'function') {
        const saved = await createComplaint(newGrievance);
        if (saved) {
          setComplaints((prev) =>
            prev.map((c) => (c.id === newGrievance.id ? saved : c))
          );
        }
      }
    } catch (err) {
      console.error('Failed to sync complaint to server:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await officialLogin(officialEmail, officialPass);
      if (res && res.token) {
        setOfficialToken(res.token);
        setShowOfficialModal(false);
        alert('Authenticated.');
      }
    } catch (err) {
      alert('Invalid credentials. Use: admin@synccivic.gov');
    }
  };

  const rankedComplaints = [...complaints].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  const topGrievance = rankedComplaints[0] || {
    title: 'Unrepaired trench across bus lane causing traffic congestion',
    upvotes: 55,
    description: 'Severely impacting transit corridor. Unresolved past 72-hour SLA window.'
  };

  const tabs = ['Overview', 'Grievances', 'Live Works', 'Audits'];

  return (
    <div className="relative min-h-screen bg-[#faf5eb] text-amber-950 px-4 md:px-8 py-6 selection:bg-amber-300">
      <div className="pointer-events-none fixed -top-32 left-1/4 w-[500px] h-[500px] bg-amber-300/35 rounded-full blur-[140px]" />
      <div className="pointer-events-none fixed top-1/3 -right-20 w-[450px] h-[450px] bg-orange-300/30 rounded-full blur-[150px]" />

      <header className="relative z-10 max-w-7xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl light-glass-panel flex items-center justify-center text-amber-700 font-black text-xl border border-amber-300 shadow-sm">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-amber-950 leading-none">SyncCivic</h1>
            <p className="text-xs text-amber-700 font-mono mt-1">Ward 42 — Public Civic Ledger</p>
          </div>
        </div>

        <nav className="light-glass-dock rounded-full px-2 py-1.5 flex items-center gap-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                activeTab === tab ? 'bg-amber-500 text-white shadow-md' : 'text-amber-800/70 hover:text-amber-950'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setShowOfficialModal(true)}
          className="light-glass-dock rounded-full px-5 py-2 text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-2 border border-amber-300 transition-all hover:scale-105 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          {officialToken ? 'Dashboard Active' : 'Log in'}
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto">
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 light-glass-panel rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-amber-800 uppercase">Civic Telemetry</span>
                    <span className="text-xs font-mono text-orange-700 font-bold">Live Ward 42</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-5xl font-black tracking-tight text-amber-950">88.4%</span>
                    <span className="text-xs text-amber-700 font-medium">Efficiency</span>
                  </div>
                  <div className="mt-5 h-2.5 w-full bg-amber-200/50 rounded-full overflow-hidden flex p-0.5 border border-amber-300/40">
                    <div className="bg-amber-500 h-full rounded-full w-[50%]" />
                    <div className="bg-orange-500 h-full rounded-full w-[30%] ml-1" />
                    <div className="bg-yellow-400 h-full rounded-full w-[20%] ml-1" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <div className="light-glass-inset rounded-2xl p-2.5 text-center">
                    <span className="badge-gold text-[9px] font-extrabold px-1.5 py-0.5 rounded-full block mb-1">Resolved</span>
                    <span className="text-base font-black text-amber-950">24</span>
                  </div>
                  <div className="light-glass-inset rounded-2xl p-2.5 text-center">
                    <span className="badge-vermicelli text-[9px] font-extrabold px-1.5 py-0.5 rounded-full block mb-1">In Progress</span>
                    <span className="text-base font-black text-amber-950">9</span>
                  </div>
                  <div className="light-glass-inset rounded-2xl p-2.5 text-center">
                    <span className="badge-amber-tint text-[9px] font-extrabold px-1.5 py-0.5 rounded-full block mb-1">Escalated</span>
                    <span className="text-base font-black text-orange-900">5</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 light-glass-panel rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <span className="badge-vermicelli text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">#1 Priority Grievance</span>
                  <h2 className="mt-4 text-xl font-bold text-amber-950 leading-snug">{topGrievance.title}</h2>
                  <p className="mt-2 text-xs text-amber-800">{topGrievance.description}</p>
                </div>
                <div className="mt-6 pt-5 border-t border-amber-300/40 flex items-center justify-between">
                  <span className="text-xl font-black text-amber-950">▲ {topGrievance.upvotes || 0} votes</span>
                  <button
                    onClick={() => handleUpvote(topGrievance._id || topGrievance.id || 'c1')}
                    className="light-glass-inset px-4 py-2 rounded-xl text-xs font-bold text-amber-900 border border-amber-300 cursor-pointer"
                  >
                    ▲ Upvote
                  </button>
                </div>
              </div>

              <div className="lg:col-span-3 light-glass-panel rounded-3xl p-6 flex flex-col justify-between">
                <span className="text-xs font-bold tracking-wider text-amber-800 uppercase">Weekly Velocity</span>
                <span className="text-4xl font-black text-amber-950 mt-2">48.2 <span className="text-xs font-mono font-normal">hrs SLA</span></span>
                <div className="mt-4 h-28 flex items-end justify-between gap-1">
                  {[40, 60, 30, 80, 100, 50, 25].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className={`w-full rounded-full ${i === 4 ? 'bg-amber-500' : 'bg-amber-200/70'}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="light-glass-panel rounded-3xl p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-amber-950">Grievance Leaderboard</h3>
                <p className="text-xs text-amber-700">Check community ranking and public resolutions.</p>
              </div>
              <button onClick={() => setActiveTab('Grievances')} className="badge-vermicelli px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
                Go to Rankings ({rankedComplaints.length}) →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Grievances' && (
          <GrievanceRankings
            complaints={rankedComplaints}
            onUpvote={handleUpvote}
            onSubmitGrievance={handleCreateComplaint}
            formState={{
              newTitle, setNewTitle,
              newWard, setNewWard,
              newCategory, setNewCategory,
              newDesc, setNewDesc
            }}
          />
        )}

        {activeTab === 'Live Works' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div key={proj._id || proj.title} onClick={() => setSelectedProject(proj)} className="light-glass-panel rounded-3xl p-5 cursor-pointer">
                <span className="badge-gold text-[10px] font-bold px-2 py-0.5 rounded-full">{proj.status || 'Active'}</span>
                <h4 className="font-bold text-amber-950 text-sm mt-2">{proj.title}</h4>
                <p className="text-xs text-amber-800 mt-1 line-clamp-2">{proj.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Audits' && (
          <div className="space-y-4">
            {projects.map((proj) => (
              <div key={proj._id || proj.title} className="light-glass-panel rounded-3xl p-5">
                <h4 className="font-bold text-amber-950 text-sm">{proj.title}</h4>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {['Clearance', 'Structure', 'Utilities', 'Quality Audit'].map((s, idx) => (
                    <div key={s} className="text-center">
                      <div className={`w-6 h-6 rounded-full mx-auto text-xs font-bold flex items-center justify-center ${idx <= 2 ? 'badge-gold' : 'bg-amber-200'}`}>
                        {idx + 1}
                      </div>
                      <span className="text-[10px] text-amber-800">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedProject && (
        <div className="fixed inset-0 bg-amber-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="light-glass-panel rounded-3xl max-w-md w-full p-6 space-y-3">
            <h3 className="font-bold text-amber-950">{selectedProject.title}</h3>
            <p className="text-xs text-amber-800">{selectedProject.description}</p>
            <button onClick={() => setSelectedProject(null)} className="w-full light-glass-inset py-2 rounded-xl text-xs font-bold text-amber-900 border border-amber-300">
              Close
            </button>
          </div>
        </div>
      )}

      {showOfficialModal && (
        <div className="fixed inset-0 bg-amber-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="light-glass-panel rounded-3xl max-w-sm w-full p-6 space-y-3">
            <h3 className="font-bold text-amber-950 text-sm">Log in</h3>
            <form onSubmit={handleLogin} className="space-y-2">
              <input
                type="email"
                placeholder="Official Email"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                className="w-full bg-white/80 text-xs rounded-xl px-3 py-2 text-amber-950 border border-amber-300 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={officialPass}
                onChange={(e) => setOfficialPass(e.target.value)}
                className="w-full bg-white/80 text-xs rounded-xl px-3 py-2 text-amber-950 border border-amber-300 focus:outline-none"
              />
              <button type="submit" className="w-full badge-gold py-2 rounded-xl text-xs font-bold">
                Log in
              </button>
              <button type="button" onClick={() => setShowOfficialModal(false)} className="w-full text-xs text-amber-800">
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}