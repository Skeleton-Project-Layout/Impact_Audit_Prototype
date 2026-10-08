import React, { useState, useEffect, useCallback } from 'react';
import './auditLog.css';
import { AbhisaranLoader } from '../../components/AbhisaranLoader';

export interface AuditLogDTO {
  id: string;
  timestamp: string;
  actorId: string | null;
  actorUsername: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
}

export const AuditLogScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Log for JSON Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogDTO | null>(null);

  const fetchAuditLogs = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (roleFilter) params.append('actorRole', roleFilter);
      if (targetTypeFilter) params.append('targetType', targetTypeFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      params.append('page', String(targetPage));
      params.append('size', '20');

      const res = await fetch(`/api/v1/audit-log?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load audit logs (HTTP ${res.status})`);
      }
      const data = await res.json();
      setLogs(data.content || []);
      setPage(data.number || 0);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, roleFilter, targetTypeFilter, searchTerm]);

  useEffect(() => {
    fetchAuditLogs(0);
  }, [actionFilter, roleFilter, targetTypeFilter, fetchAuditLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs(0);
  };

  const handleResetFilters = () => {
    setActionFilter('');
    setRoleFilter('');
    setTargetTypeFilter('');
    setSearchTerm('');
    setPage(0);
  };

  const getActionBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('ANALYSE') || act.includes('RUN_')) return 'analyse';
    if (act.includes('UPSERT') || act.includes('CREATE') || act.includes('UPDATE')) return 'write';
    if (act.includes('PASSWORD') || act.includes('SECURITY') || act.includes('DISTRICT')) return 'security';
    if (act.includes('LOGIN') || act.includes('LOGOUT')) return 'auth';
    return 'generic';
  };

  const getRoleBadgeClass = (role: string | null) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return 'admin';
      case 'OFFICER': return 'officer';
      case 'DATA_OPERATOR': return 'operator';
      default: return 'operator';
    }
  };

  const formatDetailsJson = (details: string | null) => {
    if (!details) return 'None';
    try {
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  };

  return (
    <div className="audit-log-container">
      {/* Header */}
      <div className="audit-log-header">
        <div className="audit-log-title">
          <h1>
            <span>🛡️</span> Append-Only Security Audit Log
          </h1>
          <p>
            Immutable event journal recording user access, scoring executions, rubric updates, and geographic assignments.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchAuditLogs(page)}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="audit-log-filter-bar">
        <div className="audit-filter-item">
          <label htmlFor="filter-action">Action Type</label>
          <select
            id="filter-action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="BULK_ANALYSE">BULK_ANALYSE</option>
            <option value="RUN_ANALYSIS">RUN_ANALYSIS</option>
            <option value="AUDIT_ANSWER_UPSERT">AUDIT_ANSWER_UPSERT</option>
            <option value="UPDATE_OFFICER_DISTRICTS">UPDATE_OFFICER_DISTRICTS</option>
            <option value="CREATE_LOCATION">CREATE_LOCATION</option>
            <option value="BUMP_QUESTION">BUMP_QUESTION</option>
          </select>
        </div>

        <div className="audit-filter-item">
          <label htmlFor="filter-role">Actor Role</label>
          <select
            id="filter-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="OFFICER">OFFICER</option>
            <option value="DATA_OPERATOR">DATA_OPERATOR</option>
          </select>
        </div>

        <div className="audit-filter-item">
          <label htmlFor="filter-target">Target Object</label>
          <select
            id="filter-target"
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
          >
            <option value="">All Targets</option>
            <option value="PILOT_LOCATIONS">PILOT_LOCATIONS</option>
            <option value="AUDIT_PAGE">AUDIT_PAGE</option>
            <option value="OFFICER_DISTRICT">OFFICER_DISTRICT</option>
            <option value="QUESTION">QUESTION</option>
            <option value="USER">USER</option>
          </select>
        </div>

        <form className="audit-filter-item search" onSubmit={handleSearchSubmit}>
          <label htmlFor="filter-search-term">Search Actor / Target ID / IP</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              id="filter-search-term"
              type="text"
              placeholder="e.g. admin or 127.0.0.1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: '0 12px' }}>
              🔍
            </button>
          </div>
        </form>

        <div style={{ marginTop: 'auto' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleResetFilters}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="audit-log-table-card">
        <div className="audit-log-table-toolbar">
          <span>
            Displaying {logs.length} of {totalElements} audit events
          </span>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            🔒 Tamper-evident PostgreSQL journal
          </span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          {loading ? (
            <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
              <AbhisaranLoader message="Loading immutable security log entries..." size={48} />
            </div>
          ) : error ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--danger)' }}>
              ⚠️ {error}
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
              No audit records found matching criteria.
            </div>
          ) : (
            <table className="audit-log-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Target ID</th>
                  <th>Client IP</th>
                  <th>Summary</th>
                  <th style={{ textAlign: 'right' }}>Payload</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{log.actorUsername || 'System'}</span>
                      {log.actorRole && (
                        <span className={`audit-role-badge ${getRoleBadgeClass(log.actorRole)}`}>
                          {log.actorRole}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`audit-action-pill ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{log.targetType || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px' }}>
                        {log.targetId ? (log.targetId.length > 18 ? `${log.targetId.substring(0, 18)}…` : log.targetId) : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--muted)' }}>
                        {log.ipAddress || '—'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
                      {log.details || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => setSelectedLog(log)}
                        disabled={!log.details}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', borderTop: '1px solid var(--line)', fontSize: '13px' }}>
          <div>
            Page {page + 1} of {Math.max(1, totalPages)} ({totalElements} total records)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page <= 0 || loading}
              onClick={() => {
                const prev = page - 1;
                setPage(prev);
                fetchAuditLogs(prev);
              }}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchAuditLogs(next);
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* JSON Inspection Modal */}
      {selectedLog && (
        <div className="modal-overlay">
          <div className="bulk-modal-card">
            <div className="bulk-modal-header">
              <h3>🔍 Event Payload: {selectedLog.action}</h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedLog(null)}
              >
                ✕
              </button>
            </div>
            <div className="bulk-modal-body audit-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12px', marginBottom: '12px' }}>
                <div><b>Actor:</b> {selectedLog.actorUsername} ({selectedLog.actorRole})</div>
                <div><b>Timestamp:</b> {new Date(selectedLog.timestamp).toISOString()}</div>
                <div><b>Target Type:</b> {selectedLog.targetType}</div>
                <div><b>Target ID:</b> {selectedLog.targetId}</div>
                <div><b>Client IP:</b> {selectedLog.ipAddress}</div>
                <div><b>Log ID:</b> {selectedLog.id}</div>
              </div>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Payload / Change Details
              </label>
              <pre>{formatDetailsJson(selectedLog.details)}</pre>
            </div>
            <div className="bulk-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedLog(null)}
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
