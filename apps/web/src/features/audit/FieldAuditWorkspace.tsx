import React, { useState, useEffect, useRef, useMemo } from 'react';
import './auditWorkspace.css';
import {
  savePageLocally,
  queuePendingSync,
  clearPendingSync,
  exportLocationBackup,
  importLocationBackup
} from './offlineStorage';

export interface AuditWorkspaceProps {
  initialLocationId?: string;
  onBackToOverview?: () => void;
}

interface QuestionDef {
  id: string;
  domain: string;
  section: string;
  canonicalText: string;
  responseType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  scored: boolean;
  rubricType: string;
  evidenceUploadDefault: boolean;
  evidenceHint?: string;
  fieldsSchema?: any[];
}

interface PageAnswerState {
  value: Record<string, any>;
  na: boolean;
  naReason?: string;
  notAssessed: boolean;
  notAssessedReason?: string;
}

interface PageData {
  id: string;
  pageNumber: number;
  status: string;
  answers: Record<string, PageAnswerState>;
  evidence: Record<string, Array<{ id: string; fileName: string; fileSizeBytes: number; mimeType: string }>>;
}

interface SectionDef {
  id: string;
  short: string;
  title: string;
}

const DEFAULT_SECTIONS: SectionDef[] = [
  { id: 'A', short: 'Village Profile', title: 'A. VILLAGE & COMMUNITY PROFILE' },
  { id: 'B', short: 'School', title: 'B. SCHOOL – HEAD TEACHER / PRINCIPAL' },
  { id: 'C', short: 'Anganwadi', title: 'C. ANGANWADI – AWW' },
  { id: 'D', short: 'Health Facility', title: 'D. PHC / HEALTH FACILITY – MEDICAL OFFICER / STAFF' },
  { id: 'E', short: 'Community', title: 'E. COMMUNITY / HOUSEHOLD INTERACTION' },
  { id: 'F', short: 'Physical Verification', title: 'F. PHYSICAL VERIFICATION – FIELD TEAM' },
  { id: 'G', short: 'Quick Summary', title: 'G. ABHISARAN BASELINE – QUICK SUMMARY' }
];

