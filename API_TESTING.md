# API Testing Guide

## Base URL
```
http://localhost:8080/api
```

## 1. Register a Customer

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Customer\",
    \"email\": \"test@example.com\",
    \"password\": \"password123\",
    \"phone\": \"+91-9999999999\",
    \"address\": \"Mumbai, India\"
  }"
```

**Expected Response:**
```json
{
  "token": "eyJhbGc...",
  "type": "Bearer",
  "id": 9,
  "name": "Test Customer",
  "email": "test@example.com",
  "userType": "customer"
}
```

**Save the token** for subsequent requests.

---

## 2. Login as Sales Executive

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"rajesh.kumar@premiumautohub.com\",
    \"password\": \"password123\",
    \"userType\": \"sales_executive\"
  }"
```

---

## 3. Initiate a Deal (Customer)

**Replace `YOUR_TOKEN` with the JWT token from registration/login**

```bash
curl -X POST http://localhost:8080/api/deals/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": 9,
    \"interestCategory\": \"SUV\",
    \"budgetRange\": \"15-20 lakhs\",
    \"intendedTimeframe\": \"1-2 months\",
    \"preferredContactMode\": \"phone\"
  }"
```

**Response includes `dealId` - save this!**

---

## 4. Assign Sales Executive to Deal

```bash
curl -X POST "http://localhost:8080/api/deals/assign?dealId=DEAL_ID&salesExecutiveId=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 5. Get Chat for Deal

```bash
curl -X GET http://localhost:8080/api/chats/deal/DEAL_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 6. Send Chat Message (Customer)

```bash
curl -X POST http://localhost:8080/api/chats/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"dealId\": \"DEAL_ID\",
    \"senderId\": 9,
    \"senderName\": \"Test Customer\",
    \"senderType\": \"CUSTOMER\",
    \"content\": \"Hi, I'm interested in a test drive for an SUV\"
  }"
```

---

## 7. Send Chat Message (Sales Executive)

```bash
curl -X POST http://localhost:8080/api/chats/message \
  -H "Authorization: Bearer YOUR_SALES_EXEC_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"dealId\": \"DEAL_ID\",
    \"senderId\": 1,
    \"senderName\": \"Rajesh Kumar\",
    \"senderType\": \"SALES_EXECUTIVE\",
    \"content\": \"Hello! I'd be happy to arrange a test drive. What time works best for you?\"
  }"
```

---

## 8. Update Deal Status

```bash
curl -X PUT http://localhost:8080/api/deals/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"dealId\": \"DEAL_ID\",
    \"status\": \"IN_PROGRESS\",
    \"note\": \"Customer very interested, discussing test drive options\"
  }"
```

---

## 9. Request Health Score Calculation

```bash
curl -X POST http://localhost:8080/api/deals/DEAL_ID/request-health-score \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This triggers the ML service via Kafka. Check logs to see the calculation.

---

## 10. Get Deal Details

```bash
curl -X GET http://localhost:8080/api/deals/DEAL_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 11. Schedule Appointment

```bash
curl -X PUT http://localhost:8080/api/deals/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"dealId\": \"DEAL_ID\",
    \"appointmentDate\": \"2026-01-20T14:00:00\",
    \"note\": \"Test drive scheduled at customer's home address\"
  }"
```

---

## 12. Get All Deals for Customer

```bash
curl -X GET http://localhost:8080/api/deals/customer/9 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 13. Get All Deals for Sales Executive

```bash
curl -X GET http://localhost:8080/api/deals/sales-executive/1 \
  -H "Authorization: Bearer YOUR_SALES_EXEC_TOKEN"
```

---

## 14. Get Deal DNA

```bash
curl -X GET http://localhost:8080/api/deal-dna/deal/DEAL_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 15. Get All Available Sales Executives

```bash
curl -X GET http://localhost:8080/api/sales-executives/available \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Complete Workflow Example

```bash
# 1. Register
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo User","email":"demo@test.com","password":"pass123","phone":"+91-9999999999"}')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
CUSTOMER_ID=$(echo $REGISTER_RESPONSE | jq -r '.id')

# 2. Initiate Deal
DEAL_RESPONSE=$(curl -s -X POST http://localhost:8080/api/deals/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":$CUSTOMER_ID,\"interestCategory\":\"SUV\",\"budgetRange\":\"15-20 lakhs\",\"intendedTimeframe\":\"1-2 months\",\"preferredContactMode\":\"phone\"}")

DEAL_ID=$(echo $DEAL_RESPONSE | jq -r '.id')

# 3. Assign Sales Executive
curl -s -X POST "http://localhost:8080/api/deals/assign?dealId=$DEAL_ID&salesExecutiveId=1" \
  -H "Authorization: Bearer $TOKEN"

# 4. Get Deal
curl -s -X GET http://localhost:8080/api/deals/$DEAL_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Testing ML Services Directly

### Sales Executive Predictor
```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": 1,
    \"customerName\": \"Test Customer\",
    \"interestCategory\": \"SUV\",
    \"budgetRange\": \"15-20 lakhs\"
  }"
```

### Deal DNA Analyzer
```bash
curl -X POST http://localhost:5002/analyze \
  -H "Content-Type: application/json" \
  -d "{
    \"dealId\": \"some-deal-id\",
    \"dealDnaId\": \"some-dna-id\"
  }"
```

---

## Deal Statuses

- `INITIATED` - Deal just created
- `IN_PROGRESS` - Sales executive assigned and chatting
- `APPOINTMENT_SCHEDULED` - Meeting scheduled
- `CLOSED` - Deal successfully closed
- `LOST` - Deal did not proceed

---

## Health Score Thresholds

- **Below 30 (Critical)**: Deal at risk, minimize effort
- **30-70 (Normal)**: Continue standard engagement  
- **Above 70 (Opportunity)**: Offer premium services, home test drive
