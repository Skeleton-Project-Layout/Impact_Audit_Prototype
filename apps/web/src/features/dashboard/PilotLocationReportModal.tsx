import React, { useState, useEffect } from 'react';
import './pilotReportModal.css';
import { AbhisaranLoader } from '../../components/AbhisaranLoader';
import { SECTIONS, QUESTIONS } from '../audit/questionsData';

export interface PilotReportModalProps {
  locationId: string;
  facilityCode: string;
  domain?: string | null;
  typeLabel?: string | null;
  districtName?: string | null;
  blockName?: string | null;
  initialStatus?: string;
  onClose: () => void;
  onGoToAudit?: (locationId: string) => void;
  onAnalysisUpdated?: () => void;
}

export const PilotLocationReportModal: React.FC<PilotReportModalProps> = ({
  locationId,
  facilityCode,
  domain,
  typeLabel,
  districtName,
  blockName,
  initialStatus,
  onClose,
  onGoToAudit,
  onAnalysisUpdated
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [analysisRun, setAnalysisRun] = useState<any | null>(null);
  const [auditPages, setAuditPages] = useState<any[]>([]);
  const [status, setStatus] = useState<string>(initialStatus || 'DRAFT');
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'findings' | 'evidence' | 'summary'>('findings');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [runningAnalysis, setRunningAnalysis] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load latest analysis run and audit pages/evidence
  useEffect(() => {
    loadData();
  }, [locationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch latest analysis run
      const analysisRes = await fetch(`/api/v1/locations/${locationId}/analysis/latest`);
      if (analysisRes.ok && analysisRes.status !== 204) {
        const runData = await analysisRes.json();
        setAnalysisRun(runData);
        if (runData.status) setStatus(runData.status);
      } else {
        setAnalysisRun(null);
      }

      // 2. Fetch pages & evidence
      const pagesRes = await fetch(`/api/v1/locations/${locationId}/pages`);
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        if (pagesData.status) setStatus(pagesData.status);
        const pages = pagesData.pages || [];
        setAuditPages(pages);

        // Extract all evidence attachments from pages
        const allEv: any[] = [];
        pages.forEach((p: any) => {
          if (p.evidence) {
            Object.entries(p.evidence).forEach(([qId, evItems]: [string, any]) => {
              if (Array.isArray(evItems)) {
                evItems.forEach(ev => {
                  allEv.push({ ...ev, pageNumber: p.pageNumber, questionId: qId });
                });
              }
            });
          }
        });
        setEvidenceList(allEv);
      }
    } catch (e) {
      console.error('Failed to load pilot report details', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScoring = async () => {
    setRunningAnalysis(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/v1/locations/${locationId}/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const updated = await res.json();
        setAnalysisRun(updated);
        setStatus('ANALYSED');
        setActionMessage('✅ ACS scoring computed successfully!');
        if (onAnalysisUpdated) onAnalysisUpdated();
      } else {
        const err = await res.json().catch(() => ({}));
        setActionMessage(`⚠️ Scoring failed: ${err.error || 'Server error'}`);
      }
    } catch (err: any) {
      setActionMessage(`⚠️ Error running scoring: ${err.message}`);
    } finally {
      setRunningAnalysis(false);
    }
  };

  // Compile question answers from auditPages
  const aggregatedAnswers: Record<string, any> = {};
  auditPages.forEach(p => {
    if (p.answers) {
      Object.entries(p.answers).forEach(([qId, ans]: [string, any]) => {
        aggregatedAnswers[qId] = ans;
      });
    }
  });

  // Calculate alert band badge class
  const getBandClass = (band: string | null) => {
    if (!band) return 'unknown';
    const b = band.toUpperCase();
    if (b.includes('GREEN') || b.includes('OPTIMAL')) return 'optimal';
    if (b.includes('AMBER') || b.includes('ORANGE') || b.includes('AT_RISK') || b.includes('MODERATE')) return 'at-risk';
    return 'critical';
  };

  // Compile finding color code per question
  const getFindingEvaluation = (qNum: number, item?: any) => {
    // If analysisItem exists from ScoringEngine
    if (item) {
      if (item.isRedFlag || item.clampedRed) {
        return {
          status: 'CRITICAL',
          label: '🚨 Critical / Red Flag',
          badgeClass: 'finding-red',
          borderClass: 'border-red'
        };
      }
      if (item.alertBand === 'CRITICAL' || (item.weightedEarnedPoints === 0 && item.weightedMaxPoints > 0)) {
        return {
          status: 'DEFICIENT',
          label: '🔴 Deficient (0 pts)',
          badgeClass: 'finding-red',
          borderClass: 'border-red'
        };
      }
      if (item.alertBand === 'AT_RISK' || item.alertBand === 'AMBER' || (item.weightedEarnedPoints < item.weightedMaxPoints)) {
        return {
          status: 'PARTIAL',
          label: '🟡 At Risk / Partial',
          badgeClass: 'finding-amber',
          borderClass: 'border-amber'
        };
      }
      if (item.alertBand === 'OPTIMAL' || item.alertBand === 'GREEN' || item.weightedEarnedPoints === item.weightedMaxPoints) {
        return {
          status: 'OPTIMAL',
          label: '🟢 Optimal (Full pts)',
          badgeClass: 'finding-green',
          borderClass: 'border-green'
        };
      }
      if (item.isNa) {
        return {
          status: 'NA',
          label: '⚪ Not Applicable',
          badgeClass: 'finding-gray',
          borderClass: 'border-gray'
        };
      }
    }

    // Fallback: evaluate based on raw answers entered in the quiz
    const code = `S${String(qNum).padStart(2, '0')}`;
    const ans = aggregatedAnswers[code] || aggregatedAnswers[`question${qNum}`];
    if (!ans || !ans.value) {
      return {
        status: 'UNANSWERED',
        label: '⚪ Baseline / Pending',
        badgeClass: 'finding-gray',
        borderClass: 'border-gray'
      };
    }

    const val = typeof ans.value === 'object' ? JSON.stringify(ans.value) : String(ans.value);
    const low = val.toLowerCase();

    if (low.includes('"no"') || low.includes('no') && !low.includes('notes') && (qNum === 17 || qNum === 18 || qNum === 27 || qNum === 37 || qNum === 48 || qNum === 50)) {
      return {
        status: 'CRITICAL',
        label: '🔴 Service Disrupted',
        badgeClass: 'finding-red',
        borderClass: 'border-red'
      };
    }
    if (low.includes('"difficult"') || low.includes('difficult') || low.includes('partly')) {
      return {
        status: 'PARTIAL',
        label: '🟡 Barrier Identified',
        badgeClass: 'finding-amber',
        borderClass: 'border-amber'
      };
    }
    if (low.includes('"yes"') || low.includes('functional') || low.includes('available')) {
      return {
        status: 'OPTIMAL',
        label: '🟢 Available & Functional',
        badgeClass: 'finding-green',
        borderClass: 'border-green'
      };
    }

    return {
      status: 'RECORDED',
      label: '✓ Recorded',
      badgeClass: 'finding-blue',
      borderClass: 'border-blue'
    };
  };

  return (
    <div className="pilot-modal-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pilot-modal-container" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="pilot-modal-header">
          <div className="pilot-modal-title-box">
            <div className="pilot-facility-code-row">
              <span className="pilot-code-tag">{facilityCode}</span>
              <span className={`pilot-status-tag ${status.toLowerCase()}`}>
                {status.replace(/_/g, ' ')}
              </span>
              <span className="pilot-domain-tag">
                {domain === 'Education' ? '🏫 Education' : domain === 'Health' ? '🏥 Health' : domain === 'Nutrition' ? '👶 Nutrition' : '🌾 Baseline'}
              </span>
            </div>
            <h2 className="pilot-modal-heading">
              {typeLabel || 'Pilot Facility'} &bull; {districtName || 'East Khasi Hills'}
              {blockName ? ` (${blockName} Block)` : ''}
            </h2>
          </div>

          <div className="pilot-modal-header-actions">
            <button
              type="button"
              className="btn btn-ghost modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Action message */}
        {actionMessage && (
          <div className="pilot-modal-action-bar">
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="pilot-modal-body">
          {loading ? (
            <div style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
              <AbhisaranLoader message="Loading pilot location report & findings..." size={44} />
            </div>
          ) : (
            <>
              {/* Executive Score & Continuity Banner */}
              <div className="pilot-score-hero-card">
                <div className="hero-score-left">
                  <div className="hero-score-box">
                    {analysisRun && analysisRun.acsScore != null ? (
                      <>
                        <span className="hero-score-value">{Number(analysisRun.acsScore).toFixed(1)}</span>
                        <span className="hero-score-scale">/100</span>
                      </>
                    ) : (
                      <span className="hero-score-pending">--</span>
                    )}
                  </div>

                  <div className="hero-score-details">
                    <div className="hero-score-title">Abhisaran Continuity Score (ACS)</div>
                    {analysisRun ? (
                      <div className={`hero-band-pill ${getBandClass(analysisRun.alertBand)}`}>
                        {analysisRun.alertBand === 'GREEN' || analysisRun.alertBand === 'DARK_GREEN' || analysisRun.alertBand === 'OPTIMAL'
                          ? '🟢 Optimal Service Continuity'
                          : analysisRun.alertBand === 'AMBER' || analysisRun.alertBand === 'ORANGE' || analysisRun.alertBand === 'AT_RISK'
                          ? '🟡 At Risk / Intervention Required'
                          : '🔴 Critical Risk / High Vulnerability'}
                      </div>
                    ) : (
                      <span className="hero-pending-tag">Analysis Pending Field Submission</span>
                    )}
                  </div>
                </div>

                <div className="hero-metrics-grid">
                  <div className="hero-metric-tile">
                    <span className="hero-metric-num">
                      {analysisRun?.coveragePct != null ? `${Number(analysisRun.coveragePct).toFixed(0)}%` : `${auditPages.length > 0 ? '100%' : '0%'}`}
                    </span>
                    <span className="hero-metric-lab">Assessment Coverage</span>
                    {analysisRun?.isProvisional && (
                      <span className="hero-provisional-pill">⚠️ Provisional</span>
                    )}
                  </div>

                  <div className="hero-metric-tile">
                    <span className={`hero-metric-num ${analysisRun?.triggeredRedFlagsCount > 0 ? 'text-red' : 'text-green'}`}>
                      {analysisRun ? (analysisRun.triggeredRedFlagsCount || 0) : 0}
                    </span>
                    <span className="hero-metric-lab">Critical Red Flags</span>
                  </div>

                  <div className="hero-metric-tile">
                    <span className="hero-metric-num">{evidenceList.length}</span>
                    <span className="hero-metric-lab">Evidence Attachments</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="pilot-modal-tabs">
                <button
                  type="button"
                  className={`modal-tab-btn ${activeTab === 'findings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('findings')}
                >
                  📋 Colour-Coded Findings ({QUESTIONS.length} Indicators)
                </button>
                <button
                  type="button"
                  className={`modal-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
                  onClick={() => setActiveTab('evidence')}
                >
                  📎 Attached Evidence ({evidenceList.length})
                </button>
                <button
                  type="button"
                  className={`modal-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('summary')}
                >
                  📊 Executive Summary &amp; Recommendations
                </button>
              </div>

              {/* TAB 1: Colour-Coded Findings */}
              {activeTab === 'findings' && (
                <div className="pilot-findings-tab">
                  {/* Section Filter */}
                  <div className="findings-filter-strip">
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Filter Section:</span>
                    <select
                      className="section-filter-select"
                      value={selectedSectionFilter}
                      onChange={(e) => setSelectedSectionFilter(e.target.value)}
                    >
                      <option value="ALL">All Sections (A &ndash; G)</option>
                      {SECTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.id}. {s.short}</option>
                      ))}
                    </select>
                  </div>

                  {/* Findings Cards List */}
                  <div className="findings-cards-list">
                    {SECTIONS.filter(s => selectedSectionFilter === 'ALL' || s.id === selectedSectionFilter).map(sec => {
                      const secQuestions = QUESTIONS.filter(q => q.s === sec.idx);

                      return (
                        <div key={sec.id} className="finding-section-group">
                          <div className="finding-section-header">
                            <h3>{sec.title}</h3>
                            <span>{secQuestions.length} Questions</span>
                          </div>

                          <div className="finding-items-stack">
                            {secQuestions.map(q => {
                              // Find analysis item if scored
                              const code = `S${String(q.n).padStart(2, '0')}`;
                              const aItem = analysisRun?.items?.find((it: any) => it.questionId === code || it.questionId === `Q${q.n}`);
                              const finding = getFindingEvaluation(q.n, aItem);

                              // Retrieve entered answer
                              const ansObj = aggregatedAnswers[code] || aggregatedAnswers[`question${q.n}`];
                              const hasAnswer = ansObj && ansObj.value != null;

                              return (
                                <div key={q.n} className={`finding-card ${finding.borderClass}`}>
                                  <div className="finding-card-top">
                                    <div className="finding-qnum-title">
                                      <span className="finding-qbadge">Q{q.n}</span>
                                      <span className="finding-qtext">{q.text}</span>
                                    </div>

                                    <span className={`finding-status-badge ${finding.badgeClass}`}>
                                      {finding.label}
                                    </span>
                                  </div>

                                  {q.hint && (
                                    <div className="finding-qhint">{q.hint}</div>
                                  )}

                                  {/* Answer Value Display */}
                                  <div className="finding-response-box">
                                    <span className="response-label">Recorded Finding:</span>
                                    {hasAnswer ? (
                                      <div className="response-content">
                                        {typeof ansObj.value === 'object' ? (
                                          <pre className="response-json">{JSON.stringify(ansObj.value, null, 2)}</pre>
                                        ) : (
                                          <span className="response-text">{String(ansObj.value)}</span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="response-empty">No answer recorded in this audit draft</span>
                                    )}
                                  </div>

                                  {/* Scoring Details & Interventions */}
                                  {aItem && (
                                    <div className="finding-score-row">
                                      <span className="finding-points">
                                        Earned: <b>{Number(aItem.rawEarnedPoints ?? 0).toFixed(1)} / {Number(aItem.rawMaxPoints ?? 0).toFixed(1)} pts</b>
                                      </span>
                                      {aItem.suggestedIntervention && (
                                        <div className="finding-intervention">
                                          💡 <b>Suggested Action:</b> {aItem.suggestedIntervention}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: Attached Evidence */}
              {activeTab === 'evidence' && (
                <div className="pilot-evidence-tab">
                  {evidenceList.length === 0 ? (
                    <div className="evidence-empty-box">
                      <div className="empty-icon">📂</div>
                      <h3>No Evidence Attachments</h3>
                      <p>No photos, documents, or PDF exports have been attached to this pilot location audit yet.</p>
                      {onGoToAudit && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => { onClose(); onGoToAudit(locationId); }}
                        >
                          📋 Open Audit Form to Attach Evidence
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="evidence-grid">
                      {evidenceList.map((ev, idx) => (
                        <div key={ev.id || idx} className="evidence-file-card">
                          <div className="evidence-card-top">
                            <span className="evidence-type-icon">
                              {ev.mimeType?.includes('pdf') ? '📄' : ev.mimeType?.includes('image') ? '🖼️' : '📎'}
                            </span>
                            <div className="evidence-file-info">
                              <h4 className="evidence-filename" title={ev.fileName}>{ev.fileName || `Evidence_${idx + 1}`}</h4>
                              <span className="evidence-meta">
                                {ev.fileSizeBytes ? `${Math.round(ev.fileSizeBytes / 1024)} KB` : 'Verified file'} &bull; Question {ev.questionId || 'S01'}
                              </span>
                            </div>
                          </div>

                          <div className="evidence-card-actions">
                            <a
                              href={`/api/v1/evidence/${ev.id}/file`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                            >
                              📥 View / Download
                            </a>
                            <span className="evidence-verified-pill">✓ Attested</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Executive Summary */}
              {activeTab === 'summary' && (
                <div className="pilot-summary-tab">
                  <div className="summary-card">
                    <h3>Executive Summary &amp; Interventions</h3>
                    <p>
                      Pilot Location <b>{facilityCode}</b> ({typeLabel || 'Facility'}) in <b>{districtName || 'Pilot'}</b> district has an overall Abhisaran Continuity Score of <b>{analysisRun?.acsScore != null ? Number(analysisRun.acsScore).toFixed(1) : '--'}/100</b>.
                    </p>
                    <div className="summary-stats-list">
                      <div className="summary-stat-row">
                        <span>Current Alert Band:</span>
                        <b>{analysisRun?.alertBand || 'PENDING'}</b>
                      </div>
                      <div className="summary-stat-row">
                        <span>Total Questions Assessed:</span>
                        <b>{analysisRun?.totalAssessedQuestions ?? 0} of {analysisRun?.totalApplicableQuestions ?? QUESTIONS.length}</b>
                      </div>
                      <div className="summary-stat-row">
                        <span>Red Flags Requiring Priority Remediation:</span>
                        <b style={{ color: analysisRun?.triggeredRedFlagsCount > 0 ? '#dc2626' : '#16a34a' }}>
                          {analysisRun?.triggeredRedFlagsCount ?? 0}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pilot-modal-footer">
          <div className="footer-left">
            {onGoToAudit && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { onClose(); onGoToAudit(locationId); }}
              >
                📋 Open Field Audit Form
              </button>
            )}
          </div>

          <div className="footer-right">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunScoring}
              disabled={runningAnalysis}
            >
              {runningAnalysis ? '⏳ Computing ACS...' : '⚡ Run Scoring Engine'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
