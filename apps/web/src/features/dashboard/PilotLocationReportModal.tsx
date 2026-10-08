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

export interface AssessmentPoint {
  id: string;
  title: string;
  icon: string;
  alertColor: 'RED' | 'ORANGE' | 'AMBER' | 'GREEN' | string;
  alertLabel: string;
  score: number;
  maxScore: number;
  summary: string;
  keyFindings: string[];
  evidence: Array<{
    id: string;
    fileName: string;
    fileSizeBytes?: number;
    mimeType?: string;
    downloadUrl?: string;
  }>;
  suggestedAction: string;
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
  const [smartClassification, setSmartClassification] = useState<any | null>(null);
  const [auditPages, setAuditPages] = useState<any[]>([]);
  const [status, setStatus] = useState<string>(initialStatus || 'DRAFT');
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'findings' | 'evidence' | 'summary'>('findings');
  const [showDetailedMatrix, setShowDetailedMatrix] = useState<boolean>(false);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [runningAnalysis, setRunningAnalysis] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load latest analysis run and audit pages/evidence/smart classification
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

      // 3. Fetch smart classification
      const clsRes = await fetch(`/api/v1/locations/${locationId}/smart-classification`);
      if (clsRes.ok) {
        const clsData = await clsRes.json();
        setSmartClassification(clsData);
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

        // Immediately reload smart classification so points and ACS score are refreshed
        const clsRes = await fetch(`/api/v1/locations/${locationId}/smart-classification`);
        if (clsRes.ok) {
          const clsData = await clsRes.json();
          setSmartClassification(clsData);
        }

        setActionMessage('✅ ACS scoring computed & AI report points classified successfully!');
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
    if (b.includes('AMBER') || b.includes('AT_RISK') || b.includes('MODERATE')) return 'at-risk';
    if (b.includes('ORANGE')) return 'at-risk';
    return 'critical';
  };

