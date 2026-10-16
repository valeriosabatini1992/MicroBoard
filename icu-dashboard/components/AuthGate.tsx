'use client';
import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

const AUTH_KEY = 'microboard_auth_session_v1';
const VALID_PASSWORD = 'Spallanzani';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const isAuth = sessionStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(AUTH_KEY) === 'true';
    setIsAuthenticated(isAuth);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (password === VALID_PASSWORD) {
      setError(false);
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      setError(true);
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-content">
          <div className="auth-spinner" />
          <span>Verifica autorizzazione in corso...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-page">
        {/* Subtle decorative background lights */}
        <div className="auth-bg-glow glow-1" />
        <div className="auth-bg-glow glow-2" />

        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon-badge">
              <ShieldCheck size={28} />
            </div>
            <div className="auth-brand">
              <span className="auth-hospital-tag">INMI Lazzaro Spallanzani</span>
              <h1 className="auth-title">MicroBoard TI</h1>
              <p className="auth-subtitle">Sorveglianza Microbiologica & Isolamenti Terapia Intensiva</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="auth-pwd" className="auth-label">
                Password di Reparto
              </label>
              <div className={`auth-input-wrap ${error ? 'has-error' : ''}`}>
                <Lock className="auth-input-icon" size={17} />
                <input
                  id="auth-pwd"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Inserisci la password..."
                  autoFocus
                  required
                  className="auth-input"
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Nascondi password' : 'Mostra password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <div className="auth-error-msg" role="alert">
                  <span>⚠️</span> Password errata. Riprova.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!password || isSubmitting}
              className="auth-submit-btn"
            >
              <span>Accedi alla Dashboard</span>
              <ArrowRight size={17} className="auth-btn-arrow" />
            </button>
          </form>

          {/* Footer cloud sync status */}
          <div className="auth-footer">
            <div className="auth-status-pill">
              <span className="auth-status-dot" />
              <span>Sincronizzazione Cloud Firebase in tempo reale</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const logoutApp = () => {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  window.location.reload();
};
