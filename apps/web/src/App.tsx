import React, { useState, useEffect } from 'react';
import { SplashSequence } from './components/SplashSequence';
import { LoginScreen, UserSession } from './features/auth/LoginScreen';
import { BrandLogo } from './components/BrandLogo';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check if splash was already viewed in this browser session
    const seen = sessionStorage.getItem('abhisaran_splash_shown');
    if (seen === 'true') {
      setShowSplash(false);
    }

    // Check system color scheme
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
    }
  };

  if (showSplash) {
    return <SplashSequence onComplete={() => setShowSplash(false)} />;
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Universal Navigation Header */}
      <header
        style={{
          height: '56px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <BrandLogo size={34} showWordmark={true} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Logged in as <b>{currentUser.displayName}</b> ({currentUser.role})
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px' }}
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Role-Specific Workspace Shell */}
      <main style={{ flex: 1, padding: '32px 20px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {currentUser.mustChangePassword && (
          <div className="alert-banner alert-danger" style={{ marginBottom: '24px' }}>
            <span>⚠️ <b>Security Notice:</b> You are using a temporary bootstrap password. Please update your password immediately in Settings.</span>
          </div>
        )}

        {currentUser.role === 'ADMIN' ? (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>
              Admin Home
            </h1>
            <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
              Field audit coordination, pilot location registry, and scoring decision support.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700 }}>
                    📋
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Open Audit</h2>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Select pilot location & collect field evidence</span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--muted)', flex: 1 }}>
                  Conduct multi-page field assessments for schools, Anganwadis, and health facilities with offline autosave and per-question evidence attachments.
                </p>
                <button type="button" className="btn btn-primary" style={{ width: '100%' }}>
                  Launch Audit Workspace
                </button>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700 }}>
                    📊
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Open Dashboard</h2>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Analyze submissions & view ACS ledgers</span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--muted)', flex: 1 }}>
                  Execute deterministic scoring engine, review point deduction waterfalls, monitor district continuity, and supervise officer deliveries.
                </p>
                <button type="button" className="btn btn-secondary" style={{ width: '100%' }}>
                  View Decision Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>
              Government Officer Portal
            </h1>
            <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
              Jurisdiction ACS inbox and service continuity reports for assigned districts.
            </p>

            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>📥</div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>ACS Inbox</h2>
              <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: '480px', margin: '0 auto 24px' }}>
                Delivered institutional audit scores for your assigned district jurisdiction will appear here once analysed.
              </p>
              <div className="alert-banner" style={{ display: 'inline-flex', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                Zero PII Guarantee: All institutions are reported by non-identifying district codes.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
