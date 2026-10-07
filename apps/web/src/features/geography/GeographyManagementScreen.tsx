import React, { useState, useEffect } from 'react';
import {
  District,
  Block,
  Panchayat,
  fetchDistricts,
  fetchBlocks,
  fetchPanchayats,
  createBlock,
  createPanchayat
} from '../../api/geography';
import { AbhisaranLoader } from '../../components/AbhisaranLoader';

export const GeographyManagementScreen: React.FC = () => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [panchayatsByBlock, setPanchayatsByBlock] = useState<Record<number, Panchayat[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddBlock, setShowAddBlock] = useState<boolean>(false);
  const [newBlockCode, setNewBlockCode] = useState<string>('');
  const [newBlockName, setNewBlockName] = useState<string>('');

  const [activeBlockForPanchayat, setActiveBlockForPanchayat] = useState<Block | null>(null);
  const [newPanchayatCode, setNewPanchayatCode] = useState<string>('');
  const [newPanchayatName, setNewPanchayatName] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDistricts();
      setDistricts(data);
      if (data.length > 0) {
        setSelectedDistrict(data[0]);
        await loadBlocksForDistrict(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load districts');
    } finally {
      setLoading(false);
    }
  };

  const loadBlocksForDistrict = async (districtId: number) => {
    try {
      setLoading(true);
      const blks = await fetchBlocks(districtId);
      setBlocks(blks);

      // Load panchayats for all blocks
      const panMap: Record<number, Panchayat[]> = {};
      await Promise.all(
        blks.map(async (b) => {
          try {
            const pans = await fetchPanchayats(b.id);
            panMap[b.id] = pans;
          } catch {
            panMap[b.id] = [];
          }
        })
      );
      setPanchayatsByBlock(panMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load blocks');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDistrict = (d: District) => {
    setSelectedDistrict(d);
    loadBlocksForDistrict(d.id);
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrict || !newBlockCode.trim() || !newBlockName.trim()) return;

    try {
      setActionLoading(true);
      setError(null);
      await createBlock({
        districtId: selectedDistrict.id,
        code: newBlockCode.trim().toUpperCase(),
        name: newBlockName.trim()
      });
      setShowAddBlock(false);
      setNewBlockCode('');
      setNewBlockName('');
      await loadBlocksForDistrict(selectedDistrict.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create block');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePanchayat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBlockForPanchayat || !newPanchayatCode.trim() || !newPanchayatName.trim()) return;

    try {
      setActionLoading(true);
      setError(null);
      await createPanchayat({
        blockId: activeBlockForPanchayat.id,
        code: newPanchayatCode.trim().toUpperCase(),
        name: newPanchayatName.trim()
      });
      setActiveBlockForPanchayat(null);
      setNewPanchayatCode('');
      setNewPanchayatName('');
      if (selectedDistrict) {
        await loadBlocksForDistrict(selectedDistrict.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create panchayat');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            Geography & Pilot Location Hierarchy
          </h1>
          <span className="badge badge-subtle" style={{ fontWeight: 600 }}>
            State: Jharkhand (JH)
          </span>
        </div>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '14px' }}>
          Administrative structure for the 4 pilot districts. Add blocks and panchayats to expand local facility coverage.
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-danger" style={{ marginBottom: '20px' }}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Pilot District Selector Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '24px'
        }}
      >
        {districts.map((d) => {
          const isSelected = selectedDistrict?.id === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => handleSelectDistrict(d)}
              className={isSelected ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{d.name}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--surface-2)',
                  color: isSelected ? '#fff' : 'var(--muted)'
                }}
              >
                {d.code3}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <AbhisaranLoader size={44} message="Loading geography data..." />
        </div>
      ) : selectedDistrict ? (
        <div>
          {/* District Header & Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>
                {selectedDistrict.name} District ({selectedDistrict.code3})
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {blocks.length} Blocks registered &bull;{' '}
                {Object.values(panchayatsByBlock).reduce((acc, curr) => acc + curr.length, 0)} Panchayats
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAddBlock(true)}
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              + Add New Block
            </button>
          </div>

          {/* Blocks Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
            {blocks.map((b) => {
              const pans = panchayatsByBlock[b.id] || [];
              return (
                <div
                  key={b.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '16px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 600, fontSize: '15px' }}>{b.name}</span>
                      <span className="badge badge-subtle" style={{ fontSize: '11px' }}>
                        Code: {b.code}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', fontWeight: 600 }}>
                      PANCHAYATS ({pans.length}):
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                      {pans.length > 0 ? (
                        pans.map((p) => (
                          <span
                            key={p.id}
                            style={{
                              fontSize: '12px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'var(--surface-2)',
                              border: '1px solid var(--line)',
                              color: 'var(--ink)'
                            }}
                          >
                            {p.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>
                          No panchayats registered yet
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveBlockForPanchayat(b)}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                  >
                    + Add Panchayat
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Add Block Modal */}
      {showAddBlock && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              Add Block in {selectedDistrict?.name}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              Define the administrative block code and official name.
            </p>

            <form onSubmit={handleCreateBlock}>
              <div style={{ marginBottom: '16px' }}>
                <label className="field-label" htmlFor="new-block-code">Block Code (e.g., KNK, DHN_SADAR)</label>
                <input
                  id="new-block-code"
                  type="text"
                  className="input-field"
                  placeholder="e.g. KNK"
                  value={newBlockCode}
                  onChange={(e) => setNewBlockCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="field-label" htmlFor="new-block-name">Block Name</label>
                <input
                  id="new-block-name"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Kanke"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddBlock(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Add Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Panchayat Modal */}
      {activeBlockForPanchayat && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              Add Panchayat in {activeBlockForPanchayat.name}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              Register a Gram Panchayat in this administrative block.
            </p>

            <form onSubmit={handleCreatePanchayat}>
              <div style={{ marginBottom: '16px' }}>
                <label className="field-label" htmlFor="new-panchayat-code">Panchayat Code (e.g., KNK_P1)</label>
                <input
                  id="new-panchayat-code"
                  type="text"
                  className="input-field"
                  placeholder="e.g. KNK_P1"
                  value={newPanchayatCode}
                  onChange={(e) => setNewPanchayatCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="field-label" htmlFor="new-panchayat-name">Panchayat Name</label>
                <input
                  id="new-panchayat-name"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Kanke North"
                  value={newPanchayatName}
                  onChange={(e) => setNewPanchayatName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setActiveBlockForPanchayat(null)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Add Panchayat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
