import axios from 'axios';

// Backend base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ==========================
// Authentication APIs
// ==========================

export const authAPI = {
  // Register new user (Customer or Sales Executive)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  }
};

// ==========================
// Deal APIs
// ==========================

export const dealAPI = {
  // Initiate a new deal (called after chatbot completes)
  initiateDeal: async (dealData) => {
    const response = await api.post('/deals/initiate', dealData);
    return response.data;
  },

  // Get deal by ID
  getDeal: async (dealId) => {
    const response = await api.get(`/deals/${dealId}`);
    return response.data;
  },

  // Get all deals for a customer
  getCustomerDeals: async (customerId) => {
    const response = await api.get(`/deals/customer/${customerId}`);
    return response.data;
  },

  // Get all deals for a sales executive
  getSalesExecutiveDeals: async (salesExecutiveId) => {
    const response = await api.get(`/deals/sales-executive/${salesExecutiveId}`);
    return response.data;
  },

  // Update deal status
  updateDeal: async (dealData) => {
    const response = await api.put('/deals/update', dealData);
    return response.data;
  },

  // Customer books an appointment
  bookAppointment: async (dealId, payload) => {
    const response = await api.post(`/deals/${dealId}/appointment`, payload);
    return response.data;
  },

  // Sales executive updates deal stage
  updateDealStage: async (dealId, status) => {
    const response = await api.put(`/deals/${dealId}/stage`, { status });
    return response.data;
  },

  // Deal terminal actions
  completeDeal: async (dealId) => {
    const response = await api.post(`/deals/${dealId}/complete`);
    return response.data;
  },

  failDeal: async (dealId) => {
    const response = await api.post(`/deals/${dealId}/fail`);
    return response.data;
  },

  // Trigger health score recompute
  requestHealthScore: async (dealId) => {
    const response = await api.post(`/deals/${dealId}/request-health-score`);
    return response.data;
  },

  // Feedback
  submitFeedback: async (dealId, payload) => {
    const response = await api.post(`/deals/${dealId}/feedback`, payload);
    return response.data;
  },

  getFeedback: async (dealId) => {
    const response = await api.get(`/deals/${dealId}/feedback`);
    return response.data;
  }
};

// ==========================
// Chat APIs
// ==========================

export const chatAPI = {
  // Get all chats for a deal
  getDealChats: async (dealId) => {
    const response = await api.get(`/chats/deal/${dealId}`);
    return response.data;
  },

  // Get sales chat only for a deal
  getSalesChat: async (dealId) => {
    const response = await api.get(`/chats/deal/${dealId}/sales`);
    return response.data;
  },

  // Add a message to chat (REST endpoint - WebSocket is preferred for real-time)
  addMessage: async (chatId, messageData) => {
    const response = await api.post(`/chats/${chatId}/message`, messageData);
    return response.data;
  }
};

// ==========================
// Sales Executive APIs
// ==========================

export const salesExecutiveAPI = {
  // Get all sales executives
  getAllSalesExecutives: async () => {
    const response = await api.get('/sales-executives');
    return response.data;
  },

  // Get sales executive by ID
  getSalesExecutive: async (id) => {
    const response = await api.get(`/sales-executives/${id}`);
    return response.data;
  }
};

// Export the axios instance for custom requests
export default api;
