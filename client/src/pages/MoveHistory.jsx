import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Search, ArrowDownLeft, ArrowUpRight, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../services/api';

const DEFAULT_MOVES = [
  { id: 'M-001', date: '2026-09-26 10:00', product: 'Ergonomic Desk Chair', operation: 'Receipt', quantity: '+10', from: 'Vendor A', to: 'WH/Stock/A-01', status: 'Done' },
  { id: 'M-002', date: '2026-09-26 09:30', product: 'Dual Monitor Mount', operation: 'Delivery', quantity: '-5', from: 'WH/Stock/B-01', to: 'Customer X', status: 'Done' },
  { id: 'M-003', date: '2026-09-25 15:00', product: 'Braided Type-C Cable', operation: 'Internal', quantity: '20', from: 'WH/Input', to: 'WH/Stock/B-05', status: 'Done' }
];

export default function MoveHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [moves, setMoves] = useState(DEFAULT_MOVES);
  const [loading, setLoading] = useState(false);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await api.getStockLedger();
      if (res?.data && res.data.length > 0) {
        const formatted = res.data.map(item => {
          const isPositive = (item.quantityChange || 0) > 0;
          return {
            id: item.id || `M-${Math.random().toString(36).substr(2, 4)}`,
            date: item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now',
            product: item.product?.name || item.reference || 'General Item',
            operation: item.movementType ? (item.movementType.charAt(0).toUpperCase() + item.movementType.slice(1).toLowerCase()) : 'Internal',
            quantity: `${isPositive ? '+' : ''}${item.quantityChange ?? item.quantity ?? 1}`,
            from: item.fromLocation || item.location?.warehouse?.name || 'Input Dock',
            to: item.location?.name || item.location?.code || 'Main Storage',
            status: 'Done'
          };
        });
        setMoves(formatted);
      }
    } catch {
      // Fallback kept in state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filteredMoves = moves.filter(m => 
    m.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.operation.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <h1 style={{
                fontSize: '1.85rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                Move History
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginTop: '0.2rem'
              }}>
                Audit log of stock movements, receipts, deliveries, and adjustments
              </p>
            </div>

            <button onClick={fetchLedger} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} disabled={loading}>
              <RefreshCw size={15} className={loading ? "spin" : ""} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          <div style={{
            marginBottom: '1.25rem',
            position: 'relative',
            maxWidth: '320px'
          }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-subtle)'
              }}
            />
            <input
              type="text"
              placeholder="Search move history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                backgroundColor: '#FFFFFF',
                outline: 'none'
              }}
            />
          </div>

          <div className="data-table-container">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Operation</th>
                    <th>Quantity</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMoves.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No movement history found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredMoves.map(m => (
                      <tr key={m.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{m.date}</td>
                        <td style={{ fontWeight: 600 }}>{m.product}</td>
                        <td>
                          {m.operation?.toLowerCase().includes('receipt') && <span className="badge badge-emerald"><ArrowDownLeft size={12} /> Receipt</span>}
                          {m.operation?.toLowerCase().includes('delivery') && <span className="badge badge-indigo"><ArrowUpRight size={12} /> Delivery</span>}
                          {m.operation?.toLowerCase().includes('internal') && <span className="badge badge-neutral"><ArrowRight size={12} /> Internal</span>}
                          {!['receipt', 'delivery', 'internal'].some(op => m.operation?.toLowerCase().includes(op)) && (
                            <span className="badge badge-neutral">{m.operation}</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: String(m.quantity).startsWith('+') ? 'var(--emerald-main)' : String(m.quantity).startsWith('-') ? 'var(--rose-main)' : 'inherit' }}>
                          {m.quantity}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{m.from}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{m.to}</td>
                        <td>
                          <span className="badge badge-neutral">
                            <CheckCircle2 size={12} color="var(--emerald-main)" /> {m.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
