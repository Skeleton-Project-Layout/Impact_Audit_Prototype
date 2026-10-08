import React, { useState, useEffect } from 'react';

export interface QuestionSummary {
  id: string;
  domain: string;
  section: string;
  canonicalText: string;
  responseType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  scored: boolean;
  rubricType: string;
  active: boolean;
  latestVersionNumber: number;
  status: string;
  totalVersions: number;
  displayOrder: number;
}

interface RubricReviewScreenProps {
  onOpenRubricTester?: (questionId: string) => void;
}

export const RubricReviewScreen: React.FC<RubricReviewScreenProps> = ({ onOpenRubricTester }) => {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [rubricTypeFilter, setRubricTypeFilter] = useState<string>('ALL');

  // Action states
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [bulkApproving, setBulkApproving] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/questions');
      if (!res.ok) {
        throw new Error('Failed to load questions from server');
      }
      const data: QuestionSummary[] = await res.json();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching question bank');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleApproveSingle = async (qId: string) => {
    setApprovingId(qId);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(`/api/v1/questions/${qId}/approve-rubric`, {
        method: 'POST'
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to approve rubric for ${qId}`);
      }
      // Optimistic update
      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, status: 'ACTIVE' } : q))
      );
      setActionSuccessMsg(`Successfully approved rubric for question ${qId}.`);
    } catch (err: any) {
      setError(err.message || 'Approval action failed');
    } finally {
      setApprovingId(null);
    }
  };

  const handleBulkApprove = async () => {
    setBulkApproving(true);
    setActionSuccessMsg(null);
    setShowBulkModal(false);
    try {
      const res = await fetch('/api/v1/questions/bulk-approve-rubrics', {
        method: 'POST'
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to bulk-approve rubrics');
      }
      const data = await res.json();
      setActionSuccessMsg(`Bulk approved ${data.approvedCount || 'all'} pending rubrics! All rubrics now ACTIVE.`);
      // Refresh list
      await fetchQuestions();
    } catch (err: any) {
      setError(err.message || 'Bulk approval action failed');
    } finally {
      setBulkApproving(false);
    }
  };

  // Metrics
  const totalCount = questions.length;
  const pendingCount = questions.filter((q) => q.status === 'DEFAULT_PENDING_OWNER_REVIEW').length;
  const activeCount = questions.filter((q) => q.status === 'ACTIVE').length;
  const scoredCount = questions.filter((q) => q.scored).length;

  // Filtered view
  const filteredQuestions = questions.filter((q) => {
    if (domainFilter !== 'ALL' && q.domain !== domainFilter) return false;
    if (statusFilter === 'PENDING' && q.status !== 'DEFAULT_PENDING_OWNER_REVIEW') return false;
    if (statusFilter === 'ACTIVE' && q.status !== 'ACTIVE') return false;
    if (rubricTypeFilter !== 'ALL' && q.rubricType !== rubricTypeFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchId = q.id.toLowerCase().includes(s);
      const matchText = q.canonicalText.toLowerCase().includes(s);
      const matchSec = q.section.toLowerCase().includes(s);
      if (!matchId && !matchText && !matchSec) return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            🛡️ Rubric Review & Governance
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
            Verify and approve default scoring models before pilot audit campaigns commence.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            disabled={pendingCount === 0 || bulkApproving}
            className="btn btn-primary"
            style={{ padding: '9px 18px', fontSize: '13px' }}
          >
            {bulkApproving ? 'Approving...' : `✅ Approve All Pending (${pendingCount})`}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#15803d',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>✅ {actionSuccessMsg}</span>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            style={{ color: '#15803d', fontWeight: 700, fontSize: '16px', background: 'transparent' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="alert-banner alert-danger">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Total Audit Questions
          </span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink)' }}>
            {totalCount}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Exact 72 questions from seed specification
          </span>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#b45309', textTransform: 'uppercase' }}>
            Pending Owner Review
          </span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#b45309' }}>
            {pendingCount}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Requires platform owner sign-off
          </span>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803d', textTransform: 'uppercase' }}>
            Approved & Active
          </span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#15803d' }}>
            {activeCount}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Locked for field audit execution
          </span>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>
            Scored / Analytical
          </span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>
            {scoredCount}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Contribute to institutional ACS ratings
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label className="field-label">Search Questions</label>
            <input
              type="text"
              className="input-field"
              placeholder="Search by ID, text, or section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Domain</label>
            <select className="input-field" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
              <option value="ALL">All Domains</option>
              <option value="EDUCATION">Education</option>
              <option value="WASH">WASH (Water & Sanitation)</option>
              <option value="HEALTH_NUTRITION">Health & Nutrition</option>
              <option value="GOVERNANCE">Governance & Safety</option>
            </select>
          </div>

          <div>
            <label className="field-label">Review Status</label>
            <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review ({pendingCount})</option>
              <option value="ACTIVE">Approved / Active ({activeCount})</option>
            </select>
          </div>

          <div>
            <label className="field-label">Rubric Model</label>
            <select className="input-field" value={rubricTypeFilter} onChange={(e) => setRubricTypeFilter(e.target.value)}>
              <option value="ALL">All Rubric Models</option>
              <option value="GRID_AFU">GRID_AFU (Available/Func/Used)</option>
              <option value="CHECKLIST_YNP">CHECKLIST_YNP (Yes/Part/No/NA)</option>
              <option value="YESNO_WITH_COUNT">YESNO_WITH_COUNT (Uptake Count)</option>
              <option value="RATING_1_5">RATING_1_5 (1..5 Rating)</option>
              <option value="PERCENT_THRESHOLD">PERCENT_THRESHOLD (Benchmarked %)</option>
              <option value="RATIO">RATIO (Ratio Formula)</option>
              <option value="NONE">NONE (Informational)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Review Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
            Loading questions for review...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
            No questions match the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', width: '90px' }}>ID</th>
                  <th style={{ padding: '12px 16px', width: '130px' }}>Domain</th>
                  <th style={{ padding: '12px 16px' }}>Canonical Question Text</th>
                  <th style={{ padding: '12px 16px', width: '110px' }}>Severity</th>
                  <th style={{ padding: '12px 16px', width: '160px' }}>Rubric Model</th>
                  <th style={{ padding: '12px 16px', width: '140px' }}>Status</th>
                  <th style={{ padding: '12px 16px', width: '200px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => {
                  const isPending = q.status === 'DEFAULT_PENDING_OWNER_REVIEW';
                  return (
                    <tr
                      key={q.id}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        background: isPending ? '#fffdfa' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                        {q.id}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '11px', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {q.domain}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '2px' }}>
                          {q.canonicalText}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {q.section.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: q.severity === 'CRITICAL' ? '#fee2e2' : q.severity === 'HIGH' ? '#ffedd5' : '#fef9c3',
                            color: q.severity === 'CRITICAL' ? '#991b1b' : q.severity === 'HIGH' ? '#9a3412' : '#854d0e'
                          }}
                        >
                          {q.severity} ({q.severity === 'CRITICAL' ? '3×' : q.severity === 'HIGH' ? '2×' : '1×'})
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {q.scored ? (
                          <span style={{ fontSize: '12px', background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {q.rubricType}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            Informational
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {isPending ? (
                          <span
                            style={{
                              background: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>⚠️</span> Pending Review
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#dcfce7',
                              color: '#15803d',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>✓</span> Active
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          {q.scored && (
                            <button
                              type="button"
                              onClick={() => onOpenRubricTester && onOpenRubricTester(q.id)}
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              title="Test rubric calculations in interactive sandbox"
                            >
                              ⚡ Test
                            </button>
                          )}

                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => handleApproveSingle(q.id)}
                              disabled={approvingId === q.id}
                              className="btn btn-primary"
                              style={{ padding: '5px 12px', fontSize: '12px' }}
                            >
                              {approvingId === q.id ? 'Approving...' : '✓ Approve'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', padding: '5px 8px' }}>
                              Approved
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Approval Confirmation Modal */}
      {showBulkModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div className="card" style={{ maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              Confirm Bulk Rubric Approval
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
              You are about to approve <b>{pendingCount}</b> pending question rubrics simultaneously. This will transition all questions from <code>DEFAULT_PENDING_OWNER_REVIEW</code> to <code>ACTIVE</code> status.
            </p>
            <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--ink)' }}>
              🔒 <b>Audit Guarantee:</b> This approval action will be permanently recorded in the system audit log with actor ID and client IP.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="btn btn-secondary"
                disabled={bulkApproving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkApprove}
                className="btn btn-primary"
                disabled={bulkApproving}
              >
                {bulkApproving ? 'Approving...' : `Yes, Approve All (${pendingCount})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
