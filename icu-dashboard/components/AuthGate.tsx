'use client';
import React, { useState, useEffect } from 'react';

const AUTH_KEY = 'microboard_auth_session_v1';
const VALID_PASSWORD = 'Spallanzani';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const isAuth = sessionStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(AUTH_KEY) === 'true';
    setIsAuthenticated(isAuth);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === VALID_PASSWORD) {
      setError(false);
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      setError(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setPassword('');
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          Caricamento...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3 text-2xl shadow-inner">
              🔒
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">MicroBoard TI</h1>
            <p className="text-xs text-slate-400 mt-1">Accesso riservato Reparto Terapia Intensiva</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password di Reparto
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Inserisci password..."
                autoFocus
                className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-white text-sm focus:outline-none focus:ring-2 transition ${
                  error
                    ? 'border-red-500 focus:ring-red-500/30'
                    : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
              {error && (
                <p className="text-xs text-red-400 mt-1.5 font-medium flex items-center gap-1">
                  <span>⚠️</span> Password errata. Riprova.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              Accedi alla Dashboard
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-500">
              Sincronizzazione Cloud Firebase in tempo reale attiva
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
};

export const logoutApp = () => {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  window.location.reload();
};
