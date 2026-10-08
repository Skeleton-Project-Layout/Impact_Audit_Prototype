import React, { useState, useEffect, useCallback } from 'react';
import './dashboard.css';
import { AbhisaranLoader } from '../../components/AbhisaranLoader';
import { PilotLocationReportModal } from './PilotLocationReportModal';

export interface LocationOverviewItem {
  id: string;
  code: string;
  typeCode: string | null;
  typePrefix: string | null;
  typeLabel: string | null;
  domain: string | null;
  districtId: number | null;
  districtCode: string | null;
  districtName: string | null;
  blockId: number | null;
  blockName: string | null;
  panchayatId: number | null;
  panchayatName: string | null;
  status: string;
  isDemo: boolean;
  pageCount: number;
  latestRunId: string | null;
  latestRunNumber: number | null;
  latestAcsScore: number | null;
  latestAlertBand: string | null;
  latestCoveragePct: number | null;
  latestIsProvisional: boolean;
  latestRedFlagsCount: number;
  lastAnalysedAt: string | null;
  lastSubmittedAt: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  totalLocations: number;
  readyForAnalysis: number;
  analysed: number;
  draftOrReopened: number;
  registered: number;
}

export interface BulkAnalyseItemResult {
  locationId: string;
  facilityCode: string;
  success: boolean;
  acsScore: number | null;
  alertBand: string | null;
  coveragePct: number | null;
  runId: string | null;
  deliveredOfficersCount: number;
  errorMessage: string | null;
}

export interface BulkAnalyseResponse {
  totalRequested: number;
  totalSuccess: number;
  totalFailed: number;
  results: BulkAnalyseItemResult[];
  executedAt: string;
}

interface DistrictOption {
  id: number;
  name: string;
  code3: string;
}

interface BlockOption {
  id: number;
  name: string;
}

interface LocationTypeOption {
  id: number;
  code: string;
  label: string;
  domain: string;
}

interface DashboardOverviewScreenProps {
  onViewAnalysis: (locationId: string, runId?: string) => void;
  onGoToAudit: (locationId: string) => void;
}

