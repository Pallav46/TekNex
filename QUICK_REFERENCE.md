# 🚀 Quick API Reference Card

## Base URL
```
http://localhost:8080/api
```

## 🔐 Authentication

### Register
```bash
POST /auth/register
{
  "name": "John Doe",
  "email": "john@test.com",
  "password": "pass123",
  "phone": "+91-9999999999"
}
→ Returns: { token, id, name, email, userType }
```

### Login
```bash
POST /auth/login
{
  "email": "john@test.com",
  "password": "pass123",
  "userType": "customer"  // or "sales_executive"
}
→ Returns: { token, id, name, email, userType }
```

**Add to all requests:** `Authorization: Bearer YOUR_TOKEN`

---

## 💼 Deal Flow

### 1️⃣ Initiate Deal
```bash
POST /deals/initiate
{
  "customerId": 1,
  "interestCategory": "SUV",
  "budgetRange": "15-20 lakhs",
  "intendedTimeframe": "1-2 months",
  "preferredContactMode": "phone"
}
→ Returns: Deal with ID (save this!)
```

### 2️⃣ Assign Sales Executive
```bash
POST /deals/assign?dealId=DEAL_ID&salesExecutiveId=1
→ Returns: Updated deal with SE assigned
```

### 3️⃣ Update Deal
```bash
PUT /deals/update
{
  "dealId": "DEAL_ID",
  "status": "IN_PROGRESS",
  "note": "Customer interested"
}
```

### 4️⃣ Request Health Score
```bash
POST /deals/DEAL_ID/request-health-score
→ Triggers ML calculation via Kafka
```

---

## 💬 Chat

### Send Message
```bash
POST /chats/message
{
  "dealId": "DEAL_ID",
  "senderId": 1,
  "senderName": "John",
  "senderType": "CUSTOMER",  // or SALES_EXECUTIVE, BOT
  "content": "Hello!"
}
```

### Get Chat
```bash
GET /chats/deal/DEAL_ID
→ Returns: All messages for deal
```

---

## 📊 Queries

### Get Data
```bash
GET /deals/customer/1          # Customer's deals
GET /deals/sales-executive/1   # SE's deals
GET /deals/DEAL_ID             # Specific deal

GET /customers                 # All customers
GET /dealers                   # All dealers
GET /sales-executives          # All SEs
GET /sales-executives/available # Available SEs

GET /deal-dna/deal/DEAL_ID    # Deal DNA
```

---

## 🎯 Deal Statuses

| Status | Description |
|--------|-------------|
| `INITIATED` | Just created |
| `IN_PROGRESS` | SE assigned, chatting |
| `APPOINTMENT_SCHEDULED` | Meeting set |
| `CLOSED` | Successfully closed |
| `LOST` | Did not proceed |

---

## 📈 Health Thresholds

| Score | Threshold | Action |
|-------|-----------|--------|
| < 30 | **Critical** | Minimize effort |
| 30-70 | Normal | Standard engagement |
| > 70 | **Opportunity** | Home test drive! |

---

## 🧪 Test Credentials

### Sales Executive
```
Email: rajesh.kumar@premiumautohub.com
Password: password123
```

### Pre-loaded Customer
```
Email: arjun.mehta@example.com
Password: customer123
```

---

## 🔥 Quick Test Flow

```bash
# 1. Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@t.com","password":"pass123","phone":"+91-9999999999"}'

# Save token from response!

# 2. Initiate Deal
curl -X POST http://localhost:8080/api/deals/initiate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId":9,"interestCategory":"SUV","budgetRange":"15-20L","intendedTimeframe":"1-2m","preferredContactMode":"phone"}'

# Save dealId from response!

# 3. Assign SE
curl -X POST "http://localhost:8080/api/deals/assign?dealId=DEAL_ID&salesExecutiveId=1" \
  -H "Authorization: Bearer TOKEN"

# 4. Send Message
curl -X POST http://localhost:8080/api/chats/message \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dealId":"DEAL_ID","senderId":9,"senderName":"Test","senderType":"CUSTOMER","content":"Hi!"}'

# 5. Get Chat
curl -X GET http://localhost:8080/api/chats/deal/DEAL_ID \
  -H "Authorization: Bearer TOKEN"
```

---

## 🐳 Service Ports

| Service | Port | Health |
|---------|------|--------|
| CRM API | 8080 | /api/dealers |
| MySQL | 3306 | - |
| MongoDB | 27017 | - |
| Kafka | 9092 | - |
| SE Predictor | 5001 | /health |
| DNA Analyzer | 5002 | /health |

---

## 📦 Postman

Import: `CRM_API.postman_collection.json`

Variables auto-set:
- `token` → After login/register
- `customerId` → After register
- `dealId` → After initiate deal

---

## ⚡ Common Errors

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check token, re-login |
| 400 Bad Request | Validate JSON body |
| 404 Not Found | Check ID exists |
| 500 Server Error | Check logs |

---

## 🎮 Full Demo Script

1. **Register** → Get token & customer ID
2. **Initiate Deal** → Get deal ID
3. **List Available SEs** → Choose one
4. **Assign SE** → Connect customer & SE
5. **Send Messages** → Simulate chat
6. **Request Health Score** → ML calculates
7. **Get Deal** → See updated health score
8. **Update Status** → Set appointment
9. **Get Deal DNA** → See analytics

---

**Pro Tip**: Use Postman collection for automated variable management!
