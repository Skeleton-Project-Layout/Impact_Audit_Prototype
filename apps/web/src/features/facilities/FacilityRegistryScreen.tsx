import React, { useState, useEffect } from 'react';
import {
  PilotLocationType,
  FacilityResponse,
  CsvUploadSummary,
  fetchLocationTypes,
  registerFacility,
  searchFacilities,
  uploadFacilityCsv
} from '../../api/facilities';
import {
  District,
  Block,
  Panchayat,
  fetchDistricts,
  fetchBlocks,
  fetchPanchayats
} from '../../api/geography';
import { AbhisaranLoader } from '../../components/AbhisaranLoader';

export interface FacilityRegistryScreenProps {
  onAuditFacility?: (facilityId: string) => void;
}

export const FacilityRegistryScreen: React.FC<FacilityRegistryScreenProps> = ({ onAuditFacility }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'register' | 'upload'>('directory');

  // Shared master data
  const [types, setTypes] = useState<PilotLocationType[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  // Directory state
  const [facilities, setFacilities] = useState<FacilityResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<number | undefined>();
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Register state
  const [regTypeCode, setRegTypeCode] = useState<string>('SCHOOL');
  const [regDistrictId, setRegDistrictId] = useState<number | undefined>();
  const [regBlockId, setRegBlockId] = useState<number | undefined>();
  const [regPanchayatId, setRegPanchayatId] = useState<number | undefined>();
  const [regFacilityName, setRegFacilityName] = useState<string>('');
  const [regOfficialCode, setRegOfficialCode] = useState<string>('');
  const [regBlocks, setRegBlocks] = useState<Block[]>([]);
  const [regPanchayats, setRegPanchayats] = useState<Panchayat[]>([]);
  const [registering, setRegistering] = useState<boolean>(false);
  const [registeredSuccess, setRegisteredSuccess] = useState<FacilityResponse | null>(null);

  // Upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSummary, setUploadSummary] = useState<CsvUploadSummary | null>(null);

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadFacilities();
  }, [selectedDistrictFilter, selectedTypeFilter]);

  useEffect(() => {
    if (regDistrictId) {
      loadBlocksForReg(regDistrictId);
    } else {
      setRegBlocks([]);
      setRegBlockId(undefined);
    }
  }, [regDistrictId]);

  useEffect(() => {
    if (regBlockId) {
      loadPanchayatsForReg(regBlockId);
    } else {
      setRegPanchayats([]);
      setRegPanchayatId(undefined);
    }
  }, [regBlockId]);

  const loadMasterData = async () => {
    try {
      const [tData, dData] = await Promise.all([fetchLocationTypes(), fetchDistricts()]);
      setTypes(tData);
      setDistricts(dData);
      if (dData.length > 0) {
        setRegDistrictId(dData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load master metadata');
    }
  };

  const loadFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await searchFacilities({
        districtId: selectedDistrictFilter,
        typeId: selectedTypeFilter,
        size: 50
      });
      setFacilities(res.content);
    } catch (err: any) {
      setError(err.message || 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  const loadBlocksForReg = async (distId: number) => {
    try {
      const blks = await fetchBlocks(distId);
      setRegBlocks(blks);
      setRegBlockId(blks.length > 0 ? blks[0].id : undefined);
    } catch {
      setRegBlocks([]);
    }
  };

  const loadPanchayatsForReg = async (blkId: number) => {
    try {
      const pans = await fetchPanchayats(blkId);
      setRegPanchayats(pans);
      setRegPanchayatId(pans.length > 0 ? pans[0].id : undefined);
    } catch {
      setRegPanchayats([]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDistrictId || !regFacilityName.trim()) return;

    try {
      setRegistering(true);
      setError(null);
      const res = await registerFacility({
        typeCode: regTypeCode,
        districtId: regDistrictId,
        blockId: regBlockId,
        panchayatId: regPanchayatId,
        facilityName: regFacilityName.trim(),
        officialCode: regOfficialCode.trim() || undefined
      });
      setRegisteredSuccess(res);
      setRegFacilityName('');
      setRegOfficialCode('');
      loadFacilities();
    } catch (err: any) {
      setError(err.message || 'Failed to register facility');
    } finally {
      setRegistering(false);
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    try {
      setUploading(true);
      setError(null);
      setUploadSummary(null);
      const summary = await uploadFacilityCsv(csvFile);
      setUploadSummary(summary);
      loadFacilities();
    } catch (err: any) {
      setError(err.message || 'CSV upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      'type_code,district_code,block_code,panchayat_code,facility_name,official_code\n' +
      'SCHOOL,RCH,KNK,KNK_P1,Rajkiya Utkramit Madhya Vidyalaya Kanke,UDISE_2026_001\n' +
      'ANGANWADI,DHN,DHN_B,DHN_P1,Anganwadi Kendra Saraidhela Centre 4,POSHAN_7712\n' +
      'PHC,BOK,CHS,CHS_P1,Primary Health Centre Chas Central,PHC_BOK_09\n' +
      'HOSPITAL,ESB,GCJ,GCJ_P1,Sub-Divisional Hospital Jugsalai,HOS_ESB_14\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'abhisaran_facilities_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFacilities = facilities.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.code.toLowerCase().includes(q) ||
      (f.facilityName && f.facilityName.toLowerCase().includes(q)) ||
      (f.officialCode && f.officialCode.toLowerCase().includes(q)) ||
      f.districtName.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--ink)' }}>
          Pilot Facility Registry & Code Allocator
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '14px' }}>
          Deterministic, non-recyclable institutional identification for Schools, Anganwadis, and Health Centres.
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-danger" style={{ marginBottom: '20px' }}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Segmented Tab Navigation */}
      <div
        style={{
          display: 'flex',
          background: 'var(--surface-2)',
          borderRadius: '8px',
          padding: '4px',
          width: 'fit-content',
          marginBottom: '24px'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className="btn"
          style={{
            background: activeTab === 'directory' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'directory' ? 'var(--ink)' : 'var(--muted)',
            boxShadow: activeTab === 'directory' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'directory' ? 600 : 500,
            cursor: 'pointer'
          }}
        >
          Facility Directory ({facilities.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('register')}
          className="btn"
          style={{
            background: activeTab === 'register' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'register' ? 'var(--ink)' : 'var(--muted)',
            boxShadow: activeTab === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'register' ? 600 : 500,
            cursor: 'pointer'
          }}
        >
          + Register Single Facility
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className="btn"
          style={{
            background: activeTab === 'upload' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'upload' ? 'var(--ink)' : 'var(--muted)',
            boxShadow: activeTab === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'upload' ? 600 : 500,
            cursor: 'pointer'
          }}
        >
          📤 Bulk CSV Upload
        </button>
      </div>

      {/* Tab 1: Directory */}
      {activeTab === 'directory' && (
        <div>
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Search code, name, or UDISE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ maxWidth: '280px', padding: '8px 12px', fontSize: '13px' }}
            />

            <select
              value={selectedDistrictFilter ?? ''}
              onChange={(e) => setSelectedDistrictFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="input-field"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="">All Pilot Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code3})
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter ?? ''}
              onChange={(e) => setSelectedTypeFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="input-field"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="">All Facility Types</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.prefix})
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <AbhisaranLoader size={44} message="Loading facility registry..." />
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <span style={{ fontSize: '32px' }}>🏫</span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '12px', marginBottom: '6px' }}>
                No Facilities Found
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px 0' }}>
                Register a new facility or upload a bulk CSV to allocate non-recyclable codes.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                + Register First Facility
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Unique Code</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Facility Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>District & Block</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>External ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((f) => (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <code
                          style={{
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'var(--accent-soft)',
                            color: 'var(--accent)',
                            fontSize: '12px'
                          }}
                        >
                          {f.code}
                        </code>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--ink)' }}>
                        {f.facilityName || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-subtle">{f.typeLabel}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                        {f.districtName} {f.blockName ? `› ${f.blockName}` : ''}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '12px' }}>
                        {f.officialCode || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-success" style={{ fontSize: '11px' }}>
                          {f.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {onAuditFacility && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ minHeight: '30px', padding: '2px 10px', fontSize: '12px' }}
                            onClick={() => onAuditFacility(f.id)}
                            title="Open Field Audit Workspace for this facility"
                          >
                            📋 Audit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Register Single Facility */}
      {activeTab === 'register' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
            Register New Pilot Facility
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
            Assigns a permanent, non-recyclable code (e.g., <code>JH-RCH-SCH-0001</code>). Once assigned, codes are immutable and never re-used.
          </p>

          {registeredSuccess && (
            <div
              className="alert-banner alert-success"
              style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>🎉 Facility Registered Successfully!</span>
                <button
                  type="button"
                  onClick={() => setRegisteredSuccess(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: '13px' }}>
                Allocated Permanent Code:{' '}
                <strong style={{ fontSize: '15px', color: 'var(--accent)' }}>{registeredSuccess.code}</strong>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                Institution: {registeredSuccess.facilityName} ({registeredSuccess.districtName} District)
              </div>
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '16px' }}>
              <label className="field-label" htmlFor="reg-type-code">Facility Type</label>
              <select
                id="reg-type-code"
                className="input-field"
                value={regTypeCode}
                onChange={(e) => setRegTypeCode(e.target.value)}
                required
              >
                {types.map((t) => (
                  <option key={t.id} value={t.code}>
                    {t.label} ({t.prefix}) &bull; Domain: {t.domain}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="field-label" htmlFor="reg-district-id">Pilot District</label>
                <select
                  id="reg-district-id"
                  className="input-field"
                  value={regDistrictId ?? ''}
                  onChange={(e) => setRegDistrictId(Number(e.target.value))}
                  required
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code3})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="reg-block-id">Block (Optional)</label>
                <select
                  id="reg-block-id"
                  className="input-field"
                  value={regBlockId ?? ''}
                  onChange={(e) => setRegBlockId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">None / Unassigned</option>
                  {regBlocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {regBlockId && regPanchayats.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label className="field-label" htmlFor="reg-panchayat-id">Gram Panchayat (Optional)</label>
                <select
                  id="reg-panchayat-id"
                  className="input-field"
                  value={regPanchayatId ?? ''}
                  onChange={(e) => setRegPanchayatId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">None / Unassigned</option>
                  {regPanchayats.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label className="field-label" htmlFor="reg-facility-name">Official Facility Name</label>
              <input
                id="reg-facility-name"
                type="text"
                className="input-field"
                placeholder="e.g. Rajkiya Utkramit Madhya Vidyalaya Kanke"
                value={regFacilityName}
                onChange={(e) => setRegFacilityName(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                🔒 Sequestered in restricted registry; never exposed on public ACS scoring tables.
              </span>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="field-label" htmlFor="reg-official-code">External Code (UDISE+ / POSHAN Tracker / NIN)</label>
              <input
                id="reg-official-code"
                type="text"
                className="input-field"
                placeholder="e.g. 20010100101"
                value={regOfficialCode}
                onChange={(e) => setRegOfficialCode(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px' }}
              disabled={registering}
            >
              {registering ? 'Generating Non-Recyclable Code...' : 'Register Facility & Allocate Code'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Bulk CSV Upload */}
      {activeTab === 'upload' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>
                  Bulk Facility CSV Upload
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Upload batches of institutional facilities with automated row-level validation.
                </span>
              </div>

              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                📥 Download Template CSV
              </button>
            </div>

            <form onSubmit={handleCsvUpload}>
              <div
                style={{
                  border: '2px dashed var(--line)',
                  borderRadius: '8px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: 'var(--surface-2)',
                  marginBottom: '20px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    {csvFile ? csvFile.name : 'Click or Drag CSV File Here'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Required columns: <code>type_code, district_code, facility_name</code> (Optional: <code>block_code, panchayat_code, official_code</code>)
                  </div>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px' }}
                disabled={!csvFile || uploading}
              >
                {uploading ? 'Processing & Validating CSV...' : `Upload & Process ${csvFile ? `(${csvFile.name})` : ''}`}
              </button>
            </form>
          </div>

          {/* Upload Diagnostics Report */}
          {uploadSummary && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                CSV Processing Report
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{uploadSummary.totalRows}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Rows</div>
                </div>

                <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)' }}>
                    {uploadSummary.successCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Successful Registrations</div>
                </div>

                <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '6px', textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: uploadSummary.failureCount > 0 ? 'var(--danger)' : 'var(--muted)'
                    }}
                  >
                    {uploadSummary.failureCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Validation Failures</div>
                </div>
              </div>

              {/* Validation Errors Table */}
              {uploadSummary.errors.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)', marginBottom: '8px' }}>
                    Validation Diagnostics ({uploadSummary.errors.length} issues detected):
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Line #</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Field</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Diagnostic Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadSummary.errors.map((err, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>Row {err.rowNumber}</td>
                          <td style={{ padding: '8px 12px' }}><code>{err.field}</code></td>
                          <td style={{ padding: '8px 12px', color: 'var(--danger)' }}>{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
