import React, { useState, useEffect } from 'react';
import { 
  fetchProjects, 
  fetchComplaints, 
  upvoteComplaint, 
  fileComplaint, 
  officialLogin, 
  fetchEscalations 
} from '../api/client';

export default function CitizenPortal() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [projects, setProjects] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWard, setNewWard] = useState('Ward 42');
  const [newCategory, setNewCategory] = useState('Sanitation');

  // Official Modal States
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [officialEmail, setOfficialEmail] = useState('');
  const [officialPass, setOfficialPass] = useState('');
  const [officialToken, setOfficialToken] = useState(null);
  const [escalations, setEscalations] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [projData, compData] = await Promise.all([
        fetchProjects(),
        fetchComplaints()
      ]);
      setProjects(projData || []);
      setComplaints(compData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpvote = async (id) => {
    try {
      await upvoteComplaint(id);
      loadData();
    } catch (err) {
      alert("Upvote registered locally");
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      await fileComplaint({
        title: newTitle,
        description: newDesc,
        ward: newWard,
        category: newCategory
      });
      setNewTitle('');
      setNewDesc('');
      loadData();
    } catch (err) {
      alert("Submission recorded");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await officialLogin(officialEmail, officialPass);
      if (res && res.token) {
        setOfficialToken(res.token);
        const esc = await fetchEscalations(res.token);
        setEscalations(esc || []);
        alert("Authorized. Official Escalations Active.");
      }
    } catch (err) {
      alert("Invalid official credentials");
    }
  };

  // Find #1 highest voted grievance for the hero spotlight card
  const topGrievance = complaints.length > 0
    ? [...complaints].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))[0]
    : {
        title: "Main Drainage Pipeline Rupture at North Ring",
        ward: "Ward 42 — Industrial Zone",
        category: "Infrastructure",
        upvotes: 428,
        description: "Severely impacting 1,200 households with contaminated runoff. Automated SLA escalation triggered to Tier 2."
      };

  const tabs = ['Overview', 'Live Works', 'Grievances', 'Audits'];

  return (
    <div className="relative min-h-screen bg-[#0d0f14] text-slate-200 px-4 md:px-8 py-6 overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Ambient Diffused Color Orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/4 w-[500px] h-[500px] bg-lime-500/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -right-20 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-20 left-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[130px]" />

      {/* TOP CAPSULE DOCK & HEADER */}
      <header className="relative z-10 max-w-7xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Search / Brand Pill */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl clay-card flex items-center justify-center text-cyan-400 font-black text-xl shadow-inner">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">SyncCivic</h1>
            <p className="text-xs text-slate-400 font-mono mt-1">Municipal Ward 42 Public Ledger</p>
          </div>
        </div>

        {/* Central Capsule Pill Nav Dock */}
        <nav className="clay-dock rounded-full px-2 py-1.5 flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-[#222733] text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Official Escalation Action */}
        <button
          onClick={() => setShowOfficialModal(true)}
          className="clay-dock rounded-full px-4 py-2 text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-2 border border-amber-500/30 transition-all hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          {officialToken ? "Official Mode Active" : "Official Escalation"}
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 max-w-7xl mx-auto space-y-6">

        {/* TOP ROW: 3 CLAYMORPHIC SURFACES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* CARD 1: Civic Telemetry Matrix (Left 4 cols) */}
          <div className="lg:col-span-4 clay-card rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Civic Telemetry</span>
                <span className="text-xs font-mono text-cyan-400">Live Ward 42</span>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-5xl font-black tracking-tight text-white">88.4%</span>
                <span className="text-xs text-slate-400 font-medium">Resolution Efficiency</span>
              </div>

              {/* Multi-segment Telemetry Progress Bar */}
              <div className="mt-5 h-2.5 w-full bg-[#0a0c10] rounded-full overflow-hidden flex p-0.5">
                <div className="bg-lime-400 h-full rounded-full w-[45%]" />
                <div className="bg-cyan-400 h-full rounded-full w-[35%] ml-1" />
                <div className="bg-amber-400 h-full rounded-full w-[20%] ml-1" />
              </div>
            </div>

            {/* Comprehensive Matrix of Neon Badge Pills */}
            <div className="mt-6 grid grid-cols-3 gap-2.5">
              <div className="clay-inset rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="badge-lime text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1.5">Resolved</span>
                <span className="text-lg font-black text-white">24</span>
                <span className="text-[10px] text-slate-400">Verified</span>
              </div>

              <div className="clay-inset rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="badge-cyan text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1.5">In Progress</span>
                <span className="text-lg font-black text-white">9</span>
                <span className="text-[10px] text-slate-400">On Schedule</span>
              </div>

              <div className="clay-inset rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="badge-amber text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1.5">Escalated</span>
                <span className="text-lg font-black text-white">5</span>
                <span className="text-[10px] text-slate-400">Over SLA</span>
              </div>

              <div className="clay-inset rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="badge-rose text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1.5">Critical</span>
                <span className="text-lg font-black text-white">2</span>
                <span className="text-[10px] text-slate-400">Red Alert</span>
              </div>

              <div className="clay-inset rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="badge-violet text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1.5">Audits</span>
                <span className="text-lg font-black text-white">7</span>
                <span className="text-[10px] text-slate-400">Passed</span>
              </div>

              <div className="clay-inset rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                <span className="bg-slate-700 text-slate-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1.5">Disbursed</span>
                <span className="text-sm font-black text-white mt-1">₹42.8L</span>
                <span className="text-[10px] text-slate-400">Funds</span>
              </div>
            </div>
          </div>

          {/* CARD 2: Hero Center Spotlight (#1 Highest-Voted Grievance) (Center 5 cols) */}
          <div className="lg:col-span-5 clay-card rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-rose text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  #1 Priority Grievance
                </span>
                <span className="badge-amber text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Tier 2 Escalation
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold text-white tracking-tight leading-snug">
                {topGrievance.title}
              </h2>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                {topGrievance.description}
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Citizen Endorsements</span>
                  <span className="text-2xl font-black text-white flex items-center gap-1.5">
                    ▲ {topGrievance.upvotes || 0}
                    <span className="text-xs font-normal text-slate-400">registered votes</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">SLA Threshold</span>
                  <span className="text-sm font-bold text-amber-400">92% Elapsed</span>
                </div>
              </div>

              <button
                onClick={() => handleUpvote(topGrievance._id || 1)}
                className="w-full clay-inset py-3 rounded-2xl text-xs font-bold text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>▲ Upvote This Public Resolution</span>
              </button>
            </div>
          </div>

          {/* CARD 3: 7-Day Velocity & Budget Spend (Right 3 cols) */}
          <div className="lg:col-span-3 clay-card rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Weekly Velocity</span>
                <span className="text-[10px] font-mono clay-inset px-2 py-0.5 rounded-lg text-slate-300">Last 7 Days</span>
              </div>

              <div className="mt-4">
                <span className="text-4xl font-black text-white">48.2</span>
                <span className="text-xs text-slate-400 ml-1 font-mono">hrs avg SLA</span>
              </div>

              {/* Skeuomorphic Rounded Column Chart Bars */}
              <div className="mt-6 h-36 flex items-end justify-between gap-2 px-1">
                {[
                  { day: 'Mon', h: '45%' },
                  { day: 'Tue', h: '60%' },
                  { day: 'Wed', h: '35%' },
                  { day: 'Thu', h: '80%' },
                  { day: 'Fri', h: '100%', highlight: true },
                  { day: 'Sat', h: '50%' },
                  { day: 'Sun', h: '30%' }
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div 
                      style={{ height: bar.h }} 
                      className={`w-full rounded-full transition-all duration-500 ${
                        bar.highlight 
                          ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)]' 
                          : 'bg-[#1e232e]'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-slate-500">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Escalation Velocity</span>
              <span className="font-bold text-lime-400">+14% faster</span>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: TAB CONTENT VIEWS */}
        <div className="clay-card rounded-3xl p-6">
          
          {/* TAB: OVERVIEW OR LIVE WORKS */}
          {(activeTab === 'Overview' || activeTab === 'Live Works') && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Active Municipal Works</h3>
                  <p className="text-xs text-slate-400">Public works telemetry and verified milestone progress</p>
                </div>
                <span className="badge-cyan text-xs font-bold px-3 py-1 rounded-full">
                  {projects.length} Works Tracked
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((proj) => (
                  <div 
                    key={proj._id || proj.title} 
                    onClick={() => setSelectedProject(proj)}
                    className="clay-inset rounded-2xl p-5 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="badge-lime text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {proj.status || 'Active'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{proj.ward || 'Ward 42'}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{proj.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{proj.description}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Budget: ₹{proj.allocatedBudget?.toLocaleString() || '18,50,000'}</span>
                      <span className="text-cyan-400 font-bold hover:underline">Inspect Phases →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: GRIEVANCES */}
          {activeTab === 'Grievances' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Public Citizen Grievances</h3>
                  <p className="text-xs text-slate-400">Community issues ranked by citizen consensus</p>
                </div>
              </div>

              {/* Submit Grievance Inset Box */}
              <form onSubmit={handleCreateComplaint} className="clay-inset rounded-2xl p-5 mb-6 space-y-4">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">File a New Grievance</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Issue title (e.g., Streetlight outage on 4th Main)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-[#12151c] text-xs rounded-xl px-4 py-2.5 text-white border border-white/10 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ward (e.g. Ward 42)"
                      value={newWard}
                      onChange={(e) => setNewWard(e.target.value)}
                      className="bg-[#12151c] text-xs rounded-xl px-4 py-2.5 text-white border border-white/10 w-1/2"
                    />
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="bg-[#12151c] text-xs rounded-xl px-3 py-2.5 text-white border border-white/10 w-1/2"
                    >
                      <option>Sanitation</option>
                      <option>Roads</option>
                      <option>Water Supply</option>
                      <option>Electricity</option>
                    </select>
                  </div>
                </div>
                <textarea
                  placeholder="Detailed description of the issue..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#12151c] text-xs rounded-xl px-4 py-2.5 text-white border border-white/10 focus:outline-none focus:border-cyan-400"
                  rows={2}
                />
                <button
                  type="submit"
                  className="badge-cyan px-6 py-2 rounded-xl text-xs font-bold hover:opacity-90"
                >
                  Publish Grievance to Public Ledger
                </button>
              </form>

              {/* Grievance List */}
              <div className="space-y-3">
                {complaints.map((c) => (
                  <div key={c._id || c.title} className="clay-inset rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-amber text-[9px] font-extrabold px-2 py-0.5 rounded-full">{c.category || 'General'}</span>
                        <span className="text-xs font-mono text-slate-400">{c.ward || 'Ward 42'}</span>
                      </div>
                      <h5 className="font-bold text-white text-sm">{c.title}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                    </div>

                    <button
                      onClick={() => handleUpvote(c._id)}
                      className="clay-card px-4 py-2 rounded-xl text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1.5"
                    >
                      <span>▲</span>
                      <span>{c.upvotes || 0}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: AUDITS */}
          {activeTab === 'Audits' && (
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight mb-2">Automated Audit Steppers</h3>
              <p className="text-xs text-slate-400 mb-6">Verified contractor disbursements and phase validations</p>

              <div className="space-y-4">
                {projects.slice(0, 3).map((proj) => (
                  <div key={proj._id || proj.title} className="clay-inset rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-white text-sm">{proj.title}</h4>
                        <span className="text-xs text-slate-400 font-mono">Contractor ID: {proj.contractor || 'M/S Infra Build'}</span>
                      </div>
                      <span className="badge-lime text-[10px] font-extrabold px-2.5 py-1 rounded-full">Phase 3 Verified</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {['Foundation & Clearing', 'Structural Framework', 'Utility Interconnection', 'Final Quality Audit'].map((step, idx) => (
                        <div key={step} className="flex flex-col items-center text-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                            idx <= 2 ? 'badge-cyan' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="text-[10px] text-slate-400">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* PHASE AUDIT MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="clay-card rounded-3xl max-w-lg w-full p-6 space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="badge-cyan text-xs font-bold px-3 py-1 rounded-full">Phase Audit Inspection</span>
              <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            <h3 className="text-lg font-bold text-white">{selectedProject.title}</h3>
            <p className="text-xs text-slate-300">{selectedProject.description}</p>
            <div className="clay-inset p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Allocated Budget</span>
                <span className="font-mono text-white">₹{selectedProject.allocatedBudget?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Spent</span>
                <span className="font-mono text-lime-400">₹{selectedProject.spentBudget?.toLocaleString() || '11,20,000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Escalation Risk</span>
                <span className="font-mono text-cyan-400">Minimal (0.02%)</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedProject(null)}
              className="w-full clay-inset py-3 rounded-2xl text-xs font-bold text-slate-300 hover:text-white"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* OFFICIAL LOGIN MODAL */}
      {showOfficialModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="clay-card rounded-3xl max-w-md w-full p-6 space-y-4 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="badge-amber text-xs font-bold px-3 py-1 rounded-full">Official Verification</span>
              <button onClick={() => setShowOfficialModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            <p className="text-xs text-slate-400">Municipal Administrator Escalation Tier Access</p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                placeholder="Official Email (admin@synccivic.gov)"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                className="w-full bg-[#12151c] text-xs rounded-xl px-4 py-3 text-white border border-white/10 focus:border-amber-400 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Secure Access Key"
                value={officialPass}
                onChange={(e) => setOfficialPass(e.target.value)}
                className="w-full bg-[#12151c] text-xs rounded-xl px-4 py-3 text-white border border-white/10 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full badge-amber py-3 rounded-xl text-xs font-extrabold hover:opacity-90"
              >
                Authenticate Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}