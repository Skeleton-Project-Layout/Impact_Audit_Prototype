import React, { useState, useEffect } from 'react';
import './acsPdfReport.css';
import { AbhisaranLoader } from '../../components/AbhisaranLoader';
import { AnalysisRunDTO } from './AnalysisDetailsView';

interface AcsPdfReportViewProps {
  runId?: string;
  locationId?: string;
  onBack: () => void;
}

export const AcsPdfReportView: React.FC<AcsPdfReportViewProps> = ({
  runId,
  locationId,
  onBack
}) => {
  const [run, setRun] = useState<AnalysisRunDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [runId, locationId]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = runId
        ? `/api/v1/scoring/runs/${runId}`
        : `/api/v1/scoring/locations/${locationId}/latest`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load analysis report (HTTP ${res.status})`);
      }
      const data: AnalysisRunDTO = await res.json();
      setRun(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading audit report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getBandBadgeStyle = (band: string | null) => {
    switch (band?.toUpperCase()) {
      case 'DARK_GREEN':
        return { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' };
      case 'LIGHT_GREEN':
        return { background: '#ecfccb', color: '#4d7c0f', border: '1px solid #bef264' };
      case 'ORANGE':
        return { background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' };
      case 'RED':
        return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' };
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
        <AbhisaranLoader message="Generating certified code-only PDF report..." size={56} />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="pdf-report-container">
        <div className="pdf-report-toolbar">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
          ⚠️ {error || 'Report data unavailable'}
        </div>
      </div>
    );
  }

  const bandStyle = getBandBadgeStyle(run.alertBand);
  const redFlagItems = run.items.filter(i => i.isRedFlag);

  return (
    <div className="pdf-report-container">
      {/* Interactive Action Toolbar (Hidden in Print) */}
      <div className="pdf-report-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            ← Back to Analysis
          </button>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Code-Only Official Audit Summary for <b>{run.facilityCode}</b>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>🖨️</span> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable Paper Canvas */}
      <div className="pdf-report-paper">
        <div className="pdf-watermark">NON-RANKING AUDIT BASELINE</div>

        {/* Header */}
        <div className="pdf-header">
          <div className="pdf-header-top">
            <div className="pdf-emblem-group">
              <div className="pdf-emblem-badge">JH</div>
              <div className="pdf-titles">
                <h2>Government of Jharkhand • Department of Planning & Audit</h2>
                <h1>Abhisaran Composite Audit Score (ACS) Report</h1>
                <p>Strict Zero-PII Official Certification • AEHT Mathematical Model V2</p>
              </div>
            </div>
            <div className="pdf-code-banner">
              <div className="code">{run.facilityCode}</div>
              <div className="run-tag">Run #{run.runNumber} • {new Date(run.analyzedAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Meta Grid - Zero PII Guarantee */}
          <div className="pdf-meta-grid">
            <div className="pdf-meta-item">
              <span className="label">Permanent Facility Code</span>
              <span className="val" style={{ fontFamily: 'var(--font-mono, monospace)' }}>{run.facilityCode}</span>
            </div>
            <div className="pdf-meta-item">
              <span className="label">Audit Status</span>
              <span className="val">{run.isProvisional ? 'Provisional Baseline' : 'Certified Final'}</span>
            </div>
            <div className="pdf-meta-item">
              <span className="label">Evaluation Timestamp</span>
              <span className="val">{new Date(run.analyzedAt).toLocaleString()}</span>
            </div>
            <div className="pdf-meta-item">
              <span className="label">Ledger Integrity Check</span>
              <span className="val">{run.isLedgerBalanced ? 'Balanced (Δ = 0.00)' : 'Unbalanced'}</span>
            </div>
          </div>
        </div>

        {/* Composite Score Card */}
        <div className="pdf-score-card">
          <div className="pdf-score-primary">
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>
              Composite ACS Score
            </div>
            <div className="pdf-score-number">
              {run.acsScore != null ? run.acsScore.toFixed(1) : '—'}
            </div>
            <div className="pdf-score-band" style={bandStyle}>
              {run.alertBand ? run.alertBand.replace(/_/g, ' ') : 'UNCLASSIFIED'}
            </div>
            {run.isProvisional && (
              <span style={{ fontSize: '10px', color: '#b45309', fontWeight: 600, marginTop: '4px' }}>
                * Provisional (&lt; 70% coverage)
              </span>
            )}
          </div>

          <div className="pdf-score-stats">
            <div className="pdf-stat-cell">
              <span className="stat-label">Audit Coverage</span>
              <span className="stat-val">{run.coveragePct.toFixed(1)}%</span>
            </div>
            <div className="pdf-stat-cell">
              <span className="stat-label">Applicable Questions</span>
              <span className="stat-val">{run.totalApplicableQuestions}</span>
            </div>
            <div className="pdf-stat-cell">
              <span className="stat-label">Assessed Questions</span>
              <span className="stat-val">{run.totalAssessedQuestions}</span>
            </div>
            <div className="pdf-stat-cell">
              <span className="stat-label">Max Weighted Points</span>
              <span className="stat-val">{run.totalMaxWeightedPoints.toFixed(2)}</span>
            </div>
            <div className="pdf-stat-cell">
              <span className="stat-label">Earned Weighted Points</span>
              <span className="stat-val">{run.totalEarnedWeightedPoints.toFixed(2)}</span>
            </div>
            <div className="pdf-stat-cell">
              <span className="stat-label">Total Points Lost</span>
              <span className="stat-val" style={{ color: '#b91c1c' }}>
                {run.totalDeductionsWeightedPoints.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Red Flags Callout Box */}
        {redFlagItems.length > 0 && (
          <div className="pdf-red-flag-box">
            <div className="pdf-red-flag-title">
              <span>🚨</span>
              <span>Critical Red Flag Breaches Triggered ({redFlagItems.length})</span>
            </div>
            <div style={{ fontSize: '11px', color: '#7f1d1d', lineHeight: 1.5 }}>
              The following audit indicators triggered automatic red flag escalation due to severe service delivery impairment:
            </div>
            <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '11px', color: '#991b1b' }}>
              {redFlagItems.map(rf => (
                <li key={rf.id} style={{ marginBottom: '4px' }}>
                  <b>[{rf.questionId}] (Page {rf.pageNumber}):</b> {rf.workingNotes || rf.questionText}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Deduction Waterfall Ledger */}
        <div>
          <div className="pdf-section-title">
            <span>📉</span> Mathematical Deduction Waterfall Ledger
          </div>
          <table className="pdf-table">
            <thead>
              <tr>
                <th style={{ width: '45px' }}>QID</th>
                <th style={{ width: '35px' }}>Pg</th>
                <th>Indicator / Assessment Metric</th>
                <th style={{ width: '60px' }}>Severity</th>
                <th style={{ width: '50px', textAlign: 'right' }}>Pts Lost</th>
                <th style={{ width: '50px', textAlign: 'right' }}>% Loss</th>
                <th>Diagnostic Rationale & Suggested Action</th>
              </tr>
            </thead>
            <tbody>
              {run.ledger.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#16a34a', padding: '16px' }}>
                    ✓ Full compliance achieved: zero deductions recorded across all assessed indicators.
                  </td>
                </tr>
              ) : (
                run.ledger.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>{d.questionId}</td>
                    <td>{d.pageNumber}</td>
                    <td>{d.questionText}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: d.severity === 'CRITICAL' ? '#b91c1c' : '#475569' }}>
                        {d.severity}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', color: '#b91c1c', fontWeight: 700 }}>
                      -{d.lostWeightedPoints.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                      {d.deductionPercentage.toFixed(1)}%
                    </td>
                    <td>
                      <div>{d.lossExplanation}</div>
                      {d.suggestedIntervention && (
                        <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '2px' }}>
                          <b>Intervention:</b> {d.suggestedIntervention}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Domain Section Breakdown */}
        {run.sections && run.sections.length > 0 && (
          <div>
            <div className="pdf-section-title">
              <span>📑</span> Section-by-Section Performance Matrix
            </div>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Audit Domain Section</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Questions</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Earned Points</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Max Points</th>
                  <th style={{ width: '70px', textAlign: 'right' }}>Score %</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Band</th>
                </tr>
              </thead>
              <tbody>
                {run.sections.map(s => (
                  <tr key={s.section}>
                    <td style={{ fontWeight: 600 }}>{s.section}</td>
                    <td style={{ textAlign: 'center' }}>{s.questionCount}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono, monospace)' }}>
                      {s.earnedWeightedPoints.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono, monospace)' }}>
                      {s.maxWeightedPoints.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>
                      {s.scorePercentage.toFixed(1)}%
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          ...getBandBadgeStyle(s.alertBand)
                        }}
                      >
                        {s.alertBand.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer & Non-Ranking Disclaimer */}
        <div className="pdf-footer">
          <div style={{ lineHeight: 1.4 }}>
            <b>Legal Notice on Non-Ranking Principle:</b> This document contains proprietary audit diagnostics calculated under the Abhisaran Platform. In strict compliance with the AEHT governance protocol, this report is dedicated exclusively to internal facility diagnostics, capacity development, and targeted resource allocation. Any use of this score for institutional ranking, comparative league tables, or punitive comparison is strictly prohibited by law.
          </div>

          <div className="pdf-signature-row">
            <div>
              <div><b>Document Hash:</b> {run.id.replace(/-/g, '').substring(0, 24).toUpperCase()}</div>
              <div><b>Certified Engine:</b> Abhisaran Scoring Kernel v2.1.0</div>
            </div>
            <div className="pdf-sig-box">
              Verified Compliance Officer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
