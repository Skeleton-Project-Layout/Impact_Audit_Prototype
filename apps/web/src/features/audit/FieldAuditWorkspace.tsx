import React, { useState, useEffect, useRef } from 'react';
import './auditWorkspace.css';
import { SECTIONS, QUESTIONS } from './questionsData';
import { PilotLocationReportModal } from '../dashboard/PilotLocationReportModal';

export interface AuditWorkspaceProps {
  initialLocationId?: string;
  onBackToOverview?: () => void;
  onViewAnalysis?: (locationId: string) => void;
}

interface FacilityOption {
  id: string;
  code: string;
  typeLabel?: string | null;
  domain?: string | null;
  districtName?: string | null;
  blockName?: string | null;
  status: string;
}

export const FieldAuditWorkspace: React.FC<AuditWorkspaceProps> = ({
  initialLocationId,
  onBackToOverview,
  onViewAnalysis: _onViewAnalysis
}) => {
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocationId || '');
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(true);

  // Pagination: "one section per page, if someone wants to add a section it will add the page"
  const [activeSectionPages, setActiveSectionPages] = useState<number[]>([0]); // List of section indices (0..6)
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [showAddSectionModal, setShowAddSectionModal] = useState<boolean>(false);

  // Answers State: map of question key -> object with values
  // e.g. answers['question1'] = { village: 'Mawlynnong', locality: 'Block A' }
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Evidence state: map of questionId -> list of uploaded evidence files
  const [evidenceMap, setEvidenceMap] = useState<Record<string, any[]>>({});
  const [uploadingForQ, setUploadingForQ] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetQuestionForFile, setTargetQuestionForFile] = useState<number | null>(null);

  // Success Submission Modal & Report Modal
  const [submissionSuccessModal, setSubmissionSuccessModal] = useState<boolean>(false);
  const [submittedAcsScore, setSubmittedAcsScore] = useState<number | null>(null);
  const [submittedAlertBand, setSubmittedAlertBand] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const activeSectionIdx = activeSectionPages[currentPageIndex] ?? 0;
  const currentSection = SECTIONS[activeSectionIdx] || SECTIONS[0];
  const sectionQuestions = QUESTIONS.filter(q => q.s === activeSectionIdx);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch pilot facilities for target binding
  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    setLoadingFacilities(true);
    try {
      const res = await fetch('/api/v1/dashboard/overview?page=0&size=50');
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        setFacilities(items.map((i: any) => ({
          id: i.id,
          code: i.code,
          typeLabel: i.typeLabel || i.typePrefix,
          domain: i.domain,
          districtName: i.districtName,
          blockName: i.blockName,
          status: i.status
        })));

        if (!selectedLocationId && items.length > 0) {
          setSelectedLocationId(items[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load facilities', e);
    } finally {
      setLoadingFacilities(false);
    }
  };

  const selectedFacility = facilities.find(f => f.id === selectedLocationId) || facilities[0];

  // 2. Load answers when facility changes
  useEffect(() => {
    if (!selectedLocationId) return;

    // Check localStorage cache first
    const storageKey = `abhisaran_field_answers_${selectedLocationId}`;
    const cached = localStorage.getItem(storageKey);
    let initialAns: Record<string, any> = {};

    if (cached) {
      try {
        initialAns = JSON.parse(cached);
      } catch (e) {}
    } else {
      // Check legacy ahfjhabsd localStorage
      const legacyRaw = localStorage.getItem('abhisaran_field_form_v1');
      if (legacyRaw) {
        try {
          const parsed = JSON.parse(legacyRaw);
          if (Array.isArray(parsed.records) && parsed.records[0]?.answers) {
            initialAns = parsed.records[0].answers;
          }
        } catch (e) {}
      }
    }

    setAnswers(initialAns);

    // Fetch pages & answers from backend for this location
    fetchBackendPages(selectedLocationId, initialAns);
  }, [selectedLocationId]);

  const fetchBackendPages = async (locId: string, currentLocalAnswers: Record<string, any>) => {
    try {
      const res = await fetch(`/api/v1/locations/${locId}/pages`);
      if (res.ok) {
        const data = await res.json();
        const pages = data.pages || [];

        // Build evidence map from backend
        const evMap: Record<string, any[]> = {};
        pages.forEach((p: any) => {
          if (p.evidence) {
            Object.entries(p.evidence).forEach(([qId, evList]: [string, any]) => {
              evMap[qId] = evList;
            });
          }
        });
        setEvidenceMap(evMap);

        // Merge backend answers if available
        if (pages.length > 0 && pages[0].answers) {
          const merged = { ...currentLocalAnswers };
          Object.entries(pages[0].answers).forEach(([code, ansObj]: [string, any]) => {
            const numStr = code.replace(/^S0*/, '');
            const qKey = `question${numStr}`;
            if (ansObj && ansObj.value && !merged[qKey]) {
              merged[qKey] = typeof ansObj.value === 'object' ? ansObj.value : { val: ansObj.value };
            }
          });
          setAnswers(merged);
        }
      }
    } catch (e) {
      console.warn('Could not fetch backend pages for location', e);
    }
  };

  // Save answer update to state & localStorage
  const handleUpdateAnswer = (qNum: number, fieldKey: string, val: any) => {
    setAnswers(prev => {
      const qKey = `question${qNum}`;
      const qAns = { ...(prev[qKey] || {}) };
      if (val === '' || val == null || (Array.isArray(val) && val.length === 0)) {
        delete qAns[fieldKey];
      } else {
        qAns[fieldKey] = val;
      }

      const updated = { ...prev, [qKey]: qAns };
      if (selectedLocationId) {
        localStorage.setItem(`abhisaran_field_answers_${selectedLocationId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Add a section page to this audit
  const handleAddSectionPage = (secIdx: number) => {
    if (!activeSectionPages.includes(secIdx)) {
      const newPages = [...activeSectionPages, secIdx].sort((a, b) => a - b);
      setActiveSectionPages(newPages);
      setCurrentPageIndex(newPages.indexOf(secIdx));
    } else {
      setCurrentPageIndex(activeSectionPages.indexOf(secIdx));
    }
    setShowAddSectionModal(false);
    showToast(`Added Page: ${SECTIONS[secIdx].title}`);
  };

  // Remove a section page
  const handleRemoveSectionPage = (idxToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeSectionPages.length <= 1) {
      showToast('At least one section page must remain in the audit form.');
      return;
    }
    const updated = activeSectionPages.filter((_, i) => i !== idxToRemove);
    setActiveSectionPages(updated);
    if (currentPageIndex >= updated.length) {
      setCurrentPageIndex(updated.length - 1);
    }
  };

  // Handle Evidence File Upload for Question
  const handleTriggerUpload = (qNum: number) => {
    setTargetQuestionForFile(qNum);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || targetQuestionForFile == null || !selectedLocationId) return;

    setUploadingForQ(targetQuestionForFile);
    try {
      // 1. Get or create page on backend
      const pagesRes = await fetch(`/api/v1/locations/${selectedLocationId}/pages`);
      let pageId: string | null = null;
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        if (pagesData.pages && pagesData.pages.length > 0) {
          pageId = pagesData.pages[0].id;
        }
      }

      if (!pageId) {
        const newPageRes = await fetch(`/api/v1/locations/${selectedLocationId}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageNumber: 1, answers: {} })
        });
        if (newPageRes.ok) {
          const newP = await newPageRes.json();
          pageId = newP.id;
        }
      }

      if (!pageId) throw new Error('Could not initialize backend audit page');

      // 2. Upload evidence multipart
      const code = `S${String(targetQuestionForFile).padStart(2, '0')}`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('questionId', code);
      formData.append('attestation', 'true');

      const uploadRes = await fetch(`/api/v1/pages/${pageId}/evidence`, {
        method: 'POST',
        body: formData
      });

      if (uploadRes.ok) {
        const evDto = await uploadRes.json();
        setEvidenceMap(prev => ({
          ...prev,
          [code]: [...(prev[code] || []), evDto]
        }));
        showToast(`✅ Evidence attached for Q${targetQuestionForFile}: ${file.name}`);
      } else {
        throw new Error('Upload returned ' + uploadRes.status);
      }
    } catch (err: any) {
      showToast('⚠️ Evidence upload failed: ' + err.message);
    } finally {
      setUploadingForQ(null);
      setTargetQuestionForFile(null);
      if (e.target) e.target.value = '';
    }
  };

  // Submit Audit Findings to Selected Pilot Location
  const handleSubmitAuditFindings = async () => {
    if (!selectedLocationId) {
      showToast('Please select a pilot facility first.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Ensure page exists on backend
      const pagesRes = await fetch(`/api/v1/locations/${selectedLocationId}/pages`);
      let pageId: string | null = null;
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        if (pagesData.pages && pagesData.pages.length > 0) {
          pageId = pagesData.pages[0].id;
        }
      }

      if (!pageId) {
        const newPageRes = await fetch(`/api/v1/locations/${selectedLocationId}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageNumber: 1, answers: {} })
        });
        if (newPageRes.ok) {
          const newPage = await newPageRes.json();
          pageId = newPage.id;
        }
      }

      if (!pageId) throw new Error('Could not create or find an audit page on the server.');

      // 2. Format answers for backend canonical question IDs (S01, S02, etc.)
      const backendAnswers: Record<string, any> = {};
      Object.entries(answers).forEach(([qKey, qVal]) => {
        const qNum = qKey.replace('question', '');
        const code = `S${String(qNum).padStart(2, '0')}`;
        backendAnswers[code] = {
          value: qVal,
          na: false,
          notAssessed: false
        };
      });

      // Save answers batch
      await fetch(`/api/v1/pages/${pageId}/answers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: backendAnswers })
      });

      // 3. Submit location: transitions status from DRAFT -> READY_FOR_ANALYSIS
      await fetch(`/api/v1/locations/${selectedLocationId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationText: 'CONFIRM' })
      });

      // 4. Run Scoring Engine immediately
      const scoreRes = await fetch(`/api/v1/scoring/${selectedLocationId}/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setSubmittedAcsScore(scoreData.acsScore);
        setSubmittedAlertBand(scoreData.alertBand);
      }

      setSubmissionSuccessModal(true);
    } catch (err: any) {
      showToast('⚠️ Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate completion percentage for current section
  const currentSecAnsweredCount = sectionQuestions.filter(q => {
    const a = answers[`question${q.n}`];
    return a && Object.values(a).some(v => Array.isArray(v) ? v.length > 0 : String(v).trim() !== '');
  }).length;
  const currentSecPct = Math.round((currentSecAnsweredCount / (sectionQuestions.length || 1)) * 100);

  return (
    <div className="audit-workspace-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hidden file input for evidence attachment */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelected}
        accept="image/*,application/pdf,.doc,.docx"
      />

      {/* Top Header */}
      <header className="hdr" style={{ borderBottom: '2px solid var(--line)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {onBackToOverview && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBackToOverview}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              &larr; Admin Home
            </button>
          )}

          <div className="brand">
            <b>ABHISARAN FIELD AUDIT</b>
            <span>Pilot Baseline &amp; Impact Assessment</span>
          </div>

          {/* Facility Context Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>PILOT:</span>
            <select
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '13px',
                fontWeight: 600,
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                cursor: 'pointer'
              }}
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              disabled={loadingFacilities}
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} &bull; {f.typeLabel || 'Pilot'} ({f.districtName || 'District'}) &ndash; [{f.status}]
                </option>
              ))}
            </select>

            {selectedFacility && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  background: selectedFacility.status === 'ANALYSED' ? '#dcfce7' : selectedFacility.status === 'READY_FOR_ANALYSIS' ? '#dbeafe' : '#fef3c7',
                  color: selectedFacility.status === 'ANALYSED' ? '#166534' : selectedFacility.status === 'READY_FOR_ANALYSIS' ? '#1e40af' : '#92400e'
                }}
              >
                {selectedFacility.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Primary Header Action: Prominent Submit Button */}
        <div className="hdr-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmitAuditFindings}
            disabled={submitting || !selectedLocationId}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 3px 6px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            {submitting ? '⏳ Submitting...' : `⚡ Submit Findings to Pilot (${selectedFacility?.code || ''})`}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '980px', margin: '0 auto', width: '100%', padding: '20px 16px', flex: 1 }}>
        {/* Toast */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            background: '#1e293b',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
            zIndex: 999,
            fontSize: '13px',
            fontWeight: 600
          }}>
            {toastMessage}
          </div>
        )}

        {/* SECTION-PAGE TABS STRIP (One section per page + Add Page button) */}
        <section className="recbar" aria-label="Section Pages" style={{ marginBottom: '16px' }}>
          <div className="tabs" role="tablist">
            {activeSectionPages.map((secIdx, pIdx) => {
              const sec = SECTIONS[secIdx];
              const isCurrent = pIdx === currentPageIndex;

              return (
                <button
                  key={`${sec.id}-${pIdx}`}
                  type="button"
                  className="tab"
                  role="tab"
                  aria-current={isCurrent}
                  aria-selected={isCurrent}
                  onClick={() => setCurrentPageIndex(pIdx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    position: 'relative'
                  }}
                >
                  <span>Page {pIdx + 1}: {sec.id}. {sec.short}</span>
                  {activeSectionPages.length > 1 && (
                    <span
                      onClick={(e) => handleRemoveSectionPage(pIdx, e)}
                      style={{
                        marginLeft: '4px',
                        cursor: 'pointer',
                        color: isCurrent ? 'var(--accent-ink)' : 'var(--muted)',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                      title="Remove this section page"
                    >
                      &times;
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="btn add"
            onClick={() => setShowAddSectionModal(true)}
            style={{ fontWeight: 700, padding: '0 16px' }}
          >
            + Add Section Page
          </button>
        </section>

        {/* Record Header Card */}
        <section className="card rechead" style={{ marginBottom: '16px' }}>
          <div className="rechead-top">
            <div>
              <h1 style={{ fontSize: '17px', color: 'var(--ink)' }}>
                {currentSection.title}
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
                Pilot Location: <b>{selectedFacility?.code}</b> &bull; {selectedFacility?.districtName || 'East Khasi Hills'} &bull; Page {currentPageIndex + 1} of {activeSectionPages.length}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="recbadge">
                Section {currentSection.id} &bull; {sectionQuestions.length} Questions
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: currentSecPct === 100 ? '#166534' : 'var(--accent)',
                  background: currentSecPct === 100 ? '#dcfce7' : 'var(--accent-soft)',
                  padding: '4px 10px',
                  borderRadius: '999px'
                }}
              >
                {currentSecPct}% Complete
              </span>
            </div>
          </div>
        </section>

        {/* Search Questions Filter */}
        <div className="searchbox" style={{ marginBottom: '16px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
          </svg>
          <input
            type="text"
            placeholder="Search questions in this section (e.g. water, enrolment, doctors, toilets)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ACTIVE SECTION QUESTIONS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '80px' }}>
          {sectionQuestions
            .filter(q => !searchQuery || q.text.toLowerCase().includes(searchQuery.toLowerCase()) || (q.hint && q.hint.toLowerCase().includes(searchQuery.toLowerCase())))
            .map(q => {
              const qKey = `question${q.n}`;
              const qAns = answers[qKey] || {};
              const code = `S${String(q.n).padStart(2, '0')}`;
              const attachedFiles = evidenceMap[code] || [];
              const isAnswered = Object.values(qAns).some(v => Array.isArray(v) ? v.length > 0 : String(v).trim() !== '');

              return (
                <article
                  key={q.n}
                  className={`qcard ${isAnswered ? 'done' : ''}`}
                  id={`card-${q.n}`}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Question Header */}
                  <div className="qhead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span className="qnum" style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isAnswered ? '#10b981' : 'var(--surface-2)',
                        color: isAnswered ? '#ffffff' : 'var(--ink)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                        flexShrink: 0
                      }}>
                        {q.n}
                      </span>
                      <div>
                        <h3 className="qtext" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                          {q.text}
                        </h3>
                        {q.hint && (
                          <p className="qhint" style={{ fontSize: '12px', color: 'var(--muted)', margin: '3px 0 0 0' }}>
                            {q.hint}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Question Evidence Attachment Button */}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleTriggerUpload(q.n)}
                      disabled={uploadingForQ === q.n}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '6px'
                      }}
                      title="Attach photo or documentary evidence to this question"
                    >
                      {uploadingForQ === q.n ? '⏳ Uploading...' : `📎 Attach Evidence (${attachedFiles.length})`}
                    </button>
                  </div>

                  {/* Render Question Fields based on types */}
                  <div className="qbody" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {q.fields.map(f => {
                      const val = qAns[f.k] ?? '';

                      if (f.type === 'text') {
                        return (
                          <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {f.label && <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>{f.label}</label>}
                            <input
                              type="text"
                              value={val}
                              placeholder={f.ph || f.label}
                              onChange={(e) => handleUpdateAnswer(q.n, f.k, e.target.value)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--line)',
                                background: 'var(--surface)',
                                color: 'var(--ink)',
                                fontSize: '14px'
                              }}
                            />
                          </div>
                        );
                      }

                      if (f.type === 'number') {
                        return (
                          <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {f.label && <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>{f.label}</label>}
                            <input
                              type="number"
                              value={val}
                              placeholder={f.label}
                              max={f.max}
                              step={f.dec ? '0.1' : '1'}
                              onChange={(e) => handleUpdateAnswer(q.n, f.k, e.target.value)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--line)',
                                background: 'var(--surface)',
                                color: 'var(--ink)',
                                fontSize: '14px',
                                maxWidth: '240px'
                              }}
                            />
                          </div>
                        );
                      }

                      if (f.type === 'area') {
                        return (
                          <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {f.label && <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>{f.label}</label>}
                            <textarea
                              rows={f.rowsNum || 2}
                              value={val}
                              placeholder={f.label}
                              onChange={(e) => handleUpdateAnswer(q.n, f.k, e.target.value)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--line)',
                                background: 'var(--surface)',
                                color: 'var(--ink)',
                                fontSize: '14px',
                                resize: 'vertical'
                              }}
                            />
                          </div>
                        );
                      }

                      if (f.type === 'radio' && f.opts) {
                        return (
                          <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {f.label && <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>{f.label}</label>}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {f.opts.map(opt => {
                                const isSelected = val === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleUpdateAnswer(q.n, f.k, isSelected ? '' : opt)}
                                    style={{
                                      padding: '6px 14px',
                                      borderRadius: '20px',
                                      border: isSelected ? '1px solid #10b981' : '1px solid var(--line)',
                                      background: isSelected ? '#10b981' : 'var(--surface-2)',
                                      color: isSelected ? '#ffffff' : 'var(--ink)',
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      if (f.type === 'check' && f.opts) {
                        const checkedList: string[] = Array.isArray(val) ? val : [];
                        return (
                          <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {f.label && <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>{f.label}</label>}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {f.opts.map(opt => {
                                const isChecked = checkedList.includes(opt);
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      const updated = isChecked
                                        ? checkedList.filter(x => x !== opt)
                                        : [...checkedList, opt];
                                      handleUpdateAnswer(q.n, f.k, updated);
                                    }}
                                    style={{
                                      padding: '6px 14px',
                                      borderRadius: '20px',
                                      border: isChecked ? '1px solid #3b82f6' : '1px solid var(--line)',
                                      background: isChecked ? '#3b82f6' : 'var(--surface-2)',
                                      color: isChecked ? '#ffffff' : 'var(--ink)',
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {isChecked ? '✓ ' : ''}{opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      if (f.type === 'grid' && f.rows && f.cols) {
                        const gridState = typeof val === 'object' ? val : {};
                        return (
                          <div key={f.k} style={{ overflowX: 'auto', margin: '4px 0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ background: 'var(--surface-2)' }}>
                                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--line)' }}>Facility Indicator</th>
                                  {f.cols.map(c => (
                                    <th key={c.k} style={{ padding: '8px', textAlign: 'center', border: '1px solid var(--line)' }}>{c.label}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {f.rows.map(r => (
                                  <tr key={r.k}>
                                    <td style={{ padding: '8px', border: '1px solid var(--line)', fontWeight: 600 }}>{r.label}</td>
                                    {f.cols!.map(c => {
                                      const isCellChecked = gridState[r.k]?.[c.k] === true;
                                      return (
                                        <td key={c.k} style={{ textAlign: 'center', border: '1px solid var(--line)', padding: '6px' }}>
                                          <input
                                            type="checkbox"
                                            checked={isCellChecked}
                                            onChange={(e) => {
                                              const rowObj = { ...(gridState[r.k] || {}) };
                                              rowObj[c.k] = e.target.checked;
                                              const updatedGrid = { ...gridState, [r.k]: rowObj };
                                              handleUpdateAnswer(q.n, f.k, updatedGrid);
                                            }}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                          />
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>

                  {/* Attached Evidence List for this Question */}
                  {attachedFiles.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed var(--line)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {attachedFiles.map((ev, i) => (
                        <a
                          key={ev.id || i}
                          href={`/api/v1/evidence/${ev.id}/file`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#dcfce7',
                            color: '#166534',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          📎 {ev.fileName || `Evidence_${i + 1}`} (View)
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
        </div>
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <nav className="bottombar" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        padding: '12px 20px',
        zIndex: 50,
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          maxWidth: '980px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentPageIndex === 0}
              onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              &#8249; Previous Page
            </button>

            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>
              Page {currentPageIndex + 1} of {activeSectionPages.length} ({currentSection.id}. {currentSection.short})
            </span>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentPageIndex === activeSectionPages.length - 1}
              onClick={() => setCurrentPageIndex(prev => Math.min(activeSectionPages.length - 1, prev + 1))}
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              Next Page &#8250;
            </button>
          </div>

          {/* Primary Action Button: Submit to Pilot */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmitAuditFindings}
            disabled={submitting || !selectedLocationId}
            style={{
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            {submitting ? '⏳ Submitting...' : `⚡ Submit Findings to Pilot (${selectedFacility?.code || ''})`}
          </button>
        </div>
      </nav>

      {/* ADD SECTION PAGE MODAL */}
      {showAddSectionModal && (
        <div className="pilot-modal-scrim" onClick={() => setShowAddSectionModal(false)}>
          <div className="pilot-modal-container" style={{ maxWidth: '540px', height: 'auto', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>
              Add a Section Page to this Audit
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px 0' }}>
              Select an assessment section to add as an active page for pilot <b>{selectedFacility?.code}</b>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {SECTIONS.map(s => {
                const isAdded = activeSectionPages.includes(s.idx);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleAddSectionPage(s.idx)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: isAdded ? '1px solid #10b981' : '1px solid var(--line)',
                      background: isAdded ? '#f0fdf4' : 'var(--surface-2)',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <b style={{ fontSize: '14px', color: 'var(--ink)' }}>{s.id}. {s.short}</b>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Domain: {s.domain}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isAdded ? '#166534' : '#2563eb' }}>
                      {isAdded ? '✓ Active Page' : '+ Add Page'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddSectionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION SUCCESS MODAL */}
      {submissionSuccessModal && (
        <div className="pilot-modal-scrim">
          <div className="pilot-modal-container" style={{ maxWidth: '580px', height: 'auto', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--ink)' }}>
              Audit Findings Successfully Submitted!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 20px 0' }}>
              Findings for pilot <b>{selectedFacility?.code}</b> have been submitted to the database and analyzed by the scoring engine.
            </p>

            {submittedAcsScore != null && (
              <div style={{
                background: 'var(--surface-2)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Computed ACS Score</span>
                <span style={{ fontSize: '36px', fontWeight: 800, color: '#166534' }}>{Number(submittedAcsScore).toFixed(1)} <small style={{ fontSize: '16px', color: 'var(--muted)' }}>/ 100</small></span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>Alert Band: {submittedAlertBand || 'OPTIMAL'}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSubmissionSuccessModal(false);
                  setShowReportModal(true);
                }}
                style={{ padding: '10px 20px', fontWeight: 700 }}
              >
                📊 View Colour-Coded Report
              </button>
              {onBackToOverview && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onBackToOverview}
                  style={{ padding: '10px 20px' }}
                >
                  ← Back to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP REPORT MODAL */}
      {showReportModal && selectedFacility && (
        <PilotLocationReportModal
          locationId={selectedFacility.id}
          facilityCode={selectedFacility.code}
          typeLabel={selectedFacility.typeLabel}
          domain={selectedFacility.domain}
          districtName={selectedFacility.districtName}
          blockName={selectedFacility.blockName}
          initialStatus="ANALYSED"
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