export const DashboardOverviewScreen: React.FC<DashboardOverviewScreenProps> = ({
  onViewAnalysis,
  onGoToAudit
}) => {
  // Data state
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [locations, setLocations] = useState<LocationOverviewItem[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [blocks, setBlocks] = useState<BlockOption[]>([]);
  const [locationTypes, setLocationTypes] = useState<LocationTypeOption[]>([]);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Bulk Selection state
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [isBulkExecuting, setIsBulkExecuting] = useState<boolean>(false);
  const [bulkResponse, setBulkResponse] = useState<BulkAnalyseResponse | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedModalLocation, setSelectedModalLocation] = useState<LocationOverviewItem | null>(null);

  // Single location scoring handler
  const handleExecuteSingleAnalyse = async (locationId: string) => {
    setIsBulkExecuting(true);
    try {
      const res = await fetch(`/api/v1/locations/${locationId}/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Scoring failed with HTTP ${res.status}`);
      }
      await loadDashboard(page);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Scoring analysis failed.');
    } finally {
      setIsBulkExecuting(false);
    }
  };

  // Load initial dropdown options
  useEffect(() => {
    fetchDistricts();
    fetchLocationTypes();
  }, []);

  // Cascading blocks when district changes
  useEffect(() => {
    if (selectedDistrict) {
      fetchBlocks(Number(selectedDistrict));
    } else {
      setBlocks([]);
      setSelectedBlock('');
    }
  }, [selectedDistrict]);

  const fetchDistricts = async () => {
    try {
      const res = await fetch('/api/v1/geography/districts');
      if (res.ok) {
        const data = await res.json();
        setDistricts(data);
        const ekh = data.find((d: any) =>
          d.code3 === 'EKH' ||
          d.name?.toLowerCase().includes('khasi') ||
          d.name?.toLowerCase().includes('khalasi')
        );
        if (ekh && !selectedDistrict) {
          setSelectedDistrict(String(ekh.id));
        }
      }
    } catch (e) {
      console.error('Failed to load districts', e);
    }
  };

  const fetchBlocks = async (districtId: number) => {
    try {
      const res = await fetch(`/api/v1/geography/districts/${districtId}/blocks`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
      }
    } catch (e) {
      console.error('Failed to load blocks', e);
    }
  };

  const fetchLocationTypes = async () => {
    try {
      const res = await fetch('/api/v1/facilities/types');
      if (res.ok) {
        const data = await res.json();
        setLocationTypes(data);
      }
    } catch (e) {
      console.error('Failed to load location types', e);
    }
  };

  // Load Dashboard Data
  const loadDashboard = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedDistrict) params.append('districtId', selectedDistrict);
      if (selectedBlock) params.append('blockId', selectedBlock);
      if (selectedType) params.append('typeId', selectedType);
      if (selectedStatus && selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      params.append('page', String(targetPage));
      params.append('size', '20');

      const res = await fetch(`/api/v1/dashboard/overview?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load dashboard overview (HTTP ${res.status})`);
      }
      const data = await res.json();
      setMetrics(data.metrics);
      setLocations(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  }, [page, selectedDistrict, selectedBlock, selectedType, selectedStatus, searchTerm]);

  useEffect(() => {
    loadDashboard(0);
  }, [selectedDistrict, selectedBlock, selectedType, selectedStatus, loadDashboard]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDashboard(0);
  };

  const handleResetFilters = () => {
    setSelectedDistrict('');
    setSelectedBlock('');
    setSelectedType('');
    setSelectedStatus('ALL');
    setSearchTerm('');
    setPage(0);
  };

  // Bulk Selection Handlers
  const handleToggleSelectLocation = (id: string) => {
    setSelectedLocationIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllReadyOnPage = () => {
    const readyIds = locations
      .filter(loc => loc.status === 'READY_FOR_ANALYSIS')
      .map(loc => loc.id);

    const allSelected = readyIds.every(id => selectedLocationIds.includes(id));
    if (allSelected) {
      setSelectedLocationIds(prev => prev.filter(id => !readyIds.includes(id)));
    } else {
      setSelectedLocationIds(prev => Array.from(new Set([...prev, ...readyIds])));
    }
  };

  const handleOpenBulkModal = () => {
    setBulkResponse(null);
    setShowBulkModal(true);
  };

  const handleExecuteBulkAnalyse = async () => {
    setIsBulkExecuting(true);
    setBulkResponse(null);
    try {
      const payload = selectedLocationIds.length > 0
        ? { locationIds: selectedLocationIds }
        : null;

      const res = await fetch('/api/v1/dashboard/bulk-analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined
      });

      if (!res.ok) {
        throw new Error(`Bulk analysis failed with HTTP ${res.status}`);
      }

      const data: BulkAnalyseResponse = await res.json();
      setBulkResponse(data);
      setSelectedLocationIds([]);
      // Refresh dashboard in background
      loadDashboard(page);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Bulk analysis failed.');
    } finally {
      setIsBulkExecuting(false);
    }
  };

  const getBandClass = (band: string | null) => {
    if (!band) return '';
    switch (band.toUpperCase()) {
      case 'DARK_GREEN': return 'dark-green';
      case 'LIGHT_GREEN': return 'light-green';
      case 'ORANGE': return 'orange';
      case 'RED': return 'red';
      default: return '';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'READY_FOR_ANALYSIS': return 'ready';
      case 'ANALYSED': return 'analysed';
      case 'DRAFT':
      case 'REOPENED': return 'draft';
      case 'REGISTERED': return 'registered';
      default: return '';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>
            <span>📊</span> Administrative Overview & Audit Analytics
          </h1>
          <p>
            Holistic pilot baseline progress, deterministic compliance scoring, and atomic officer delivery tracking.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => loadDashboard(page)}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenBulkModal}
            disabled={loading || (metrics?.readyForAnalysis === 0 && selectedLocationIds.length === 0)}
          >
            ⚡ Bulk Analyse {selectedLocationIds.length > 0 ? `(${selectedLocationIds.length})` : 'Ready Facilities'}
          </button>
        </div>
      </div>

      {/* Strict Non-Ranking Disclaimer Banner */}
      <div className="non-ranking-banner">
        <span className="icon">🛡️</span>
        <div>
          <b>Non-Ranking Compliance Policy:</b> Per the AEHT institutional framework, Abhisaran strictly enforces non-comparative audit baselines. Facilities are permanently sorted by Facility Identification Code (ASC). League tables and inter-facility rankings are architecturally barred.
        </div>
      </div>

      {/* Metric Tiles */}
      {metrics && (
        <div className="dashboard-metrics-grid">
          <div className="dashboard-metric-card accent">
            <div className="dashboard-metric-label">
              <span>Total Pilot Locations</span>
              <span>🏫</span>
            </div>
            <div className="dashboard-metric-value">{metrics.totalLocations}</div>
            <div className="dashboard-metric-subtext">Registered facilities across pilot districts</div>
          </div>

          <div
            className="dashboard-metric-card ready"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedStatus('READY_FOR_ANALYSIS')}
            title="Click to filter Ready for Analysis"
          >
            <div className="dashboard-metric-label">
              <span>Ready for Analysis</span>
              <span>⏳</span>
            </div>
            <div className="dashboard-metric-value" style={{ color: '#2563eb' }}>
              {metrics.readyForAnalysis}
            </div>
            <div className="dashboard-metric-subtext">Submissions ready for scoring engine</div>
          </div>

          <div
            className="dashboard-metric-card analysed"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedStatus('ANALYSED')}
            title="Click to filter Analysed"
          >
            <div className="dashboard-metric-label">
              <span>Analysed & Delivered</span>
              <span>✅</span>
            </div>
            <div className="dashboard-metric-value" style={{ color: '#16a34a' }}>
              {metrics.analysed}
            </div>
            <div className="dashboard-metric-subtext">ACS calculated & dispatched to officers</div>
          </div>

          <div
            className="dashboard-metric-card draft"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedStatus('DRAFT')}
            title="Click to filter In Progress"
          >
            <div className="dashboard-metric-label">
              <span>In Progress / Draft</span>
              <span>📝</span>
            </div>
            <div className="dashboard-metric-value" style={{ color: '#d97706' }}>
              {metrics.draftOrReopened}
            </div>
            <div className="dashboard-metric-subtext">Audits currently under field collection</div>
          </div>

          <div
            className="dashboard-metric-card registered"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedStatus('REGISTERED')}
            title="Click to filter Registered"
          >
            <div className="dashboard-metric-label">
              <span>Registered (New)</span>
              <span>🏷️</span>
            </div>
            <div className="dashboard-metric-value" style={{ color: '#64748b' }}>
              {metrics.registered}
            </div>
            <div className="dashboard-metric-subtext">Allocated codes awaiting first page</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="dashboard-filter-bar">
        <div className="filter-control">
          <label htmlFor="filter-district">District</label>
          <select
            id="filter-district"
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedBlock('');
            }}
          >
            <option value="">All Districts</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code3})</option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label htmlFor="filter-block">Block</label>
          <select
            id="filter-block"
            value={selectedBlock}
            disabled={!selectedDistrict || blocks.length === 0}
            onChange={(e) => setSelectedBlock(e.target.value)}
          >
            <option value="">All Blocks</option>
            {blocks.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label htmlFor="filter-type">Facility Type</label>
          <select
            id="filter-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Facility Types</option>
            {locationTypes.map(t => (
              <option key={t.id} value={t.id}>{t.label} ({t.domain})</option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label htmlFor="filter-status">Audit Status</label>
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="READY_FOR_ANALYSIS">Ready for Analysis</option>
            <option value="ANALYSED">Analysed</option>
            <option value="DRAFT">Draft / Field Entry</option>
            <option value="REGISTERED">Registered</option>
          </select>
        </div>

        <form className="filter-control search-control" onSubmit={handleSearchSubmit}>
          <label htmlFor="filter-search">Facility Code Search</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              id="filter-search"
              type="text"
              placeholder="e.g. JH-RCH-001"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: '0 12px' }}>
              🔍
            </button>
          </div>
        </form>

        <div className="filter-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleResetFilters}
            title="Reset all filters"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="dashboard-table-card">
        <div className="dashboard-table-toolbar">
          <div className="selection-summary">
            <span>
              Showing {locations.length} of {totalElements} facilities
            </span>
            {selectedLocationIds.length > 0 && (
              <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {selectedLocationIds.length} selected for bulk analyse
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Cards View"
              >
                🃏 Location Cards
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                📋 Table View
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 10px' }}
              onClick={handleSelectAllReadyOnPage}
            >
              Select Ready on Page
            </button>
            {selectedLocationIds.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '12px', padding: '6px 10px' }}
                onClick={() => setSelectedLocationIds([])}
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-table-wrapper">
          {loading ? (
            <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
              <AbhisaranLoader message="Loading facility overview..." size={48} />
            </div>
          ) : error ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--danger)' }}>
              ⚠️ {error}
            </div>
          ) : locations.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--muted)' }}>
              No facilities found matching the specified filters.
            </div>
          ) : viewMode === 'cards' ? (
            <div className="location-cards-grid">
              {locations.map((loc) => {
                const isAnalysed = loc.status === 'ANALYSED';
                const isSelected = selectedLocationIds.includes(loc.id);
                const isReady = loc.status === 'READY_FOR_ANALYSIS';
                const bandClass = getBandClass(loc.latestAlertBand);

                return (
                  <div
                    key={loc.id}
                    className={`pilot-location-card ${isSelected ? 'selected' : ''} ${bandClass ? bandClass : loc.status.toLowerCase()}`}
                    onClick={() => setSelectedModalLocation(loc)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Header */}
                    <div className="location-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          className="card-checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleToggleSelectLocation(loc.id)}
                          title="Select for bulk actions"
                        />
                        <span
                          className="facility-code-pill"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedModalLocation(loc);
                          }}
                          title="Click to view pilot report & findings"
                        >
                          {loc.code}
                        </span>
                        {loc.isDemo && (
                          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>[Demo]</span>
                        )}
                      </div>
                      <span className={`status-pill ${getStatusClass(loc.status)}`}>
                        {loc.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Facility Type & Geography */}
                    <div className="location-card-meta">
                      <div className="location-type-badge">
                        <span className="type-icon">
                          {loc.domain === 'Education' ? '🏫' : loc.domain === 'Health' ? '🏥' : loc.domain === 'Nutrition' ? '👶' : '🌾'}
                        </span>
                        <span className="type-title">{loc.typeLabel || loc.typePrefix || 'Facility'}</span>
                        <span className="domain-tag">({loc.domain || 'Pilot'})</span>
                      </div>

                      <div className="geo-tag">
                        <span>📍 <b>{loc.districtName || 'Pilot District'}</b></span>
                        {loc.blockName && <span> &middot; {loc.blockName} Block</span>}
                      </div>
                    </div>

                    {/* Fancy Score Showcase / Status Body */}
                    <div className="location-card-body">
                      {isAnalysed ? (
                        <div className="score-showcase-box">
                          <div className="score-display">
                            <div className={`score-badge ${bandClass}`}>
                              <span className="score-num">{loc.latestAcsScore != null ? loc.latestAcsScore.toFixed(1) : '70.0'}</span>
                              <span className="score-denom">/100</span>
                            </div>
                            <div className="score-meta">
                              <div className={`band-label ${bandClass}`}>
                                {loc.latestAlertBand === 'GREEN' || loc.latestAlertBand === 'DARK_GREEN' ? '🟢 Optimal Continuity' : loc.latestAlertBand === 'AMBER' || loc.latestAlertBand === 'ORANGE' ? '🟡 At Risk' : '🔴 Critical Risk'}
                              </div>
                              {loc.latestIsProvisional && (
                                <span className="provisional-pill" title="Coverage < 70%">⚠️ Provisional</span>
                              )}
                              {loc.lastAnalysedAt && (
                                <span className="time-subtext">Scored {new Date(loc.lastAnalysedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>

                          <div className="red-flags-indicator">
                            {loc.latestRedFlagsCount > 0 ? (
                              <span className="flags-pill danger">🚨 {loc.latestRedFlagsCount} Red Flag{loc.latestRedFlagsCount === 1 ? '' : 's'}</span>
                            ) : (
                              <span className="flags-pill clean">✓ 0 Red Flags</span>
                            )}
                          </div>
                        </div>
                      ) : isReady ? (
                        <div className="ready-showcase-box">
                          <div className="ready-indicator">
                            <span className="ready-icon">⏳</span>
                            <div>
                              <div className="ready-title">Field Audit Submitted</div>
                              <div className="ready-subtext">Locked &amp; ready for scoring engine</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn single-analyse-btn"
                            onClick={() => handleExecuteSingleAnalyse(loc.id)}
                            disabled={isBulkExecuting}
                          >
                            ⚡ Run Scoring Engine
                          </button>
                        </div>
                      ) : (
                        <div className="draft-showcase-box">
                          <div className="draft-progress-row">
                            <span className="pages-count">📄 {loc.pageCount} Audit Page{loc.pageCount === 1 ? '' : 's'}</span>
                            <span className="draft-tag">{loc.status === 'DRAFT' || loc.status === 'REOPENED' ? 'In Collection' : 'Registered'}</span>
                          </div>
                          <div className="draft-hint">
                            {loc.status === 'DRAFT' || loc.status === 'REOPENED'
                              ? 'Field baseline collection actively under way.'
                              : 'Facility code allocated. Ready for field audit.'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="location-card-footer">
                      <button
                        type="button"
                        className="btn btn-primary card-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModalLocation(loc);
                        }}
                      >
                        📊 View Findings &amp; Report
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary card-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoToAudit(loc.id);
                        }}
                      >
                        📋 Audit Form
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={
                        locations.length > 0 &&
                        locations.every(loc => selectedLocationIds.includes(loc.id))
                      }
                      onChange={() => {
                        const allPageSelected = locations.every(loc => selectedLocationIds.includes(loc.id));
                        if (allPageSelected) {
                          setSelectedLocationIds(prev => prev.filter(id => !locations.some(l => l.id === id)));
                        } else {
                          setSelectedLocationIds(prev => Array.from(new Set([...prev, ...locations.map(l => l.id)])));
                        }
                      }}
                      title="Select all on this page"
                    />
                  </th>
                  <th>Facility Code</th>
                  <th>Type & Domain</th>
                  <th>District / Block</th>
                  <th>Status</th>
                  <th>Pages</th>
                  <th>Latest ACS Score</th>
                  <th>Red Flags</th>
                  <th>Last Analysed</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => {
                  const isAnalysed = loc.status === 'ANALYSED';
                  const isSelected = selectedLocationIds.includes(loc.id);

                  return (
                    <tr key={loc.id} style={{ background: isSelected ? 'rgba(37, 99, 235, 0.04)' : undefined }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectLocation(loc.id)}
                        />
                      </td>
                      <td>
                        <span
                          className="facility-code-pill"
                          onClick={() => setSelectedModalLocation(loc)}
                          title="Click to view pilot report & findings"
                        >
                          {loc.code}
                        </span>
                        {loc.isDemo && (
                          <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: '6px' }}>
                            [Demo]
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{loc.typeLabel || loc.typePrefix || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{loc.domain || '—'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{loc.districtName || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          {loc.blockName ? `${loc.blockName}` : 'District Wide'}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${getStatusClass(loc.status)}`}>
                          {loc.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                          {loc.pageCount}
                        </span>
                      </td>
                      <td>
                        {loc.latestAcsScore != null ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <span className={`score-band-pill ${getBandClass(loc.latestAlertBand)}`}>
                              {loc.latestAcsScore.toFixed(1)}
                            </span>
                            {loc.latestIsProvisional && (
                              <span className="provisional-badge" title="Coverage < 70%">
                                Provisional
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {loc.latestRedFlagsCount > 0 ? (
                          <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>
                            🚨 {loc.latestRedFlagsCount}
                          </span>
                        ) : loc.latestRunId ? (
                          <span style={{ color: '#16a34a', fontSize: '12px' }}>✓ None</span>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {loc.lastAnalysedAt ? (
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            {new Date(loc.lastAnalysedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Not yet</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {isAnalysed && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                              onClick={() => onViewAnalysis(loc.id, loc.latestRunId || undefined)}
                            >
                              📊 ACS
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => onGoToAudit(loc.id)}
                          >
                            📋 Audit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="dashboard-pagination">
          <div>
            Page {page + 1} of {Math.max(1, totalPages)} ({totalElements} total locations)
          </div>
          <div className="pagination-controls">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page <= 0 || loading}
              onClick={() => {
                const prev = page - 1;
                setPage(prev);
                loadDashboard(prev);
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
                loadDashboard(next);
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Analyse Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="bulk-modal-card">
            <div className="bulk-modal-header">
              <h3>⚡ Bulk Audit Analysis & Officer Delivery</h3>
              {!isBulkExecuting && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowBulkModal(false)}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="bulk-modal-body">
              {isBulkExecuting ? (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <AbhisaranLoader
                    message="Evaluating deterministic rubric algorithms & delivering to scoped district officers..."
                    size={64}
                  />
                  <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)' }}>
                    Each location undergoes ledger balancing, mathematical deduction accounting, and atomic database dispatch.
                  </p>
                </div>
              ) : bulkResponse ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    className="alert-banner"
                    style={{
                      background: bulkResponse.totalFailed === 0 ? '#dcfce7' : '#fef3c7',
                      color: bulkResponse.totalFailed === 0 ? '#166534' : '#92400e',
                      border: '1px solid currentColor',
                      borderRadius: '8px',
                      padding: '12px 16px'
                    }}
                  >
                    <b>Bulk Run Completed:</b> {bulkResponse.totalSuccess} succeeded, {bulkResponse.totalFailed} failed out of {bulkResponse.totalRequested} locations.
                  </div>

                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {bulkResponse.results.map((res) => (
                      <div key={res.locationId} className="bulk-result-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>
                            {res.facilityCode}
                          </span>
                          {res.success ? (
                            <span className={`score-band-pill ${getBandClass(res.alertBand)}`}>
                              ACS: {res.acsScore != null ? res.acsScore.toFixed(1) : '—'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--danger)', fontSize: '12px' }}>
                              ⚠️ {res.errorMessage || 'Failed'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {res.success && `Delivered to ${res.deliveredOfficersCount} officer(s)`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--ink)' }}>
                    You are about to run batch evaluation for:
                  </p>
                  <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                    {selectedLocationIds.length > 0 ? (
                      <div>
                        <b>{selectedLocationIds.length} Selected Facilities</b>
                        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                          Analysis will run across only the facilities you have explicitly checked.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <b>All Facilities Ready for Analysis ({metrics?.readyForAnalysis || 0} locations)</b>
                        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                          No specific facilities checked. All facilities currently in <code>READY_FOR_ANALYSIS</code> status will be processed.
                        </p>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    🛡️ Each facility's resulting audit run will be atomically delivered into the scoped inboxes of district officers for that location.
                  </div>
                </div>
              )}
            </div>

            <div className="bulk-modal-footer">
              {bulkResponse ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowBulkModal(false)}
                >
                  Close & View Dashboard
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowBulkModal(false)}
                    disabled={isBulkExecuting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleExecuteBulkAnalyse}
                    disabled={isBulkExecuting || (selectedLocationIds.length === 0 && (!metrics || metrics.readyForAnalysis === 0))}
                  >
                    Confirm & Start Bulk Analyse
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* POPUP PILOT REPORT MODAL */}
      {selectedModalLocation && (
        <PilotLocationReportModal
          locationId={selectedModalLocation.id}
          facilityCode={selectedModalLocation.code}
          typeLabel={selectedModalLocation.typeLabel}
          domain={selectedModalLocation.domain}
          districtName={selectedModalLocation.districtName}
          blockName={selectedModalLocation.blockName}
          initialStatus={selectedModalLocation.status}
          onClose={() => setSelectedModalLocation(null)}
          onGoToAudit={(locId) => {
            setSelectedModalLocation(null);
            onGoToAudit(locId);
          }}
          onAnalysisUpdated={() => loadDashboard(page)}
        />
      )}
    </div>
  );
};
