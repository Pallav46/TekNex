# Tekion CRM Frontend - Fully Integrated! 🚀

> **Status**: ✅ Backend Integration Complete  
> **Real-time Chat**: ✅ WebSocket Enabled  
> **Authentication**: ✅ JWT Implemented

Modern automotive CRM platform with AI-powered customer matching and real-time chat between customers and sales executives.

---

## 🎯 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open browser
http://localhost:5173
```

**📖 Full Guide**: See [QUICK_START.md](QUICK_START.md) for complete testing instructions.

---

## ✨ Features

### Customer Portal
- 🤖 **AI Chatbot** - Interactive questionnaire for vehicle preferences
- 💬 **Real-time Chat** - Instant messaging with assigned sales executive
- 🔐 **Secure Authentication** - JWT-based login/signup
- 📱 **Responsive Design** - Works on desktop and mobile

### Sales Executive Portal
- 📊 **Dashboard** - View all active opportunities
- 👥 **Deal Management** - Track customer interactions
- 💬 **Multi-chat Support** - Handle multiple customers simultaneously
- 🔔 **Real-time Notifications** - Instant updates when customers message
- 📈 **Analytics** - Deal statistics and performance metrics

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
REST API (JWT Auth)
    ↓
Backend (Spring Boot @ localhost:8080)
    ↓
WebSocket (STOMP + SockJS)
    ↓
Real-time Bidirectional Chat
```

---

## 🔧 Tech Stack

- **React 19** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **SockJS + STOMP** - WebSocket protocol
- **Lucide React** - Icons

---

## 📁 Project Structure

```
src/
├── component/
│   ├── TekionCRMLogin.jsx      # Auth component
│   ├── CustomerChatbot.jsx     # Chatbot + real-time chat
│   ├── CRM.jsx                 # Sales dashboard
│   └── FeedbackForm.jsx
├── services/
│   ├── api.js                  # REST API + JWT
│   └── websocket.js            # WebSocket service
├── App.jsx                     # Main router
└── main.jsx
```

---

## 🔌 Backend Integration

### Prerequisites
- Backend running on `http://localhost:8080`
- CORS enabled for all origins
- WebSocket endpoint at `/ws`
- JWT authentication enabled

### Environment Configuration

**Default URLs:**
- API: `http://localhost:8080/api`
- WebSocket: `http://localhost:8080/ws`

**To change**, edit:
- `src/services/api.js` → `API_BASE_URL`
- `src/services/websocket.js` → SockJS URL

---

## 🎮 Complete User Flow

### 1️⃣ Customer Journey
```
Login/Signup → Dashboard → Open Chatbot → Answer Questions
    → Deal Created → Sales Person Assigned → Real-time Chat
```

### 2️⃣ Sales Executive Journey
```
Login/Signup → Dashboard → View Active Opportunities
    → Click Deal → Chat with Customer in Real-time
```

---

## 🧪 Testing

### Quick Test (2 Users)

**Terminal 1 - Start Frontend:**
```bash
npm run dev
```

**Browser 1 - Customer:**
1. Open `http://localhost:5173`
2. Sign up as Customer
3. Complete chatbot
4. Wait for sales person

**Browser 2 - Sales Person (Incognito):**
1. Open `http://localhost:5173`
2. Sign up as Sales Person
3. See customer deal in dashboard
4. Click to chat

**Result:** Real-time messages between both users! 🎉

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Step-by-step testing guide
- **[BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md)** - Complete integration docs
- **[INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)** - Summary of changes

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Network Error | Check if backend is running at `localhost:8080` |
| WebSocket Failed | Refresh page (auto-reconnect enabled) |
| 401 Unauthorized | Clear localStorage and re-login |
| Deal Not Showing | Check browser console for API errors |

**Debug Mode:** Press `F12` to open browser console for detailed logs.

---

## 🚀 Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

**Note:** Update API and WebSocket URLs in `src/services/` before deploying!

---

## 🎨 Key UI Components

### Login Page
- Dual-mode: Customer / Sales Person
- Form validation
- Loading states
- Error handling

### Customer Chatbot
- Multi-step questionnaire
- Interactive option buttons
- Real-time chat mode
- Message history

### Sales Dashboard
- Active opportunities grid
- Deal health indicators
- Search & filter
- Click-to-chat

### Real-time Chat
- Bidirectional messaging
- Message history from backend
- Typing indicators (UI ready)
- Unread badges

---

## 🔐 Authentication Flow

1. User submits credentials
2. Backend returns JWT token
3. Token stored in `localStorage`
4. Token added to all API requests
5. Auto-login on page refresh
6. Token expires after 24 hours

---

## 📡 WebSocket Flow

1. Connection established on deal creation
2. Subscribe to `/topic/chat/{dealId}`
3. Send messages to `/app/chat/{dealId}`
4. Messages broadcast to all subscribers
5. Auto-reconnect on disconnect (max 5 attempts)

---

## 📊 API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/deals/initiate` | Create deal after chatbot |
| GET | `/api/deals/sales-executive/{id}` | Fetch assigned deals |
| GET | `/api/chats/deal/{id}/sales` | Get chat history |
| WS | `/ws` → `/topic/chat/{dealId}` | Real-time messaging |

---

## 🎯 Success Criteria

✅ Customer can complete chatbot  
✅ Deal created in backend  
✅ Sales person sees deal in dashboard  
✅ Real-time chat works both ways  
✅ WebSocket auto-reconnects  
✅ JWT authentication works  
✅ No console errors  

---

## 🌟 Features Roadmap

- [x] Authentication (Login/Signup)
- [x] Customer chatbot
- [x] Deal creation
- [x] Real-time chat
- [x] Sales dashboard
- [ ] File attachments in chat
- [ ] Push notifications
- [ ] Video call integration
- [ ] Deal status updates from UI
- [ ] Customer feedback integration

---

## 🤝 Contributing

This is a hackathon project for Tekion. Feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 📝 License

© 2025 Tekion CRM - All rights reserved

---

## 🎉 Ready to Test?

**Backend running?** ✅  
**Frontend running?** ✅  
**Let's go!** → [QUICK_START.md](QUICK_START.md)

---

**Built with ❤️ for Tekion Hackathon 2025**
