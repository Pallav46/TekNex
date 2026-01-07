# CRM System - Hackathon Project

A comprehensive Customer Relationship Management (CRM) system for automotive dealerships with ML-powered sales executive matching and deal health prediction.

## 🏗️ Architecture

### Backend Stack
- **Spring Boot 3.5.9** (Java 21)
- **MySQL 8.0** - Stores Customer, Dealer, and SalesExecutive data
- **MongoDB 7.0** - Stores Chat, Deal, and DealDNA documents
- **Apache Kafka** - Event-driven communication with ML services
- **JWT Authentication** - Secure authentication system
- **Docker & Docker Compose** - Containerized deployment

### ML Services (Flask)
1. **Sales Executive Predictor** (`predict-sales-executive`) - Matches customers with best-suited sales executives
2. **Deal DNA Analyzer** (`dna`) - Calculates deal health scores and thresholds

## 📊 Key Features

### 1. Customer Flow
- Customer registration and JWT-based login
- Bot chat for initial information gathering:
  - Interest category (SUV, Sedan, Hatchback, Electric, etc.)
  - Budget range
  - Intended timeframe (1-2 months, 3-5 months, 6+ months)
  - Preferred contact mode (phone, call, Skype, WhatsApp)

### 2. Sales Executive Matching
- ML service analyzes customer preferences
- Automatically assigns best-suited sales executive
- Based on expertise, availability, and performance

### 3. Deal Management
- **Deal Health Score** (0-100): Likelihood of deal closure
- **Critical Threshold** (~30): Below this, deal likely to fail
- **Opportunity Threshold** (~70): Above this, offer premium services

### 4. Smart Features
- **Home Test Drive**: Offered for high-scoring deals (>70)
- **Appointment Scheduling**: Available unless health < critical threshold
- **Deal DNA**: Comprehensive summary of customer, deal, and engagement metrics

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Docker Compose
- Java 21 (for local development)
- Python 3.11 (for local ML service development)

### Running with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f crm-backend
docker-compose logs -f sales-executive-predictor
docker-compose logs -f deal-dna-analyzer

# Stop all services
docker-compose down
```

### Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| CRM Backend | 8080 | Spring Boot REST API |
| MySQL | 3306 | Customer, Dealer, SalesExecutive DB |
| MongoDB | 27017 | Chat, Deal, DealDNA DB |
| Kafka | 9092 | Event streaming |
| Zookeeper | 2181 | Kafka coordination |
| Sales Executive Predictor | 5001 | Flask ML service |
| Deal DNA Analyzer | 5002 | Flask ML service |

## 📡 API Endpoints

### Authentication
```http
POST /api/auth/register
POST /api/auth/login
```

### Deals
```http
POST /api/deals/initiate
POST /api/deals/assign?dealId={id}&salesExecutiveId={id}
PUT /api/deals/update
GET /api/deals/{dealId}
GET /api/deals/customer/{customerId}
GET /api/deals/sales-executive/{salesExecutiveId}
POST /api/deals/{dealId}/request-health-score
```

### Chat
```http
POST /api/chats/message
GET /api/chats/deal/{dealId}
GET /api/chats/customer/{customerId}
GET /api/chats/sales-executive/{salesExecutiveId}
```

### Customers, Dealers, Sales Executives
```http
GET /api/customers
GET /api/customers/{id}
GET /api/dealers
GET /api/dealers/{id}
GET /api/sales-executives
GET /api/sales-executives/{id}
GET /api/sales-executives/available
```

### Deal DNA
```http
GET /api/deal-dna/deal/{dealId}
GET /api/deal-dna/{id}
```

## 🔐 Authentication

### Register Customer
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+91-9999999999"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "userType": "customer"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "userType": "customer"
}
```

## 📝 Sample Workflow

### 1. Customer Initiates Deal
```bash
curl -X POST http://localhost:8080/api/deals/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "interestCategory": "SUV",
    "budgetRange": "15-20 lakhs",
    "intendedTimeframe": "1-2 months",
    "preferredContactMode": "phone"
  }'
```

### 2. System Matches Sales Executive (via Kafka)
- Request sent to `sales-executive-match-request` topic
- ML service processes and sends response to `sales-executive-match-response`
- CRM assigns sales executive automatically