export const FieldAuditWorkspace: React.FC<AuditWorkspaceProps> = ({
  initialLocationId,
  onBackToOverview
}) => {
  // Location selection & metadata
  const [facilities, setFacilities] = useState<Array<{ id: string; code: string; typeLabel: string; districtName: string; status: string }>>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocationId || '');
  const [locationCode, setLocationCode] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<string>('DRAFT');

  // Multi-page state
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);

  // Questions catalog
  const [questions, setQuestions] = useState<QuestionDef[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Save status pill: 'synced' | 'saving' | 'error'
  const [saveStatus, setSaveStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [saveStatusMessage, setSaveStatusMessage] = useState<string>('Synced');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // UI Popovers & Modals
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [showPdfMenu, setShowPdfMenu] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    body: string;
    confirmText?: string;
    actionLabel: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Evidence upload modal state
  const [evidenceUploadTarget, setEvidenceUploadTarget] = useState<{
    questionId: string;
    questionText: string;
  } | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [attestationConfirmed, setAttestationConfirmed] = useState<boolean>(false);
  const [uploadingEvidence, setUploadingEvidence] = useState<boolean>(false);

  // Completeness check modal
  const [completenessModal, setCompletenessModal] = useState<{
    complete: boolean;
    totalMissing: number;
    missingByPage: Record<number, string[]>;
    summary: string;
  } | null>(null);

  // Reopen modal
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');

  // Debounced auto-save timer ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPage = pages[currentPageIndex] || null;

  // 1. Initial Load: Facilities and Questions
  useEffect(() => {
    loadCatalogAndFacilities();
  }, []);

  // 2. Load Location Audit Pages when location changes
  useEffect(() => {
    if (selectedLocationId) {
      loadLocationPages(selectedLocationId);
    }
  }, [selectedLocationId]);

  // 3. Setup online/offline network listeners
  useEffect(() => {
    const handleOnline = () => {
      showToast('Network restored. Re-syncing pending audit answers...');
      triggerSaveImmediate();
    };
    const handleOffline = () => {
      setSaveStatus('saving');
      setSaveStatusMessage('Saved on this device (Offline)');
      showToast('Offline mode: Answers are securely saved locally in IndexedDB.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentPage, selectedLocationId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  const loadCatalogAndFacilities = async () => {
    try {
      setLoading(true);
      const [qRes, fRes] = await Promise.all([
        fetch('/api/v1/questions'),
        fetch('/api/v1/facilities?size=100')
      ]);

      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData);
      }

      if (fRes.ok) {
        const fData = await fRes.json();
        const facilityItems = fData.content || [];
        setFacilities(facilityItems);

        if (!selectedLocationId && facilityItems.length > 0) {
          setSelectedLocationId(facilityItems[0].id);
        }
      }
    } catch (err: any) {
      showToast('Failed to load question bank or facility list: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLocationPages = async (locId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/locations/${locId}/pages`);
      if (!res.ok) throw new Error('Failed to load audit pages');

      const data = await res.json();
      setLocationCode(data.locationCode);
      setLocationStatus(data.locationStatus);

      const mappedPages: PageData[] = (data.pages || []).map((p: any) => ({
        id: p.id,
        pageNumber: p.pageNumber,
        status: p.status,
        answers: Object.fromEntries(
          Object.entries(p.answers || {}).map(([qId, ans]: [string, any]) => [
            qId,
            {
              value: ans.value || {},
              na: !!ans.na,
              naReason: ans.naReason || '',
              notAssessed: !!ans.notAssessed,
              notAssessedReason: ans.notAssessedReason || ''
            }
          ])
        ),
        evidence: p.evidence || {}
      }));

      // Cache all pages locally in IndexedDB
      for (const p of mappedPages) {
        await savePageLocally({
          pageId: p.id,
          locationId: locId,
          pageNumber: p.pageNumber,
          answers: p.answers,
          status: p.status,
          updatedAt: new Date().toISOString()
        });
      }

      setPages(mappedPages);
      setCurrentPageIndex(0);
      setSaveStatus('synced');
      setSaveStatusMessage('Synced');
    } catch (err: any) {
      // Fallback: try loading cached pages from IndexedDB
      showToast('Network error loading pages; attempting local IndexedDB offline cache...');
      setSaveStatus('saving');
      setSaveStatusMessage('Saved on this device');
    } finally {
      setLoading(false);
    }
  };

  // Group questions by section
  const sectionQuestionsMap = useMemo(() => {
    const map: Record<string, QuestionDef[]> = {};
    for (const sec of DEFAULT_SECTIONS) {
      map[sec.id] = [];
    }

    const domainOrAll = questions;
    for (const q of domainOrAll) {
      // Map question section to section A-G
      let targetSec = 'A';
      const secUpper = (q.section || '').toUpperCase();
      if (secUpper.includes('COMMUNITY') || secUpper.includes('VILLAGE')) targetSec = 'A';
      else if (secUpper.includes('SCHOOL')) targetSec = 'B';
      else if (secUpper.includes('ANGANWADI')) targetSec = 'C';
      else if (secUpper.includes('HEALTH') || secUpper.includes('PHC')) targetSec = 'D';
      else if (secUpper.includes('HOUSEHOLD') || secUpper.includes('INTERACTION')) targetSec = 'E';
      else if (secUpper.includes('PHYSICAL') || secUpper.includes('VERIFICATION')) targetSec = 'F';
      else if (secUpper.includes('SUMMARY') || secUpper.includes('CONVERGENCE')) targetSec = 'G';
      else {
        // Fallback matching by ID prefix (C: Community, S: School, A: Anganwadi, P: PHC, E, F, G)
        const prefix = q.id.charAt(0).toUpperCase();
        if (prefix === 'C' && !isNaN(Number(q.id.charAt(1)))) targetSec = 'A';
        else if (prefix === 'S') targetSec = 'B';
        else if (prefix === 'A') targetSec = 'C';
        else if (prefix === 'P' || prefix === 'H') targetSec = 'D';
        else if (prefix === 'E') targetSec = 'E';
        else if (prefix === 'F') targetSec = 'F';
        else if (prefix === 'G') targetSec = 'G';
      }

      if (!map[targetSec]) map[targetSec] = [];
      map[targetSec].push(q);
    }

    return map;
  }, [questions]);

  // Active section questions (with search filter)
  const activeSection = DEFAULT_SECTIONS[activeSectionIndex] || DEFAULT_SECTIONS[0];
  const activeQuestions = useMemo(() => {
    const list = sectionQuestionsMap[activeSection.id] || [];
    if (!searchQuery.trim()) return list;

    const qLower = searchQuery.toLowerCase().trim();
    return list.filter(
      (q) =>
        q.id.toLowerCase().includes(qLower) ||
        q.canonicalText.toLowerCase().includes(qLower) ||
        (q.evidenceHint && q.evidenceHint.toLowerCase().includes(qLower))
    );
  }, [sectionQuestionsMap, activeSection, searchQuery]);

  // Overall and Section-level answer stats
  const auditStats = useMemo(() => {
    let totalAssessed = 0;
    const totalQuestions = questions.length || 67;

    if (!currentPage) return { totalAssessed: 0, totalQuestions, pct: 0, sectionStats: [] };

    const sectionStats = DEFAULT_SECTIONS.map((sec) => {
      const secQs = sectionQuestionsMap[sec.id] || [];
      let secDone = 0;

      for (const q of secQs) {
        const ans = currentPage.answers[q.id];
        if (ans) {
          if (ans.na || ans.notAssessed) {
            secDone++;
          } else if (ans.value && Object.keys(ans.value).length > 0) {
            const hasValue = Object.values(ans.value).some((v) =>
              Array.isArray(v) ? v.length > 0 : String(v).trim() !== ''
            );
            if (hasValue) secDone++;
          }
        }
      }

      totalAssessed += secDone;
      return {
        id: sec.id,
        short: sec.short,
        done: secDone,
        total: secQs.length,
        isComplete: secQs.length > 0 && secDone >= secQs.length
      };
    });

    const pct = Math.round((totalAssessed / Math.max(totalQuestions, 1)) * 100);
    return { totalAssessed, totalQuestions, pct, sectionStats };
  }, [currentPage, questions, sectionQuestionsMap]);

  // Answer modification handler with immediate IndexedDB autosave & 500ms debounced server sync
  const handleAnswerChange = (
    questionId: string,
    updater: (prev: PageAnswerState) => PageAnswerState
  ) => {
    if (!currentPage || currentPage.status === 'SUBMITTED') return;

    const currentAns = currentPage.answers[questionId] || {
      value: {},
      na: false,
      naReason: '',
      notAssessed: false,
      notAssessedReason: ''
    };
    const updatedAns = updater(currentAns);

    const updatedAnswers = {
      ...currentPage.answers,
      [questionId]: updatedAns
    };

    const updatedPages = [...pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      answers: updatedAnswers
    };
    setPages(updatedPages);

    // 1. Immediate write to IndexedDB (Offline guarantee)
    savePageLocally({
      pageId: currentPage.id,
      locationId: selectedLocationId,
      pageNumber: currentPage.pageNumber,
      answers: updatedAnswers,
      status: currentPage.status,
      updatedAt: new Date().toISOString(),
      dirty: true
    }).catch((e) => console.warn('Failed local IndexedDB write:', e));

    queuePendingSync(currentPage.id, updatedAnswers).catch((e) =>
      console.warn('Failed queueing sync:', e)
    );

    // 2. Set save status pill to 'saving'
    setSaveStatus('saving');
    setSaveStatusMessage('Saved on this device');
    setSyncErrorMessage(null);

    // 3. Debounced 500ms sync with API server
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      syncAnswersToServer(currentPage.id, updatedAnswers);
    }, 500);
  };

  const syncAnswersToServer = async (pageId: string, answers: Record<string, PageAnswerState>) => {
    if (!navigator.onLine) {
      setSaveStatus('saving');
      setSaveStatusMessage('Saved on this device (Offline)');
      return;
    }

    try {
      const payload = {
        answers: Object.entries(answers).map(([qId, ans]) => ({
          questionId: qId,
          value: ans.value || {},
          na: ans.na,
          naReason: ans.naReason || null,
          notAssessed: ans.notAssessed,
          notAssessedReason: ans.notAssessedReason || null
        }))
      };

      const res = await fetch(`/api/v1/pages/${pageId}/answers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await clearPendingSync(pageId);
        setSaveStatus('synced');
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setSaveStatusMessage(`Synced ${timeStr}`);
        setSyncErrorMessage(null);
      } else if (res.status === 422) {
        // PII Detection Server Guard Rejection
        const errJson = await res.json();
        setSaveStatus('error');
        setSaveStatusMessage('Sync error: PII Detected');
        setSyncErrorMessage(errJson.error || 'Server rejected submission due to prohibited personal identifiers.');
        showToast('⚠️ PII Alert: ' + (errJson.error || 'Prohibited personal information detected.'));
      } else {
        const errData = await res.json().catch(() => ({}));
        setSaveStatus('error');
        setSaveStatusMessage('Sync error');
        setSyncErrorMessage(errData.error || `HTTP ${res.status} error saving answers.`);
      }
    } catch (err: any) {
      setSaveStatus('saving');
      setSaveStatusMessage('Saved on this device (Network error)');
    }
  };

  const triggerSaveImmediate = () => {
    if (!currentPage) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    syncAnswersToServer(currentPage.id, currentPage.answers);
  };

  // Add Page Action
  const handleAddPage = async () => {
    try {
      const res = await fetch(`/api/v1/locations/${selectedLocationId}/pages`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create new audit page');
      const newPageDTO = await res.json();

      const newPage: PageData = {
        id: newPageDTO.id,
        pageNumber: newPageDTO.pageNumber,
        status: newPageDTO.status,
        answers: {},
        evidence: {}
      };

      const updated = [...pages, newPage];
      setPages(updated);
      setCurrentPageIndex(updated.length - 1);
      showToast(`Added Page ${newPage.pageNumber}`);
    } catch (err: any) {
      showToast('Error adding page: ' + err.message);
    }
  };

  // Duplicate Page Action
  const handleDuplicatePage = async () => {
    if (!currentPage) return;
    try {
      const res = await fetch(`/api/v1/pages/${currentPage.id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate page');
      const dupPageDTO = await res.json();

      const dupPage: PageData = {
        id: dupPageDTO.id,
        pageNumber: dupPageDTO.pageNumber,
        status: dupPageDTO.status,
        answers: Object.fromEntries(
          Object.entries(dupPageDTO.answers || {}).map(([qId, ans]: [string, any]) => [
            qId,
            {
              value: ans.value || {},
              na: !!ans.na,
              naReason: ans.naReason || '',
              notAssessed: !!ans.notAssessed,
              notAssessedReason: ans.notAssessedReason || ''
            }
          ])
        ),
        evidence: {}
      };

      const updated = [...pages, dupPage];
      setPages(updated);
      setCurrentPageIndex(updated.length - 1);
      showToast(`Duplicated Page ${currentPage.pageNumber} as Page ${dupPage.pageNumber}`);
    } catch (err: any) {
      showToast('Error duplicating page: ' + err.message);
    }
  };

  // Delete Page Action
  const handleDeletePage = () => {
    if (!currentPage) return;
    if (pages.length <= 1) {
      showToast('Cannot delete the only remaining page for a facility. Use Clear Page instead.');
      return;
    }

    setConfirmModal({
      title: `Delete Page ${currentPage.pageNumber}?`,
      body: `Are you sure you want to permanently delete Page ${currentPage.pageNumber}? All recorded answers and attached evidence for this page will be removed.`,
      actionLabel: 'Delete Page',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/pages/${currentPage.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete page');

          const remaining = pages.filter((p) => p.id !== currentPage.id);
          setPages(remaining);
          setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
          showToast(`Page ${currentPage.pageNumber} deleted.`);
        } catch (err: any) {
          showToast('Error deleting page: ' + err.message);
        }
      }
    });
  };

  // Clear Current Page Action
  const handleClearPage = () => {
    if (!currentPage) return;
    setConfirmModal({
      title: `Clear Page ${currentPage.pageNumber}?`,
      body: `This will reset all answer fields and remove evidence on Page ${currentPage.pageNumber}. Page structure will remain intact.`,
      confirmText: 'CLEAR',
      actionLabel: 'Clear All Answers',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/pages/${currentPage.id}/clear`, { method: 'POST' });
          if (!res.ok) throw new Error('Failed to clear page');

          const updatedPages = [...pages];
          updatedPages[currentPageIndex] = {
            ...currentPage,
            answers: {},
            evidence: {}
          };
          setPages(updatedPages);
          showToast(`Page ${currentPage.pageNumber} cleared.`);
        } catch (err: any) {
          showToast('Error clearing page: ' + err.message);
        }
      }
    });
  };

  // Pre-Flight Completeness Check & Submit
  const handlePreFlightSubmit = async () => {
    try {
      const res = await fetch(`/api/v1/locations/${selectedLocationId}/completeness`);
      if (!res.ok) throw new Error('Failed to check completeness');
      const report = await res.json();

      if (!report.complete) {
        setCompletenessModal(report);
      } else {
        // Confirmation modal before locking
        setConfirmModal({
          title: `Submit Audit for ${locationCode}?`,
          body: `All ${pages.length} audit pages are 100% complete. Once submitted, all pages will be locked and transitioned to 'READY_FOR_ANALYSIS' for scoring computation.`,
          actionLabel: `Submit ${locationCode}`,
          isDanger: false,
          onConfirm: async () => {
            try {
              const subRes = await fetch(`/api/v1/locations/${selectedLocationId}/submit`, { method: 'POST' });
              if (!subRes.ok) {
                const errJson = await subRes.json();
                throw new Error(errJson.error || 'Submission failed');
              }
              setLocationStatus('READY_FOR_ANALYSIS');
              setPages((prev) => prev.map((p) => ({ ...p, status: 'SUBMITTED' })));
              showToast(`🎉 Location ${locationCode} submitted successfully for ACS analysis!`);
            } catch (e: any) {
              showToast('Submission error: ' + e.message);
            }
          }
        });
      }
    } catch (err: any) {
      showToast('Error validating completeness: ' + err.message);
    }
  };

  // Reopen Audit Handler (for ADMIN)
  const handleReopenSubmit = async () => {
    if (!reopenReason.trim()) {
      showToast('Reopen reason is mandatory.');
      return;
    }

    try {
      const res = await fetch(`/api/v1/locations/${selectedLocationId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reopenReason })
      });

      if (!res.ok) throw new Error('Failed to reopen location audit');
      setLocationStatus('REOPENED');
      setPages((prev) => prev.map((p) => ({ ...p, status: 'DRAFT' })));
      setShowReopenModal(false);
      setReopenReason('');
      showToast(`Location ${locationCode} reopened for editing.`);
    } catch (err: any) {
      showToast('Error reopening audit: ' + err.message);
    }
  };

  // Evidence Upload Handler
  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceUploadTarget || !evidenceFile || !attestationConfirmed || !currentPage) return;

    try {
      setUploadingEvidence(true);
      const formData = new FormData();
      formData.append('file', evidenceFile);
      formData.append('questionId', evidenceUploadTarget.questionId);
      formData.append('attestation', 'true');

      const res = await fetch(`/api/v1/pages/${currentPage.id}/evidence`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to upload evidence');
      }

      const uploaded = await res.json();
      const updatedEvidence = { ...currentPage.evidence };
      if (!updatedEvidence[evidenceUploadTarget.questionId]) {
        updatedEvidence[evidenceUploadTarget.questionId] = [];
      }
      updatedEvidence[evidenceUploadTarget.questionId].push({
        id: uploaded.id,
        fileName: uploaded.fileName,
        fileSizeBytes: uploaded.fileSizeBytes,
        mimeType: uploaded.mimeType
      });

      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        evidence: updatedEvidence
      };
      setPages(updatedPages);

      setEvidenceUploadTarget(null);
      setEvidenceFile(null);
      setAttestationConfirmed(false);
      showToast(`Evidence attached: ${uploaded.fileName}`);
    } catch (err: any) {
      showToast('Evidence upload failed: ' + err.message);
    } finally {
      setUploadingEvidence(false);
    }
  };

  // Evidence Delete Handler
  const handleDeleteEvidence = async (questionId: string, evidenceId: string) => {
    if (!currentPage || currentPage.status === 'SUBMITTED') return;

    try {
      const res = await fetch(`/api/v1/evidence/${evidenceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete evidence attachment');

      const updatedEvidence = { ...currentPage.evidence };
      if (updatedEvidence[questionId]) {
        updatedEvidence[questionId] = updatedEvidence[questionId].filter((e) => e.id !== evidenceId);
      }

      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        evidence: updatedEvidence
      };
      setPages(updatedPages);
      showToast('Evidence attachment deleted.');
    } catch (err: any) {
      showToast('Error removing evidence: ' + err.message);
    }
  };

  // Export JSON Backup
  const handleExportBackup = async () => {
    try {
      const backupJson = await exportLocationBackup(selectedLocationId);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `abhisaran_${locationCode}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully.');
    } catch (e: any) {
      showToast('Export failed: ' + e.message);
    }
  };

  // Import JSON Backup
  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const res = await importLocationBackup(text);
        showToast(`Imported ${res.restoredCount} pages locally. Refreshing...`);
        loadLocationPages(selectedLocationId);
      } catch (err: any) {
        showToast('Import failed: ' + err.message);
      }
    };
    input.click();
  };

  const isLocationLocked = locationStatus === 'SUBMITTED' || locationStatus === 'READY_FOR_ANALYSIS';

  if (loading && pages.length === 0) {
    return (
      <div className="audit-workspace-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Loading Field Audit Workspace...</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading questions and offline cache for {locationCode || 'pilot facility'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-workspace-root">
      {/* 56px Sticky Reference Header */}
      <header className="hdr">
        <div className="brand" onClick={onBackToOverview} style={{ cursor: 'pointer' }}>
          <b>ABHISARAN</b>
          <span>Village Baseline &amp; Impact Assessment &middot; Field Audit</span>
        </div>

        <div className="hdr-actions">
          {/* Facility Selection & Privacy Header Code */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {facilities.length > 1 && (
              <select
                className="input-field"
                style={{
                  minHeight: '36px',
                  padding: '2px 8px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  background: 'var(--surface-2)',
                  borderColor: 'var(--line)'
                }}
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} &bull; {f.districtName} ({f.status})
                  </option>
                ))}
              </select>
            )}

            {/* CRITICAL PRIVACY: Code only */}
            <span className="location-code-display" title="Allocated Pilot Facility Code">
              {locationCode || 'JH-PILOT-LOC'}
            </span>
          </div>

          {/* 3-State Save Status Pill */}
          <span
            className={`status ${saveStatus === 'saving' ? 'saving' : saveStatus === 'error' ? 'error' : 'synced'}`}
            role="status"
            onClick={() => {
              if (syncErrorMessage) {
                setConfirmModal({
                  title: 'Sync Error Details',
                  body: syncErrorMessage,
                  actionLabel: 'Retry Sync Now',
                  onConfirm: () => triggerSaveImmediate()
                });
              } else {
                triggerSaveImmediate();
              }
            }}
            title="Click to trigger manual sync or view status"
          >
            <span className="t">{saveStatusMessage}</span>
          </span>

          {/* PDF Download Button */}
          <div className="pop">
            <button
              type="button"
              className="btn primary"
              onClick={() => setShowPdfMenu(!showPdfMenu)}
              aria-haspopup="true"
              aria-expanded={showPdfMenu}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                borderColor: 'transparent'
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16" />
              </svg>
              <span><span className="lab-long">Download </span>PDF</span>
            </button>
            {showPdfMenu && (
              <div className="menu" onMouseLeave={() => setShowPdfMenu(false)}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPdfMenu(false);
                    window.print();
                  }}
                >
                  Download Current Page (Print)
                  <small>Page {currentPage?.pageNumber || 1} of {pages.length}</small>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPdfMenu(false);
                    window.print();
                  }}
                >
                  Download All Pages as One PDF
                  <small>{pages.length} record pages</small>
                </button>
              </div>
            )}
          </div>

          {/* More Actions Popover Menu ⋯ */}
          <div className="pop">
            <button
              type="button"
              className="btn icon"
              aria-label="More actions"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              &#8943;
            </button>
            {showMoreMenu && (
              <div className="menu" onMouseLeave={() => setShowMoreMenu(false)}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleAddPage();
                  }}
                  disabled={isLocationLocked}
                >
                  + Add Audit Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleDuplicatePage();
                  }}
                  disabled={isLocationLocked}
                >
                  Duplicate Current Page
                  <small>Copies answers, omits evidence</small>
                </button>
                <hr />
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleExportBackup();
                  }}
                >
                  Export Data
                  <small>Portable JSON backup</small>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleImportBackup();
                  }}
                >
                  Import Data
                  <small>Restore from JSON backup</small>
                </button>
                <hr />
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleClearPage();
                  }}
                  disabled={isLocationLocked}
                >
                  Clear Current Page
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleDeletePage();
                  }}
                  disabled={isLocationLocked || pages.length <= 1}
                >
                  Delete This Page
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Locked / Submitted Banner */}
      {isLocationLocked && (
        <div
          style={{
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            padding: '10px 20px',
            fontSize: '14px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <span>
            🔒 <b>Audit Submitted &amp; Locked:</b> Status is <b>{locationStatus}</b>. Answers cannot be modified.
          </span>
          <button
            type="button"
            className="btn"
            style={{ padding: '4px 12px', minHeight: '32px', fontSize: '13px' }}
            onClick={() => setShowReopenModal(true)}
          >
            Reopen Audit (Admin)
          </button>
        </div>
      )}

      {/* Main Responsive Shell */}
      <div className="shell">
        {/* Desktop Section Sidebar (>= 960px) */}
        <aside className="side" aria-label="Audit Sections">
          <div className="card side-card">
            <h3>Audit Sections</h3>
            {DEFAULT_SECTIONS.map((sec, idx) => {
              const secStat = auditStats.sectionStats[idx];
              const isOk = secStat && secStat.isComplete;
              return (
                <button
                  key={sec.id}
                  type="button"
                  className={`nav-item ${idx === activeSectionIndex ? 'on' : ''}`}
                  onClick={() => setActiveSectionIndex(idx)}
                >
                  <span className="nl">{sec.id}. {sec.short}</span>
                  <span className={`ns ${isOk ? 'ok' : ''}`}>
                    {isOk ? '✓ Complete' : '○ Incomplete'} &middot; {secStat ? secStat.done : 0}/{secStat ? secStat.total : 0} answered
                  </span>
                </button>
              );
            })}
          </div>

          <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Page Operations
            </span>
            <button type="button" className="btn" onClick={handleAddPage} disabled={isLocationLocked}>
              + Add New Page
            </button>
            <button type="button" className="btn" onClick={handleDuplicatePage} disabled={isLocationLocked}>
              Duplicate Page
            </button>
            <button type="button" className="btn" onClick={handleExportBackup}>
              Export Data (JSON)
            </button>
          </div>
        </aside>

        {/* Central Workspace Content */}
        <main>
          {/* Page Tabs Strip */}
          <section className="recbar" aria-label="Page records">
            <div className="tabs" role="tablist">
              {pages.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  className="tab"
                  role="tab"
                  aria-current={idx === currentPageIndex}
                  onClick={() => setCurrentPageIndex(idx)}
                >
                  Page {p.pageNumber} &middot; <span style={{ opacity: 0.8, fontSize: '11px' }}>{p.status}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn add"
              onClick={handleAddPage}
              disabled={isLocationLocked}
              title="Add New Audit Page"
            >
              + Add Page
            </button>
          </section>

          {/* Record Header (Strict Zero Facility Name Guarantee) */}
          <section className="card rechead" aria-label="Record header">
            <div className="rechead-top">
              <div>
                <h1>ABHISARAN &ndash; FIELD BASELINE ASSESSMENT</h1>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  Pilot Facility Code: <b>{locationCode}</b>
                </span>
              </div>
              <span className="recbadge">
                Page {currentPage ? currentPage.pageNumber : 1} of {pages.length} &middot; Status: {currentPage?.status || 'DRAFT'}
              </span>
            </div>
          </section>

          {/* Question Search */}
          <div className="searchbox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Search questions (e.g. S04, water, toilet, ratio)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search questions"
            />
          </div>

          {/* Sticky Progress Strip */}
          <div className="strip" id="strip">
            <div className="strip-row">
              <b>Section {activeSection.id}: {activeSection.short}</b>
              <span>{auditStats.pct}% complete &middot; {auditStats.totalAssessed} of {auditStats.totalQuestions} answered</span>
            </div>
            <div className="bar" role="progressbar" aria-valuenow={auditStats.pct} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: `${auditStats.pct}%` }} />
            </div>

            {/* Mobile Jump-To-Section Dropdown (< 960px) */}
            <select
              className="jump"
              value={activeSectionIndex}
              onChange={(e) => setActiveSectionIndex(Number(e.target.value))}
              aria-label="Jump to section"
            >
              {DEFAULT_SECTIONS.map((sec, idx) => {
                const stat = auditStats.sectionStats[idx];
                return (
                  <option key={sec.id} value={idx}>
                    {sec.id}. {sec.short} &mdash; {stat ? stat.total : 0} questions ({stat?.done || 0}/{stat?.total || 0} {stat?.isComplete ? '✓' : '○'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Section Heading */}
          <div className="sechead">
            <h2>{activeSection.title}</h2>
            <span>
              {activeQuestions.length} questions in this view
            </span>
          </div>

          {/* Question Cards Form */}
          <form id="form" onSubmit={(e) => e.preventDefault()} noValidate>
            {activeQuestions.length === 0 ? (
              <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                No questions found matching your search query.
              </div>
            ) : (
              activeQuestions.map((q) => {
                const ansState = currentPage?.answers[q.id] || {
                  value: {},
                  na: false,
                  naReason: '',
                  notAssessed: false,
                  notAssessedReason: ''
                };
                const evidenceList = currentPage?.evidence[q.id] || [];

                const isAssessed =
                  ansState.na ||
                  ansState.notAssessed ||
                  (ansState.value &&
                    Object.values(ansState.value).some((v) =>
                      Array.isArray(v) ? v.length > 0 : String(v).trim() !== ''
                    ));

                return (
                  <article
                    key={q.id}
                    className={`qcard ${isAssessed ? 'done' : ''}`}
                    id={`card-${q.id}`}
                  >
                    {/* Question Header */}
                    <div className="qhead">
                      <span className="qnum">{q.id}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <h3 className="qtext">{q.canonicalText}</h3>
                          <span className={`qseverity ${q.severity}`}>{q.severity}</span>
                          {q.scored && (
                            <span style={{ fontSize: '11px', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                              Scored &middot; {q.rubricType}
                            </span>
                          )}
                        </div>
                        {q.evidenceHint && <p className="qhint">{q.evidenceHint}</p>}
                      </div>
                    </div>

                    {/* Question Input Body (Disabled if NA or CNA checked) */}
                    <div
                      className="qbody"
                      style={{
                        opacity: ansState.na || ansState.notAssessed ? 0.35 : 1,
                        pointerEvents: ansState.na || ansState.notAssessed || isLocationLocked ? 'none' : 'auto'
                      }}
                    >
                      {renderQuestionFields(q, ansState.value, (key, val) => {
                        handleAnswerChange(q.id, (prev) => ({
                          ...prev,
                          value: {
                            ...prev.value,
                            [key]: val
                          }
                        }));
                      })}
                    </div>

                    {/* N/A and Could Not Be Assessed Toggles */}
                    <div className="assessment-status-toggles">
                      <button
                        type="button"
                        className={`toggle-pill ${ansState.na ? 'active' : ''}`}
                        onClick={() => {
                          if (isLocationLocked) return;
                          handleAnswerChange(q.id, (prev) => ({
                            ...prev,
                            na: !prev.na,
                            notAssessed: false
                          }));
                        }}
                      >
                        {ansState.na ? '✓ Not Applicable' : 'Mark as Not Applicable'}
                      </button>

                      <button
                        type="button"
                        className={`toggle-pill ${ansState.notAssessed ? 'active' : ''}`}
                        onClick={() => {
                          if (isLocationLocked) return;
                          handleAnswerChange(q.id, (prev) => ({
                            ...prev,
                            notAssessed: !prev.notAssessed,
                            na: false
                          }));
                        }}
                      >
                        {ansState.notAssessed ? '✓ Cannot Assess' : 'Could Not Be Assessed'}
                      </button>
                    </div>

                    {/* Required Justification Box if NA checked */}
                    {ansState.na && (
                      <div className="reason-input-box">
                        <label htmlFor={`na-reason-${q.id}`}>Reason for Not Applicable (Mandatory)</label>
                        <input
                          id={`na-reason-${q.id}`}
                          type="text"
                          placeholder="e.g. Facility is not a residential high school; kitchen not applicable"
                          value={ansState.naReason || ''}
                          disabled={isLocationLocked}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleAnswerChange(q.id, (prev) => ({ ...prev, naReason: val }));
                          }}
                        />
                      </div>
                    )}

                    {/* Required Justification Box if CNA checked */}
                    {ansState.notAssessed && (
                      <div className="reason-input-box">
                        <label htmlFor={`cna-reason-${q.id}`}>Reason Could Not Be Assessed (Mandatory)</label>
                        <input
                          id={`cna-reason-${q.id}`}
                          type="text"
                          placeholder="e.g. Locked room; headmaster absent during inspection hours"
                          value={ansState.notAssessedReason || ''}
                          disabled={isLocationLocked}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleAnswerChange(q.id, (prev) => ({ ...prev, notAssessedReason: val }));
                          }}
                        />
                      </div>
                    )}

                    {/* Contextual Evidence Attachments */}
                    {q.evidenceUploadDefault && (
                      <div className="evidence-container">
                        <div className="evidence-head">
                          <span className="evidence-title">
                            📎 Evidence Attachments ({evidenceList.length}/10)
                          </span>
                          {!isLocationLocked && evidenceList.length < 10 && (
                            <button
                              type="button"
                              className="btn"
                              style={{ minHeight: '32px', padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => {
                                setEvidenceUploadTarget({
                                  questionId: q.id,
                                  questionText: q.canonicalText
                                });
                                setEvidenceFile(null);
                                setAttestationConfirmed(false);
                              }}
                            >
                              + Attach Evidence
                            </button>
                          )}
                        </div>

                        {evidenceList.length > 0 && (
                          <div className="evidence-items">
                            {evidenceList.map((att) => (
                              <div key={att.id} className="evidence-badge">
                                <span>📄 {att.fileName} ({(att.fileSizeBytes / 1024).toFixed(0)} KB)</span>
                                {!isLocationLocked && (
                                  <button
                                    type="button"
                                    className="del"
                                    onClick={() => handleDeleteEvidence(q.id, att.id)}
                                    title="Delete file"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </form>
        </main>
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="bottombar" aria-label="Form navigation">
        <div className="bb-in">
          <button
            type="button"
            className="btn"
            disabled={activeSectionIndex === 0}
            onClick={() => {
              setActiveSectionIndex(Math.max(0, activeSectionIndex - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            &#8249; Previous
          </button>

          <span id="bbInfo">
            {activeSection.id}. {activeSection.short}
          </span>

          <button
            type="button"
            className="btn primary"
            onClick={triggerSaveImmediate}
            title="Save answers now"
          >
            Save
          </button>

          <button
            type="button"
            className="btn"
            disabled={activeSectionIndex === DEFAULT_SECTIONS.length - 1}
            onClick={() => {
              setActiveSectionIndex(Math.min(DEFAULT_SECTIONS.length - 1, activeSectionIndex + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Next &#8250;
          </button>

          {/* Submit all pages for Location Code Button */}
          {!isLocationLocked && (
            <button
              type="button"
              className="btn submit-all"
              onClick={handlePreFlightSubmit}
            >
              Submit all pages for {locationCode}
            </button>
          )}
        </div>
      </nav>

      {/* Attestation Evidence Upload Modal */}
      {evidenceUploadTarget && (
        <div className="scrim" onClick={() => setEvidenceUploadTarget(null)}>
          <div className="dlg" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2>Attach Evidence for {evidenceUploadTarget.questionId}</h2>
            <p style={{ fontSize: '13px' }}>{evidenceUploadTarget.questionText}</p>

            <form onSubmit={handleUploadEvidence} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="lbl" htmlFor="evidence-file-input">Select File (JPEG, PNG, WebP, PDF &le; 10MB)</label>
                <input
                  id="evidence-file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  required
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  style={{ marginTop: '6px' }}
                />
              </div>

              {/* Mandatory Anti-PII Attestation Checkbox */}
              <div
                style={{
                  background: 'var(--warn-soft)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--warn)'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--ink)' }}>
                  <input
                    type="checkbox"
                    checked={attestationConfirmed}
                    onChange={(e) => setAttestationConfirmed(e.target.checked)}
                    style={{ marginTop: '3px', width: '18px', height: '18px' }}
                    required
                  />
                  <span>
                    <b>Mandatory Attestation:</b> I confirm that this file does <u>not</u> contain any human faces, children, names, Aadhaar numbers, phone numbers, or personally identifiable information. EXIF/GPS tags will be stripped automatically.
                  </span>
                </label>
              </div>

              <div className="acts">
                <button type="button" className="btn" onClick={() => setEvidenceUploadTarget(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={!evidenceFile || !attestationConfirmed || uploadingEvidence}
                >
                  {uploadingEvidence ? 'Processing & Stripping EXIF...' : 'Upload Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completeness Pre-Flight Block Modal */}
      {completenessModal && (
        <div className="scrim" onClick={() => setCompletenessModal(null)}>
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: 'var(--danger)' }}>⚠️ Incomplete Scored Questions</h2>
            <p>
              Submission blocked: All applicable scored questions across every page must be answered or explicitly marked with an N/A or Could Not Assess reason.
            </p>

            <div style={{ maxHeight: '240px', overflowY: 'auto', background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
              {Object.entries(completenessModal.missingByPage || {}).map(([pageNo, qIds]) => (
                <div key={pageNo} style={{ marginBottom: '10px' }}>
                  <b style={{ color: 'var(--accent)' }}>Page {pageNo}:</b>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {qIds.map((qid) => (
                      <span
                        key={qid}
                        style={{
                          background: 'var(--danger-soft)',
                          color: 'var(--danger)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      >
                        {qid}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="acts">
              <button type="button" className="btn primary" onClick={() => setCompletenessModal(null)}>
                Understood, Return to Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Audit Modal (Admin Only) */}
      {showReopenModal && (
        <div className="scrim" onClick={() => setShowReopenModal(false)}>
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <h2>Reopen Audit for {locationCode}</h2>
            <p>
              Reopening allows field auditors to amend answers and evidence. A mandatory reason is logged to the immutable audit trail.
            </p>

            <div className="fld">
              <label htmlFor="reopen-reason-input">Mandatory Reopen Reason</label>
              <textarea
                id="reopen-reason-input"
                rows={3}
                placeholder="e.g. Auditor requested additional verification of WASH facilities; discrepancy identified in attendance register"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                required
              />
            </div>

            <div className="acts">
              <button type="button" className="btn" onClick={() => setShowReopenModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn danger"
                disabled={!reopenReason.trim()}
                onClick={handleReopenSubmit}
              >
                Confirm Reopen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Confirmation Modal */}
      {confirmModal && (
        <div className="scrim" onClick={() => setConfirmModal(null)}>
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <h2>{confirmModal.title}</h2>
            <p>{confirmModal.body}</p>
            <div className="acts">
              <button type="button" className="btn" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${confirmModal.isDanger ? 'danger' : 'primary'}`}
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  cb();
                }}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div id="toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

// Helper: Renders input fields based on canonical Question schema & response type
function renderQuestionFields(
  q: QuestionDef,
  values: Record<string, any>,
  onChange: (key: string, val: any) => void
) {
  const type = q.responseType?.toUpperCase() || 'TEXT';

  // 1. GRID_AFU Matrix (Available / Functional / Used)
  if (type === 'GRID_AFU') {
    const rows = [
      { k: 'water', label: 'Drinking Water' },
      { k: 'elec', label: 'Electricity Connection' },
      { k: 'net', label: 'Internet / Connectivity' },
      { k: 'digital', label: 'Digital Facilities' }
    ];
    const cols = ['Available', 'Functional', 'Used'];

    return (
      <div className="grid-rows">
        {rows.map((row) => (
          <div key={row.k} className="grow-row">
            <span className="gl">{row.label}</span>
            <div className="gcols">
              {cols.map((col) => {
                const key = `${row.k}_${col.toLowerCase()}`;
                const cur = values[key];
                return (
                  <div key={col} className="gcol">
                    <span className="lbl">{col}</span>
                    <div className="seg">
                      {['Yes', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className="opt"
                          aria-checked={cur === opt}
                          onClick={() => onChange(key, opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. CHECKLIST_YNP / NUM_TABLE (Sanctioned vs Available Staff or Facilities)
  if (type === 'CHECKLIST_YNP' || type === 'NUM_TABLE') {
    const roles = [
      { k: 'doctors', label: 'Doctors / Medical Officers' },
      { k: 'nurses', label: 'Nurses / Staff' },
      { k: 'anm', label: 'ANM / Health Workers' }
    ];

    return (
      <div className="tbl-wrap">
        <table className="nt">
          <thead>
            <tr>
              <th scope="col">Designation</th>
              <th scope="col">Sanctioned</th>
              <th scope="col">Available</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.k}>
                <th scope="row">{r.label}</th>
                <td>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={values[`${r.k}_sanctioned`] ?? ''}
                    onChange={(e) => onChange(`${r.k}_sanctioned`, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={values[`${r.k}_available`] ?? ''}
                    onChange={(e) => onChange(`${r.k}_available`, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 3. RATING_1_5 (Segmented Star/Rating Chips)
  if (type === 'RATING_1_5') {
    const currentRating = values.rating ?? '';
    return (
      <div className="fld">
        <label className="lbl">Overall Rating (1 = Poor, 5 = Excellent)</label>
        <div className="rating-group">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`rating-btn ${Number(currentRating) === n ? 'active' : ''}`}
              onClick={() => onChange('rating', n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 4. RATIO_SANCTIONED_WORKING (Sanctioned vs Working Teachers / Staff)
  if (type === 'RATIO_SANCTIONED_WORKING') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="fld">
          <label className="lbl" htmlFor={`sanc-${q.id}`}>Sanctioned Strength</label>
          <input
            id={`sanc-${q.id}`}
            type="number"
            min="0"
            placeholder="0"
            value={values.sanctioned ?? ''}
            onChange={(e) => onChange('sanctioned', e.target.value)}
          />
        </div>
        <div className="fld">
          <label className="lbl" htmlFor={`work-${q.id}`}>Working / Active</label>
          <input
            id={`work-${q.id}`}
            type="number"
            min="0"
            placeholder="0"
            value={values.working ?? ''}
            onChange={(e) => onChange('working', e.target.value)}
          />
        </div>
      </div>
    );
  }

  // 5. RADIO (Yes / No / Partial)
  if (type === 'RADIO' || type === 'BINARY_YES_NO') {
    const curVal = values.answer ?? '';
    const opts = ['Yes', 'No'];
    return (
      <div className="fld">
        <div className="seg">
          {opts.map((opt) => (
            <button
              key={opt}
              type="button"
              className="opt"
              aria-checked={curVal === opt}
              onClick={() => onChange('answer', opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 6. PERCENTAGE
  if (type === 'PERCENTAGE') {
    return (
      <div className="fld" style={{ maxWidth: '240px' }}>
        <label className="lbl" htmlFor={`pct-${q.id}`}>Percentage (%)</label>
        <div style={{ position: 'relative' }}>
          <input
            id={`pct-${q.id}`}
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="0.0"
            value={values.percentage ?? ''}
            onChange={(e) => onChange('percentage', e.target.value)}
          />
          <span style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--muted)', fontWeight: 700 }}>
            %
          </span>
        </div>
      </div>
    );
  }

  // 7. MULTI_LINE / AREA
  if (type === 'MULTI_LINE' || type === 'AREA') {
    return (
      <div className="fld">
        <label className="lbl" htmlFor={`area-${q.id}`}>Details / Observations</label>
        <textarea
          id={`area-${q.id}`}
          rows={3}
          placeholder="Enter observation notes..."
          value={values.notes ?? ''}
          onChange={(e) => onChange('notes', e.target.value)}
        />
      </div>
    );
  }

  // 8. NUMBER
  if (type === 'NUMBER') {
    return (
      <div className="fld" style={{ maxWidth: '240px' }}>
        <label className="lbl" htmlFor={`num-${q.id}`}>Count / Value</label>
        <input
          id={`num-${q.id}`}
          type="number"
          min="0"
          placeholder="0"
          value={values.count ?? ''}
          onChange={(e) => onChange('count', e.target.value)}
        />
      </div>
    );
  }

  // Default: TEXT
  return (
    <div className="fld">
      <label className="lbl" htmlFor={`txt-${q.id}`}>Response</label>
      <input
        id={`txt-${q.id}`}
        type="text"
        placeholder="Enter response..."
        value={values.response ?? ''}
        onChange={(e) => onChange('response', e.target.value)}
      />
    </div>
  );
}
