const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `HTTP ${response.status} on ${endpoint}`);
    }

    return data;
  } catch (error) {
    console.warn(`[API] Error on ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // --- Dashboard & Metrics ---
  async getDashboardOverview() {
    try {
      const [receiptsRes, deliveriesRes, stocksRes] = await Promise.allSettled([
        fetchAPI('/receipts'),
        fetchAPI('/deliveries'),
        fetchAPI('/stock'),
      ]);

      const receipts = receiptsRes.status === 'fulfilled' && receiptsRes.value?.data ? receiptsRes.value.data : [];
      const deliveries = deliveriesRes.status === 'fulfilled' && deliveriesRes.value?.data ? deliveriesRes.value.data : [];
      const stocks = stocksRes.status === 'fulfilled' && stocksRes.value?.data ? stocksRes.value.data : [];

      const toReceiveCount = receipts.filter(r => r.status === 'READY' || r.status === 'DRAFT' || r.status === 'WAITING').length;
      const lateReceiptsCount = receipts.filter(r => r.status === 'LATE').length;
      const totalReceiptsOps = receipts.length;

      const toDeliverCount = deliveries.filter(d => d.status === 'READY' || d.status === 'DRAFT').length;
      const lateDeliveriesCount = deliveries.filter(d => d.status === 'LATE').length;
      const waitingDeliveriesCount = deliveries.filter(d => d.status === 'WAITING').length;
      const totalDeliveriesOps = deliveries.length;

      return {
        receipts: {
          toReceive: toReceiveCount,
          late: lateReceiptsCount,
          operations: totalReceiptsOps,
          list: receipts,
        },
        deliveries: {
          toDeliver: toDeliverCount,
          late: lateDeliveriesCount,
          waiting: waitingDeliveriesCount,
          operations: totalDeliveriesOps,
          list: deliveries,
        },
        totalStocks: stocks.length,
      };
    } catch {
      return {
        receipts: { toReceive: 0, late: 0, operations: 0, list: [] },
        deliveries: { toDeliver: 0, late: 0, waiting: 0, operations: 0, list: [] },
        totalStocks: 0,
      };
    }
  },

  // --- Receipts Module ---
  async getReceipts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/receipts?${query}` : '/receipts';
    return fetchAPI(url);
  },

  async createReceipt(data) {
    return fetchAPI('/receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async validateReceipt(id) {
    return fetchAPI(`/receipts/${id}/validate`, {
      method: 'POST',
    });
  },

  // --- Deliveries Module ---
  async getDeliveries(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/deliveries?${query}` : '/deliveries';
    return fetchAPI(url);
  },

  async createDelivery(data) {
    return fetchAPI('/deliveries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- Stocks & Products Module ---
  async getStock(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/stock?${query}` : '/stock';
    return fetchAPI(url);
  },

  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/products?${query}` : '/products';
    return fetchAPI(url);
  },

  async createProduct(data) {
    return fetchAPI('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- Ledger (Move History) Module ---
  async getStockLedger(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/ledger?${query}` : '/ledger';
    return fetchAPI(url);
  },

  // --- Warehouses Module ---
  async getWarehouses() {
    return fetchAPI('/warehouses');
  },

  async createWarehouse(data) {
    return fetchAPI('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateWarehouse(id, data) {
    return fetchAPI(`/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // --- Locations Module ---
  async getLocations(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/locations?${query}` : '/locations';
    return fetchAPI(url);
  },

  async createLocation(data) {
    return fetchAPI('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default api;