### 3. Assign Sales Executive to Deal
```bash
curl -X POST "http://localhost:8080/api/deals/assign?dealId=DEAL_ID&salesExecutiveId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Chat Between Customer and Sales Executive
```bash
curl -X POST http://localhost:8080/api/chats/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "DEAL_ID",
    "senderId": 1,
    "senderName": "John Doe",
    "senderType": "CUSTOMER",
    "content": "I am interested in a test drive"
  }'
```

### 5. Update Deal Status
```bash
curl -X PUT http://localhost:8080/api/deals/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "DEAL_ID",
    "status": "APPOINTMENT_SCHEDULED",
    "appointmentDate": "2026-01-15T10:00:00",
    "note": "Test drive scheduled at customer location"
  }'
```

### 6. Request Health Score Calculation
```bash
curl -X POST http://localhost:8080/api/deals/DEAL_ID/request-health-score \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Pre-loaded Dummy Data

### Dealers
- Premium Auto Hub (Mumbai)
- Elite Motors (Delhi)
- Royal Wheels (Bangalore)
- Crown Automobiles (Pune)

### Sales Executives
- Rajesh Kumar, Priya Sharma (Premium Auto Hub)
- Amit Patel, Sneha Reddy (Elite Motors)
- Vikram Singh, Anita Desai (Royal Wheels)
- Suresh Nair, Kavita Iyer (Crown Automobiles)

### Test Credentials

**Sales Executive Login:**
- Email: `rajesh.kumar@premiumautohub.com`
- Password: `password123`

**Customer Login (Register first or use existing):**
- Email: `arjun.mehta@example.com`
- Password: `customer123`

## 🎯 Deal Health Thresholds

### Critical Threshold (~30)
- **Name**: Critical Benchmark
- **Indication**: Deal likely to fail
- **Action**: Minimize effort if customer unresponsive

### Opportunity Threshold (~70)
- **Name**: Opportunity Benchmark
- **Indication**: Deal highly likely to close
- **Action**: Offer premium services (home test drive, priority scheduling)

## 📊 MongoDB Collections

### Deals
- Customer information
- Sales executive assignment
- Interest category, budget, timeframe
- Health score and thresholds
- Deal status and notes

### Chats
- Bot chat history
- Sales executive chat history
- Message timestamps and types

### Deal DNA
- Comprehensive deal metrics
- Customer engagement data
- Interaction patterns
- Performance indicators

## 🐳 Docker Notes

### Building Individual Services
```bash
# Build CRM backend
cd crm
docker build -t crm-backend .

# Build Sales Executive Predictor
cd predict-sales-executive
docker build -t sales-executive-predictor .

# Build Deal DNA Analyzer
cd dna
docker build -t deal-dna-analyzer .
```

### Environment Variables
Check `docker-compose.yml` for all environment configurations.

## 🔍 Troubleshooting

### Kafka Connection Issues
```bash
# Check Kafka is running
docker-compose logs kafka

# Verify topics are created
docker exec -it crm_kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Database Connection Issues
```bash
# Check MySQL
docker exec -it crm_mysql mysql -uroot -proot123 -e "SHOW DATABASES;"

# Check MongoDB
docker exec -it crm_mongodb mongosh --eval "show dbs"
```

## 📚 Technologies Used

- Spring Boot 3.5.9
- Spring Data JPA & MongoDB
- Spring Security with JWT
- Spring Kafka
- MySQL 8.0
- MongoDB 7.0
- Apache Kafka & Zookeeper
- Flask 3.0
- Docker & Docker Compose
- Lombok
- BCrypt Password Encoding

## 🎓 Hackathon Demo Focus

This project focuses on the **backend CRM functionality** with:
- Complete REST API
- JWT authentication
- Dual database architecture (MySQL + MongoDB)
- Event-driven ML integration via Kafka
- Simulated ML services for demo purposes

The chat feature is implemented for demonstration. In production, this would extend to:
- WhatsApp integration
- Phone calls
- Video conferencing (Zoom/Skype)
- Email communication

## 📄 License

This is a hackathon project for demonstration purposes.
