# React Frontend - Backend Integration Guide

## Overview
This guide provides complete instructions for connecting your React application to the Spring Boot CRM backend with real-time WebSocket chat functionality.

---

## 1. Backend Configuration

### Base URLs
```javascript
const API_BASE_URL = 'http://localhost:8080';
const WS_BASE_URL = 'http://localhost:8080/ws';
```

### CORS Status
✅ Backend is already configured to accept requests from any origin (including React dev server on `http://localhost:3000`)

---

## 2. Required Dependencies

Install these packages in your React app:

```bash
npm install axios sockjs-client @stomp/stompjs
```

**Package purposes:**
- `axios` - HTTP requests to REST APIs
- `sockjs-client` - WebSocket connection with fallback
- `@stomp/stompjs` - STOMP protocol for messaging

---

## 3. Sales Executive Assignment Notification

When a customer completes the chatbot, the backend sends the request to an **ML service via Kafka**. The ML service processes it **asynchronously** (2-5 seconds) and assigns a sales executive. The frontend needs to know when this happens.

### Two Approaches:

#### Approach 1: WebSocket Push Notification (Real-time) 🚀 **RECOMMENDED**
- Backend pushes update when SE is assigned
- **Instant notification** (no delay)
- Subscribe to: `/topic/deal/{dealId}/assignment`
- **Best user experience**

```javascript
// Frontend subscribes and waits
websocketService.client.subscribe(`/topic/deal/${dealId}/assignment`, (message) => {
  const assignedDeal = JSON.parse(message.body);
  console.log('Sales Executive assigned:', assignedDeal.salesExecutiveName);
  // Navigate to chat immediately!
});
```

#### Approach 2: Polling (Fallback) ✅
- Frontend repeatedly checks if SE is assigned
- Polls GET `/api/deals/{dealId}` every 2 seconds
- Simple but has 2-5 second delay
- Works everywhere

```javascript
// Keep checking until salesExecutiveId appears
const deal = await dealService.pollForAssignment(dealId);
```

**Implementation:** Use WebSocket as primary method, polling as fallback. See Chatbot component example below.

---

## 4. API Authentication Setup

### 3.1 Create API Service (`src/services/api.js`)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userType');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 4. Authentication APIs

### 4.1 Auth Service (`src/services/authService.js`)

```javascript
import api from './api';

export const authService = {
  // Customer Registration
  registerCustomer: async (userData) => {
    const response = await api.post('/api/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      address: userData.address,
    });
    
    // Store token and user info
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('userId', response.data.id);
    localStorage.setItem('userType', 'customer');
    
    return response.data;
  },

  // Sales Executive Registration
  registerSalesExecutive: async (userData) => {
    const response = await api.post('/api/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      address: userData.address,
    });
    
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('userId', response.data.id);
    localStorage.setItem('userType', 'sales_executive');
    
    return response.data;
  },

  // Login
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('userId', response.data.id);
    localStorage.setItem('userType', response.data.userType);
    
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
  },

  // Get current user
  getCurrentUser: () => {
    return {
      token: localStorage.getItem('authToken'),
      userId: localStorage.getItem('userId'),
      userType: localStorage.getItem('userType'),
    };
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};
```

---

## 6. Deal/Chatbot APIs

### 11.1 Deal Service (`src/services/dealService.js`)

```javascript
import api from './api';

export const dealService = {
  // Create deal (after chatbot completes)
  createDeal: async (dealData) => {
    const response = await api.post('/api/deals/initiate', {
      customerId: dealData.customerId,
      interestCategory: dealData.interestCategory,      // "SUV", "Sedan", etc.
      budgetRange: dealData.budgetRange,                // "5-10 lakhs"
      intendedTimeframe: dealData.intendedTimeframe,    // "1-2 months"
      preferredContactMode: dealData.preferredContactMode || 'phone',
    });
    return response.data;
  },

  // Get deal by ID (to check if SE assigned)
  getDealById: async (dealId) => {
    const response = await api.get(`/api/deals/${dealId}`);
    return response.data;
  },

  // Poll for sales executive assignment
  pollForAssignment: async (dealId, maxAttempts = 15, intervalMs = 2000) => {
    for (let i = 0; i < maxAttempts; i++) {
      const deal = await dealService.getDealById(dealId);
      
      if (deal.salesExecutiveId) {
        return deal; // SE assigned!
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Sales executive assignment timeout');
  },

  // Get deals for sales executive (for dashboard)
  getDealsBySalesExecutive: async (salesExecutiveId) => {
    const response = await api.get(`/api/deals/sales-executive/${salesExecutiveId}`);
    return response.data;
  },

  // Get deals by customer
  getDealsByCustomer: async (customerId) => {
    const response = await api.get(`/api/deals/customer/${customerId}`);
    return response.data;
  },

  // Update deal status
  updateDealStatus: async (dealId, status) => {
    const response = await api.put(`/api/deals/${dealId}/status`, { status });
    return response.data;
  },
};
```

