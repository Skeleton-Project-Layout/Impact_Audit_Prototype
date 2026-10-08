import React, { useState, useEffect } from 'react';
import './officerInbox.css';

export interface DistrictSummary {
  id: number;
  name: string;
  code: string;
}

export interface DeliveryInboxItem {
  id: string;
  runId: string;
  locationId: string;
  locationCode: string;
  facilityType: string;
  districtId: number;
  districtName: string;
  blockName: string;
  panchayatName?: string;
  acsScore: number | null;
  alertBand: string | null;
  coveragePct: number;
  provisional: boolean;
  triggeredRedFlagsCount: number;
  deliveredAt: string;
  readAt: string | null;
  acknowledgedAt: string | null;
  acknowledgmentNotes: string | null;
  read: boolean;
  acknowledged: boolean;
}

export interface InboxSummary {
  totalDelivered: number;
  totalUnread: number;
  totalAcknowledged: number;
  districts: DistrictSummary[];
  deliveries: DeliveryInboxItem[];
}

interface OfficerInboxScreenProps {
  onViewAnalysis: (runId: string, locationCode: string) => void;
}

export const OfficerInboxScreen: React.FC<OfficerInboxScreenProps> = ({ onViewAnalysis }) => {
  const [inbox, setInbox] = useState<InboxSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'ACKNOWLEDGED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Acknowledgment Modal
  const [activeAckDelivery, setActiveAckDelivery] = useState<DeliveryInboxItem | null>(null);
  const [ackNotes, setAckNotes] = useState<string>('');
  const [ackSubmitting, setAckSubmitting] = useState<boolean>(false);
  const [ackError, setAckError] = useState<string | null>(null);

  // View Notes Modal
  const [activeViewNotesDelivery, setActiveViewNotesDelivery] = useState<DeliveryInboxItem | null>(null);

  useEffect(() => {
    fetchInbox();
  }, [selectedDistrictId, statusFilter]);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedDistrictId !== null) {
        params.append('districtId', selectedDistrictId.toString());
      }
      if (statusFilter === 'UNREAD') {
        params.append('unreadOnly', 'true');
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/v1/me/inbox${queryString}`);

      if (!res.ok) {
        throw new Error(`Failed to load officer inbox: ${res.statusText}`);
      }

      const data: InboxSummary = await res.json();
      setInbox(data);
    } catch (err: any) {
      setError(err.message || 'Error loading ACS inbox');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = async (item: DeliveryInboxItem) => {
    // If not read yet, mark as read in background
    if (!item.read) {
      try {
        await fetch(`/api/v1/me/deliveries/${item.id}/read`, { method: 'POST' });
        // Optimistically mark as read in local state
        if (inbox) {
          setInbox({
            ...inbox,
            totalUnread: Math.max(0, inbox.totalUnread - 1),
            deliveries: inbox.deliveries.map((d) =>
              d.id === item.id ? { ...d, read: true, readAt: new Date().toISOString() } : d
            )
          });
        }
      } catch (e) {
        console.warn('Failed to mark delivery as read:', e);
      }
    }

    onViewAnalysis(item.runId, item.locationCode);
  };

  const handleOpenAckModal = (item: DeliveryInboxItem) => {
    setActiveAckDelivery(item);
    setAckNotes(item.acknowledgmentNotes || '');
    setAckError(null);
  };

  const handleCloseAckModal = () => {
    setActiveAckDelivery(null);
    setAckNotes('');
    setAckError(null);
  };

  const handleSubmitAcknowledgment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAckDelivery) return;

    try {
      setAckSubmitting(true);
      setAckError(null);

      const res = await fetch(`/api/v1/me/deliveries/${activeAckDelivery.id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: ackNotes.trim() })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to acknowledge delivery');
      }

      const updatedDelivery: DeliveryInboxItem = await res.json();

      // Update state
      if (inbox) {
        setInbox({
          ...inbox,
          totalAcknowledged: inbox.totalAcknowledged + (activeAckDelivery.acknowledged ? 0 : 1),
          deliveries: inbox.deliveries.map((d) => (d.id === updatedDelivery.id ? updatedDelivery : d))
        });
      }

      handleCloseAckModal();
    } catch (err: any) {
      setAckError(err.message || 'Failed to record official acknowledgment');
    } finally {
      setAckSubmitting(false);
    }
  };

  // Filter deliveries client-side for search term and acknowledged status filter
  const filteredDeliveries = (inbox?.deliveries || []).filter((item) => {
    if (statusFilter === 'ACKNOWLEDGED' && !item.acknowledged) {
      return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const codeMatch = item.locationCode.toLowerCase().includes(term);
      const districtMatch = item.districtName.toLowerCase().includes(term);
      const blockMatch = item.blockName.toLowerCase().includes(term);
      const panchayatMatch = (item.panchayatName || '').toLowerCase().includes(term);
      const typeMatch = item.facilityType.toLowerCase().includes(term);
      return codeMatch || districtMatch || blockMatch || panchayatMatch || typeMatch;
    }

    return true;
  });

  const getAlertBadgeClass = (band: string | null) => {
    switch (band) {
      case 'DARK_GREEN':
        return 'score-badge DARK_GREEN';
      case 'LIGHT_GREEN':
        return 'score-badge LIGHT_GREEN';
      case 'AMBER':
        return 'score-badge AMBER';
      case 'ORANGE':
        return 'score-badge ORANGE';
      case 'RED':
        return 'score-badge RED';
      default:
        return 'score-badge';
    }
  };

  const getAlertLabel = (band: string | null) => {
    switch (band) {
      case 'DARK_GREEN':
        return 'Full Continuity';
      case 'LIGHT_GREEN':
        return 'Acceptable Service';
      case 'AMBER':
        return 'Moderate Risk';
      case 'ORANGE':
        return 'Severe Disruption';
      case 'RED':
        return 'Critical Crisis';
      default:
        return 'Unscored';
    }
  };

  return (
    <div className="inbox-container">
      {/* Portal Header */}
      <div className="portal-header">
        <div className="portal-title-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="portal-badge">🏛️ District Officer Portal</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Official Government Access</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>
              Jurisdiction ACS Delivery Inbox
            </h1>
          </div>
          <button
            type="button"
            onClick={fetchInbox}
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '6px 12px' }}
          >
            🔄 Refresh Inbox
          </button>
        </div>

        {/* Zero-PII Compliance Notice */}
        <div className="zero-pii-banner">
          <span style={{ fontSize: '16px' }}>🛡️</span>
          <div>
            <b>Zero-PII Compliance Guarantee:</b> Institutional data is indexed strictly by non-identifying
            jurisdiction codes (e.g. <code>JH-RCH-SCH-0001</code>). Personal contacts and institution names are
            shielded to prevent bias and comply with state data isolation standards.
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total Delivered Reports</span>
          <span className="stat-value">{inbox ? inbox.totalDelivered : '—'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unread Deliveries</span>
          <span className="stat-value" style={{ color: inbox && inbox.totalUnread > 0 ? 'var(--accent)' : 'inherit' }}>
            {inbox ? inbox.totalUnread : '—'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Officially Acknowledged</span>
          <span className="stat-value" style={{ color: '#10b981' }}>
            {inbox ? inbox.totalAcknowledged : '—'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Assigned Districts</span>
          <span className="stat-value" style={{ fontSize: '20px', fontWeight: 600 }}>
            {inbox?.districts && inbox.districts.length > 0
              ? inbox.districts.map((d) => d.name).join(', ')
              : 'All Jurisdictions'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="inbox-filter-bar">
        <div className="filter-group">
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Status:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
          >
            All Reports ({inbox?.totalDelivered ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('UNREAD')}
            className={`filter-pill ${statusFilter === 'UNREAD' ? 'active' : ''}`}
          >
            Unread ({inbox?.totalUnread ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACKNOWLEDGED')}
            className={`filter-pill ${statusFilter === 'ACKNOWLEDGED' ? 'active' : ''}`}
          >
            Acknowledged ({inbox?.totalAcknowledged ?? 0})
          </button>
        </div>

        {inbox?.districts && inbox.districts.length > 1 && (
          <div className="filter-group">
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
              District:
            </span>
            <select
              value={selectedDistrictId ?? ''}
              onChange={(e) => setSelectedDistrictId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="form-control"
              style={{ fontSize: '13px', padding: '6px 10px', width: 'auto' }}
            >
              <option value="">All Scoped Districts</option>
              {inbox.districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search by code, district, block, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ fontSize: '13px', padding: '6px 12px', width: '100%' }}
          />
        </div>
      </div>

      {/* Main Deliveries Table */}
      {error && (
        <div className="alert-banner alert-danger">
          <span>❌ {error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
          <span>Loading delivered ACS reports...</span>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="inbox-table-card" style={{ padding: '64px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink)' }}>
            No delivered reports found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '440px', margin: '0 auto' }}>
            {searchTerm
              ? 'No deliveries matched your search filter.'
              : statusFilter === 'UNREAD'
              ? 'You have caught up with all delivered reports for your jurisdiction!'
              : 'As field audits are completed and analysed in your district, scored reports will automatically arrive in this inbox.'}
          </p>
        </div>
      ) : (
        <div className="inbox-table-card">
          <table className="inbox-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Permanent Code</th>
                <th>Facility Type</th>
                <th>Jurisdiction</th>
                <th>Continuity Score</th>
                <th>Coverage</th>
                <th>Delivered On</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((item) => (
                <tr key={item.id} className={!item.read ? 'unread-row' : ''}>
                  <td>
                    {!item.read && <span className="unread-dot" title="Unread report" />}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ink)' }}>
                      {item.locationCode}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--surface-2)',
                        color: 'var(--muted)',
                        fontWeight: 600
                      }}
                    >
                      {item.facilityType}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.districtName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {item.blockName} {item.panchayatName ? `• ${item.panchayatName}` : ''}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={getAlertBadgeClass(item.alertBand)}>
                        {item.acsScore !== null ? item.acsScore.toFixed(1) : 'N/A'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {getAlertLabel(item.alertBand)}
                      </span>
                    </div>
                    {item.triggeredRedFlagsCount > 0 && (
                      <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                        🚩 {item.triggeredRedFlagsCount} Red Flag{item.triggeredRedFlagsCount > 1 ? 's' : ''}
                      </div>
                    )}
                    {item.provisional && (
                      <div style={{ fontSize: '10.5px', color: '#ea580c', fontWeight: 500, marginTop: '2px' }}>
                        ⚠️ Provisional
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '6px',
                          borderRadius: '3px',
                          background: 'var(--line)',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, item.coveragePct))}%`,
                            height: '100%',
                            background: item.coveragePct >= 80 ? '#10b981' : item.coveragePct >= 50 ? '#f59e0b' : '#dc2626'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{Math.round(item.coveragePct)}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: 'var(--ink)' }}>
                      {new Date(item.deliveredAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {new Date(item.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    {item.acknowledged ? (
                      <button
                        type="button"
                        onClick={() => setActiveViewNotesDelivery(item)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        title="Click to view acknowledgment notes"
                      >
                        ✅ Acknowledged
                      </button>
                    ) : item.read ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'var(--surface-2)',
                          color: 'var(--muted)'
                        }}
                      >
                        👁️ Read
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'var(--accent-soft)',
                          color: 'var(--accent)'
                        }}
                      >
                        📩 New
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenReport(item)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        Inspect Breakdown
                      </button>
                      {!item.acknowledged && (
                        <button
                          type="button"
                          onClick={() => handleOpenAckModal(item)}
                          className="btn"
                          style={{
                            fontSize: '12px',
                            padding: '5px 10px',
                            background: '#047857',
                            color: '#ffffff',
                            fontWeight: 600
                          }}
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Acknowledgment Modal */}
      {activeAckDelivery && (
        <div className="modal-backdrop" onClick={handleCloseAckModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                Official Receipt Acknowledgment
              </h2>
              <button
                type="button"
                onClick={handleCloseAckModal}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4 }}>
              Record official receipt of continuity assessment for location{' '}
              <strong style={{ color: 'var(--ink)', fontFamily: 'monospace' }}>
                {activeAckDelivery.locationCode}
              </strong>{' '}
              in <strong>{activeAckDelivery.districtName}</strong>. This registers your formal notice of
              the ACS score ({activeAckDelivery.acsScore?.toFixed(1) ?? 'N/A'}) and red flags.
            </div>

            {ackError && (
              <div className="alert-banner alert-danger" style={{ fontSize: '12px', padding: '8px 12px' }}>
                <span>❌ {ackError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAcknowledgment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink)' }}>
                  Action Notes & Remediation Directives (Optional)
                </label>
                <textarea
                  rows={4}
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  placeholder="Record directives, planned block visits, or remedial measures initiated based on this score..."
                  className="form-control"
                  style={{ width: '100%', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleCloseAckModal}
                  className="btn btn-secondary"
                  disabled={ackSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={ackSubmitting}
                  style={{ background: '#059669', borderColor: '#059669' }}
                >
                  {ackSubmitting ? 'Recording Acknowledgment...' : 'Confirm Formal Acknowledgment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Notes Modal */}
      {activeViewNotesDelivery && (
        <div className="modal-backdrop" onClick={() => setActiveViewNotesDelivery(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                Acknowledgment Record
              </h2>
              <button
                type="button"
                onClick={() => setActiveViewNotesDelivery(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ marginBottom: '4px' }}>
                <b>Location:</b> <span style={{ fontFamily: 'monospace' }}>{activeViewNotesDelivery.locationCode}</span>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <b>District:</b> {activeViewNotesDelivery.districtName} ({activeViewNotesDelivery.blockName})
              </div>
              <div style={{ marginBottom: '4px' }}>
                <b>Acknowledged On:</b>{' '}
                {activeViewNotesDelivery.acknowledgedAt
                  ? new Date(activeViewNotesDelivery.acknowledgedAt).toLocaleString()
                  : 'N/A'}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink)' }}>
                Official Notes Recorded:
              </label>
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '13px',
                  color: activeViewNotesDelivery.acknowledgmentNotes ? 'var(--ink)' : 'var(--muted)',
                  whiteSpace: 'pre-wrap',
                  minHeight: '80px'
                }}
              >
                {activeViewNotesDelivery.acknowledgmentNotes || 'No notes were recorded upon acknowledgment.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveViewNotesDelivery(null)}
                className="btn btn-secondary"
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
