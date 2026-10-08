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
  evidenceEnabled: boolean;
  evidenceHint?: string;
  active: boolean;
  latestVersionNumber: number;
  status: string;
  totalVersions: number;
  displayOrder: number;
}

export interface QuestionDetail extends QuestionSummary {
  versionNumber: number;
  text: string;
  hint?: string;
  redFlagLogic?: string;
  suggestedIntervention?: string;
  rubricConfig: Record<string, any>;
  fieldsSchema: any[];
  alertOverrides?: Record<string, any>;
  versionHistory: {
    id: string;
    versionNumber: number;
    text: string;
    severity: string;
    scored: boolean;
    status: string;
    createdAt: string;
  }[];
}

interface QuestionBankScreenProps {
  onOpenRubricTester?: (questionId: string) => void;
}

export const QuestionBankScreen: React.FC<QuestionBankScreenProps> = ({ onOpenRubricTester }) => {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [scoredFilter, setScoredFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected for edit/history modal
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<QuestionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Edit form state
  const [editText, setEditText] = useState<string>('');
  const [editHint, setEditHint] = useState<string>('');
  const [editSeverity, setEditSeverity] = useState<string>('HIGH');
  const [editScored, setEditScored] = useState<boolean>(true);
  const [editEvidenceEnabled, setEditEvidenceEnabled] = useState<boolean>(false);
  const [editEvidenceHint, setEditEvidenceHint] = useState<string>('');
  const [editRedFlagLogic, setEditRedFlagLogic] = useState<string>('');
  const [editSuggestedIntervention, setEditSuggestedIntervention] = useState<string>('');
  const [editChangeReason, setEditChangeReason] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (domainFilter !== 'ALL') params.append('domain', domainFilter);
      if (sectionFilter !== 'ALL') params.append('section', sectionFilter);
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (scoredFilter === 'SCORED') params.append('scored', 'true');
      if (scoredFilter === 'INFO') params.append('scored', 'false');
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/v1/questions?${params.toString()}`);
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
  }, [domainFilter, sectionFilter, severityFilter, scoredFilter, statusFilter, search]);

  const loadQuestionDetail = async (id: string, openEdit: boolean = false) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/v1/questions/${id}`);
      if (!res.ok) throw new Error('Failed to load question details');
      const detail: QuestionDetail = await res.json();
      setSelectedDetail(detail);
      setSelectedQuestionId(id);

      if (openEdit) {
        setEditText(detail.text || detail.canonicalText);
        setEditHint(detail.hint || '');
        setEditSeverity(detail.severity);
        setEditScored(detail.scored);
        setEditEvidenceEnabled(detail.evidenceEnabled);
        setEditEvidenceHint(detail.evidenceHint || '');
        setEditRedFlagLogic(detail.redFlagLogic || '');
        setEditSuggestedIntervention(detail.suggestedIntervention || '');
        setEditChangeReason('');
        setSaveSuccessMsg(null);
        setShowEditModal(true);
      } else {
        setShowHistoryModal(true);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveVersionBump = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionId) return;

    if (!editChangeReason.trim()) {
      alert('A change reason is required for the immutable audit log trail.');
      return;
    }

    setSavingEdit(true);
    setSaveSuccessMsg(null);
    try {
      const payload = {
        text: editText.trim(),
        hint: editHint.trim() || null,
        severity: editSeverity,
        scored: editScored,
        evidenceEnabled: editEvidenceEnabled,
        evidenceHint: editEvidenceHint.trim() || null,
        redFlagLogic: editRedFlagLogic.trim() || null,
        suggestedIntervention: editSuggestedIntervention.trim() || null,
        changeReason: editChangeReason.trim()
      };

      const res = await fetch(`/api/v1/questions/${selectedQuestionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update question');
      }

      const updated: QuestionDetail = await res.json();
      setSaveSuccessMsg(`Success! Version ${updated.versionNumber} created. Previous versions remain immutable.`);
      fetchQuestions();
      setSelectedDetail(updated);
    } catch (err: any) {
      alert(err.message || 'Error creating new question version');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/v1/questions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stat counters
  const totalCount = questions.length;
  const scoredCount = questions.filter(q => q.scored).length;
  const evidenceCount = questions.filter(q => q.evidenceEnabled).length;
  const pendingReviewCount = questions.filter(q => q.status === 'DEFAULT_PENDING_OWNER_REVIEW').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Title & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--ink)' }}>
            Master Question Bank
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--muted)' }}>
            72 de-duplicated audit questions with immutable versioning and deterministic rubrics.
          </p>
        </div>
      </div>

      {/* Top Stat Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Total Questions</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>{totalCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Cataloged in Registry</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Scored Indicators</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)', marginTop: '4px' }}>{scoredCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Contributes to ACS Score</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Evidence Enabled</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ok)', marginTop: '4px' }}>{evidenceCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Photo / Document Upload</div>
        </div>
        <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Pending Review</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: pendingReviewCount > 0 ? '#f59e0b' : 'var(--muted)', marginTop: '4px' }}>
            {pendingReviewCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Default Rubric Approvals</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by ID (e.g. S03) or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 240px',
            padding: '9px 12px',
            borderRadius: '6px',
            border: '1px solid var(--line)',
            background: 'var(--surface-2)',
            color: 'var(--ink)',
            fontSize: '14px'
          }}
        />

        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '13px' }}
        >
          <option value="ALL">All Domains</option>
          <option value="SCHOOL">School</option>
          <option value="ANGANWADI">Anganwadi</option>
          <option value="HEALTH">Health</option>
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '13px' }}
        >
          <option value="ALL">All Sections</option>
          <option value="COMMUNITY_PROFILE">Community Profile</option>
          <option value="SCHOOL">School</option>
          <option value="ANGANWADI">Anganwadi</option>
          <option value="HEALTH">Health</option>
          <option value="COMMUNITY_INTERACTION">Community Interaction</option>
          <option value="PHYSICAL_VERIFICATION">Physical Verification</option>
          <option value="SUMMARY">Summary</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '13px' }}
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
        </select>

        <select
          value={scoredFilter}
          onChange={(e) => setScoredFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '13px' }}
        >
          <option value="ALL">All Scored Types</option>
          <option value="SCORED">Scored Indicators (31)</option>
          <option value="INFO">Informational Only (41)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '13px' }}
        >
          <option value="ALL">All Review Statuses</option>
          <option value="ACTIVE">Active (Approved)</option>
          <option value="DEFAULT_PENDING_OWNER_REVIEW">Pending Owner Review</option>
        </select>

        {(search || domainFilter !== 'ALL' || sectionFilter !== 'ALL' || severityFilter !== 'ALL' || scoredFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearch('');
              setDomainFilter('ALL');
              setSectionFilter('ALL');
              setSeverityFilter('ALL');
              setScoredFilter('ALL');
              setStatusFilter('ALL');
            }}
            style={{
              padding: '9px 14px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Error / Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          Loading master questions from PostgreSQL...
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Questions List */}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: '10px', border: '1px dashed var(--line)', color: 'var(--muted)' }}>
              No questions found matching your filter criteria.
            </div>
          ) : (
            questions.map((q) => {
              const severityColor =
                q.severity === 'CRITICAL' ? '#dc2626' : q.severity === 'HIGH' ? '#ea580c' : '#d97706';
              const severityBg =
                q.severity === 'CRITICAL' ? '#fef2f2' : q.severity === 'HIGH' ? '#fff7ed' : '#fffbeb';

              return (
                <div
                  key={q.id}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    opacity: q.active ? 1 : 0.6,
                    boxShadow: 'var(--shadow)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: 'var(--accent-soft)',
                          color: 'var(--accent)',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}
                      >
                        {q.id}
                      </span>
                      <span
                        style={{
                          background: 'var(--surface-2)',
                          color: 'var(--muted)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}
                      >
                        {q.domain}
                      </span>
                      <span
                        style={{
                          background: 'var(--surface-2)',
                          color: 'var(--muted)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 500
                        }}
                      >
                        {q.section.replace(/_/g, ' ')}
                      </span>
                      <span
                        style={{
                          background: severityBg,
                          color: severityColor,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        {q.severity}
                      </span>
                      {q.scored ? (
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          SCORED: {q.rubricType}
                        </span>
                      ) : (
                        <span
                          style={{
                            background: 'var(--surface-2)',
                            color: 'var(--muted)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 500
                          }}
                        >
                          INFO (UNSCORED)
                        </span>
                      )}
                      {q.evidenceEnabled && (
                        <span
                          style={{
                            background: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #bbf7d0',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                          title={q.evidenceHint || 'Evidence upload enabled'}
                        >
                          📷 Evidence Allowed
                        </span>
                      )}
                      <span
                        style={{
                          background: 'var(--accent-soft)',
                          color: 'var(--accent)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        v{q.latestVersionNumber}
                      </span>
                      {q.status === 'DEFAULT_PENDING_OWNER_REVIEW' && (
                        <span
                          style={{
                            background: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          Pending Review
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {q.scored && (
                        <button
                          onClick={() => onOpenRubricTester && onOpenRubricTester(q.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--accent)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ⚡ Test Rubric
                        </button>
                      )}
                      <button
                        onClick={() => loadQuestionDetail(q.id, true)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--surface-2)',
                          color: 'var(--ink)',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        Edit (Bump v{q.latestVersionNumber + 1})
                      </button>
                      <button
                        onClick={() => loadQuestionDetail(q.id, false)}
                        style={{
                          padding: '6px 10px',
                          background: 'transparent',
                          color: 'var(--muted)',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        History ({q.totalVersions})
                      </button>
                      <button
                        onClick={() => handleToggleActive(q.id, q.active)}
                        style={{
                          padding: '6px 8px',
                          background: 'transparent',
                          color: q.active ? 'var(--muted)' : 'var(--ok)',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                        title={q.active ? 'Deactivate question' : 'Activate question'}
                      >
                        {q.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4 }}>
                    {q.canonicalText}
                  </div>

                  {q.evidenceHint && (
                    <div style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>
                      Evidence guidance: {q.evidenceHint}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit / Version Bump Modal */}
      {showEditModal && selectedDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '12px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>
                  Edit Question {selectedDetail.id} &rarr; Create Version {selectedDetail.versionNumber + 1}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                  Strict Invariant: Prior version {selectedDetail.versionNumber} remains immutable in the database.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--muted)' }}
              >
                &times;
              </button>
            </div>

            {detailLoading && (
              <div style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: '6px', fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
                Fetching latest version snapshot...
              </div>
            )}

            {saveSuccessMsg && (
              <div style={{ padding: '12px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {saveSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveVersionBump} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink)', marginBottom: '4px' }}>
                  Question Text:
                </label>
                <textarea
                  rows={3}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink)', marginBottom: '4px' }}>
                  Helper Hint / Field Guidance:
                </label>
                <input
                  type="text"
                  value={editHint}
                  onChange={(e) => setEditHint(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink)', marginBottom: '4px' }}>
                    Severity Level:
                  </label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '13px' }}
                  >
                    <option value="CRITICAL">Critical (Weight 3)</option>
                    <option value="HIGH">High (Weight 2)</option>
                    <option value="MEDIUM">Medium (Weight 1)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink)', marginBottom: '4px' }}>
                    Scored in ACS:
                  </label>
                  <select
                    value={editScored ? 'true' : 'false'}
                    onChange={(e) => setEditScored(e.target.value === 'true')}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '13px' }}
                  >
                    <option value="true">Yes — Scored Indicator</option>
                    <option value="false">No — Informational Only</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editEvidenceEnabled}
                    onChange={(e) => setEditEvidenceEnabled(e.target.checked)}
                  />
                  Allow evidence upload for this question (Field Form Upload Box)
                </label>
                {editEvidenceEnabled && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                      Evidence helper guidance / register title:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Admission register / Attendance book photograph"
                      value={editEvidenceHint}
                      onChange={(e) => setEditEvidenceHint(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '13px' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink)', marginBottom: '4px' }}>
                  Red Flag Trigger Logic:
                </label>
                <input
                  type="text"
                  value={editRedFlagLogic}
                  onChange={(e) => setEditRedFlagLogic(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink)', marginBottom: '4px' }}>
                  Suggested Government Intervention:
                </label>
                <input
                  type="text"
                  value={editSuggestedIntervention}
                  onChange={(e) => setEditSuggestedIntervention(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                  Change Reason (Mandatory Audit Log Entry):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Revised threshold for Q3 2026 pilot monitoring"
                  value={editChangeReason}
                  onChange={(e) => setEditChangeReason(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: savingEdit ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingEdit ? 'Creating v' + (selectedDetail.versionNumber + 1) + '...' : 'Create Version ' + (selectedDetail.versionNumber + 1)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showHistoryModal && selectedDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '12px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>
                  Version History: {selectedDetail.id}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                  Total {selectedDetail.versionHistory.length} immutable snapshots preserved.
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--muted)' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedDetail.versionHistory.map((vh) => (
                <div
                  key={vh.id}
                  style={{
                    padding: '14px',
                    background: 'var(--surface-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>
                        Version {vh.versionNumber}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: vh.status === 'ACTIVE' ? '#dcfce7' : '#fffbeb',
                          color: vh.status === 'ACTIVE' ? '#15803d' : '#b45309'
                        }}
                      >
                        {vh.status}
                      </span>
                      <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'var(--surface)', color: 'var(--muted)' }}>
                        {vh.severity}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {new Date(vh.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
                    {vh.text}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
