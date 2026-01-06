# 🚀 Tekion CRM Frontend - Backend Integration

## 📋 Overview

This React + Vite frontend application is fully integrated with the Spring Boot backend for the Tekion CRM system. It includes:

- **Authentication**: JWT-based login/registration
- **REST API Integration**: All CRUD operations for deals, chats, and users
- **WebSocket Integration**: Real-time chat using STOMP over SockJS
- **Modern UI**: TailwindCSS with Tekion brand colors

---

## 🏗️ Project Structure

```
src/
├── component/
│   ├── TekionCRMLogin.jsx       # Login/Registration (✅ Backend Connected)
│   ├── CustomerChatbot.jsx      # Customer chatbot (✅ Creates deals via API)
│   ├── DealsDashboard.jsx       # View all deals (✅ Fetches from backend)
│   ├── SalesExecutiveChat.jsx   # Real-time chat (✅ WebSocket connected)
│   ├── CRM.jsx                  # Original CRM dashboard (mock data)
│   └── FeedbackForm.jsx         # Feedback form
│
├── services/
│   ├── api.js                   # REST API service layer (axios)
│   └── websocket.js             # WebSocket service (SockJS + STOMP)
│
├── utils/
│   └── auth.js                  # Authentication utilities
│
├── App.jsx                      # Main app with routing
└── main.jsx                     # Entry point
```

---

## 🔌 Backend Connection Details

### Base URLs

```javascript
REST API:    http://localhost:8080/api
WebSocket:   http://localhost:8080/ws
```

### Environment Setup

The backend URLs are hardcoded in the services. To change them:

1. **REST API**: Edit `src/services/api.js` → `API_BASE_URL`
2. **WebSocket**: Edit `src/services/websocket.js` → `WS_BASE_URL`

For production, consider using environment variables:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ installed
- Backend Spring Boot server running on port 8080
- MySQL database configured
- MongoDB configured

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📦 API Service Layer (`src/services/api.js`)

### Authentication APIs

```javascript
import { authAPI } from './services/api';

// Register new user
const user = await authAPI.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  phone: '+1-555-0000',
  address: 'New York, USA'
});

// Login
const { token, ...userData } = await authAPI.login({
  email: 'john@example.com',
  password: 'password123'
});
// Token is automatically stored in localStorage

// Logout
authAPI.logout();

// Get current user
const currentUser = authAPI.getCurrentUser();

// Check if authenticated
const isLoggedIn = authAPI.isAuthenticated();
```

### Deal APIs

```javascript
import { dealAPI } from './services/api';

// Create a deal
const deal = await dealAPI.initiateDeal({
  customerId: 123,
  interestCategory: 'SUV',
  budgetRange: '10-15 lakhs',
  intendedTimeframe: '1-2 months',
  preferredContactMode: 'phone'
});

// Get deal by ID
const deal = await dealAPI.getDeal(dealId);

// Get customer's deals
const deals = await dealAPI.getCustomerDeals(customerId);

// Get sales executive's deals
const deals = await dealAPI.getSalesExecutiveDeals(salesExecutiveId);

// Update deal
const updatedDeal = await dealAPI.updateDeal({
  dealId: 1,
  status: 'CLOSED',
  notes: 'Customer purchased vehicle'
});
```

### Chat APIs

```javascript
import { chatAPI } from './services/api';

// Get all chats for a deal
const chats = await chatAPI.getDealChats(dealId);

// Get sales chat only
const salesChat = await chatAPI.getSalesChat(dealId);

// Send message via REST (alternative to WebSocket)
const message = await chatAPI.sendMessage(chatId, {
  content: 'Hello!',
  senderId: 123
});
```

---

## 🌐 WebSocket Service (`src/services/websocket.js`)

### Connection

```javascript
import websocketService from './services/websocket';

// Connect to WebSocket server
await websocketService.connect(
  () => console.log('Connected!'),
  (error) => console.error('Connection error:', error)
);
```

### Subscribe to Deal Chat

```javascript
// Subscribe to a specific deal's chat
websocketService.subscribeToDeal(dealId, (message) => {
  console.log('New message:', message);
  // message structure:
  // {
  //   dealId, senderId, senderName, senderType, content, timestamp
  // }
});
```

### Send Message

```javascript
// Send a message
websocketService.sendMessage(dealId, {
  senderId: currentUser.id,
  senderName: currentUser.name,
  senderType: 'CUSTOMER', // or 'SALES_EXECUTIVE'
  content: 'Hello!'
});
```

### Unsubscribe

```javascript
// Unsubscribe from deal
websocketService.unsubscribeFromDeal(dealId);

// Disconnect completely
websocketService.disconnect();
```

---

## 🔐 Authentication Flow

### 1. User Registration/Login

[TekionCRMLogin.jsx](src/component/TekionCRMLogin.jsx) handles both:

```javascript
// On form submit:
if (isSignup) {
  await authAPI.register(userData);
  const response = await authAPI.login(credentials);
} else {
  const response = await authAPI.login(credentials);
}
// JWT token is automatically stored
```

### 2. Token Management

JWT tokens are automatically:
- Stored in `localStorage` on login
- Attached to all API requests via axios interceptor
- Cleared on logout or 401 errors

