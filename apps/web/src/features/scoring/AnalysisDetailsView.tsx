import React, { useState, useEffect } from 'react';
import './analysisDetails.css';

export interface AnalysisItemDTO {
  id: string;
  questionId: string;
  questionVersionId: string;
  questionText: string;
  pageNumber: number;
  severity: string;
  weight: number;
  rawEarnedPoints: number | null;
  rawMaxPoints: number | null;
  weightedEarnedPoints: number | null;
  weightedMaxPoints: number | null;
  isNa: boolean;
  isNotAssessed: boolean;
  isRedFlag: boolean;
  alertBand: string | null;
  clampedRed: boolean;
  workingNotes: string | null;
  suggestedIntervention: string | null;
}

export interface DeductionLedgerDTO {
  id: string;
  questionId: string;
  pageNumber: number;
  questionText: string;
  severity: string;
  weight: number;
  lostWeightedPoints: number;
  deductionPercentage: number;
  lossExplanation: string;
  suggestedIntervention: string | null;
}

export interface SectionScoreDTO {
  section: string;
  earnedWeightedPoints: number;
  maxWeightedPoints: number;
  scorePercentage: number;
  alertBand: string;
  questionCount: number;
}

export interface AnalysisRunDTO {
  id: string;
  pilotLocationId: string;
  facilityCode: string;
  submissionId: string | null;
  runNumber: number;
  acsScore: number | null;
  alertBand: string | null;
  isProvisional: boolean;
  coveragePct: number;
  totalApplicableQuestions: number;
  totalAssessedQuestions: number;
  totalMaxWeightedPoints: number;
  totalEarnedWeightedPoints: number;
  totalDeductionsWeightedPoints: number;
  triggeredRedFlagsCount: number;
  runByUserId: string | null;
  runByUsername: string | null;
  analyzedAt: string;
  status: string;
  ledgerSum: number;
  isLedgerBalanced: boolean;
  items: AnalysisItemDTO[];
  ledger: DeductionLedgerDTO[];
  sections: SectionScoreDTO[];
}

interface AnalysisDetailsViewProps {
  locationId?: string;
  runId?: string;
  isOfficerView?: boolean;
  onBack: () => void;
  onGoToAudit?: (locationId: string) => void;
}

