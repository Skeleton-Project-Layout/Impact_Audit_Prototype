import React, { useState, useEffect } from 'react';
import { SplashSequence } from './components/SplashSequence';
import { LoginScreen, UserSession } from './features/auth/LoginScreen';
import { BrandLogo } from './components/BrandLogo';
import { GeographyManagementScreen } from './features/geography/GeographyManagementScreen';
import { FacilityRegistryScreen } from './features/facilities/FacilityRegistryScreen';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [adminView, setAdminView] = useState<'overview' | 'geography' | 'facilities'>('overview');

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
      setAdminView('overview');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div onClick={() => setAdminView('overview')} style={{ cursor: 'pointer' }}>
            <BrandLogo size={34} showWordmark={true} />
          </div>

          {currentUser.role === 'ADMIN' && (
            <nav style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setAdminView('overview')}
                className="btn"
                style={{
                  background: adminView === 'overview' ? 'var(--surface-2)' : 'transparent',
                  color: adminView === 'overview' ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: adminView === 'overview' ? 600 : 500,
                  fontSize: '13px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Overview
              </button>

              <button
                type="button"
                onClick={() => setAdminView('geography')}
                className="btn"
                style={{
                  background: adminView === 'geography' ? 'var(--surface-2)' : 'transparent',
                  color: adminView === 'geography' ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: adminView === 'geography' ? 600 : 500,
                  fontSize: '13px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Geography Hierarchy
              </button>

              <button
                type="button"
                onClick={() => setAdminView('facilities')}
                className="btn"
                style={{
                  background: adminView === 'facilities' ? 'var(--surface-2)' : 'transparent',
                  color: adminView === 'facilities' ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: adminView === 'facilities' ? 600 : 500,
                  fontSize: '13px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Facility Registry
              </button>
            </nav>
          )}
        </div>

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
            {adminView === 'overview' && (
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>
                  Admin Home
                </h1>
                <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
                  Field audit coordination, pilot location registry, and scoring decision support.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700 }}>
                        🗺️
                      </div>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Geography Management</h2>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Jharkhand & 4 pilot districts</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', flex: 1 }}>
                      Inspect administrative hierarchy (Districts, Blocks, Panchayats), add new local blocks and Gram Panchayats.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAdminView('geography')}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Manage Geography
                    </button>
                  </div>

                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700 }}>
                        🏫
                      </div>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Facility Registry</h2>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Allocate permanent facility codes</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', flex: 1 }}>
                      Register Schools, Anganwadis, and Health Centres with deterministic, non-recyclable codes or bulk upload via CSV.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAdminView('facilities')}
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                    >
                      Open Facility Registry
                    </button>
                  </div>

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
                      Conduct multi-page field assessments with offline autosave and per-question evidence attachments.
                    </p>
                    <button type="button" className="btn btn-secondary" style={{ width: '100%' }}>
                      Launch Audit Workspace
                    </button>
                  </div>
                </div>
              </div>
            )}

            {adminView === 'geography' && <GeographyManagementScreen />}
            {adminView === 'facilities' && <FacilityRegistryScreen />}
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
