import React, { useState } from 'react';
import CitizenPortal from './pages/CitizenPortal';
import LoginModal from './components/common/LoginModal';

export default function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {/* Top Banner */}
      <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-slate-900/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
            SC
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">SyncCivic</h1>
            <p className="text-[10px] text-amber-400/80">Citizen Portal & Transparency Hub</p>
          </div>
        </div>

        <div>
          {currentUser ? (
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full font-medium">
              Officer: {currentUser.email}
            </span>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl transition shadow-md cursor-pointer"
            >
              Officer Portal ➔
            </button>
          )}
        </div>
      </header>

      {/* Primary: YOUR Citizen Portal */}
      <main className="w-full">
        <CitizenPortal />
      </main>

      {/* Friend's Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}