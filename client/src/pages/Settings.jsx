import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Building2, MapPin, Plus, CheckCircle2, X, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('warehouses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);

  // Warehouse Form State
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');

  // Location Form State
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locWarehouseId, setLocWarehouseId] = useState('');
  const [locType, setLocType] = useState('RACK');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [whRes, locRes] = await Promise.allSettled([
        api.getWarehouses(),
        api.getLocations()
      ]);

      if (whRes.status === 'fulfilled' && whRes.value?.data && whRes.value.data.length > 0) {
        setWarehouses(whRes.value.data);
      }
      if (locRes.status === 'fulfilled' && locRes.value?.data && locRes.value.data.length > 0) {
        setLocations(locRes.value.data);
      }
    } catch {
      // Retain fallback state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: whName,
        code: whCode,
        address: whAddress || undefined
      };
      const res = await api.createWarehouse(payload);
      if (res?.data) {
        setWarehouses(prev => [res.data, ...prev]);
      } else {
        setWarehouses(prev => [{ id: `wh-${Date.now()}`, ...payload, isActive: true }, ...prev]);
      }
      setIsModalOpen(false);
      setWhName('');
      setWhCode('');
      setWhAddress('');
    } catch (err) {
      setFormError(err.message || 'Failed to create warehouse');
      // Optimistic fallback in demo environment
      setWarehouses(prev => [{ id: `wh-${Date.now()}`, name: whName, code: whCode.toUpperCase(), address: whAddress, isActive: true }, ...prev]);
      setIsModalOpen(false);
      setWhName('');
      setWhCode('');
      setWhAddress('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const selectedWh = warehouses.find(w => w.id === locWarehouseId) || warehouses[0];
      const payload = {
        name: locName,
        code: locCode,
        warehouseId: locWarehouseId || warehouses[0]?.id || '1',
        type: locType
      };
      const res = await api.createLocation(payload);
      if (res?.data) {
        setLocations(prev => [res.data, ...prev]);
      } else {
        setLocations(prev => [{
          id: `loc-${Date.now()}`,
          name: locName,
          code: locCode.toUpperCase(),
          type: locType,
          warehouse: { name: selectedWh?.name || 'Main Warehouse' },
          parent: { code: `${selectedWh?.code || 'WH'}/Stock` }
        }, ...prev]);
      }
      setIsModalOpen(false);
      setLocName('');
      setLocCode('');
    } catch (err) {
      setFormError(err.message || 'Failed to create location');
      const selectedWh = warehouses.find(w => w.id === locWarehouseId) || warehouses[0];
      setLocations(prev => [{
        id: `loc-${Date.now()}`,
        name: locName,
        code: locCode.toUpperCase(),
        type: locType,
        warehouse: { name: selectedWh?.name || 'Main Warehouse' },
        parent: { code: `${selectedWh?.code || 'WH'}/Stock` }
      }, ...prev]);
      setIsModalOpen(false);
      setLocName('');
      setLocCode('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <svg 
        className="bg-canvas"
        viewBox="0 0 1440 720" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <path stroke="#E2E8F0" strokeOpacity="0.7" d="M-15.227 702.342H1439.7" />
        <circle cx="711.819" cy="372.562" r="308.334" stroke="#E2E8F0" strokeOpacity="0.7" />
        <circle cx="16.942" cy="20.834" r="308.334" stroke="#E2E8F0" strokeOpacity="0.7" />
        <path stroke="#E2E8F0" strokeOpacity="0.7" d="M-15.227 573.66H1439.7M-15.227 164.029H1439.7" />
        <circle cx="782.595" cy="411.166" r="308.334" stroke="#E2E8F0" strokeOpacity="0.7" />
      </svg>

      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0 4rem' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.85rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                Settings
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginTop: '0.2rem'
              }}>
                Configure warehouses, storage locations, docks, and racks
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button onClick={fetchData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} disabled={loading}>
                <RefreshCw size={15} className={loading ? "spin" : ""} />
                <span>Refresh</span>
              </button>
              <button onClick={() => { setFormError(''); setIsModalOpen(true); }} className="btn btn-primary">
                <Plus size={16} />
                <span>{activeTab === 'warehouses' ? 'Add Warehouse' : 'Add Location'}</span>
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '1.75rem'
          }}>
            <button
              onClick={() => setActiveTab('warehouses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'warehouses' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'warehouses' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'warehouses' ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <Building2 size={16} />
              <span>Warehouses ({warehouses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'locations' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'locations' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'locations' ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <MapPin size={16} />
              <span>Locations ({locations.length})</span>
            </button>
          </div>

          {activeTab === 'warehouses' ? (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Warehouse Name</th>
                    <th>Code</th>
                    <th>Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No warehouses configured. Click <strong>"Add Warehouse"</strong> to create one.
                      </td>
                    </tr>
                  ) : (
                    warehouses.map(wh => (
                      <tr key={wh.id}>
                        <td style={{ fontWeight: 600 }}>{wh.name}</td>
                        <td><code>{wh.code}</code></td>
                        <td style={{ color: 'var(--text-muted)' }}>{wh.address || '—'}</td>
                        <td>
                          <span className={`badge ${wh.isActive !== false ? 'badge-emerald' : 'badge-neutral'}`}>
                            <CheckCircle2 size={12} /> {wh.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Location Name</th>
                    <th>Warehouse</th>
                    <th>Parent / Path</th>
                    <th>Type</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No storage locations configured. Click <strong>"Add Location"</strong> to create one.
                      </td>
                    </tr>
                  ) : (
                    locations.map(loc => (
                      <tr key={loc.id}>
                        <td style={{ fontWeight: 600 }}>{loc.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{loc.warehouse?.name || 'Main Warehouse'}</td>
                        <td style={{ color: 'var(--text-muted)' }}><code>{loc.parent?.code || loc.parent?.name || `${loc.code}`}</code></td>
                        <td><span className="badge badge-neutral">{loc.type}</span></td>
                        <td style={{ color: 'var(--text-muted)' }}><code>{loc.code}</code></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                {activeTab === 'warehouses' ? 'Add Warehouse' : 'Add Location'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'var(--rose-light)', color: 'var(--rose-main)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            {activeTab === 'warehouses' ? (
              <form onSubmit={handleCreateWarehouse}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>Warehouse Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. South Distribution Hub"
                      value={whName}
                      onChange={(e) => setWhName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>Code / Identifier *</label>
                    <input
                      type="text"
                      placeholder="e.g. WH/South"
                      value={whCode}
                      onChange={(e) => setWhCode(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Sector 7, Logistics Park"
                      value={whAddress}
                      onChange={(e) => setWhAddress(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Warehouse'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateLocation}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>Location Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rack C-04"
                      value={locName}
                      onChange={(e) => setLocName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>Location Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. LOC-004"
                      value={locCode}
                      onChange={(e) => setLocCode(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>Warehouse *</label>
                    <select
                      value={locWarehouseId}
                      onChange={(e) => setLocWarehouseId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>Type *</label>
                    <select
                      value={locType}
                      onChange={(e) => setLocType(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      <option value="WAREHOUSE">WAREHOUSE</option>
                      <option value="RACK">RACK</option>
                      <option value="BIN">BIN</option>
                      <option value="RECEIVING">RECEIVING (Input Dock)</option>
                      <option value="SHIPPING">SHIPPING (Dispatch Bay)</option>
                      <option value="PRODUCTION">PRODUCTION</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Location'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
