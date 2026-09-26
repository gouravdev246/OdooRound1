import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, AlertCircle, Clock, ArrowRight } from 'lucide-react';

export default function ReceiptCard({
  toReceive = 4,
  lateCount = 1,
  operationsCount = 6
}) {
  return (
    <div className="stock-card" style={{
      padding: '1.75rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative'
    }}>
      <div>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--primary-border)'
            }}>
              <ArrowDownLeft size={22} />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.15rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                lineHeight: 1.2
              }}>
                Receipt
              </h3>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-subtle)'
              }}>
                Incoming vendor shipments
              </span>
            </div>
          </div>

          <span className="badge badge-indigo">
            Inbound
          </span>
        </div>

        {/* Primary Metric */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#F8FAFC',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em'
            }}>
              {toReceive}
            </div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-muted)'
            }}>
              to receive
            </div>
          </div>

          <Link
            to="/operations?tab=receipts"
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            Process
          </Link>
        </div>

        {/* Status Indicators */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--rose-light)',
            border: '1px solid var(--rose-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <AlertCircle size={18} color="var(--rose-main)" />
            <div>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--rose-main)',
                lineHeight: 1.2
              }}>
                {lateCount} Late
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#991B1B'
              }}>
                Overdue
              </div>
            </div>
          </div>

          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <Clock size={18} color="var(--text-muted)" />
            <div>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                lineHeight: 1.2
              }}>
                {operationsCount} Operations
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-subtle)'
              }}>
                Total planned
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        paddingTop: '0.85rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link
          to="/operations?tab=receipts"
          style={{
            color: 'var(--primary)',
            fontSize: '0.825rem',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          View all receipt operations <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
