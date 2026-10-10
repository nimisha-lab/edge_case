import React, { useState } from 'react';
import { api } from '../../api/client';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const data = await api.login({ email: email.trim(), password: password.trim() });
      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || { email }));
      }
      onLoginSuccess(data.user || { email });
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid credentials. Check email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0E131F]/95 p-7 shadow-2xl backdrop-blur-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Municipal Official Access</h2>
            <p className="text-xs text-slate-400 mt-0.5">Non-Public Internal Portal (JWT Authentication)</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300">Official Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ae.ward12@synccivic.gov.in"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900/80 p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900/80 p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-emerald-500/60 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 transition"
            >
              {loading ? 'Authenticating via API...' : 'Log In to Official Portal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}