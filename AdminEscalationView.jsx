import React, { useState, useEffect } from 'react';

export default function AdminEscalationView() {
  const [complaints, setComplaints] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('ae@city.gov');
  const [alertStatus, setAlertStatus] = useState('');

  const fetchComplaints = async (authToken) => {
    try {
      const res = await fetch('http://localhost:5000/api/complaints', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setComplaints(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (email) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: '123' })
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('token', data.token);
      fetchComplaints(data.token);
    }
  };

  const handleAction = async (id, action, nextLevel) => {
    await fetch(`http://localhost:5000/api/complaints/${id}/action`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action, nextLevel })
    });
    fetchComplaints(token);
  };

  const triggerWhatsAppAlert = async () => {
    const res = await fetch('http://localhost:5000/api/alerts/send-cutdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ward: 'Ward 12 (Tambaram/Kancheepuram)',
        cutdownType: 'Water Supply Shutdown',
        scheduledDate: 'Tomorrow, 10:00 AM - 4:00 PM',
        message: 'Main line pipe relocation due to metro road expansion.'
      })
    });
    const result = await res.json();
    setAlertStatus(`Alert Dispatched! [${result.mode}]`);
    setTimeout(() => setAlertStatus(''), 4000);
  };

  useEffect(() => {
    if (token) handleLogin('ae@city.gov');
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Quick Role Switcher */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-slate-900 text-white rounded-lg shadow-md">
        <div>
          <h1 className="text-xl font-bold">Authority Action & Escalation Console</h1>
          <p className="text-sm text-slate-400">
            Active User: <span className="text-emerald-400 font-semibold">{currentUser?.name || 'Not Logged In'}</span> 
            {currentUser?.level && ` (${currentUser.level.replace('_', ' ')})`}
          </p>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button onClick={() => handleLogin('inspector@city.gov')} className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded">Log as Inspector</button>
          <button onClick={() => handleLogin('ae@city.gov')} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded">Log as AE</button>
          <button onClick={() => handleLogin('ee@city.gov')} className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 rounded">Log as Exec Engineer</button>
        </div>
      </div>

      {/* WhatsApp Disruption Trigger Section */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-amber-900">Utility Cutdown Notification Engine</h2>
          <p className="text-xs text-amber-700">Dispatch instant broadcast to affected ward residents before major trenching/shutoffs.</p>
        </div>
        <div className="flex items-center gap-3">
          {alertStatus && <span className="text-xs font-semibold text-emerald-700">{alertStatus}</span>}
          <button onClick={triggerWhatsAppAlert} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded shadow transition">
            📲 Send WhatsApp Alert
          </button>
        </div>
      </div>

      {/* Hierarchical Complaints Table */}
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Escalated Civic Grievances</h2>
          <span className="text-xs text-slate-500">Auto-escalates based on upvotes & #FastTrack flags</span>
        </div>
        <div className="divide-y divide-slate-100">
          {complaints.map((item) => (
            <div key={item.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">#{item.id} - {item.title}</span>
                  {item.tags.map(t => (
                    <span key={t} className={`text-xs px-2 py-0.5 rounded font-medium ${t === '#FastTrack' ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-slate-100 text-slate-600'}`}>
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-slate-500">{item.location} • 👍 {item.upvotes} resident upvotes</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500">Escalated Authority:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    item.assignedLevel === 'EXECUTIVE_ENGINEER' ? 'bg-purple-100 text-purple-800' :
                    item.assignedLevel === 'ASSISTANT_ENGINEER' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.assignedLevel.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                {item.status !== 'RESOLVED' && (
                  <>
                    <button
                      onClick={() => handleAction(item.id, 'ESCALATE', 'EXECUTIVE_ENGINEER')}
                      className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100"
                    >
                      Escalate to EE
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'RESOLVE')}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      Mark Resolved
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}