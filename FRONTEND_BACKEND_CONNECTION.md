# 🚀 Complete Frontend-Backend Connection Guide

## 📋 System Overview

This CRM system consists of:
- **Backend**: Spring Boot (Java) REST API + WebSocket server
- **Frontend**: 2 HTML files (Customer & Sales Executive portals)
- **Database**: MySQL (users) + MongoDB (deals, chats)
- **ML Services**: Flask services for sales executive matching
- **Message Broker**: Kafka for async communication

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                         │
├─────────────────────────────────────────────────────────────┤
│      
│  (Customer Portal)          │  (Sales Executive Portal)     │
│  - Registration/Login       │  - Login                      │
│  - Chatbot Q&A             │  - Dashboard                  │
│  - Real-time chat          │  - Deal management            │
│                            │  - Real-time chat             │
└─────────────┬───────────────┴──────────────┬────────────────┘
              │                              │
              │   HTTP REST API (Port 8080)  │
              │   WebSocket (Port 8080/ws)   │
              │                              │
┌─────────────▼──────────────────────────────▼────────────────┐
│                   BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Spring Boot Application (crm-backend)                      │
│  ├── REST Controllers                                       │
│  │   ├── AuthController (/api/auth/*)                      │
│  │   ├── DealController (/api/deals/*)                     │
│  │   ├── ChatController (/api/chats/*)                     │
│  │   └── SalesExecutiveController (/api/sales-executives/*)│
│  │                                                           │
│  ├── WebSocket Controller                                   │
│  │   └── /ws endpoint with STOMP protocol                  │
│  │                                                           │
│  ├── Security Layer                                         │
│  │   ├── JWT Authentication                                │
│  │   ├── BCrypt Password Hashing                           │
│  │   └── CORS Configuration (allows all origins)           │
│  │                                                           │
│  └── Kafka Integration                                      │
│      ├── Sends: Sales executive match requests             │
│      └── Receives: ML predictions                          │
└─────────────┬───────────────────────────────────────────────┘
              │
    ┌─────────┴─────────┬────────────┬──────────────┐
    │                   │            │              │
┌───▼────┐      ┌──────▼──────┐  ┌─▼────────┐  ┌─▼─────────┐
│ MySQL  │      │  MongoDB    │  │  Kafka   │  │ ML Service│
│ (Users)│      │(Deals/Chats)│  │ (Broker) │  │  (Flask)  │
└────────┘      └─────────────┘  └──────────┘  └───────────┘
```

---

## 🔌 Connection Details

### 1. **HTTP REST API Connection**

**Base URL**: `http://localhost:8080/api`

**CORS**: Enabled for all origins (`*`)

**Authentication**: 
- JWT Bearer tokens
- Header: `Authorization: Bearer <token>`
- Token expiry: 24 hours

#### Frontend → Backend REST Calls

```javascript
// Example: Login
fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
})
.then(response => response.json())
.then(data => {
    // data.token = JWT token
    // data.id = User ID
    // Store token for future requests
});

// Example: Create Deal (Authenticated)
fetch('http://localhost:8080/api/deals/initiate', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token  // JWT token from login
    },
    body: JSON.stringify({
        customerId: 123,
        interestCategory: 'SUV',
        budgetRange: '10-15 lakhs',
        intendedTimeframe: '1-2 months',
        preferredContactMode: 'phone'
    })
})
.then(response => response.json())
.then(deal => {
    // deal.id = Deal ID for chat
});
```

---

### 2. **WebSocket Connection (Real-time Chat)**

**WebSocket URL**: `http://localhost:8080/ws`

**Protocol**: STOMP over SockJS

**Libraries Used**:
- `sockjs-client@1` (WebSocket fallback)
- `stompjs@2.3.3` (STOMP protocol)

#### Frontend WebSocket Setup

```javascript
// 1. Create SockJS connection
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

// 2. Connect
stompClient.connect({}, function(frame) {
    console.log('WebSocket Connected');
    
    // 3. Subscribe to deal-specific chat topic
    stompClient.subscribe('/topic/chat/' + dealId, function(message) {
        const msg = JSON.parse(message.body);
        // Display message: msg.content, msg.senderName, msg.senderType
    });
});

// 4. Send message
const message = {
    dealId: dealId,
    senderId: userId,
    senderName: userName,
    senderType: 'CUSTOMER', // or 'SALES_EXECUTIVE'
    content: 'Hello!'
};

stompClient.send("/app/chat/" + dealId, {}, JSON.stringify(message));
```

**Message Flow**:
```
Customer sends → /app/chat/{dealId} → Backend saves → 
Broadcast to /topic/chat/{dealId} → All subscribers receive
```

---

## 🎯 Complete API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login (returns JWT) | No |

**Register Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+91-9999999999",
  "address": "Mumbai, India"
}
```

**Login Request**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGc...",
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "userType": "customer"
}
```

---

### Deal Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/deals/initiate` | Create new deal | Yes |
| GET | `/api/deals/{dealId}` | Get deal by ID | Yes |
| GET | `/api/deals/customer/{customerId}` | Get customer's deals | Yes |
| GET | `/api/deals/sales-executive/{seId}` | Get SE's deals | Yes |
| PUT | `/api/deals/update` | Update deal status | Yes |

**Initiate Deal Request**:
```json
{
  "customerId": 123,
  "interestCategory": "SUV",
  "budgetRange": "10-15 lakhs",
  "intendedTimeframe": "1-2 months",
  "preferredContactMode": "phone"
}
```

---

### Chat Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/chats/deal/{dealId}` | Get all chats for deal | Yes |
| GET | `/api/chats/deal/{dealId}/sales` | Get sales chat only | Yes |
| POST | `/api/chats/{chatId}/message` | Add message (REST) | Yes |

---

### Sales Executive Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/sales-executives` | List all SEs | Yes |
| GET | `/api/sales-executives/{id}` | Get SE details | Yes |

---

## 🚀 Starting the System

### Step 1: Start All Services

```powershell
# Navigate to project directory
cd C:\Users\Pallav\OneDrive\Desktop\t

# Start all Docker containers
docker-compose up -d

# Verify all containers are running
docker ps
```

**Expected Containers**:
- `crm_backend` (Spring Boot - Port 8080)
- `crm_mysql` (MySQL - Port 3306)
- `crm_mongodb` (MongoDB - Port 27017)
- `crm_kafka` (Kafka - Port 9092)
- `crm_zookeeper` (Zookeeper - Port 2181)
- `sales_executive_predictor` (Flask ML - Port 5001)
- `deal_dna_analyzer` (Flask ML - Port 5002)

### Step 2: Wait for Backend Initialization

```powershell
# Check backend logs
docker logs crm_backend

# Wait for this message:
# "Started CrmApplication in X seconds"
```

### Step 3: Open Frontend Files

**Option 1: File Browser**
- Navigate to: `C:\Users\Pallav\OneDrive\Desktop\t\`
- Double-click `customer-app.html` (opens in default browser)
- Double-click `sales-executive-app.html` (opens in new tab)

**Option 2: Direct URLs** (if using a local server)
- Customer: `file:///C:/Users/Pallav/OneDrive/Desktop/t/customer-app.html`
- Sales Executive: `file:///C:/Users/Pallav/OneDrive/Desktop/t/sales-executive-app.html`

---

## 🧪 Complete Testing Workflow

### Test 1: Customer Registration & Chatbot

1. **Open** `customer-app.html`
2. **Fill in**:
   - Name: "Test Customer"
   - Email: "test@example.com"
   - Password: "password"
3. **Click** "Register & Start"
4. **Answer chatbot**:
   - Car type: SUV
   - Budget: 5-10 lakhs
   - Timeframe: 1-2 months
5. **Wait** for message: "Connected you with Rajesh Kumar from Premium Auto Hub"
6. **See** chat interface appear

### Test 2: Sales Executive Login & Dashboard

1. **Open** `sales-executive-app.html` (new tab)
2. **Click** "Create Rajesh Kumar Account & Login"
3. **See** dashboard with customer's deal in left sidebar
4. **Click** the deal card
5. **See** chat interface open

### Test 3: Real-time Chat

1. **In customer tab**: Type "Hello, I need help" → Send
2. **In sales executive tab**: See message appear instantly
3. **In sales executive tab**: Type "Hi! How can I help you?" → Send
4. **In customer tab**: See response appear instantly
5. ✅ **WebSocket working!**

---

## 🔧 Key Frontend Configuration

### Customer App (`customer-app.html`)

**Line 189-210**: Registration
```javascript
fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone, address })
})
```

**Line 260-285**: Create Deal
```javascript
fetch('http://localhost:8080/api/deals/initiate', {
    headers: {
        'Authorization': 'Bearer ' + token  // JWT from login
    },
    body: JSON.stringify({
        customerId, interestCategory, budgetRange, 
        intendedTimeframe, preferredContactMode
    })
})
```

**Line 327-336**: WebSocket Connection
```javascript
const socket = new SockJS('http://localhost:8080/ws');
stompClient = Stomp.over(socket);
stompClient.connect({}, function(frame) {
    stompClient.subscribe('/topic/chat/' + dealId, function(message) {
        // Real-time message received
    });
});
```

**Line 361-375**: Send Message
```javascript
const message = {
    dealId: dealId,
    senderId: customerId,
    senderName: 'Customer',
    senderType: 'CUSTOMER',
    content: content
};
stompClient.send("/app/chat/" + dealId, {}, JSON.stringify(message));
```

---

### Sales Executive App (`sales-executive-app.html`)

**Line 165-195**: Login
```javascript
fetch('http://localhost:8080/api/auth/login', {
    body: JSON.stringify({ email, password })
})
```

**Line 220-245**: Load Deals
```javascript
// Fetches deals assigned to salesExecutiveId = 1 (Rajesh Kumar)
fetch(`http://localhost:8080/api/deals/sales-executive/1`, {
    headers: { 'Authorization': 'Bearer ' + token }
})
```

**Line 330-350**: Open Chat & WebSocket
```javascript
// Subscribe to deal's chat topic
stompClient.subscribe('/topic/chat/' + deal.id, function(message) {
    const msg = JSON.parse(message.body);
    displayMessage(msg);
});
```

---

## 🔐 Security Implementation

### JWT Token Flow

```
1. User logs in → Backend validates credentials
2. Backend generates JWT token with:
   - User ID
   - Email
   - User type (customer/sales_executive)
   - Expiry (24 hours)
3. Frontend stores token in JavaScript variable
4. Frontend includes token in every authenticated request:
   Header: Authorization: Bearer <token>
5. Backend validates token on each request
6. If valid → Process request
   If invalid/expired → Return 401 Unauthorized
```

### CORS Configuration

**Backend** (`SecurityConfig.java`):
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(Arrays.asList("*"));
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
    config.setAllowedHeaders(Arrays.asList("*"));
    return source;
}
```

This allows HTML files opened directly (file://) to connect to backend.

---

## 🐛 Troubleshooting

### Issue 1: "Failed to fetch" Error

**Problem**: Frontend can't connect to backend

**Solutions**:
```powershell
# Check if backend is running
docker ps | findstr crm_backend

# Check backend logs
docker logs crm_backend --tail 20

# Restart backend
docker restart crm_backend
```

**Check CORS**: Backend must allow `*` origins for file:// protocol.

---

### Issue 2: WebSocket Connection Failed

**Problem**: Chat messages not appearing

**Solutions**:
1. **Check browser console** (F12) for WebSocket errors
2. **Verify endpoint**: `http://localhost:8080/ws` (not https)
3. **Check firewall**: Port 8080 must be open
4. **Restart backend**: `docker restart crm_backend`

---

### Issue 3: JWT Token Expired

**Problem**: "401 Unauthorized" after some time

**Solution**: Login again (token expires after 24 hours)

---

### Issue 4: No Deals Showing in Sales Executive Dashboard

**Problem**: Dashboard empty

**Solutions**:
```javascript
// Open browser console (F12) and check logs
// Look for: "Found deals assigned to Rajesh Kumar (ID 1): X"

// If 0 deals:
// 1. Make sure customer completed chatbot flow
// 2. Wait 2-3 seconds for ML assignment
// 3. Refresh sales executive page
// 4. Check console for errors
```

---

## 📊 Data Flow Example

### Complete Customer-to-Sales-Executive Flow

```
1. CUSTOMER REGISTRATION
   Customer fills form → POST /api/auth/register
   Backend: Creates customer in MySQL → Returns JWT token
   Frontend: Stores token

2. CHATBOT Q&A
   Customer answers questions → Stored in frontend state
   {interestCategory: "SUV", budgetRange: "5-10 lakhs", ...}

3. DEAL CREATION
   Frontend → POST /api/deals/initiate (with JWT token)
   Backend: 
     - Creates Deal in MongoDB
     - Creates Bot Chat in MongoDB
     - Sends Kafka message to ML service
   
4. ML ASSIGNMENT (2-3 seconds)
   ML Service → Processes request → Returns:
     {salesExecutiveId: 1, salesExecutiveName: "Rajesh Kumar", ...}
   Backend → Updates Deal with SE details
   Frontend → Polls GET /api/deals/{dealId} until SE assigned

5. SALES EXECUTIVE LOGS IN
   SE opens app → Clicks "Create Rajesh Kumar Account"
   POST /api/auth/register → Returns JWT token
   
6. LOAD DEALS
   Frontend → GET /api/deals/sales-executive/1 (with JWT)
   Backend → Returns all deals assigned to Rajesh Kumar
   Frontend → Displays in sidebar

7. WEBSOCKET CHAT
   Both parties connect to /ws
   Subscribe to /topic/chat/{dealId}
   
   Customer types → Frontend sends:
     POST /app/chat/{dealId} via WebSocket
   Backend → Saves to MongoDB → Broadcasts to /topic/chat/{dealId}
   Sales Executive → Receives via subscription → Displays
   
   (Reverse direction works same way)
```

---

## 🎯 Production Deployment Notes

### Backend Changes Needed

1. **CORS**: Restrict to specific domains
```java
config.setAllowedOriginPatterns(Arrays.asList("https://yourdomain.com"));
```

2. **JWT Secret**: Use environment variable
```properties
jwt.secret=${JWT_SECRET}
```

3. **Database**: Use production credentials
```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASS}
```

### Frontend Changes Needed

1. **Update API URLs**:
```javascript
// Change from:
const API_URL = 'http://localhost:8080';

// To:
const API_URL = 'https://api.yourdomain.com';
```

2. **WebSocket URL**:
```javascript
// Change from:
const socket = new SockJS('http://localhost:8080/ws');

// To:
const socket = new SockJS('https://api.yourdomain.com/ws');
```

3. **HTTPS**: Serve frontend over HTTPS

---

## 📝 Summary

**Backend Provides**:
- ✅ REST API at `http://localhost:8080/api`
- ✅ WebSocket at `http://localhost:8080/ws`
- ✅ JWT authentication
- ✅ CORS enabled for all origins
- ✅ Real-time message broadcasting

**Frontend Connects Via**:
- ✅ `fetch()` for REST API calls
- ✅ SockJS + STOMP for WebSocket
- ✅ JWT tokens in Authorization header
- ✅ JSON data format

**Key Files**:
- `customer-app.html` - Customer portal (standalone HTML)
- `sales-executive-app.html` - Sales executive portal (standalone HTML)
- No build process needed - just open in browser!

---

## 🎉 You're Ready!

The system is **fully functional** with:
- ✅ Customer registration & chatbot
- ✅ ML-based sales executive assignment
- ✅ Real-time WebSocket chat
- ✅ Sales executive dashboard
- ✅ Complete deal management

**Start Testing**: Open both HTML files and follow the testing workflow above!

---

**Need Help?** Check browser console (F12) for detailed logs and error messages.
