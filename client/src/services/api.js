const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchAPI(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

// Helper for persistent prototype user storage
const USERS_STORAGE_KEY = 'stocksense_registered_users';

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading stored users:', e);
  }
  // Default seeded account
  const defaultUsers = [
    {
      id: 'usr_admin',
      name: 'StockSense Admin',
      email: 'admin@stocksense.io',
      password: 'password123',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

function saveStoredUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export const api = {
  // --- Auth Module ---
  async signup(data) {
    const { name, email, password, role } = data;
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      throw new Error('All required fields must be filled.');
    }

    try {
      // Primary: Save directly to PostgreSQL via backend API
      const res = await fetchAPI('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role: role || 'WAREHOUSE_STAFF',
        }),
      });

      // Update local storage backup
      const users = getStoredUsers();
      const cleanEmail = email.trim().toLowerCase();
      const existingIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      const newUser = {
        id: res?.data?.user?.id || `usr_${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        password: password,
        role: role || 'WAREHOUSE_STAFF',
        createdAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        users[existingIdx] = newUser;
      } else {
        users.push(newUser);
      }
      saveStoredUsers(users);

      return res;
    } catch (err) {
      // If error from backend (e.g. email exists), throw it
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }

      // Offline fallback
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const users = getStoredUsers();

      const existing = users.find(
        (u) => u.email.toLowerCase() === cleanEmail || u.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (existing) {
        if (existing.email.toLowerCase() === cleanEmail) {
          throw new Error('An account with this email address already exists.');
        }
        throw new Error('An account with this login ID / username already exists.');
      }

      const newUser = {
        id: `usr_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        password: password,
        role: role || 'WAREHOUSE_STAFF',
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      saveStoredUsers(users);

      return {
        success: true,
        message: 'Account created successfully! Please sign in.',
        user: newUser,
      };
    }
  },

  async login(data) {
    const { email, password } = data;
    if (!email?.trim() || !password?.trim()) {
      throw new Error('Please provide both email/login ID and password.');
    }

    try {
      // Primary: Authenticate directly against PostgreSQL database
      const res = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (res?.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('isAuthenticated', 'true');
      }

      return res;
    } catch (err) {
      // Throw exact errors returned from backend (e.g., "Account not found. Please sign up first." or "Incorrect password.")
      if (err.message && !err.message.includes('Failed to fetch')) {
        throw err;
      }

      // Offline fallback
      const identifier = email.trim().toLowerCase();
      const users = getStoredUsers();

      const user = users.find(
        (u) => u.email.toLowerCase() === identifier || u.name.toLowerCase() === identifier
      );

      if (!user) {
        throw new Error('Account not found. Please sign up first.');
      }

      if (user.password !== password) {
        throw new Error('Incorrect password.');
      }

      const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(sessionUser));
      localStorage.setItem('isAuthenticated', 'true');

      return {
        success: true,
        token,
        user: sessionUser,
      };
    }
  },

  async getMe() {
    const user = this.getCurrentUser();
    if (user) return { success: true, data: user };
    return fetchAPI('/auth/me');
  },

  async forgotPassword(email) {
    return fetchAPI('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }).catch(() => ({
      success: true,
      message: 'If an account exists, a reset code was generated.',
      devOtp: '123456',
    }));
  },

  async resetPassword(data) {
    const users = getStoredUsers();
    const user = users.find((u) => u.email.toLowerCase() === (data.email || '').toLowerCase().trim());
    if (user && data.newPassword) {
      user.password = data.newPassword;
      saveStoredUsers(users);
    }
    return fetchAPI('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(() => ({
      success: true,
      message: 'Password reset successfully.',
    }));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('isAuthenticated');
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true' && Boolean(localStorage.getItem('user'));
  },
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