### 3. Protected Routes

All API requests automatically include the JWT token:

```javascript
// Axios interceptor adds token to headers
config.headers.Authorization = `Bearer ${token}`;
```

---

## 💬 Real-time Chat Integration

### Component: [SalesExecutiveChat.jsx](src/component/SalesExecutiveChat.jsx)

This component demonstrates full WebSocket integration:

1. **Connect** on mount
2. **Subscribe** to deal-specific topic
3. **Load** chat history from REST API
4. **Send** messages via WebSocket
5. **Receive** messages in real-time
6. **Unsubscribe** on unmount

### Usage

```jsx
import SalesExecutiveChat from './component/SalesExecutiveChat';

<SalesExecutiveChat 
  dealId={123} 
  onClose={() => setSelectedDeal(null)} 
/>
```

---

## 🎯 Component Integration Status

| Component | Backend Integration | Notes |
|-----------|---------------------|-------|
| TekionCRMLogin | ✅ Complete | Auth API, JWT tokens |
| CustomerChatbot | ✅ Complete | Creates deals via API |
| DealsDashboard | ✅ Complete | Fetches deals from backend |
| SalesExecutiveChat | ✅ Complete | WebSocket + REST |
| CRM | ⚠️ Partial | Uses mock data, needs update |
| FeedbackForm | ⚠️ Partial | No backend endpoint yet |

---

## 🔧 Configuration

### API Endpoints

Edit base URLs in service files:

**REST API** (`src/services/api.js`):
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

**WebSocket** (`src/services/websocket.js`):
```javascript
const WS_BASE_URL = 'http://localhost:8080/ws';
```

### CORS

Backend must allow frontend origin:
```java
@CrossOrigin(origins = "*")  // In Spring Boot controllers
```

---

## 🐛 Troubleshooting

### 1. "Network Error" on API calls

**Problem**: Frontend can't reach backend

**Solution**:
- Ensure backend is running on port 8080
- Check CORS configuration in Spring Boot
- Verify API base URL in `api.js`

### 2. WebSocket connection fails

**Problem**: WebSocket connection refused

**Solution**:
- Ensure backend WebSocket endpoint is configured: `/ws`
- Check Spring Boot WebSocket configuration
- Verify WS URL in `websocket.js`

### 3. "401 Unauthorized" errors

**Problem**: JWT token invalid or expired

**Solution**:
- Re-login to get fresh token
- Check token expiry time (default 24 hours)
- Verify JWT secret matches backend

### 4. Messages not appearing in real-time

**Problem**: WebSocket subscription not working

**Solution**:
- Check browser console for WebSocket errors
- Verify deal ID matches backend
- Ensure correct STOMP topic format: `/topic/chat/{dealId}`

---

## 📝 Testing the Integration

### 1. Test Authentication

```bash
# In browser console:
const { authAPI } = await import('./src/services/api.js');

// Register
await authAPI.register({
  name: 'Test User',
  email: 'test@example.com',
  password: 'test123',
  phone: '+1-555-0000',
  address: 'Test City'
});

// Login
await authAPI.login({
  email: 'test@example.com',
  password: 'test123'
});
```

### 2. Test Deal Creation

```bash
# After login:
const { dealAPI } = await import('./src/services/api.js');

await dealAPI.initiateDeal({
  customerId: 1,
  interestCategory: 'SUV',
  budgetRange: '$30,000-$40,000',
  intendedTimeframe: '1-2 months',
  preferredContactMode: 'email'
});
```

### 3. Test WebSocket Chat

1. Open two browser windows
2. Login as customer in window 1
3. Login as sales executive in window 2
4. Create/open a deal
5. Send messages - they should appear in both windows in real-time

---

## 🚀 Deployment

### Frontend Deployment

```bash
# Build production bundle
npm run build

# Output in dist/ folder
# Deploy to Netlify, Vercel, or any static host
```

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=https://your-backend-api.com/api
VITE_WS_URL=https://your-backend-api.com/ws
```

Update service files to use env vars:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
```

---

## 📚 Additional Resources

- [Axios Documentation](https://axios-http.com/)
- [STOMP Protocol](https://stomp.github.io/)
- [SockJS Client](https://github.com/sockjs/sockjs-client)
- [JWT Introduction](https://jwt.io/introduction)

---

## 🎉 Success Checklist

- [ ] Backend Spring Boot server running on port 8080
- [ ] Frontend dev server running on port 5173 (or configured port)
- [ ] MySQL database configured and accessible
- [ ] MongoDB configured and accessible
- [ ] Can register new user
- [ ] Can login and receive JWT token
- [ ] Can create deal via chatbot
- [ ] Can view deals in dashboard
- [ ] Can open chat and see messages
- [ ] Messages appear in real-time via WebSocket

---

## 💡 Next Steps

1. **Add Error Handling**: Improve error messages and retry logic
2. **Add Loading States**: Better UX during API calls
3. **Implement Pagination**: For deals list when data grows
4. **Add Notifications**: Toast notifications for new messages
5. **Optimize Performance**: Memoization, lazy loading
6. **Add Tests**: Unit tests for API services
7. **Security**: Add input validation, XSS protection

---

**Built with ❤️ using React, Vite, TailwindCSS, and Spring Boot**
