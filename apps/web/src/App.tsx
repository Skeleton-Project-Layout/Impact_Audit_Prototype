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

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [adminView, setAdminView] = useState<
    'overview' | 'geography' | 'facilities' | 'questions' | 'rubric-tester' | 'rubric-review' | 'audit' | 'analysis'
  >('overview');
  const [testerQuestionId, setTesterQuestionId] = useState<string | undefined>(undefined);
  const [auditLocationId, setAuditLocationId] = useState<string | undefined>(undefined);
  const [analysisLocationId, setAnalysisLocationId] = useState<string | undefined>(undefined);

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

  const isWideView = ['questions', 'rubric-tester', 'rubric-review', 'analysis'].includes(adminView);

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
            <nav style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setAdminView('overview')}
                className="btn"
                style={{
                  background: adminView === 'overview' ? 'var(--surface-2)' : 'transparent',
                  color: adminView === 'overview' ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: adminView === 'overview' ? 600 : 500,
                  fontSize: '13px',
                  padding: '6px 10px',
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
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Geography
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
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Facilities
              </button>

              <button
                type="button"
                onClick={() => setAdminView('questions')}
                className="btn"
                style={{
                  background: adminView === 'questions' ? 'var(--surface-2)' : 'transparent',
                  color: adminView === 'questions' ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: adminView === 'questions' ? 600 : 500,
                  fontSize: '13px',
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Question Bank
              </button>

              <button
                type="button"
                onClick={() => handleOpenRubricTester()}
                className="btn"
                style={{
                  background: adminView === 'rubric-tester' ? 'var(--surface-2)' : 'transparent',
                  color: adminView === 'rubric-tester' ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: adminView === 'rubric-tester' ? 600 : 500,
                  fontSize: '13px',
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ⚡ Rubric Sandbox
              </button>

              <button
                type="button"
                onClick={() => setAdminView('rubric-review')}
                className="btn"
                style={{
                  background: adminView === 'rubric-review' ? 'var(--surface-2)' : 'transparent',
                  color: adminView === 'rubric-review' ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: adminView === 'rubric-review' ? 600 : 500,
                  fontSize: '13px',
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🛡️ Rubric Review
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
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📋 Field Audit
              </button>

              <button
                type="button"
                onClick={() => setAdminView('analysis')}
                className="btn"
                style={{
                  background: adminView === 'analysis' ? 'var(--surface-2)' : 'transparent',
                  color: adminView === 'analysis' ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: adminView === 'analysis' ? 600 : 500,
                  fontSize: '13px',
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📊 Analysis
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
                      className="btn btn-secondary"
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
                        📚
                      </div>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Question Bank & Versioning</h2>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>72 Seeded Canonical Questions</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', flex: 1 }}>
                      Browse domain questions, inspect JSON schemas, review audit history, or bump questions to version N+1.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAdminView('questions')}
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                    >
                      Open Question Bank
                    </button>
                  </div>

                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700 }}>
                        ⚡
                      </div>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Rubric Sandbox</h2>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Deterministic Mathematical Engine</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', flex: 1 }}>
                      Live simulation for all 7 rubric types, alert spectrums (Red to Green), Section 9.5 clamping, and red flag rules.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenRubricTester()}
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                    >
                      Launch Rubric Sandbox
                    </button>
                  </div>

                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700 }}>
                        🛡️
                      </div>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Rubric Review & Governance</h2>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Section 8 Owner Review Sign-off</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', flex: 1 }}>
                      Approve pending rubrics in bulk or individually before audit campaigns launch into field deployment.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAdminView('rubric-review')}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Review & Approve Rubrics
                    </button>
                  </div>

                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700 }}>
                        📋
                      </div>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Field Audit Workspace</h2>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Phase 4 Campaign Deployment</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', flex: 1 }}>
                      Conduct multi-page field assessments with offline autosave, per-question evidence attachments, and ACS computation.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        setAuditLocationId(undefined);
                        setAdminView('audit');
                      }}
                    >
                      Open Field Audit Workspace
                    </button>
                  </div>

                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700 }}>
                        📊
                      </div>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Continuity Analysis & Ledger</h2>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Deterministic ACS Scoring Engine</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', flex: 1 }}>
                      Audit Continuity Score (ACS) evaluation, strict deduction waterfall balance assertion, provisional alerts, and rubric trails.
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                      onClick={() => setAdminView('analysis')}
                    >
                      Open Continuity Analysis
                    </button>
                  </div>
                </div>
              </div>
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
