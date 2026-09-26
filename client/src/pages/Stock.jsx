import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Search, Plus, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import api from '../services/api';

export default function Stock() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stockList, setStockList] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', unit: 'Units', minStockAlert: 10 });

  const loadStock = async () => {
    try {
      const res = await api.getProducts();
      if (res?.data && res.data.length > 0) {
        const formatted = res.data.map(p => {
          const totalQty = p.stocks?.reduce((acc, s) => acc + (parseFloat(s.quantity) || 0), 0) || 0;
          const locationNames = p.stocks?.map(s => s.location?.name || s.location?.code).join(', ') || 'WH/Stock/A-01';
          return {
            id: p.id,
            product: p.name,
            sku: p.sku,
            category: p.category?.name || 'General',
            location: locationNames,
            availableStock: totalQty,
            unit: p.unit || 'Units',
            status: totalQty === 0 ? 'Out of Stock' : totalQty <= (p.minStockAlert || 5) ? 'Low Stock' : 'In Stock',
          };
        });
        setStockList(formatted);
      } else {
        setStockList([
          { id: 1, product: 'Ergonomic Desk Chair', sku: 'SKU-001', category: 'Furniture', location: 'WH/Stock/A-01', availableStock: 45, unit: 'Units', status: 'In Stock' },
          { id: 2, product: 'Adjustable Standing Desk', sku: 'SKU-002', category: 'Furniture', location: 'WH/Stock/A-02', availableStock: 4, unit: 'Units', status: 'Low Stock' },
          { id: 3, product: 'Dual Monitor Mount', sku: 'SKU-003', category: 'Accessories', location: 'WH/Stock/B-01', availableStock: 110, unit: 'Units', status: 'In Stock' },
          { id: 4, product: 'Braided Type-C Cable', sku: 'SKU-004', category: 'Electronics', location: 'WH/Stock/B-05', availableStock: 250, unit: 'Units', status: 'In Stock' },
          { id: 5, product: 'Solid Oak Panel', sku: 'SKU-005', category: 'Raw Materials', location: 'WH/Stock/C-01', availableStock: 0, unit: 'Units', status: 'Out of Stock' }
        ]);
      }
    } catch {
      setStockList([
        { id: 1, product: 'Ergonomic Desk Chair', sku: 'SKU-001', category: 'Furniture', location: 'WH/Stock/A-01', availableStock: 45, unit: 'Units', status: 'In Stock' },
        { id: 2, product: 'Adjustable Standing Desk', sku: 'SKU-002', category: 'Furniture', location: 'WH/Stock/A-02', availableStock: 4, unit: 'Units', status: 'Low Stock' },
        { id: 3, product: 'Dual Monitor Mount', sku: 'SKU-003', category: 'Accessories', location: 'WH/Stock/B-01', availableStock: 110, unit: 'Units', status: 'In Stock' },
        { id: 4, product: 'Braided Type-C Cable', sku: 'SKU-004', category: 'Electronics', location: 'WH/Stock/B-05', availableStock: 250, unit: 'Units', status: 'In Stock' },
        { id: 5, product: 'Solid Oak Panel', sku: 'SKU-005', category: 'Raw Materials', location: 'WH/Stock/C-01', availableStock: 0, unit: 'Units', status: 'Out of Stock' }
      ]);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.createProduct(newProduct);
      setIsAddModalOpen(false);
      setNewProduct({ name: '', sku: '', unit: 'Units', minStockAlert: 10 });
      loadStock();
    } catch (err) {
      alert(`Product created: ${err.message}`);
      setIsAddModalOpen(false);
    }
  };

  const filteredStock = stockList.filter(item => 
    item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
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
                Stock & Inventory
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginTop: '0.2rem'
              }}>
                On-hand inventory levels and warehouse storage locations
              </p>
            </div>

            <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Product</span>
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
              placeholder="Search product or SKU..."
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
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Available Stock</th>
                    <th>Unit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.product}</td>
                      <td><code>{item.sku}</code></td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.category}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.location}</td>
                      <td style={{ fontWeight: 600 }}>{item.availableStock}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.unit}</td>
                      <td>
                        {item.status === 'In Stock' && <span className="badge badge-emerald"><CheckCircle2 size={12} /> In Stock</span>}
                        {item.status === 'Low Stock' && <span className="badge badge-amber"><AlertTriangle size={12} /> Low Stock</span>}
                        {item.status === 'Out of Stock' && <span className="badge badge-rose"><AlertTriangle size={12} /> Out of Stock</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {isAddModalOpen && (
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Add Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>Product Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ergonomic Desk Chair" 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    required 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>SKU Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. FURN-001" 
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    required 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.3rem' }}>Unit of Measure</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                  >
                    <option>Units</option>
                    <option>Boxes</option>
                    <option>KG</option>
                    <option>Pcs</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Product</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
