import React, { useState, useEffect } from 'react';
import {
  fetchProjects,
  fetchComplaints,
  upvoteComplaint,
  fileComplaint,
  officialLogin,
  fetchEscalations
} from '../api/client';

function GrievanceFormAndList({
  complaints = [],
  onUpvote,
  onSubmitGrievance,
  formState
}) {
  const sorted = [...(complaints || [])].sort(
    (a, b) => (b.upvotes || 0) - (a.upvotes || 0)
  );

  const {
    newTitle = '',
    setNewTitle = () => {},
    newWard = 'Ward 42',
    setNewWard = () => {},
    newCategory = 'Roads',
    setNewCategory = () => {},
    newDesc = '',
    setNewDesc = () => {}
  } = formState || {};

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-amber-200/60 shadow-sm">
        <h3 className="text-lg font-bold text-amber-950 mb-1">
          File a Public Grievance
        </h3>
        <p className="text-xs text-amber-800 mb-4">
          Issues submitted are published to the citizen leaderboard and prioritized by community upvotes.
        </p>

        <form onSubmit={onSubmitGrievance} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Unrepaired trench across main bus corridor"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Ward
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ward 42"
                  value={newWard}
                  onChange={(e) => setNewWard(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Roads">Roads</option>
                  <option value="Water">Water</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Electricity">Electricity</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-900 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              required
              placeholder="Describe the problem, severity, and exact location markers..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
          >
            Submit Grievance
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-amber-950 uppercase tracking-wide">
          Ranked Grievances ({sorted.length})
        </h3>

        {sorted.length === 0 ? (
          <div className="p-6 text-center text-amber-800/70 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 text-sm">
            No grievances submitted yet. File the first one above!
          </div>
        ) : (
          sorted.map((item, index) => {
            const rank = index + 1;
            const itemId = item._id || item.id || `item-${index}`;

            return (
              <div
                key={itemId}
                className="flex items-start justify-between p-4 bg-white/90 border border-amber-100 rounded-2xl shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-extrabold shrink-0 ${
                      rank === 1
                        ? 'bg-amber-500 text-white shadow-sm'
                        : rank === 2
                        ? 'bg-amber-200 text-amber-900'
                        : rank === 3
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    #{rank}
                  </span>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wide">
                        {item.category || 'General'}
                      </span>
                      {item.ward && (
                        <span className="text-xs text-amber-700/80 font-medium">
                          Ward: {item.ward}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-amber-950 mt-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onUpvote && onUpvote(itemId)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 text-xs font-bold transition-colors shrink-0 ml-4 cursor-pointer"
                >
                  <span>▲</span>
                  <span>{item.upvotes || 0}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function CitizenPortal() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [projects, setProjects] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWard, setNewWard] = useState('Ward 42');
  const [newCategory, setNewCategory] = useState('Roads');

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projData, compData] = await Promise.all([
        fetchProjects(),
        fetchComplaints()
      ]);
      if (Array.isArray(projData)) setProjects(projData);
      if (Array.isArray(compData)) setComplaints(compData);
    } catch (err) {
      console.error('Failed to load data from backend:', err);
    }
  }

  const handleUpvote = async (complaintId) => {
    setComplaints((prev) =>
      prev.map((item) =>
        item._id === complaintId || item.id === complaintId
          ? { ...item, upvotes: (item.upvotes || 0) + 1 }
          : item
      )
    );

    try {
      await upvoteComplaint(complaintId);
    } catch (err) {
      console.warn('Upvote sync delayed or offline fallback used:', err);
    }
  };

  const handleSubmitGrievance = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newTitle.trim()) return;

    const payload = {
      title: newTitle.trim(),
      description: newDesc.trim() || 'No description provided.',
      ward: newWard.trim() || 'Ward 42',
      category: newCategory || 'Roads',
      upvotes: 0,
      status: 'Submitted'
    };

    try {
      const created = await fileComplaint(payload);
      const complaintWithId =
        created && (created._id || created.id)
          ? created
          : { ...payload, _id: `c-${Date.now()}` };

      setComplaints((prev) => [complaintWithId, ...prev]);
      setNewTitle('');
      setNewDesc('');
      alert('Grievance registered and saved to ledger!');
    } catch (err) {
      console.error('Error persisting grievance to backend:', err);
      setComplaints((prev) => [{ ...payload, _id: `c-${Date.now()}` }, ...prev]);
      setNewTitle('');
      setNewDesc('');
    }
  };

  const handleOfficialLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const auth = await officialLogin(loginEmail, loginPassword);
      if (auth && auth.token) {
        setAuthToken(auth.token);
        setIsLoginModalOpen(false);
        alert('Official session active.');
      } else {
        alert('Authentication failed.');
      }
    } catch {
      alert('Invalid official credentials.');
    }
  };

  const sortedComplaints = [...complaints].sort(
    (a, b) => (b.upvotes || 0) - (a.upvotes || 0)
  );
  const topComplaint = sortedComplaints[0] || {
    title: 'Unrepaired trench across bus lane causing traffic congestion',
    upvotes: 55,
    description: 'Severely impacting transit corridor. Unresolved past 72-hour SLA window.'
  };

  const navTabs = ['Overview', 'Grievances', 'Live Works', 'Audits'];

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
            <h1 className="text-xl font-bold tracking-tight text-amber-950 leading-none">
              SyncCivic
            </h1>
            <p className="text-xs text-amber-700 font-mono mt-1">
              Ward 42 — Public Civic Ledger
            </p>
          </div>
        </div>

        <nav className="light-glass-dock rounded-full px-2 py-1.5 flex items-center gap-1 shadow-sm">
          {navTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                activeTab === tab
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-amber-800/70 hover:text-amber-950'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setIsLoginModalOpen(true)}
          className="light-glass-dock rounded-full px-5 py-2 text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-2 border border-amber-300 transition-all hover:scale-105 shadow-sm cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          {authToken ? 'Dashboard Active' : 'Log in'}
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto">
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 light-glass-panel rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-amber-800 uppercase">
                      Civic Telemetry
                    </span>
                    <span className="text-xs font-mono text-orange-700 font-bold">
                      Live Ward 42
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-5xl font-black tracking-tight text-amber-950">
                      88.4%
                    </span>
                    <span className="text-xs text-amber-700 font-medium">
                      Efficiency
                    </span>
                  </div>
                  <div className="mt-5 h-2.5 w-full bg-amber-200/50 rounded-full overflow-hidden flex p-0.5 border border-amber-300/40">
                    <div className="bg-amber-500 h-full rounded-full w-[50%]" />
                    <div className="bg-orange-500 h-full rounded-full w-[30%] ml-1" />
                    <div className="bg-yellow-400 h-full rounded-full w-[20%] ml-1" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <div className="light-glass-inset rounded-2xl p-2.5 text-center">
                    <span className="badge-gold text-[9px] font-extrabold px-1.5 py-0.5 rounded-full block mb-1">
                      Resolved
                    </span>
                    <span className="text-base font-black text-amber-950">
                      24
                    </span>
                  </div>
                  <div className="light-glass-inset rounded-2xl p-2.5 text-center">
                    <span className="badge-vermicelli text-[9px] font-extrabold px-1.5 py-0.5 rounded-full block mb-1">
                      In Progress
                    </span>
                    <span className="text-base font-black text-amber-950">
                      9
                    </span>
                  </div>
                  <div className="light-glass-inset rounded-2xl p-2.5 text-center">
                    <span className="badge-amber-tint text-[9px] font-extrabold px-1.5 py-0.5 rounded-full block mb-1">
                      Escalated
                    </span>
                    <span className="text-base font-black text-orange-900">
                      5
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 light-glass-panel rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <span className="badge-vermicelli text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    #1 Priority Grievance
                  </span>
                  <h2 className="mt-4 text-xl font-bold text-amber-950 leading-snug">
                    {topComplaint.title}
                  </h2>
                  <p className="mt-2 text-xs text-amber-800">
                    {topComplaint.description}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-amber-300/40 flex items-center justify-between">
                  <span className="text-xl font-black text-amber-950">
                    ▲ {topComplaint.upvotes || 0} votes
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpvote(topComplaint._id || topComplaint.id || 'c1')}
                    className="light-glass-inset px-4 py-2 rounded-xl text-xs font-bold text-amber-900 border border-amber-300 cursor-pointer"
                  >
                    ▲ Upvote
                  </button>
                </div>
              </div>

              <div className="lg:col-span-3 light-glass-panel rounded-3xl p-6 flex flex-col justify-between">
                <span className="text-xs font-bold tracking-wider text-amber-800 uppercase">
                  Weekly Velocity
                </span>
                <span className="text-4xl font-black text-amber-950 mt-2">
                  48.2 <span className="text-xs font-mono font-normal">hrs SLA</span>
                </span>
                <div className="mt-4 h-28 flex items-end justify-between gap-1">
                  {[40, 60, 30, 80, 100, 50, 25].map((height, i) => (
                    <div
                      key={i}
                      style={{ height: `${height}%` }}
                      className={`w-full rounded-full ${
                        i === 4 ? 'bg-amber-500' : 'bg-amber-200/70'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="light-glass-panel rounded-3xl p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-amber-950">
                  Grievance Leaderboard
                </h3>
                <p className="text-xs text-amber-700">
                  Track community upvoting metrics and real-time public resolutions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('Grievances')}
                className="badge-vermicelli px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Go to Rankings ({sortedComplaints.length}) →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Grievances' && (
          <GrievanceFormAndList
            complaints={sortedComplaints}
            onUpvote={handleUpvote}
            onSubmitGrievance={handleSubmitGrievance}
            formState={{
              newTitle,
              setNewTitle,
              newWard,
              setNewWard,
              newCategory,
              setNewCategory,
              newDesc,
              setNewDesc
            }}
          />
        )}

        {activeTab === 'Live Works' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((item, index) => (
              <div
                key={item._id || item.id || index}
                onClick={() => setSelectedProject(item)}
                className="light-glass-panel rounded-3xl p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <span className="badge-gold text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.status || 'Active'}
                </span>
                <h4 className="font-bold text-amber-950 text-sm mt-2">
                  {item.title}
                </h4>
                <p className="text-xs text-amber-800 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Audits' && (
          <div className="space-y-4">
            {projects.map((item, index) => (
              <div
                key={item._id || item.id || index}
                className="light-glass-panel rounded-3xl p-5"
              >
                <h4 className="font-bold text-amber-950 text-sm">
                  {item.title}
                </h4>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {['Clearance', 'Structure', 'Utilities', 'Quality Audit'].map(
                    (stage, idx) => (
                      <div key={stage} className="text-center">
                        <div
                          className={`w-6 h-6 rounded-full mx-auto text-xs font-bold flex items-center justify-center ${
                            idx <= 2 ? 'badge-gold' : 'bg-amber-200'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-[10px] text-amber-800">
                          {stage}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedProject && (
        <div className="fixed inset-0 bg-amber-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="light-glass-panel rounded-3xl max-w-md w-full p-6 space-y-3">
            <h3 className="font-bold text-amber-950">
              {selectedProject.title}
            </h3>
            <p className="text-xs text-amber-800">
              {selectedProject.description}
            </p>
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="w-full light-glass-inset py-2 rounded-xl text-xs font-bold text-amber-900 border border-amber-300 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-amber-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="light-glass-panel rounded-3xl max-w-sm w-full p-6 space-y-3">
            <h3 className="font-bold text-amber-950 text-sm">
              Official Log in
            </h3>
            <form onSubmit={handleOfficialLogin} className="space-y-2">
              <input
                type="email"
                required
                placeholder="Official Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-white/80 text-xs rounded-xl px-3 py-2 text-amber-950 border border-amber-300 focus:outline-none"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-white/80 text-xs rounded-xl px-3 py-2 text-amber-950 border border-amber-300 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full badge-gold py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="w-full text-xs text-amber-800 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}