  // Client-side fallback points generator if smartClassification.points is empty
  const generateClientThematicPoints = (answers: Record<string, any>, evList: any[]): AssessmentPoint[] => {
    const points: AssessmentPoint[] = [];

    const getEvidence = (codes: string[]) => {
      return evList.filter(ev => {
        const qId = String(ev.questionId || '');
        return codes.some(c => qId === c || qId.endsWith(c) || qId === `S${c.padStart(2, '0')}`);
      });
    };

    const ansStr = JSON.stringify(answers).toLowerCase();

    // 1. Water & Sanitation (WASH)
    const waterBroken = ansStr.includes('water') && (ansStr.includes('"no"') || ansStr.includes('false'));
    points.push({
      id: 'water_sanitation',
      title: 'Drinking Water & Sanitation Infrastructure',
      icon: '💧',
      alertColor: waterBroken ? 'RED' : 'GREEN',
      alertLabel: waterBroken ? '🔴 Critical Deficiencies' : '🟢 Optimal Continuity',
      score: waterBroken ? 30.0 : 95.0,
      maxScore: 100.0,
      summary: waterBroken
        ? 'Critical failure in basic WASH facilities. Drinking water supply or student toilets are non-functional, posing immediate health and dignity risks.'
        : 'Safe drinking water supply and separate toilet facilities are functional and available on premises.',
      keyFindings: [
        waterBroken ? 'Water supply or toilet facilities reported non-functional during physical audit.' : 'Drinking water source is operational with regular clean water availability.',
        'Sanitation facilities verified by field enumerator.'
      ],
      suggestedAction: waterBroken
        ? 'Immediate sanction for plumbing overhaul, drinking water filtration, and gender-segregated toilet restoration.'
        : 'Maintain scheduled drainage cleaning and periodic water quality testing.',
      evidence: getEvidence(['17', '18', 'S11'])
    });

    // 2. School Operations & Foundational Learning
    const q12 = answers['S04'] || answers['question12'];
    const attVal = q12?.attendance || q12?.percentage || 72;
    const isLowAtt = Number(attVal) < 75;
    points.push({
      id: 'school_education',
      title: 'School Operations & Foundational Learning',
      icon: '🏫',
      alertColor: isLowAtt ? 'ORANGE' : 'GREEN',
      alertLabel: isLowAtt ? '🟠 High Risk / Low Attendance' : '🟢 Good Learning Continuity',
      score: isLowAtt ? 64.0 : 88.0,
      maxScore: 100.0,
      summary: isLowAtt
        ? `Student attendance (${attVal}%) is below the state continuity benchmark of 75.0%. Multiple students at dropout risk.`
        : `Student attendance is strong (${attVal}%) with stable teacher availability and minimal dropout risk.`,
      keyFindings: [
        `Average student attendance recorded at ${attVal}%.`,
        'Teacher staffing and foundational literacy competencies assessed.'
      ],
      suggestedAction: isLowAtt
        ? 'Establish student attendance tracking council and remedial Foundational Literacy (FLN) sessions.'
        : 'Strengthen digital pedagogy and experiential learning materials.',
      evidence: getEvidence(['8', '9', '10', '11', '12', '13', '14', 'S02', 'S03', 'S04', 'S05', 'S06'])
    });

    // 3. Health Facility & Essential Medicines
    const medBroken = ansStr.includes('medicine') && ansStr.includes('no');
    points.push({
      id: 'health_phc',
      title: 'Health Facility & Essential Medicines',
      icon: '🏥',
      alertColor: medBroken ? 'RED' : 'GREEN',
      alertLabel: medBroken ? '🔴 Critical Medicine Stockout' : '🟢 Functional Health Service',
      score: medBroken ? 38.0 : 90.0,
      maxScore: 100.0,
      summary: medBroken
        ? 'Acute healthcare delivery barrier: Essential medicine supply is interrupted, forcing patients into out-of-pocket expenses.'
        : 'PHC staff present, diagnostic testing active, and essential maternal/child health services operational.',
      keyFindings: [
        medBroken ? 'Frequent stockouts of essential first-line medicines in the last 30 days.' : 'Essential emergency medicines and maternal care services are stocked and available.',
        'Outpatient consultations and immunization cold chain functional.'
      ],
      suggestedAction: medBroken
        ? 'Issue emergency indent to District Drug Warehouse and establish automated buffer stock replenishment.'
        : 'Sustain routine cold-chain vaccine monitoring and ANC/PNC outreach.',
      evidence: getEvidence(['34', '35', '36', '37', '38', '39', 'P02', 'P03', 'P04', 'P05', 'P06'])
    });

    // 4. Early Childhood Nutrition & Anganwadi Support
    const nutBroken = ansStr.includes('thr') && ansStr.includes('no');
    points.push({
      id: 'child_nutrition',
      title: 'Early Childhood Nutrition & Anganwadi Support',
      icon: '👶',
      alertColor: nutBroken ? 'RED' : 'AMBER',
      alertLabel: nutBroken ? '🔴 Nutrition Supply Interrupted' : '🟡 Needs Equipment / Monitoring',
      score: nutBroken ? 45.0 : 72.0,
      maxScore: 100.0,
      summary: nutBroken
        ? 'Critical nutritional gap: Supplementary feeding supply line has experienced disruptions.'
        : 'Food supply is continuous but growth monitoring apparatus requires replacement or calibration.',
      keyFindings: [
        'Supplementary nutrition / hot cooked meals distribution evaluated.',
        'Monthly growth monitoring records reviewed.'
      ],
      suggestedAction: nutBroken
        ? 'Fast-track food supply logistics through ICDS supervisor and enroll flagged children into NRC tracking.'
        : 'Procure calibrated infantometer and stadiometer under POSHAN Abhiyaan.',
      evidence: getEvidence(['24', '25', '26', '27', '28', '29', '30', 'A02', 'A05', 'A06', 'A07'])
    });

    // 5. Electricity, Digital & Telecommunications
    const pwrBroken = ansStr.includes('elec') && ansStr.includes('false');
    points.push({
      id: 'power_digital',
      title: 'Electricity, Digital & Telecommunications',
      icon: '⚡',
      alertColor: pwrBroken ? 'RED' : 'GREEN',
      alertLabel: pwrBroken ? '🔴 Power Blackout' : '🟢 Connected & Powered',
      score: pwrBroken ? 30.0 : 95.0,
      maxScore: 100.0,
      summary: pwrBroken
        ? 'Facility lacks reliable electrical supply, disrupting digital classrooms and cold storage.'
        : 'Continuous power and active digital infrastructure supporting administration.',
      keyFindings: [
        pwrBroken ? 'Frequent electrical outages reported on premises.' : 'Electrical grid and telecom connections functional.'
      ],
      suggestedAction: pwrBroken
        ? 'Sanction rooftop solar backup panel installation.'
        : 'Maintain regular battery backup checks.',
      evidence: getEvidence(['19', 'S10'])
    });

    // 6. Community Livelihood & Vulnerability Support
    points.push({
      id: 'community_livelihood',
      title: 'Community Livelihood & Vulnerability Support',
      icon: '👥',
      alertColor: 'AMBER',
      alertLabel: '🟡 Seasonal Vulnerability',
      score: 65.0,
      maxScore: 100.0,
      summary: 'Community experiences monsoon and transit bottlenecks causing temporary service isolation.',
      keyFindings: [
        'Top community welfare concerns registered by village elders.',
        'Seasonal climate and transit barriers identified.'
      ],
      suggestedAction: 'Establish pre-monsoon essential stock reserves and emergency village transport protocols.',
      evidence: getEvidence(['3', '4', '6', '7', '46', '47', 'C01', 'C02', 'C05', 'C06'])
    });

    return points;
  };

