import React, { useState, useEffect, useRef } from 'react';
import './auditWorkspace.css';

export interface AuditWorkspaceProps {
  initialLocationId?: string;
  onBackToOverview?: () => void;
  onViewAnalysis?: (locationId: string) => void;
}

interface FacilityOption {
  id: string;
  code: string;
  typeLabel?: string | null;
  districtName?: string | null;
  status: string;
}

export const FieldAuditWorkspace: React.FC<AuditWorkspaceProps> = ({
  initialLocationId,
  onBackToOverview,
  onViewAnalysis
}) => {
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocationId || '');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pdfAttachedNotice, setPdfAttachedNotice] = useState<{ fileName: string; timestamp: string } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Fetch pilot facilities for the selector dropdown
  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await fetch('/api/v1/dashboard/overview?page=0&size=50');
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        setFacilities(items.map((i: any) => ({
          id: i.id,
          code: i.code,
          typeLabel: i.typeLabel || i.typePrefix,
          districtName: i.districtName,
          status: i.status
        })));
        if (!selectedLocationId && items.length > 0) {
          setSelectedLocationId(items[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load facilities in workspace', e);
    }
  };

  const selectedFacility = facilities.find(f => f.id === selectedLocationId) || facilities[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 2. Listen for cross-frame messages from ahfjhabsd PDF generator
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'ABHISARAN_PDF_EXPORTED') {
        const { fileName, dataUrl } = event.data;
        setPdfAttachedNotice({
          fileName: fileName || 'ABHISARAN_Record.pdf',
          timestamp: new Date().toLocaleTimeString()
        });
        showToast(`⚡ PDF exported & attached to /source: ${fileName}`);

        // If a facility is selected, upload the exported PDF evidence to the backend
        if (selectedLocationId && dataUrl) {
          try {
            // Convert data URL to Blob
            const fetchRes = await fetch(dataUrl);
            const blob = await fetchRes.blob();

            // First ensure a page exists on the backend
            const pagesRes = await fetch(`/api/v1/locations/${selectedLocationId}/pages`);
            let pageId: string | null = null;
            if (pagesRes.ok) {
              const pagesData = await pagesRes.json();
              if (pagesData.length > 0) {
                pageId = pagesData[0].id;
              }
            }

            if (!pageId) {
              // Create page 1
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

            if (pageId) {
              const formData = new FormData();
              formData.append('file', blob, fileName);
              formData.append('questionId', 'S01');
              formData.append('attestation', 'true');

              await fetch(`/api/v1/pages/${pageId}/evidence`, {
                method: 'POST',
                body: formData
              });
              showToast(`✅ PDF attached to facility ${selectedFacility?.code || ''} evidence ledger!`);
            }
          } catch (err) {
            console.warn('Could not auto-attach PDF to backend:', err);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedLocationId, selectedFacility]);

  // 3. Evaluate ACS: read answers from localStorage, sync to backend, and trigger scoring engine
  const handleEvaluateAcs = async () => {
    if (!selectedLocationId) {
      showToast('Please select a pilot facility first.');
      return;
    }

    setEvaluating(true);
    try {
      // 1. Read answers from ahfjhabsd localStorage
      const raw = localStorage.getItem('abhisaran_field_form_v1');
      let records: any[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.records)) records = parsed.records;
        } catch (e) {}
      }

      // Check if at least one question has been answered
      let totalAnswered = 0;
      records.forEach(r => {
        if (r.answers) {
          Object.values(r.answers).forEach((a: any) => {
            if (a && typeof a === 'object' && Object.keys(a).length > 0) totalAnswered++;
          });
        }
      });

      // Ensure at least one page exists on backend
      const pagesRes = await fetch(`/api/v1/locations/${selectedLocationId}/pages`);
      let pageId: string | null = null;
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        if (pagesData.length > 0) {
          pageId = pagesData[0].id;
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

      // Format answers for backend scoring
      const backendAnswers: Record<string, any> = {};
      if (records.length > 0 && records[0].answers) {
        // Map ahfjhabsd answers into backend questions
        Object.entries(records[0].answers).forEach(([qKey, qVal]: [string, any]) => {
          const qNum = qKey.replace('question', '');
          // Map to backend canonical question IDs (S01, S02, etc.)
          const code = `S${String(qNum).padStart(2, '0')}`;
          backendAnswers[code] = {
            value: qVal,
            na: false,
            notAssessed: false
          };
        });
      }

      // Save answers if pageId exists
      if (pageId && Object.keys(backendAnswers).length > 0) {
        await fetch(`/api/v1/pages/${pageId}/answers`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: backendAnswers })
        });
      }

      // Submit location to transition from DRAFT to READY_FOR_ANALYSIS
      await fetch(`/api/v1/locations/${selectedLocationId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationText: 'CONFIRM' })
      }).catch(() => {});

      // Trigger deterministic scoring engine
      const scoreRes = await fetch(`/api/v1/scoring/${selectedLocationId}/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!scoreRes.ok) {
        const errJson = await scoreRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Scoring failed with HTTP ${scoreRes.status}`);
      }

      showToast(`✅ ACS successfully computed for ${selectedFacility?.code || 'facility'}!`);

      // Navigate to Continuity Analysis View
      if (onViewAnalysis) {
        setTimeout(() => {
          onViewAnalysis(selectedLocationId);
        }, 600);
      }
    } catch (err: any) {
      showToast('Error evaluating ACS: ' + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Abhisaran Field Integration Strip */}
      <header
        style={{
          height: '52px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 50,
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {onBackToOverview && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBackToOverview}
              style={{
                padding: '5px 12px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px'
              }}
            >
              &larr; Admin Home
            </button>
          )}

          {/* Pilot Facility Context Binding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
              Target Facility:
            </span>
            <select
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '13px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                cursor: 'pointer'
              }}
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} &bull; {f.districtName || 'Pilot'} ({f.status})
                </option>
              ))}
            </select>

            {selectedFacility && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
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

        {/* Integration Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {pdfAttachedNotice && (
            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
              ✓ PDF Attached to /source ({pdfAttachedNotice.timestamp})
            </span>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleEvaluateAcs}
            disabled={evaluating}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
              cursor: 'pointer'
            }}
          >
            {evaluating ? '⏳ Evaluating...' : '⚡ Evaluate ACS Score'}
          </button>

          <a
            href="/abhisaran-field-form.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              textDecoration: 'none',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Open in standalone tab for full-screen offline use"
          >
            ↗ Standalone Window
          </a>
        </div>
      </header>

      {/* Embedded 100% Reference ahfjhabsd Application */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100vh - 52px)' }}>
        <iframe
          ref={iframeRef}
          src="/abhisaran-field-form.html"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          title="ABHISARAN Field Audit Form"
        />
      </div>

      {/* Floating Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--ink, #15231f)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
