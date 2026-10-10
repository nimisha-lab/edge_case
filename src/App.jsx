import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import CitizenPortal from './components/CitizenPortal';
import OfficialDashboard from './components/OfficialDashboard'; // Your official/auth view
import Login from './components/Login';

const NavigationBar = () => {
  const location = useLocation();

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
      <div className="font-bold text-xl text-indigo-600 tracking-tight">SyncCivic</div>
      
      {/* Demo Switcher for Judges / Evaluators */}
      <nav className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-sm">
        <Link
          to="/"
          className={`px-3 py-1.5 rounded-md font-medium transition ${
            location.pathname === '/' || location.pathname === '/citizen'
              ? 'bg-white shadow text-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Citizen Portal
        </Link>
        <Link
          to="/official"
          className={`px-3 py-1.5 rounded-md font-medium transition ${
            location.pathname.startsWith('/official')
              ? 'bg-white shadow text-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Official Portal
        </Link>
      </nav>
    </header>
  );
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavigationBar />
        <main className="flex-1">
          <Routes>
            {/* Citizen Public Views */}
            <Route path="/" element={<CitizenPortal />} />
            <Route path="/citizen" element={<Navigate to="/" replace />} />

            {/* Official / Admin Views */}
            <Route path="/official/login" element={<Login />} />
            <Route path="/official" element={<OfficialDashboard />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