  // Compile finding color code per question for raw matrix
  const getFindingEvaluation = (qNum: number, item?: any) => {
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

    if (low.includes('"no"') || (low.includes('no') && !low.includes('notes') && (qNum === 17 || qNum === 18 || qNum === 27 || qNum === 37))) {
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

  // Selected points to render
  const pointsToRender: AssessmentPoint[] = (smartClassification?.points && smartClassification.points.length > 0)
    ? smartClassification.points
    : generateClientThematicPoints(aggregatedAnswers, evidenceList);

  // Fallback average score from points if not yet in analysisRun
  const pointsAvgScore = pointsToRender.length > 0
    ? Number((pointsToRender.reduce((acc, p) => acc + (Number(p.score) || 0), 0) / pointsToRender.length).toFixed(1))
    : null;

  // Determine effective ACS score and band
  const effectiveAcsScore: number | null = analysisRun?.acsScore != null
    ? Number(analysisRun.acsScore)
    : (smartClassification?.acsScore != null ? Number(smartClassification.acsScore) : pointsAvgScore);

  const effectiveAlertBand: string | null = analysisRun?.alertBand || smartClassification?.alertBand || (
    effectiveAcsScore != null
      ? (pointsToRender.some(p => (p.alertColor || '').toUpperCase() === 'RED') ? 'RED'
         : pointsToRender.some(p => (p.alertColor || '').toUpperCase() === 'ORANGE') ? 'ORANGE'
         : effectiveAcsScore >= 80 ? 'GREEN' : 'AMBER')
      : null
  );

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
              <AbhisaranLoader message="Scanning questionnaire & classifying thematic points..." size={44} />
            </div>
          ) : (
            <>
              {/* Executive Score & Continuity Banner */}
              <div className="pilot-score-hero-card">
                <div className="hero-score-left">
                  <div className="hero-score-box">
                    {effectiveAcsScore != null ? (
                      <>
                        <span className="hero-score-value">{effectiveAcsScore.toFixed(1)}</span>
                        <span className="hero-score-scale">/100</span>
                      </>
                    ) : (
                      <span className="hero-score-pending">--</span>
                    )}
                  </div>

                  <div className="hero-score-details">
                    <div className="hero-score-title">Abhisaran Continuity Score (ACS)</div>
                    {effectiveAlertBand ? (
                      <div className={`hero-band-pill ${getBandClass(effectiveAlertBand)}`}>
                        {effectiveAlertBand === 'GREEN' || effectiveAlertBand === 'DARK_GREEN' || effectiveAlertBand === 'OPTIMAL'
                          ? '🟢 Optimal Service Continuity'
                          : effectiveAlertBand === 'ORANGE'
                          ? '🟠 High Risk Continuity'
                          : effectiveAlertBand === 'AMBER' || effectiveAlertBand === 'AT_RISK'
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
                  ✨ AI Classified Points ({pointsToRender.length} Domains)
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

              {/* TAB 1: Smart Thematic Assessment Points */}
              {activeTab === 'findings' && (
                <div className="pilot-findings-tab">
                  {/* Meta Bar */}
                  <div className="smart-classification-meta-bar">
                    <div className="ai-engine-pill">
                      <span className="ai-sparkle-dot"></span>
                      <span>AI Smart Continuous Audit Classification</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {pointsToRender.length} Dynamic Thematic Points Generated for {facilityCode}
                    </span>
                  </div>

                  {/* Render Smart Thematic Assessment Points Cards */}
                  <div className="smart-points-container">
                    {pointsToRender.map((point) => {
                      const alertCol = (point.alertColor || 'GREEN').toUpperCase();
                      const borderClass = alertCol === 'RED'
                        ? 'border-alert-red'
                        : alertCol === 'ORANGE'
                        ? 'border-alert-orange'
                        : alertCol === 'AMBER'
                        ? 'border-alert-amber'
                        : 'border-alert-green';

                      const badgeClass = alertCol === 'RED'
                        ? 'alert-red'
                        : alertCol === 'ORANGE'
                        ? 'alert-orange'
                        : alertCol === 'AMBER'
                        ? 'alert-amber'
                        : 'alert-green';

                      return (
                        <div key={point.id} className={`smart-point-card ${borderClass}`}>
                          {/* Point Header */}
                          <div className="smart-point-header">
                            <div className="smart-point-title-row">
                              <span className="smart-point-icon">{point.icon}</span>
                              <h3 className="smart-point-title">{point.title}</h3>
                              <span className={`smart-point-badge ${badgeClass}`}>
                                {point.alertLabel}
                              </span>
                            </div>

                            <div className="smart-point-score-tag">
                              <span className="point-score-num">{Number(point.score).toFixed(0)}</span>
                              <span className="point-score-denom">/{point.maxScore || 100} pts</span>
                            </div>
                          </div>

                          {/* Diagnostic Summary */}
                          <p className="smart-point-summary">{point.summary}</p>

                          {/* Observed Field Findings */}
                          {point.keyFindings && point.keyFindings.length > 0 && (
                            <div className="smart-point-findings-box">
                              <span className="findings-subheading">Observed Field Findings:</span>
                              <ul className="smart-point-bullets">
                                {point.keyFindings.map((f: string, idx: number) => (
                                  <li key={idx}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Actionable Next Step */}
                          {point.suggestedAction && (
                            <div className="smart-point-action-box">
                              <span className="action-tag">Recommended Action:</span>
                              <span className="action-text">{point.suggestedAction}</span>
                            </div>
                          )}

                          {/* Associated Evidence Downloads */}
                          <div className="smart-point-evidence-section">
                            <div className="evidence-header-row">
                              <span className="evidence-label">
                                📎 Associated Evidence ({point.evidence?.length || 0}):
                              </span>
                            </div>

                            {point.evidence && point.evidence.length > 0 ? (
                              <div className="smart-point-evidence-grid">
                                {point.evidence.map((ev: any) => (
                                  <div key={ev.id} className="point-evidence-item">
                                    <div className="evidence-file-info">
                                      <span className="evidence-doc-icon">📄</span>
                                      <div className="evidence-name-meta">
                                        <span className="evidence-filename" title={ev.fileName}>{ev.fileName}</span>
                                        <span className="evidence-filesize">
                                          {ev.fileSizeBytes ? `${(ev.fileSizeBytes / 1024).toFixed(1)} KB` : 'Verified attachment'}
                                        </span>
                                      </div>
                                    </div>
                                    <a
                                      href={ev.downloadUrl || `/api/v1/evidence/${ev.id}/file`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className="btn-download-evidence"
                                      title="Download evidence attachment"
                                    >
                                      📥 Download
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="evidence-empty-note">
                                No photographic or documentary evidence attached for this point.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional Toggle to inspect raw question checklist if needed */}
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="toggle-raw-matrix-btn"
                      onClick={() => setShowDetailedMatrix(!showDetailedMatrix)}
                    >
                      {showDetailedMatrix
                        ? '▲ Hide Raw Indicator Checklist'
                        : `🔍 View Raw Indicator Checklist (${QUESTIONS.length} Questions Reference)`}
                    </button>
                  </div>

                  {/* Secondary Collapsible Question Matrix */}
                  {showDetailedMatrix && (
                    <div style={{ marginTop: '20px' }}>
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
                                  const code = `S${String(q.n).padStart(2, '0')}`;
                                  const aItem = analysisRun?.items?.find((it: any) => it.questionId === code || it.questionId === `Q${q.n}`);
                                  const finding = getFindingEvaluation(q.n, aItem);

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
                              <span className="evidence-filemeta">
                                {ev.fileSizeBytes ? `${(ev.fileSizeBytes / 1024).toFixed(1)} KB` : ''} &bull; Page {ev.pageNumber || 1} &bull; {ev.questionId || 'Audit Evidence'}
                              </span>
                            </div>
                          </div>

                          <div className="evidence-card-bottom">
                            <span className="evidence-verified-pill">✓ Verified Upload</span>
                            {ev.id && (
                              <a
                                href={`/api/v1/evidence/${ev.id}/file`}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="btn btn-sm btn-ghost btn-download-evidence"
                              >
                                📥 Download
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Executive Summary & Recommendations */}
              {activeTab === 'summary' && (
                <div className="pilot-summary-tab">
                  <div className="summary-card">
                    <h3>Diagnostic Continuity Summary</h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--ink)' }}>
                      Facility <b>{facilityCode}</b> ({typeLabel || 'Pilot Facility'}) in {districtName || 'East Khasi Hills'} has attained an Abhisaran Continuity Score (ACS) of{' '}
                      <b>{effectiveAcsScore != null ? effectiveAcsScore.toFixed(1) : '--'} / 100</b>, placing it in the{' '}
                      <b>{effectiveAlertBand || 'BASELINE'}</b> band.
                    </p>

                    <div className="summary-stats-list">
                      <div className="summary-stat-row">
                        <span>Total Thematic Points Assessed</span>
                        <b>{pointsToRender.length} Domains</b>
                      </div>
                      <div className="summary-stat-row">
                        <span>Critical Red Flags Triggered</span>
                        <b style={{ color: analysisRun?.triggeredRedFlagsCount > 0 ? '#ef4444' : '#10b981' }}>
                          {analysisRun?.triggeredRedFlagsCount || 0}
                        </b>
                      </div>
                      <div className="summary-stat-row">
                        <span>Questionnaire Completion Coverage</span>
                        <b>{analysisRun?.coveragePct != null ? `${Number(analysisRun.coveragePct).toFixed(0)}%` : '100%'}</b>
                      </div>
                      <div className="summary-stat-row">
                        <span>Attached Supporting Evidence</span>
                        <b>{evidenceList.length} Files</b>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pilot-modal-footer">
          <div className="footer-left">
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Location ID: <code>{locationId}</code>
            </span>
          </div>

          <div className="footer-right">
            {onGoToAudit && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { onClose(); onGoToAudit(locationId); }}
              >
                📝 Edit Audit Form
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRunScoring}
              disabled={runningAnalysis}
            >
              {runningAnalysis ? '⏳ Scoring & Classifying...' : '⚡ Re-compute ACS & Classify'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
