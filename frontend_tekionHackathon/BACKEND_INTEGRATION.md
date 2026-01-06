# Backend Integration Guide

## Overview

This frontend is now fully integrated with the Spring Boot backend at `http://localhost:8080`. The integration includes:

- ✅ Authentication (Login/Register)
- ✅ Deal creation from chatbot
- ✅ Real-time chat via WebSocket
- ✅ Sales dashboard with active opportunities
- ✅ Automatic deal assignment to sales executives

---

## Complete User Flow

### 1. Customer Flow

```
Customer Login/Signup
    ↓
Customer Dashboard (Landing Page)
    ↓
Opens Chatbot
    ↓
Chatbot asks questions:
  - Vehicle type (Sedan, SUV, Sports, EV, Used)
  - Budget
  - Timeframe
  - Preferred contact method
    ↓
Backend creates Deal & matches Sales Executive
    ↓
Real-time chat enabled
    ↓
Sales Executive joins chat
    ↓
Customer & Sales Executive chat in real-time
```

### 2. Sales Executive Flow

```
Sales Executive Login/Signup
    ↓
Sales Dashboard
    ↓
Views Active Opportunities (all assigned deals)
    ↓
Clicks on a deal to open chat
    ↓
Chats with customer in real-time
    ↓
Updates deal status
```

---

## API Endpoints Used

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login

### Deals
- `POST /api/deals/initiate` - Create new deal (called after chatbot)
- `GET /api/deals/sales-executive/{id}` - Get all deals for sales executive
- `GET /api/deals/customer/{id}` - Get all deals for customer

### Chat
- `GET /api/chats/deal/{dealId}/sales` - Get chat history for a deal
- WebSocket `/ws` - Real-time messaging

---

## WebSocket Integration

### Connection
- URL: `http://localhost:8080/ws`
- Protocol: STOMP over SockJS
- Auto-reconnect: Yes (max 5 attempts)

### Topics
- Subscribe: `/topic/chat/{dealId}` - Receive messages for a specific deal
- Send: `/app/chat/{dealId}` - Send message to a deal

### Message Format
```javascript
{
  dealId: 123,
  senderId: 456,
  senderName: "John Doe",
  senderType: "CUSTOMER" | "SALES_EXECUTIVE",
  content: "Hello, I'm interested in this car"
}
```

---

## Configuration

### Backend URL
Located in: `src/services/api.js`
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

### WebSocket URL
Located in: `src/services/websocket.js`
```javascript
this.socket = new SockJS('http://localhost:8080/ws');
```

**To change backend URL**, update these two files.

---

## Running the Application

### Prerequisites
1. Backend server running at `http://localhost:8080`
2. MySQL database configured
3. MongoDB configured
4. Kafka (optional for ML features)

### Frontend Setup
```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

The frontend will run at `http://localhost:5173` (default Vite port)

---

## Testing the Integration

### Test Scenario 1: Customer Journey
1. Go to login page
2. Click "Sign Up" and select "Customer"
3. Fill in details and register
4. You'll be redirected to customer dashboard
5. Click "Start AI Search" to open chatbot
6. Answer all questions
7. After completing questions, a deal will be created
8. Wait for sales executive to join chat
9. Start chatting in real-time

### Test Scenario 2: Sales Executive Journey
1. Go to login page
2. Click "Sign Up" and select "Salesperson"
3. Fill in details including expertise
4. You'll be redirected to sales dashboard
5. See all assigned deals in "Active Opportunities"
6. Click on a deal card to open chat
7. Chat with the customer in real-time

---

## Troubleshooting

### Backend Connection Issues
**Problem**: "Network Error" or "Failed to fetch"
**Solution**:
1. Check if backend is running: `curl http://localhost:8080/actuator/health`
2. Check CORS configuration in backend (should allow all origins)
3. Check browser console for specific errors

### WebSocket Connection Issues
**Problem**: "WebSocket connection failed"
**Solution**:
1. Ensure WebSocket endpoint is enabled in backend
2. Check if port 8080 is accessible
3. Check browser console for WebSocket errors
4. Service will auto-reconnect up to 5 times

### Authentication Issues
**Problem**: "401 Unauthorized"
**Solution**:
1. Clear localStorage: `localStorage.clear()`
2. Re-login
3. Check if JWT token is expired (24 hours validity)

### Deal Not Created
**Problem**: Chatbot completes but no deal appears
**Solution**:
1. Check browser console for errors
2. Verify customer ID from login response
3. Check backend logs for deal creation
4. Ensure all required fields are captured from chatbot

---

## Data Flow Diagram

```
┌─────────────┐
│  Customer   │
│   Login     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Chatbot    │  ──────► Collects:
│  Questions  │           - interestCategory
└──────┬──────┘           - budgetRange
       │                  - intendedTimeframe
       │                  - preferredContactMode
       ▼
┌─────────────┐
│ Create Deal │
│   Backend   │  ──────► POST /api/deals/initiate
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Kafka     │  ──────► ML Service matches
│  Message    │           Sales Executive
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Deal Update │  ──────► salesExecutiveId assigned
│   Backend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  WebSocket  │  ──────► Both parties subscribe
│ Connection  │           to /topic/chat/{dealId}
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Real-time   │
│    Chat     │
└─────────────┘
```

---

## Key Files Modified

### New Services
- `src/services/api.js` - REST API integration with JWT
- `src/services/websocket.js` - WebSocket service for real-time chat

### Updated Components
- `src/component/TekionCRMLogin.jsx` - Backend authentication
- `src/component/CustomerChatbot.jsx` - Deal creation & real-time chat
- `src/component/CRM.jsx` - Fetch deals & real-time chat for sales
- `src/App.jsx` - Session management & routing

---

## Environment Variables (Optional)

Create `.env` file in root:
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

Then update services to use:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
```

---

## Production Deployment

### Frontend Build
```bash
npm run build
```

### Update URLs for Production
In `src/services/api.js`:
```javascript
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

In `src/services/websocket.js`:
```javascript
this.socket = new SockJS('https://your-backend-domain.com/ws');
```

---

## Support

For issues or questions:
1. Check browser console logs
2. Check backend logs
3. Verify all services are running
4. Ensure database connections are active

---

## Next Steps

### Recommended Enhancements
1. Add message read receipts
2. Add typing indicators
3. Add file attachments
4. Add push notifications
5. Add deal status updates from UI
6. Add customer feedback form integration
7. Add analytics dashboard

---

## License

© 2025 Tekion CRM - All rights reserved
