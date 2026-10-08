import React, { useState, useEffect } from 'react';
import { fetchDistricts, District } from '../../api/geography';
import './officerInbox.css';

export interface DistrictSummary {
  id: number;
  name: string;
  code: string;
}

export interface OfficerItem {
  id: string;
  loginId: string;
  displayName: string;
  designation: string | null;
  active: boolean;
  mustChangePassword: boolean;
  assignedDistricts: DistrictSummary[];
  totalDeliveries: number;
  unreadDeliveries: number;
  createdAt: string;
}

export const OfficerManagementScreen: React.FC = () => {
  const [officers, setOfficers] = useState<OfficerItem[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Create Officer Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createLoginId, setCreateLoginId] = useState<string>('');
  const [createDisplayName, setCreateDisplayName] = useState<string>('');
  const [createDesignation, setCreateDesignation] = useState<string>('');
  const [createPassword, setCreatePassword] = useState<string>('Officer#Pass2026!');
  const [createDistrictIds, setCreateDistrictIds] = useState<number[]>([]);
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Jurisdictions Modal
  const [editingOfficer, setEditingOfficer] = useState<OfficerItem | null>(null);
  const [editDistrictIds, setEditDistrictIds] = useState<number[]>([]);
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [officersRes, districtsData] = await Promise.all([
        fetch('/api/v1/officers'),
        fetchDistricts()
      ]);

      if (!officersRes.ok) {
        throw new Error(`Failed to load officers: ${officersRes.statusText}`);
      }

      const officersData: OfficerItem[] = await officersRes.json();
      setOfficers(officersData);
      setDistricts(districtsData);
    } catch (err: any) {
      setError(err.message || 'Error loading officers and jurisdictions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setCreateLoginId('');
    setCreateDisplayName('');
    setCreateDesignation('');
    setCreatePassword('Officer#Pass2026!');
    setCreateDistrictIds([]);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateError(null);
  };

  const handleToggleCreateDistrict = (districtId: number) => {
    setCreateDistrictIds((prev) =>
      prev.includes(districtId) ? prev.filter((id) => id !== districtId) : [...prev, districtId]
    );
  };

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError(null);

      const payload = {
        loginId: createLoginId.trim(),
        displayName: createDisplayName.trim(),
        designation: createDesignation.trim() || undefined,
        password: createPassword,
        districtIds: createDistrictIds
      };

      const res = await fetch('/api/v1/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to create officer: ${res.statusText}`);
      }

      const newOfficer: OfficerItem = await res.json();
      setOfficers((prev) => [newOfficer, ...prev]);
      handleCloseCreateModal();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create officer');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditModal = (officer: OfficerItem) => {
    setEditingOfficer(officer);
    setEditDistrictIds(officer.assignedDistricts.map((d) => d.id));
    setUpdateError(null);
  };

  const handleCloseEditModal = () => {
    setEditingOfficer(null);
    setEditDistrictIds([]);
    setUpdateError(null);
  };

  const handleToggleEditDistrict = (districtId: number) => {
    setEditDistrictIds((prev) =>
      prev.includes(districtId) ? prev.filter((id) => id !== districtId) : [...prev, districtId]
    );
  };

  const handleUpdateDistricts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;

    try {
      setUpdating(true);
      setUpdateError(null);

      const res = await fetch(`/api/v1/officers/${editingOfficer.id}/districts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ districtIds: editDistrictIds })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to update officer districts');
      }

      const updatedOfficer: OfficerItem = await res.json();
      setOfficers((prev) => prev.map((o) => (o.id === updatedOfficer.id ? updatedOfficer : o)));
      handleCloseEditModal();
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update jurisdictions');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOfficers = officers.filter((o) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const loginMatch = o.loginId.toLowerCase().includes(term);
    const nameMatch = o.displayName.toLowerCase().includes(term);
    const desigMatch = (o.designation || '').toLowerCase().includes(term);
    const districtMatch = o.assignedDistricts.some((d) => d.name.toLowerCase().includes(term));
    return loginMatch || nameMatch || desigMatch || districtMatch;
  });

  return (
    <div className="inbox-container">
      {/* Header */}
      <div className="portal-header">
        <div className="portal-title-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="portal-badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0284c7' }}>
                ⚙️ Administration
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Role-Based Access Control</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>
              Officer Scoping & Delivery Administration
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={loadData}
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              ➕ Register New Officer
            </button>
          </div>
        </div>

        {/* Back-fill Guarantee Banner */}
        <div className="zero-pii-banner">
          <span style={{ fontSize: '16px' }}>⚡</span>
          <div>
            <b>Automated Historical Back-fill:</b> Assigning district scopes immediately creates delivery
            records for all existing completed audit runs in those districts. Future runs are automatically delivered
            upon audit completion within the same atomic transaction.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Registered Officers</span>
          <span className="stat-value">{officers.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pilot Districts</span>
          <span className="stat-value">{districts.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Scoped Assignments</span>
          <span className="stat-value" style={{ color: '#0284c7' }}>
            {officers.reduce((acc, o) => acc + o.assignedDistricts.length, 0)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Delivered Reports</span>
          <span className="stat-value" style={{ color: '#10b981' }}>
            {officers.reduce((acc, o) => acc + o.totalDeliveries, 0)}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="inbox-filter-bar">
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search officers by name, login ID, designation, or district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ fontSize: '13px', padding: '8px 12px', width: '100%' }}
          />
        </div>
      </div>

      {/* Main Officers Table */}
      {error && (
        <div className="alert-banner alert-danger">
          <span>❌ {error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
          <span>Loading officer profiles...</span>
        </div>
      ) : filteredOfficers.length === 0 ? (
        <div className="inbox-table-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink)' }}>
            No officers match your search
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Try adjusting your search criteria or register a new officer.
          </p>
        </div>
      ) : (
        <div className="inbox-table-card">
          <table className="inbox-table">
            <thead>
              <tr>
                <th>Officer / User</th>
                <th>Designation</th>
                <th>Assigned Districts</th>
                <th>Deliveries</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOfficers.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{o.displayName}</div>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--muted)' }}>
                      @{o.loginId}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--ink)' }}>
                      {o.designation || <span style={{ color: 'var(--muted)' }}>Unspecified</span>}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {o.assignedDistricts.length === 0 ? (
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>
                          No districts assigned (Unscoped)
                        </span>
                      ) : (
                        o.assignedDistricts.map((d) => (
                          <span
                            key={d.id}
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'var(--surface-2)',
                              border: '1px solid var(--line)',
                              color: 'var(--ink)'
                            }}
                          >
                            {d.name} <span style={{ color: 'var(--muted)', fontSize: '10px' }}>({d.code})</span>
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                      {o.totalDeliveries} total
                    </div>
                    {o.unreadDeliveries > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
                        {o.unreadDeliveries} unread
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: o.active ? '#10b981' : '#dc2626'
                        }}
                      >
                        {o.active ? '● Active' : '○ Inactive'}
                      </span>
                      {o.mustChangePassword && (
                        <span style={{ fontSize: '10px', color: '#ea580c', fontWeight: 500 }}>
                          Password reset required
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(o)}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      ✏️ Edit Jurisdictions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register New Officer Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={handleCloseCreateModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                Register Government Officer
              </h2>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              Creates an official government user account with <code>ROLE_OFFICER</code> and provisions immediate
              jurisdiction scopes.
            </p>

            {createError && (
              <div className="alert-banner alert-danger" style={{ fontSize: '12px', padding: '8px 12px' }}>
                <span>❌ {createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOfficer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Login ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. officer_bokaro"
                    value={createLoginId}
                    onChange={(e) => setCreateLoginId(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '13px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Display / Officer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEO Bokaro"
                    value={createDisplayName}
                    onChange={(e) => setCreateDisplayName(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '13px', width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Official Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. District Education Officer"
                    value={createDesignation}
                    onChange={(e) => setCreateDesignation(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '13px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Initial Temporary Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '13px', width: '100%', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Assign District Jurisdictions:
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '8px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    padding: '10px',
                    background: 'var(--surface-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--line)'
                  }}
                >
                  {districts.map((d) => {
                    const checked = createDistrictIds.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleCreateDistrict(d.id)}
                        />
                        <span>
                          {d.name} <span style={{ color: 'var(--muted)', fontSize: '11px' }}>({d.code3})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  Existing completed audit runs in selected districts will be automatically back-filled into this officer's inbox.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="btn btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating & Back-filling...' : 'Register Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Jurisdictions Modal */}
      {editingOfficer && (
        <div className="modal-backdrop" onClick={handleCloseEditModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                Edit District Jurisdictions
              </h2>
              <button
                type="button"
                onClick={handleCloseEditModal}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Updating jurisdiction for <b>{editingOfficer.displayName}</b> (<code>@{editingOfficer.loginId}</code>).
            </div>

            {updateError && (
              <div className="alert-banner alert-danger" style={{ fontSize: '12px', padding: '8px 12px' }}>
                <span>❌ {updateError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateDistricts} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '12px',
                  background: 'var(--surface-2)',
                  borderRadius: '8px',
                  border: '1px solid var(--line)'
                }}
              >
                {districts.map((d) => {
                  const checked = editDistrictIds.includes(d.id);
                  return (
                    <label
                      key={d.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleEditDistrict(d.id)}
                      />
                      <span>
                        {d.name} <span style={{ color: 'var(--muted)', fontSize: '11px' }}>({d.code3})</span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.4 }}>
                💡 Any newly added districts will trigger an immediate back-fill of past completed audit runs.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="btn btn-secondary"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Updating & Back-filling...' : 'Save Jurisdictions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
