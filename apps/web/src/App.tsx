import React, { useState, useEffect } from 'react';
import { SplashSequence } from './components/SplashSequence';
import { LoginScreen, UserSession } from './features/auth/LoginScreen';
import { BrandLogo } from './components/BrandLogo';
import { GeographyManagementScreen } from './features/geography/GeographyManagementScreen';
import { FacilityRegistryScreen } from './features/facilities/FacilityRegistryScreen';
import { QuestionBankScreen } from './features/questions/QuestionBankScreen';
import { RubricTesterScreen } from './features/questions/RubricTesterScreen';
import { RubricReviewScreen } from './features/questions/RubricReviewScreen';
import { FieldAuditWorkspace } from './features/audit/FieldAuditWorkspace';
import { AnalysisDetailsView } from './features/scoring/AnalysisDetailsView';
import { OfficerInboxScreen } from './features/officers/OfficerInboxScreen';
import { OfficerManagementScreen } from './features/officers/OfficerManagementScreen';
import { DashboardOverviewScreen } from './features/dashboard/DashboardOverviewScreen';
import { AuditLogScreen } from './features/auditlog/AuditLogScreen';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [adminView, setAdminView] = useState<
    'overview' | 'dashboard' | 'geography' | 'facilities' | 'questions' | 'rubric-tester' | 'rubric-review' | 'audit' | 'analysis' | 'officers' | 'audit-log'
  >('overview');
  const [testerQuestionId, setTesterQuestionId] = useState<string | undefined>(undefined);
  const [showAdminTools, setShowAdminTools] = useState<boolean>(false);
  const [auditLocationId, setAuditLocationId] = useState<string | undefined>(undefined);
  const [analysisLocationId, setAnalysisLocationId] = useState<string | undefined>(undefined);
  const [officerView, setOfficerView] = useState<'inbox' | 'analysis'>('inbox');
  const [officerRunId, setOfficerRunId] = useState<string | undefined>(undefined);
  const [officerLocationCode, setOfficerLocationCode] = useState<string | undefined>(undefined);

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

  const handleOpenRubricTester = (questionId?: string) => {
    setTesterQuestionId(questionId);
    setAdminView('rubric-tester');
  };

  if (showSplash) {
    return <SplashSequence onComplete={() => setShowSplash(false)} />;
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  if (adminView === 'audit') {
    return (
      <FieldAuditWorkspace
        initialLocationId={auditLocationId}
        onBackToOverview={() => setAdminView('overview')}
        onViewAnalysis={(locId) => {
          setAnalysisLocationId(locId);
          setAdminView('analysis');
        }}
      />
    );
  }

  const isWideView = ['dashboard', 'questions', 'rubric-tester', 'rubric-review', 'analysis', 'officers', 'audit-log'].includes(adminView) || (currentUser?.role === 'OFFICER');

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div onClick={() => setAdminView('overview')} style={{ cursor: 'pointer' }}>
            <BrandLogo size={34} showWordmark={true} />
          </div>

          {currentUser.role === 'ADMIN' && (
            <nav style={{ display: 'flex', gap: '6px', alignItems: 'center', position: 'relative' }}>
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
                🏠 Home
              </button>

              <button
                type="button"
                onClick={() => setAdminView('dashboard')}
                className="btn"
                style={{
                  background: adminView === 'dashboard' ? 'var(--surface-2)' : 'transparent',
                  color: adminView === 'dashboard' ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: adminView === 'dashboard' ? 600 : 500,
                  fontSize: '13px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📊 Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuditLocationId(undefined);
                  setAdminView('audit');
                }}
                className="btn"
                style={{
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontWeight: 500,
                  fontSize: '13px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📋 Field Audit
              </button>

              {/* Secondary Admin Tools Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowAdminTools(!showAdminTools)}
                  className="btn"
                  style={{
                    background: ['geography', 'facilities', 'questions', 'rubric-tester', 'rubric-review', 'officers', 'audit-log'].includes(adminView) ? 'var(--surface-2)' : 'transparent',
                    color: ['geography', 'facilities', 'questions', 'rubric-tester', 'rubric-review', 'officers', 'audit-log'].includes(adminView) ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: 500,
                    fontSize: '13px',
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⚙️ Admin Tools ▾
                </button>

                {showAdminTools && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: '10px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                      minWidth: '220px',
                      zIndex: 100,
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                    onMouseLeave={() => setShowAdminTools(false)}
                  >
                    <button
                      type="button"
                      onClick={() => { setAdminView('geography'); setShowAdminTools(false); }}
                      style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ink)' }}
                    >
                      🗺️ Geography Management
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdminView('facilities'); setShowAdminTools(false); }}
                      style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ink)' }}
                    >
                      🏫 Facility Registry
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdminView('questions'); setShowAdminTools(false); }}
                      style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ink)' }}
                    >
                      📚 Question Bank & Versioning
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleOpenRubricTester(); setShowAdminTools(false); }}
                      style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ink)' }}
                    >
                      ⚡ Rubric Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdminView('rubric-review'); setShowAdminTools(false); }}
                      style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ink)' }}
                    >
                      🛡️ Rubric Review & Governance
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdminView('analysis'); setShowAdminTools(false); }}
                      style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ink)' }}
                    >
                      📊 Continuity Analysis & Ledger
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdminView('officers'); setShowAdminTools(false); }}
                      style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ink)' }}
                    >
                      🏛️ District Officers
                    </button>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '4px 0' }} />
                    <button
                      type="button"
                      onClick={() => { setAdminView('audit-log'); setShowAdminTools(false); }}
                      style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ink)' }}
                    >
                      🛡️ Security Audit Log
                    </button>
                  </div>
                )}
              </div>
            </nav>
          )}

          {currentUser.role === 'OFFICER' && (
            <nav style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setOfficerView('inbox')}
                className="btn"
                style={{
                  background: officerView === 'inbox' ? 'var(--surface-2)' : 'transparent',
                  color: officerView === 'inbox' ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: officerView === 'inbox' ? 600 : 500,
                  fontSize: '13px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📥 ACS Inbox
              </button>
              {officerView === 'analysis' && (
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: 'var(--surface-2)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '13px',
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'default'
                  }}
                >
                  📊 Scoped Report ({officerLocationCode || 'Breakdown'})
                </button>
              )}
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
      <main
        style={{
          flex: 1,
          padding: '28px 20px',
          maxWidth: isWideView ? '1280px' : '1000px',
          margin: '0 auto',
          width: '100%',
          transition: 'max-width 0.2s ease'
        }}
      >
        {currentUser.mustChangePassword && (
          <div className="alert-banner alert-danger" style={{ marginBottom: '24px' }}>
            <span>⚠️ <b>Security Notice:</b> You are using a temporary bootstrap password. Please update your password immediately in Settings.</span>
          </div>
        )}

        {currentUser.role === 'ADMIN' ? (
          <div>
            {adminView === 'overview' && (
              <div>
                <div style={{ marginBottom: '28px', textAlign: 'center' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--ink)' }}>
                    ABHISARAN Command Portal
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '640px', margin: '0 auto' }}>
                    Standardized village baseline assessments, deterministic continuity scoring, and real-time pilot monitoring.
                  </p>
                </div>

                {/* EXACTLY TWO PRIMARY CARDS ON ADMIN HOME */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px', maxWidth: '960px', margin: '0 auto' }}>
                  {/* Card 1: Open Field Audit Form */}
                  <div
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '36px 30px',
                      borderRadius: '16px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(135deg, #0b6b5c, #10b981)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                        📋
                      </div>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>Field Audit Form</h2>
                        <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>Village Baseline &amp; Impact Assessment</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.6', flex: 1, marginBottom: '24px' }}>
                      Conduct standardized field assessments with all 67 questions across 7 domain sections (Village Profile, School, Anganwadi, PHC, Community, Physical Verification, Summary). Features offline autosave, multi-page record tabs, instant question search, and certified PDF downloads.
                    </p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                      <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                        ✓ 67 Standardized Questions
                      </span>
                      <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                        ✓ Offline Autosave
                      </span>
                      <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                        ✓ A4 PDF Generation
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        fontSize: '15px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #0b6b5c, #10b981)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(11, 107, 92, 0.25)'
                      }}
                      onClick={() => {
                        setAuditLocationId(undefined);
                        setAdminView('audit');
                      }}
                    >
                      Open Field Audit Form &rarr;
                    </button>
                  </div>

                  {/* Card 2: View Dashboard */}
                  <div
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '36px 30px',
                      borderRadius: '16px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                        📊
                      </div>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>Executive Dashboard</h2>
                        <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>Pilot Facilities &amp; Continuity Monitoring</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.6', flex: 1, marginBottom: '24px' }}>
                      Inspect pilot location cards across East Khasi Hills and Jharkhand. Monitor deterministic Audit Continuity Scores (ACS), alert bands (Green, Amber, Red), identify critical operational red flags, and run automated scoring analysis.
                    </p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                      <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                        ✓ Pilot Location Cards
                      </span>
                      <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                        ✓ ACS Score Spectrum
                      </span>
                      <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                        ✓ Bulk Evaluation Engine
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn"
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        fontSize: '15px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                      }}
                      onClick={() => setAdminView('dashboard')}
                    >
                      View Dashboard &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {adminView === 'dashboard' && (
              <DashboardOverviewScreen
                onViewAnalysis={(locId, _runId) => {
                  setAnalysisLocationId(locId);
                  setAdminView('analysis');
                }}
                onGoToAudit={(locId) => {
                  setAuditLocationId(locId);
                  setAdminView('audit');
                }}
              />
            )}
            {adminView === 'geography' && <GeographyManagementScreen />}
            {adminView === 'facilities' && (
              <FacilityRegistryScreen
                onAuditFacility={(locId) => {
                  setAuditLocationId(locId);
                  setAdminView('audit');
                }}
                onViewAnalysis={(locId) => {
                  setAnalysisLocationId(locId);
                  setAdminView('analysis');
                }}
              />
            )}
            {adminView === 'questions' && (
              <QuestionBankScreen onOpenRubricTester={handleOpenRubricTester} />
            )}
            {adminView === 'rubric-tester' && (
              <RubricTesterScreen
                initialQuestionId={testerQuestionId}
                onBackToBank={() => setAdminView('questions')}
              />
            )}
            {adminView === 'rubric-review' && (
              <RubricReviewScreen onOpenRubricTester={handleOpenRubricTester} />
            )}
            {adminView === 'analysis' && (
              <AnalysisDetailsView
                locationId={analysisLocationId || ''}
                onBack={() => setAdminView('facilities')}
                onGoToAudit={(locId) => {
                  setAuditLocationId(locId);
                  setAdminView('audit');
                }}
              />
            )}
            {adminView === 'officers' && <OfficerManagementScreen />}
            {adminView === 'audit-log' && <AuditLogScreen />}
          </div>
        ) : (
          <div>
            {officerView === 'analysis' && officerRunId ? (
              <AnalysisDetailsView
                runId={officerRunId}
                isOfficerView={true}
                onBack={() => setOfficerView('inbox')}
              />
            ) : (
              <OfficerInboxScreen
                onViewAnalysis={(runId, locationCode) => {
                  setOfficerRunId(runId);
                  setOfficerLocationCode(locationCode);
                  setOfficerView('analysis');
                }}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