export const AnalysisDetailsView: React.FC<AnalysisDetailsViewProps> = ({
  locationId,
  runId,
  isOfficerView = false,
  onBack,
  onGoToAudit
}) => {
  const [analysis, setAnalysis] = useState<AnalysisRunDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reanalysing, setReanalysing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ledger' | 'redflags' | 'sections' | 'items'>('ledger');

  useEffect(() => {
    if ((isOfficerView && runId) || locationId) {
      loadAnalysis();
    } else {
      setLoading(false);
    }
  }, [locationId, runId, isOfficerView]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      let res: Response;

      if (isOfficerView && runId) {
        res = await fetch(`/api/v1/me/results/${runId}`);
      } else if (locationId) {
        res = await fetch(`/api/v1/locations/${locationId}/analysis/latest`);
      } else {
        setLoading(false);
        return;
      }

      if (res.status === 204) {
        if (!isOfficerView && locationId) {
          // No analysis run yet; auto-trigger first analysis
          await handleTriggerAnalysis();
          return;
        } else {
          throw new Error('No analysis data exists for this run.');
        }
      }

      if (!res.ok) {
        throw new Error(`Failed to load analysis: ${res.statusText}`);
      }

      const data: AnalysisRunDTO = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve analysis details');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAnalysis = async () => {
    if (!locationId || isOfficerView) return;
    try {
      setReanalysing(true);
      setError(null);
      const res = await fetch(`/api/v1/locations/${locationId}/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Analysis execution failed: ${res.statusText}`);
      }

      const data: AnalysisRunDTO = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger location analysis');
    } finally {
      setReanalysing(false);
      setLoading(false);
    }
  };

  const getBandLabel = (band: string | null) => {
    switch (band) {
      case 'DARK_GREEN':
        return 'All good';
      case 'LIGHT_GREEN':
        return 'Good — a few things are off';
      case 'AMBER':
        return 'Needs improvement';
      case 'ORANGE':
        return 'Critical gaps';
      case 'RED':
        return 'Needs immediate attention';
      default:
        return 'Unscored';
    }
  };

  const getBandColor = (band: string | null) => {
    switch (band) {
      case 'DARK_GREEN':
        return '#10b981';
      case 'LIGHT_GREEN':
        return '#84cc16';
      case 'AMBER':
        return '#f59e0b';
      case 'ORANGE':
        return '#f97316';
      case 'RED':
        return '#dc2626';
      default:
        return '#94a3b8';
    }
  };

  if (loading) {
    return (
      <div className="analysis-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
          <div className="abhisaran-spinner" style={{ width: '48px', height: '48px', border: '4px solid var(--surface-2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>Evaluating deterministic scoring & deduction ledger...</div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Calculating multi-page pooled continuity score for location</div>
        </div>
      </div>
    );
  }

  if (!locationId) {
    return (
      <div className="analysis-container">
        <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>No Location Selected</h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 20px 0', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
            Please select a pilot facility from the Facility Registry or Field Audit Workspace to inspect its deterministic ACS score and deduction ledger.
          </p>
          <button type="button" className="btn btn-primary" onClick={onBack}>
            ← Go to Facilities
          </button>
        </div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="analysis-container">
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--danger)' }}>Analysis Error</h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 20px 0' }}>{error}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onBack}>← Back</button>
            <button type="button" className="btn btn-primary" onClick={handleTriggerAnalysis} disabled={reanalysing}>
              {reanalysing ? 'Re-running...' : '⚡ Run Scoring Analysis'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const scoreVal = analysis.acsScore !== null ? analysis.acsScore : 0;
  const isCalculable = analysis.acsScore !== null;
  const redFlags = analysis.items.filter((i) => i.isRedFlag || i.clampedRed);

  return (
    <div className="analysis-container">
      {/* Header Bar */}
      <div className="analysis-header">
        <div className="analysis-header-left">
          <button type="button" className="btn btn-secondary" onClick={onBack} style={{ padding: '6px 12px', fontSize: '13px' }}>
            ← Back
          </button>
          <div className="analysis-header-info">
            <h1>Continuity Score Analysis: <code>{analysis.facilityCode}</code></h1>
            <div className="analysis-header-meta">
              <span>Run #{analysis.runNumber}</span>
              <span>•</span>
              <span>Analyzed {new Date(analysis.analyzedAt).toLocaleString()}</span>
              {analysis.runByUsername && (
                <>
                  <span>•</span>
                  <span>By {analysis.runByUsername}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="analysis-header-actions">
          {!isOfficerView && onGoToAudit && locationId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onGoToAudit(locationId)}
              style={{ fontSize: '13px', padding: '7px 14px' }}
            >
              📋 Field Audit Workspace
            </button>
          )}
          {!isOfficerView && locationId && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTriggerAnalysis}
              disabled={reanalysing}
              style={{ fontSize: '13px', padding: '7px 14px' }}
            >
              {reanalysing ? 'Evaluating...' : '⚡ Re-run Analysis'}
            </button>
          )}
          {isOfficerView && (
            <span
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '9999px',
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                color: 'var(--muted)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🏛️ Official Scoped Breakdown (Zero PII)
            </span>
          )}
        </div>
      </div>

      {/* Hero Score Card */}
      <div className="analysis-hero-card">
        {/* Left: Prominent Headline Score */}
        <div className={`hero-score-badge band-${analysis.alertBand || 'NONE'}`}>
          <div className="hero-score-label">Abhisaran Continuity Score</div>
          <div
            className="hero-score-number"
            style={{ color: isCalculable ? getBandColor(analysis.alertBand) : 'var(--muted)' }}
          >
            {isCalculable ? Math.round(scoreVal) : 'N/A'}
          </div>
          {isCalculable && (
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', fontFeatureSettings: '"tnum"' }}>
              Exact Score: {scoreVal.toFixed(2)} / 100.00
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            <span className={`band-pill ${analysis.alertBand || 'AMBER'}`}>
              {analysis.alertBand ? analysis.alertBand.replace('_', ' ') : 'NOT CALCULABLE'} • {getBandLabel(analysis.alertBand)}
            </span>

            {analysis.isProvisional ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a'
                }}
              >
                ⚠️ PROVISIONAL AUDIT (Coverage: {analysis.coveragePct}%)
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: '#d1fae5',
                  color: '#047857'
                }}
              >
                ✅ Complete Audit ({analysis.coveragePct}% Coverage)
              </span>
            )}
          </div>
        </div>

        {/* Right: 5-Tier Spectrum Gauge & Statistical Metrics */}
        <div className="spectrum-section">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Alert Spectrum Band Indicator</span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {isCalculable ? `${scoreVal.toFixed(1)}% of maximum benchmark` : 'Insufficient assessed data'}
              </span>
            </div>

            <div className="spectrum-track">
              {isCalculable && (
                <div
                  className="spectrum-marker"
                  style={{ left: `${Math.min(100, Math.max(0, scoreVal))}%` }}
                  title={`ACS: ${scoreVal.toFixed(2)}`}
                >
                  <div className="spectrum-marker-inner" />
                </div>
              )}
            </div>

            <div className="spectrum-legend" style={{ marginTop: '10px' }}>
              <div className="spectrum-legend-item">
                <div className="spectrum-legend-dot" style={{ background: '#dc2626' }} />
                <span>RED (0–39.9)</span>
              </div>
              <div className="spectrum-legend-item">
                <div className="spectrum-legend-dot" style={{ background: '#f97316' }} />
                <span>ORANGE (40–54.9)</span>
              </div>
              <div className="spectrum-legend-item">
                <div className="spectrum-legend-dot" style={{ background: '#f59e0b' }} />
                <span>AMBER (55–69.9)</span>
              </div>
              <div className="spectrum-legend-item">
                <div className="spectrum-legend-dot" style={{ background: '#84cc16' }} />
                <span>LT GREEN (70–89.9)</span>
              </div>
              <div className="spectrum-legend-item">
                <div className="spectrum-legend-dot" style={{ background: '#10b981' }} />
                <span>DK GREEN (90–100)</span>
              </div>
            </div>
          </div>

          {/* Core Stat Boxes */}
          <div className="analysis-stat-grid">
            <div className="stat-box">
              <span className="stat-box-label">Assessed / Applicable</span>
              <span className="stat-box-value">
                {analysis.totalAssessedQuestions} / {analysis.totalApplicableQuestions}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Earned / Max Points</span>
              <span className="stat-box-value">
                {Number(analysis.totalEarnedWeightedPoints).toFixed(1)} / {Number(analysis.totalMaxWeightedPoints).toFixed(1)}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Total Lost Points</span>
              <span className="stat-box-value" style={{ color: Number(analysis.totalDeductionsWeightedPoints) > 0 ? '#b91c1c' : 'var(--ink)' }}>
                {Number(analysis.totalDeductionsWeightedPoints).toFixed(1)}
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Triggered Red Flags</span>
              <span className="stat-box-value" style={{ color: analysis.triggeredRedFlagsCount > 0 ? '#dc2626' : '#10b981' }}>
                {analysis.triggeredRedFlagsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deduction Ledger Mathematical Balancing Banner */}
      <div className="ledger-balanced-banner">
        <div className="ledger-balanced-left">
          <div className="ledger-shield-icon">✓</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#065f46' }}>
              Deduction Ledger Mathematical Balancing Proof
            </div>
            <div className="ledger-balanced-formula">
              Σ Loss Deductions ({Number(analysis.ledgerSum).toFixed(2)} pts) ≡ 100.00 − ACS ({(100 - (analysis.acsScore || 0)).toFixed(2)} pts)
            </div>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>
          {analysis.isLedgerBalanced ? 'Verified Balanced (< 0.001 tolerance)' : 'Imbalance Detected'}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', gap: '4px' }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'ledger' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'ledger' ? 'var(--accent)' : 'var(--muted)'
          }}
        >
          📉 Deduction Waterfall Ledger ({analysis.ledger.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'redflags' ? 'active' : ''}`}
          onClick={() => setActiveTab('redflags')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'redflags' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'redflags' ? 'var(--accent)' : 'var(--muted)'
          }}
        >
          🚨 Red Flags & Interventions ({redFlags.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'sections' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'sections' ? 'var(--accent)' : 'var(--muted)'
          }}
        >
          📑 Section Breakdown ({analysis.sections.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'items' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'items' ? 'var(--accent)' : 'var(--muted)'
          }}
        >
          📋 All Assessed Questions ({analysis.items.length})
        </button>
      </div>

      {/* Tab 1: Deduction Waterfall Ledger */}
      {activeTab === 'ledger' && (
        <div className="waterfall-card">
          <div className="waterfall-card-header">
            <div>
              <h3 className="waterfall-card-title">Deduction Waterfall Ledger</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                Every point deducted from 100 is explicitly accounted for and linked to a field deficit.
              </p>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#b91c1c' }}>
              Total Loss: −{Number(analysis.ledgerSum).toFixed(2)} pts
            </div>
          </div>

          {analysis.ledger.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>No Deductions Recorded</div>
              <div style={{ fontSize: '13px' }}>All assessed questions met maximum compliance criteria (100.00 ACS).</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="waterfall-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Page</th>
                    <th>Severity & Weight</th>
                    <th>Lost Pts</th>
                    <th>Net ACS Impact</th>
                    <th>Field Explanation & Working</th>
                    <th>Suggested Intervention</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.ledger.map((entry, idx) => (
                    <tr key={entry.id || idx}>
                      <td style={{ fontWeight: 700, color: 'var(--muted)' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{entry.questionId}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '320px' }}>
                          {entry.questionText}
                        </div>
                      </td>
                      <td>Page {entry.pageNumber}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: entry.severity === 'CRITICAL' ? '#fee2e2' : entry.severity === 'HIGH' ? '#ffedd5' : 'var(--surface-2)',
                            color: entry.severity === 'CRITICAL' ? '#b91c1c' : entry.severity === 'HIGH' ? '#c2410c' : 'var(--ink)'
                          }}
                        >
                          {entry.severity} (×{entry.weight})
                        </span>
                      </td>
                      <td style={{ fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
                        {Number(entry.lostWeightedPoints).toFixed(2)}
                      </td>
                      <td>
                        <span className="deduction-loss-badge">
                          −{Number(entry.deductionPercentage).toFixed(2)} pts
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--ink)' }}>{entry.lossExplanation}</div>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        {entry.suggestedIntervention ? (
                          <div className="intervention-box">
                            💡 {entry.suggestedIntervention}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Red Flags & Interventions */}
      {activeTab === 'redflags' && (
        <div>
          {redFlags.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>Zero Red Flags Triggered</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                No critical thresholds, safety hazards, or Section 9.5 clamps were breached.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--muted)' }}>
                Showing <strong>{redFlags.length}</strong> triggered red flag condition(s) requiring remediation priority.
              </div>
              {redFlags.map((item) => (
                <div key={item.id} className="red-flag-card">
                  <div className="red-flag-icon">!</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#991b1b' }}>
                        {item.questionId}: {item.questionText}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {item.clampedRed && (
                          <span style={{ background: '#7f1d1d', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                            Section 9.5 Clamped to RED (&lt; 50%)
                          </span>
                        )}
                        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          Page {item.pageNumber} • {item.severity} (×{item.weight})
                        </span>
                      </div>
                    </div>

                    <div style={{ margin: '8px 0', fontSize: '13px', color: '#7f1d1d' }}>
                      {item.workingNotes || 'Critical deficit identified during inspection.'}
                    </div>

                    {item.suggestedIntervention && (
                      <div className="intervention-box" style={{ background: '#ffffff', borderLeftColor: '#ef4444', color: '#991b1b' }}>
                        <strong>Action Required:</strong> {item.suggestedIntervention}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Section Breakdown */}
      {activeTab === 'sections' && (
        <div className="section-grid">
          {analysis.sections.map((sec) => (
            <div key={sec.section} className="section-card">
              <div className="section-card-top">
                <span className="section-name">{sec.section.replace('_', ' ')}</span>
                <span className={`band-pill ${sec.alertBand}`}>
                  {sec.alertBand.replace('_', ' ')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: getBandColor(sec.alertBand) }}>
                  {Number(sec.scorePercentage).toFixed(1)}%
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {Number(sec.earnedWeightedPoints).toFixed(1)} / {Number(sec.maxWeightedPoints).toFixed(1)} pts ({sec.questionCount} Qs)
                </span>
              </div>

              <div className="section-progress-bar">
                <div
                  className="section-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, sec.scorePercentage))}%`,
                    background: getBandColor(sec.alertBand)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: All Assessed Questions */}
      {activeTab === 'items' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="waterfall-table">
            <thead>
              <tr>
                <th>Question ID</th>
                <th>Page</th>
                <th>Severity</th>
                <th>Raw Pts</th>
                <th>Weighted Pts</th>
                <th>Band</th>
                <th>Status / Working Trail</th>
              </tr>
            </thead>
            <tbody>
              {analysis.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.questionId}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '360px' }}>
                      {item.questionText}
                    </div>
                  </td>
                  <td>Page {item.pageNumber}</td>
                  <td>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--surface-2)' }}>
                      {item.severity} (×{item.weight})
                    </span>
                  </td>
                  <td>
                    {item.rawMaxPoints !== null ? (
                      <span style={{ fontFeatureSettings: '"tnum"' }}>
                        {Number(item.rawEarnedPoints).toFixed(1)} / {Number(item.rawMaxPoints).toFixed(1)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {item.weightedMaxPoints !== null ? (
                      <span style={{ fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
                        {Number(item.weightedEarnedPoints).toFixed(1)} / {Number(item.weightedMaxPoints).toFixed(1)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {item.alertBand ? (
                      <span className={`band-pill ${item.alertBand}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {item.alertBand.replace('_', ' ')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Unscored</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '340px' }}>
                    <div style={{ fontSize: '12px' }}>
                      {item.isNa && <span style={{ color: 'var(--muted)', fontWeight: 600 }}>[N/A] </span>}
                      {item.isNotAssessed && <span style={{ color: '#b91c1c', fontWeight: 600 }}>[Unassessed] </span>}
                      {item.clampedRed && <span style={{ color: '#dc2626', fontWeight: 700 }}>[Clamped RED] </span>}
                      {item.workingNotes || '—'}
                    </div>
                    {item.suggestedIntervention && (
                      <div className="intervention-box" style={{ marginTop: '4px' }}>
                        💡 {item.suggestedIntervention}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