---

## 7. Chat APIs

### 11.1 Chat Service (`src/services/chatService.js`)

```javascript
import api from './api';

export const chatService = {
  // Get chat for a deal
  getChatByDeal: async (dealId) => {
    const response = await api.get(`/api/chats/deal/${dealId}/sales`);
    return response.data;
  },

  // Get chat history
  getChatHistory: async (chatId) => {
    const response = await api.get(`/api/chats/${chatId}`);
    return response.data;
  },

  // Note: Use WebSocket for sending messages, not REST API
};
```

---

## 8. WebSocket Integration (Real-time Chat)

### 11.1 WebSocket Service (`src/services/websocketService.js`)

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  // Connect to WebSocket
  connect(onConnectCallback) {
    return new Promise((resolve, reject) => {
      // Create SockJS connection
      const socket = new SockJS('http://localhost:8080/ws');

      // Create STOMP client
      this.client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
      });

      // On successful connection
      this.client.onConnect = (frame) => {
        console.log('WebSocket Connected:', frame);
        this.connected = true;
        
        if (onConnectCallback) {
          onConnectCallback();
        }
        
        resolve(this.client);
      };

      // On error
      this.client.onStompError = (frame) => {
        console.error('STOMP Error:', frame);
        this.connected = false;
        reject(new Error(frame.headers.message));
      };

      // On disconnect
      this.client.onDisconnect = () => {
        console.log('WebSocket Disconnected');
        this.connected = false;
      };

      // Activate connection
      this.client.activate();
    });
  }

  // Subscribe to chat messages for a deal
  subscribeToChat(dealId, onMessageCallback) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const destination = `/topic/chat/${dealId}`;
    
    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const chatMessage = JSON.parse(message.body);
        console.log('Received message:', chatMessage);
        onMessageCallback(chatMessage);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Store subscription
    this.subscriptions.set(dealId, subscription);
    
    return subscription;
  }

  // Send chat message
  sendMessage(dealId, messageData) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return false;
    }

    const destination = `/app/chat/${dealId}`;
    
    this.client.publish({
      destination: destination,
      body: JSON.stringify({
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        message: messageData.message,
        senderType: messageData.senderType, // 'customer' or 'sales_executive'
      }),
    });

    return true;
  }

  // Unsubscribe from a chat
  unsubscribeFromChat(dealId) {
    const subscription = this.subscriptions.get(dealId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(dealId);
    }
  }

  // Disconnect
  disconnect() {
    if (this.client) {
      // Unsubscribe from all
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();

      // Deactivate client
      this.client.deactivate();
      this.connected = false;
    }
  }

  // Check connection status
  isConnected() {
    return this.connected;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
```

---

## 9. React Component Examples

### 11.1 Customer Registration Component

```javascript
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const CustomerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.registerCustomer(formData);
      console.log('Registration successful:', response);
      
      // Navigate to chatbot
      navigate('/chatbot');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Customer Registration</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone (+91-XXXXXXXXXX)"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <textarea
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
        />
        
        {error && <div className="error">{error}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default CustomerRegister;
```

### 9.2 Chatbot Component (with WebSocket notification)

```javascript
import React, { useState, useEffect } from 'react';
import { dealService } from '../services/dealService';
import { authService } from '../services/authService';
import { websocketService } from '../services/websocketService';
import { useNavigate } from 'react-router-dom';

const Chatbot = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    interestCategory: '',
    budgetRange: '',
    intendedTimeframe: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Finding the perfect sales executive for you...');

  const questions = {
    1: {
      question: 'What type of car are you interested in?',
      options: ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Electric'],
      key: 'interestCategory',
    },
    2: {
      question: 'What is your budget range?',
      options: ['Below 5 lakhs', '5-10 lakhs', '10-20 lakhs', '20-50 lakhs', 'Above 50 lakhs'],
      key: 'budgetRange',
    },
    3: {
      question: 'When are you planning to buy?',
      options: ['Within 1 month', '1-2 months', '2-3 months', '3-6 months', 'Just exploring'],
      key: 'intendedTimeframe',
    },
  };

  const handleAnswer = (answer) => {
    const currentQuestion = questions[step];
    
    setAnswers({
      ...answers,
      [currentQuestion.key]: answer,
    });

    if (step < 3) {
      setStep(step + 1);
    } else {
      // All questions answered, create deal
      submitDeal(answer);
    }
  };

  const submitDeal = async (lastAnswer) => {
    setLoading(true);
    
    const finalAnswers = {
      ...answers,
      intendedTimeframe: lastAnswer,
    };

    try {
      const userId = authService.getCurrentUser().userId;
      
      // Create deal
      const deal = await dealService.createDeal({
        customerId: parseInt(userId),
        ...finalAnswers,
        preferredContactMode: 'phone',
      });

      console.log('Deal created:', deal);
      setLoadingMessage('Analyzing your requirements...');

      // OPTION 1: WebSocket notification (Real-time) 🚀
      await waitForAssignmentViaWebSocket(deal.id);

      // OPTION 2: Polling (Fallback if WebSocket fails)
      // const updatedDeal = await dealService.pollForAssignment(deal.id);
      
    } catch (error) {
      console.error('Error creating deal:', error);
      alert('Failed to create deal. Please try again.');
      setLoading(false);
    }
  };

  const waitForAssignmentViaWebSocket = async (dealId) => {
    return new Promise((resolve, reject) => {
      // Connect to WebSocket
      websocketService.connect(() => {
        console.log('WebSocket connected, subscribing to assignment notifications...');
        
        // Subscribe to sales executive assignment notifications
        const subscription = websocketService.client.subscribe(
          `/topic/deal/${dealId}/assignment`,
          (message) => {
            try {
              const assignedDeal = JSON.parse(message.body);
              console.log('Sales Executive assigned via WebSocket:', assignedDeal);
              
              setLoadingMessage(`Matched with ${assignedDeal.salesExecutiveName}!`);
              
              // Unsubscribe and navigate to chat
              subscription.unsubscribe();
              
              setTimeout(() => {
                navigate(`/chat/${dealId}`, {
                  state: {
                    dealId: dealId,
                    salesExecutive: {
                      id: assignedDeal.salesExecutiveId,
                      name: assignedDeal.salesExecutiveName,
                      dealer: assignedDeal.dealerName,
                    },
                  },
                });
                resolve();
              }, 1000);
            } catch (error) {
              console.error('Error parsing assignment message:', error);
              reject(error);
            }
          }
        );
        
        // Fallback timeout (30 seconds)
        setTimeout(() => {
          console.log('WebSocket assignment timeout, falling back to polling...');
          subscription.unsubscribe();
          fallbackToPolling(dealId).then(resolve).catch(reject);
        }, 30000);
      });
    });
  };

  const fallbackToPolling = async (dealId) => {
    console.log('Using polling fallback...');
    setLoadingMessage('Still searching for the best match...');
    
    const updatedDeal = await dealService.pollForAssignment(dealId);
    
    navigate(`/chat/${dealId}`, {
      state: {
        dealId: dealId,
        salesExecutive: {
          id: updatedDeal.salesExecutiveId,
          name: updatedDeal.salesExecutiveName,
          dealer: updatedDeal.dealerName,
        },
      },
    });
  };

  const currentQuestion = questions[step];

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>Car Buying Assistant</h2>
        <p>Step {step} of 3</p>
      </div>

      {loading ? (
        <div className="loading">
          <p>{loadingMessage}</p>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="chatbot-content">
          <div className="question">
            <p>{currentQuestion.question}</p>
          </div>
          
          <div className="options">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className="option-button"
                onClick={() => handleAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Show previous answers */}
          <div className="previous-answers">
            {Object.entries(answers).map(([key, value]) => 
              value && (
                <div key={key} className="answer-chip">
                  {value}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
```

### 9.3 Customer Chat Component

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { websocketService } from '../services/websocketService';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';

const CustomerChat = () => {
  const { dealId } = useParams();
  const location = useLocation();
  const { salesExecutive } = location.state || {};
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    initializeChat();

    return () => {
      // Cleanup on unmount
      websocketService.unsubscribeFromChat(dealId);
      websocketService.disconnect();
    };
  }, [dealId]);

  const initializeChat = async () => {
    try {
      // Load chat history
      const chat = await chatService.getChatByDeal(dealId);
      setMessages(chat.messages || []);

      // Connect to WebSocket
      await websocketService.connect(() => {
        console.log('WebSocket connected');
        setConnected(true);

        // Subscribe to this deal's chat
        websocketService.subscribeToChat(dealId, (message) => {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
        });
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !connected) return;

    const messageData = {
      senderId: parseInt(currentUser.userId),
      senderName: 'You', // Get from user profile if available
      message: inputMessage,
      senderType: 'customer',
    };

    websocketService.sendMessage(dealId, messageData);
    setInputMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat with {salesExecutive?.name || 'Sales Executive'}</h3>
        {salesExecutive?.dealer && <p>{salesExecutive.dealer}</p>}
        <div className={`status ${connected ? 'online' : 'offline'}`}>
          {connected ? '● Connected' : '○ Connecting...'}
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.senderType === 'customer' ? 'sent' : 'received'}`}
          >
            <div className="message-sender">
              {msg.senderName || msg.senderType}
            </div>
            <div className="message-content">{msg.message}</div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={!connected}
        />
        <button onClick={sendMessage} disabled={!connected}>
          Send
        </button>
      </div>
    </div>
  );
};

export default CustomerChat;
```

### 9.4 Sales Executive Dashboard Component (with Real-time Notifications)

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { dealService } from '../services/dealService';
import { authService } from '../services/authService';
import { websocketService } from '../services/websocketService';
import { useNavigate } from 'react-router-dom';

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeDeals: 0,
    dealsToday: 0,
  });
  const [notification, setNotification] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const currentUser = authService.getCurrentUser();
  const salesExecutiveId = 1; // Use this ID for demo (matches ML service assignment)

  // Load deals function
  const loadDeals = useCallback(async () => {
    try {
      const dealsData = await dealService.getDealsBySalesExecutive(salesExecutiveId);
      
      setDeals(dealsData);
      
      // Calculate stats
      const today = new Date().toDateString();
      const dealsToday = dealsData.filter(
        (deal) => new Date(deal.createdAt).toDateString() === today
      ).length;

      setStats({
        activeDeals: dealsData.length,
        dealsToday: dealsToday,
      });
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  }, [salesExecutiveId]);

  // Initialize WebSocket and subscribe to new customer notifications
  useEffect(() => {
    loadDeals();

    // Connect to WebSocket for real-time notifications
    websocketService.connect(() => {
      console.log('Sales Dashboard: WebSocket connected');
      setWsConnected(true);

      // Subscribe to new customer notifications for this sales executive
      websocketService.client.subscribe(
        `/topic/sales-executive/${salesExecutiveId}/new-customer`,
        (message) => {
          try {
            const newDeal = JSON.parse(message.body);
            console.log('🔔 New customer assigned:', newDeal);

            // Show notification
            setNotification({
              type: 'new-customer',
              message: `New customer: ${newDeal.customerName}`,
              deal: newDeal,
            });

            // Play notification sound (optional)
            playNotificationSound();

            // Auto-hide notification after 10 seconds
            setTimeout(() => setNotification(null), 10000);

            // Add new deal to the list
            setDeals((prevDeals) => [newDeal, ...prevDeals]);

            // Update stats
            setStats((prev) => ({
              ...prev,
              activeDeals: prev.activeDeals + 1,
              dealsToday: prev.dealsToday + 1,
            }));
          } catch (error) {
            console.error('Error parsing new customer notification:', error);
          }
        }
      );
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, [loadDeals, salesExecutiveId]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3'); // Add this file to public folder
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Ignore if autoplay blocked
    } catch (e) {
      console.log('Could not play notification sound');
    }
  };

  // Open chat with customer
  const openChat = (deal) => {
    // Clear notification if it's for this deal
    if (notification?.deal?.id === deal.id) {
      setNotification(null);
    }

    navigate(`/sales/chat/${deal.id}`, {
      state: {
        dealId: deal.id,
        customer: {
          name: deal.customerName,
          email: deal.customerEmail,
        },
        dealDetails: {
          interest: deal.interestCategory,
          budget: deal.budgetRange,
          timeframe: deal.intendedTimeframe,
        },
      },
    });
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Real-time Notification Banner */}
      {notification && (
        <div className="notification-banner new-customer">
          <div className="notification-content">
            <span className="notification-icon">🔔</span>
            <span className="notification-message">{notification.message}</span>
            <button
              className="notification-action"
              onClick={() => openChat(notification.deal)}
            >
              Open Chat Now
            </button>
            <button
              className="notification-close"
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <h1>Sales Dashboard</h1>
        <div className="header-actions">
          <span className={`ws-status ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? '● Live' : '○ Connecting...'}
          </span>
          <button onClick={loadDeals}>Refresh</button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Deals</h3>
          <p className="stat-value">{stats.activeDeals}</p>
        </div>
        <div className="stat-card">
          <h3>Deals Today</h3>
          <p className="stat-value">{stats.dealsToday}</p>
        </div>
      </div>

      {/* Deals List */}
      <div className="deals-section">
        <h2>Your Assigned Deals</h2>
        
        {deals.length === 0 ? (
          <p>No deals assigned yet. Waiting for customers...</p>
        ) : (
          <div className="deals-grid">
            {deals.map((deal) => (
              <div 
                key={deal.id} 
                className={`deal-card ${notification?.deal?.id === deal.id ? 'new-highlight' : ''}`}
              >
                <div className="deal-header">
                  <h3>{deal.customerName}</h3>
                  <span className={`status-badge ${deal.status.toLowerCase()}`}>
                    {deal.status}
                  </span>
                </div>
                
                <div className="deal-details">
                  <p><strong>Interest:</strong> {deal.interestCategory}</p>
                  <p><strong>Budget:</strong> {deal.budgetRange}</p>
                  <p><strong>Timeframe:</strong> {deal.intendedTimeframe}</p>
                  <p><strong>Created:</strong> {new Date(deal.createdAt).toLocaleString()}</p>
                </div>

                <button
                  className="chat-button"
                  onClick={() => openChat(deal)}
                >
                  Open Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesDashboard;
```

### 9.4.1 Dashboard CSS Styles

```css
/* Add to your CSS file */

.notification-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 15px 20px;
  animation: slideDown 0.3s ease-out;
}

.notification-banner.new-customer {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 15px;
  max-width: 1200px;
  margin: 0 auto;
}

.notification-icon {
  font-size: 24px;
  animation: shake 0.5s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.notification-message {
  flex: 1;
  font-weight: 600;
  font-size: 16px;
}

.notification-action {
  background: white;
  color: #4CAF50;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.notification-action:hover {
  transform: scale(1.05);
}

.notification-close {
  background: transparent;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0 10px;
}

.ws-status {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 15px;
}

.ws-status.connected {
  background: #e8f5e9;
  color: #4CAF50;
}

.ws-status.disconnected {
  background: #fff3e0;
  color: #ff9800;
}

.deal-card.new-highlight {
  animation: pulse 2s ease-in-out infinite;
  border: 2px solid #4CAF50;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
}
```

### 9.5 Sales Executive Chat Component

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { websocketService } from '../services/websocketService';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';

const SalesChat = () => {
  const { dealId } = useParams();
  const location = useLocation();
  const { customer, dealDetails } = location.state || {};
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    initializeChat();

    return () => {
      websocketService.unsubscribeFromChat(dealId);
      websocketService.disconnect();
    };
  }, [dealId]);

  const initializeChat = async () => {
    try {
      const chat = await chatService.getChatByDeal(dealId);
      setMessages(chat.messages || []);

      await websocketService.connect(() => {
        setConnected(true);
        websocketService.subscribeToChat(dealId, (message) => {
          setMessages((prev) => [...prev, message]);
        });
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !connected) return;

    const messageData = {
      senderId: parseInt(currentUser.userId),
      senderName: 'Rajesh Kumar', // Get from user profile
      message: inputMessage,
      senderType: 'sales_executive',
    };

    websocketService.sendMessage(dealId, messageData);
    setInputMessage('');
  };

  return (
    <div className="sales-chat-container">
      {/* Customer Info Sidebar */}
      <div className="customer-info-sidebar">
        <h3>Customer Details</h3>
        {customer && (
          <>
            <p><strong>Name:</strong> {customer.name}</p>
            <p><strong>Email:</strong> {customer.email}</p>
          </>
        )}
        
        {dealDetails && (
          <>
            <h4>Requirements</h4>
            <p><strong>Interest:</strong> {dealDetails.interest}</p>
            <p><strong>Budget:</strong> {dealDetails.budget}</p>
            <p><strong>Timeframe:</strong> {dealDetails.timeframe}</p>
          </>
        )}
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        <div className="chat-header">
          <h3>Chat with {customer?.name || 'Customer'}</h3>
          <div className={`status ${connected ? 'online' : 'offline'}`}>
            {connected ? '● Connected' : '○ Connecting...'}
          </div>
        </div>

        <div className="messages-container">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.senderType === 'sales_executive' ? 'sent' : 'received'}`}
            >
              <div className="message-sender">{msg.senderName}</div>
              <div className="message-content">{msg.message}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="message-input">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            disabled={!connected}
          />
          <button onClick={sendMessage} disabled={!connected}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesChat;
```

---

## 10. React Router Setup

### 11.1 App Routes (`src/App.js`)

```javascript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';

// Import components
import CustomerRegister from './components/CustomerRegister';
import SalesRegister from './components/SalesRegister';
import Login from './components/Login';
import Chatbot from './components/Chatbot';
import CustomerChat from './components/CustomerChat';
import SalesDashboard from './components/SalesDashboard';
import SalesChat from './components/SalesChat';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedUserTypes }) => {
  const user = authService.getCurrentUser();
  
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  if (allowedUserTypes && !allowedUserTypes.includes(user.userType)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register/customer" element={<CustomerRegister />} />
        <Route path="/register/sales" element={<SalesRegister />} />

        {/* Customer routes */}
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute allowedUserTypes={['customer']}>
              <Chatbot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:dealId"
          element={
            <ProtectedRoute allowedUserTypes={['customer']}>
              <CustomerChat />
            </ProtectedRoute>
          }
        />

        {/* Sales Executive routes */}
        <Route
          path="/sales/dashboard"
          element={
            <ProtectedRoute allowedUserTypes={['sales_executive']}>
              <SalesDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/chat/:dealId"
          element={
            <ProtectedRoute allowedUserTypes={['sales_executive']}>
              <SalesChat />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 11. Environment Configuration

### 11.1 Create `.env` file

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=http://localhost:8080/ws
```

### 11.2 Use in code

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';
```

---

## 12. Complete API Reference

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register user (customer or SE) | No |
| POST | `/api/auth/login` | Login | No |

**Register/Login Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+91-9999999999",
  "address": "Mumbai, India"
}
```

**Response:**
```json
{
  "id": 9,
  "name": "John Doe",
  "email": "john@example.com",
  "userType": "customer",
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Deal Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/deals/initiate` | Create deal (chatbot complete) | Yes |
| GET | `/api/deals/{dealId}` | Get deal by ID | Yes |
| GET | `/api/deals/customer/{customerId}` | Get customer's deals | Yes |
| GET | `/api/deals/sales-executive/{seId}` | Get SE's assigned deals | Yes |
| PUT | `/api/deals/{dealId}/status` | Update deal status | Yes |

**Create Deal Request:**
```json
{
  "customerId": 9,
  "interestCategory": "SUV",
  "budgetRange": "5-10 lakhs",
  "intendedTimeframe": "1-2 months",
  "preferredContactMode": "phone"
}
```

**Deal Response:**
```json
{
  "id": "695d70a5215e09490082f427",
  "customerId": 9,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "salesExecutiveId": 1,
  "salesExecutiveName": "Rajesh Kumar",
  "dealerId": 1,
  "dealerName": "Premium Auto Hub",
  "interestCategory": "SUV",
  "budgetRange": "5-10 lakhs",
  "intendedTimeframe": "1-2 months",
  "status": "IN_PROGRESS",
  "createdAt": "2026-01-07T20:29:25.576Z"
}
```

### Chat Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/chats/deal/{dealId}/sales` | Get chat for deal | Yes |
| GET | `/api/chats/{chatId}` | Get chat history | Yes |

**Chat Response:**
```json
{
  "id": "695d70a6215e09490082f429",
  "dealId": "695d70a5215e09490082f427",
  "messages": [
    {
      "senderId": 9,
      "senderName": "John Doe",
      "message": "Hello, I'm interested in an SUV",
      "senderType": "customer",
      "timestamp": "2026-01-07T20:30:15.123Z"
    }
  ]
}
```

### WebSocket Endpoints
| Type | Destination | Description |
|------|-------------|-------------|
| Connect | `/ws` | Initial connection (SockJS) |
| Subscribe | `/topic/chat/{dealId}` | Listen for messages |
| Send | `/app/chat/{dealId}` | Send message |

**WebSocket Message Format:**
```json
{
  "senderId": 9,
  "senderName": "John Doe",
  "message": "Hello!",
  "senderType": "customer",
  "timestamp": "2026-01-07T20:30:15.123Z"
}
```

---

## 13. Testing Your Integration

### 13.1 Start Backend
```bash
cd C:\Users\Pallav\OneDrive\Desktop\t
docker-compose up -d
```

### 13.2 Start React App
```bash
cd your-react-app
npm install
npm start
```

### 13.3 Test Flow

1. **Customer Flow:**
   - Navigate to `/register/customer`
   - Register new customer
   - Complete chatbot (3 questions)
   - Wait for SE assignment
   - Start chatting

2. **Sales Executive Flow:**
   - Navigate to `/register/sales` (use email: `rajesh.kumar@premiumautohub.com`)
   - Login to dashboard
   - See assigned deal
   - Click "Open Chat"
   - Chat with customer in real-time

---

## 14. Common Issues & Solutions

### Issue: CORS errors
**Solution:** Backend already configured. Ensure React dev server runs on `http://localhost:3000`

### Issue: WebSocket connection fails
**Solution:** 
- Check backend is running: `docker ps`
- Verify SockJS URL: `http://localhost:8080/ws`
- Check browser console for errors

### Issue: 401 Unauthorized
**Solution:** 
- Token expired (24hr validity) - re-login
- Token not in request - check axios interceptor
- Clear localStorage and login again

### Issue: Messages not appearing
**Solution:**
- Check WebSocket connected: `websocketService.isConnected()`
- Verify subscribed to correct topic: `/topic/chat/{dealId}`
- Check backend logs: `docker logs t-crm-1`

### Issue: SE not assigned
**Solution:**
- ML service takes 2-5 seconds
- Check Kafka running: `docker ps | grep kafka`
- Always assigns to Rajesh Kumar (ID: 1)

---

## 15. Production Deployment Notes

### Update Environment Variables
```env
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_WS_URL=https://your-backend-domain.com/ws
```

### Update Backend CORS
In `SecurityConfig.java`, change:
```java
configuration.setAllowedOriginPatterns("*");
```
To:
```java
configuration.setAllowedOrigins("https://your-frontend-domain.com");
```

### WebSocket Over HTTPS
Ensure backend uses WSS protocol for secure WebSocket connections.

---

## 16. Quick Reference

### Test Credentials
```
Customer:
- Email: customer@test.com
- Password: password123

Sales Executive:
- Email: rajesh.kumar@premiumautohub.com
- Password: password123
```

### Key Variables to Store
```javascript
localStorage.setItem('authToken', token);
localStorage.setItem('userId', id);
localStorage.setItem('userType', 'customer' | 'sales_executive');
```

### WebSocket Connection Check
```javascript
if (websocketService.isConnected()) {
  // Ready to send messages
}
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs: `docker logs t-crm-1`
3. Verify all services running: `docker ps`
4. Review FRONTEND_BACKEND_CONNECTION.md for detailed flow

---

**Backend Status:** ✅ Running and tested  
**CORS:** ✅ Configured for all origins  
**WebSocket:** ✅ SockJS + STOMP ready  
**Database:** ✅ MySQL + MongoDB operational  
**ML Service:** ✅ Auto-assigns Rajesh Kumar
