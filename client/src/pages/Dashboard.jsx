import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ReceiptCard from '../components/ReceiptCard';
import DeliveryCard from '../components/DeliveryCard';
import { ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    receipts: { toReceive: 4, late: 1, operations: 6 },
    deliveries: { toDeliver: 4, late: 1, waiting: 2, operations: 6 },
  });

  useEffect(() => {
    let isMounted = true;
    api.getDashboardOverview().then(data => {
      if (isMounted && data) {
        setMetrics({
          receipts: {
            toReceive: data.receipts?.toReceive ?? 4,
            late: data.receipts?.late ?? 1,
            operations: data.receipts?.operations ?? 6,
          },
          deliveries: {
            toDeliver: data.deliveries?.toDeliver ?? 4,
            late: data.deliveries?.late ?? 1,
            waiting: data.deliveries?.waiting ?? 2,
            operations: data.deliveries?.operations ?? 6,
          },
        });
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="page-wrapper">
      {/* Background Geometric Canvas */}
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
          {/* Header Banner */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginBottom: '2.5rem'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid #CBD5E1',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.75rem',
              color: '#475569',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--emerald-main)'
              }} />
              <span style={{ fontWeight: 500 }}>Live Inventory Management Hub</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              width: '100%',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h1 style={{
                  fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  margin: 0
                }}>
                  Dashboard
                </h1>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-muted)',
                  maxWidth: '560px',
                  marginTop: '0.5rem',
                  lineHeight: 1.5
                }}>
                  Live operational queues, pending receipts, and scheduled delivery dispatches.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/operations" className="btn btn-primary">
                  <span>View Operations</span>
                  <ArrowRight size={15} />
                </Link>
                <Link to="/stock" className="btn btn-outline">
                  <span>Check Stock</span>
                </Link>
              </div>
            </div>
          </div>

          {/* TWO MAIN OPERATION CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.75rem'
          }}>
            <ReceiptCard 
              toReceive={metrics.receipts.toReceive} 
              lateCount={metrics.receipts.late} 
              operationsCount={metrics.receipts.operations} 
            />
            <DeliveryCard 
              toDeliver={metrics.deliveries.toDeliver} 
              lateCount={metrics.deliveries.late} 
              waitingCount={metrics.deliveries.waiting} 
              operationsCount={metrics.deliveries.operations} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
