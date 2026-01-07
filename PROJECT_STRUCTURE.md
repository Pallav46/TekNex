# 📁 Project Structure

```
t/
├── 📄 README.md                          # Main project documentation
├── 📄 API_TESTING.md                     # API testing examples
├── 📄 QUICK_REFERENCE.md                 # Quick API reference
├── 📄 TROUBLESHOOTING.md                 # Common issues & solutions
├── 📄 IMPLEMENTATION_SUMMARY.md          # Complete feature list
├── 📄 .gitignore                         # Git ignore rules
├── 📄 docker-compose.yml                 # All services orchestration
├── 📄 start.ps1                          # Quick start script
├── 📄 CRM_API.postman_collection.json   # Postman collection
│
├── 🗂️ crm/                               # Spring Boot Backend
│   ├── 📄 build.gradle                   # Dependencies & build config
│   ├── 📄 Dockerfile                     # CRM container image
│   ├── 📄 gradlew, gradlew.bat          # Gradle wrapper
│   │
│   └── 🗂️ src/main/
│       ├── 🗂️ java/com/teknex/crm/
│       │   ├── 📄 CrmApplication.java    # Main Spring Boot app
│       │   │
│       │   ├── 🗂️ config/               # Configuration
│       │   │   ├── AppConfig.java        # ObjectMapper, beans
│       │   │   ├── SecurityConfig.java   # Spring Security
│       │   │   ├── JwtAuthenticationFilter.java
│       │   │   ├── CustomUserDetailsService.java
│       │   │   └── KafkaTopicConfig.java # Kafka topics
│       │   │
│       │   ├── 🗂️ model/                # Entities
│       │   │   ├── Customer.java         # MySQL entity
│       │   │   ├── Dealer.java           # MySQL entity
│       │   │   ├── SalesExecutive.java   # MySQL entity
│       │   │   ├── Deal.java             # MongoDB document
│       │   │   ├── Chat.java             # MongoDB document
│       │   │   └── DealDNA.java          # MongoDB document
│       │   │
│       │   ├── 🗂️ repository/           # Data access
│       │   │   ├── CustomerRepository.java
│       │   │   ├── DealerRepository.java
│       │   │   ├── SalesExecutiveRepository.java
│       │   │   ├── DealRepository.java
│       │   │   ├── ChatRepository.java
│       │   │   └── DealDNARepository.java
│       │   │
│       │   ├── 🗂️ service/              # Business logic
│       │   │   ├── AuthService.java      # Registration & login
│       │   │   ├── JwtService.java       # Token handling
│       │   │   ├── DealService.java      # Deal management
│       │   │   ├── ChatService.java      # Chat management
│       │   │   ├── KafkaProducerService.java
│       │   │   └── KafkaConsumerService.java
│       │   │
│       │   ├── 🗂️ controller/           # REST endpoints
│       │   │   ├── AuthController.java   # /api/auth/*
│       │   │   ├── DealController.java   # /api/deals/*
│       │   │   ├── ChatController.java   # /api/chats/*
│       │   │   ├── CustomerController.java
│       │   │   ├── DealerController.java
│       │   │   ├── SalesExecutiveController.java
│       │   │   └── DealDNAController.java
│       │   │
│       │   ├── 🗂️ dto/                  # Data Transfer Objects
│       │   │   ├── CustomerRegistrationRequest.java
│       │   │   ├── LoginRequest.java
│       │   │   ├── AuthResponse.java
│       │   │   ├── BotChatRequest.java
│       │   │   ├── ChatMessageRequest.java
│       │   │   ├── DealUpdateRequest.java
│       │   │   ├── SalesExecutiveMatchRequest.java
│       │   │   ├── SalesExecutiveMatchResponse.java
│       │   │   ├── HealthScoreRequest.java
│       │   │   └── HealthScoreResponse.java
│       │   │
│       │   └── 🗂️ exception/            # Error handling
│       │       ├── GlobalExceptionHandler.java
│       │       └── ErrorResponse.java
│       │
│       └── 🗂️ resources/
│           ├── 📄 application.properties # App configuration
│           └── 📄 data.sql              # Dummy data
│
├── 🗂️ predict-sales-executive/          # ML Service 1
│   ├── 📄 app.py                        # Flask app - SE matching
│   ├── 📄 requirements.txt              # Python dependencies
│   └── 📄 Dockerfile                    # Container image
│
└── 🗂️ dna/                              # ML Service 2
    ├── 📄 app.py                        # Flask app - Health score
    ├── 📄 requirements.txt              # Python dependencies
    └── 📄 Dockerfile                    # Container image
```

---

## 🎯 Key Files Explained

### Backend (Spring Boot)

**Configuration**
- `SecurityConfig.java` → JWT authentication, CORS, stateless sessions
- `KafkaTopicConfig.java` → Creates 4 Kafka topics
- `CustomUserDetailsService.java` → Loads users from DB for auth

**Models**
- `Customer`, `Dealer`, `SalesExecutive` → MySQL with JPA
- `Deal`, `Chat`, `DealDNA` → MongoDB documents

**Services**
- `AuthService` → Handles registration, login, password hashing
- `DealService` → Complete deal lifecycle, health score requests
- `ChatService` → Message management
- `KafkaProducerService` → Send events to ML services
- `KafkaConsumerService` → Receive ML responses

**Controllers**
- All REST endpoints with JWT authentication
- CORS enabled for frontend integration
- Input validation with Bean Validation

### ML Services (Flask)

**Sales Executive Predictor** (port 5001)
- Listens: `sales-executive-match-request`
- Publishes: `sales-executive-match-response`
- Logic: Matches customers with SEs based on expertise

**Deal DNA Analyzer** (port 5002)
- Listens: `health-score-request`
- Publishes: `health-score-response`
- Logic: Calculates health scores and thresholds

### Docker

**docker-compose.yml**
- Defines 7 services
- Health checks for MySQL, MongoDB, Kafka
- Dependency ordering
- Network isolation
- Volume persistence

---

## 📊 Data Flow

```
Customer → Register/Login → JWT Token
    ↓
Initiate Deal → Bot Chat → Gather Info
    ↓
Send to Kafka → sales-executive-match-request
    ↓
ML Service → Match Sales Executive
    ↓
Kafka Response → sales-executive-match-response
    ↓
Assign SE → Create Deal DNA → Start Chat
    ↓
Customer ←→ Sales Executive (Real-time chat)
    ↓
Update Deal → Request Health Score
    ↓
Send to Kafka → health-score-request
    ↓
ML Service → Calculate Score & Thresholds
    ↓
Kafka Response → health-score-response
    ↓
Update Deal → Auto-actions based on score
    ↓
Schedule Appointment / Offer Test Drive / Close Deal
```

---

## 🔐 Security Flow

```
User → POST /auth/register or /auth/login
    ↓
Backend → Validate credentials (BCrypt)
    ↓
JwtService → Generate token (HS256, 24h expiry)
    ↓
Return → { token, id, name, email, userType }
    ↓
Client → Store token
    ↓
All requests → Header: "Authorization: Bearer <token>"
    ↓
JwtAuthenticationFilter → Validate token
    ↓
Extract user → Load from CustomUserDetailsService
    ↓
Set SecurityContext → Proceed to controller
```

---

## 🗄️ Database Schema

### MySQL (Relational)

**customers**
- id, name, email, password (hashed), phone, address, created_at, updated_at

**dealers**
- id, name, email, phone, location, date_of_joining, deals_closed, deals_pursued, active_deals, total_revenue, created_at, updated_at

**sales_executives**
- id, name, email, password (hashed), phone, dealer_id (FK), date_of_joining, deals_closed, deals_pursued, active_deals, performance_score, available, expertise, created_at, updated_at

### MongoDB (Documents)

**deals**
```json
{
  "id": "UUID",
  "customerId": 1,
  "salesExecutiveId": 1,
  "dealerId": 1,
  "interestCategory": "SUV",
  "budgetRange": "15-20 lakhs",
  "intendedTimeframe": "1-2 months",
  "preferredContactMode": "phone",
  "status": "IN_PROGRESS",
  "healthScore": 75.5,
  "criticalThreshold": 30.0,
  "opportunityThreshold": 70.0,
  "notes": [],
  "createdAt": "2026-01-06T...",
  "updatedAt": "2026-01-06T..."
}
```

**chats**
```json
{
  "id": "UUID",
  "dealId": "deal-uuid",
  "customerId": 1,
  "salesExecutiveId": 1,
  "chatType": "SALES_EXECUTIVE",
  "messages": [
    {
      "senderId": "1",
      "senderName": "John Doe",
      "senderType": "CUSTOMER",
      "content": "Hello!",
      "timestamp": "2026-01-06T..."
    }
  ]
}
```

**deal_dna**
```json
{
  "id": "UUID",
  "dealId": "deal-uuid",
  "customerId": 1,
  "salesExecutiveId": 1,
  "dealerId": 1,
  "healthScore": 75.5,
  "criticalThreshold": 30.0,
  "opportunityThreshold": 70.0,
  "totalInteractions": 15,
  "customerResponses": 8,
  "salesExecutiveFollowUps": 7,
  "averageResponseTime": 12.5,
  "testDriveRequested": true,
  "appointmentScheduled": true
}
```

---

## 🚀 Deployment Architecture

```
                    [Docker Network: crm_network]
                                |
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   [MySQL:3306]           [MongoDB:27017]       [Zookeeper:2181]
        │                      │                      │
        │                      │                 [Kafka:9092]
        │                      │                      │
        └──────────┬───────────┴──────────┬───────────┘
                   │                      │
              [CRM Backend:8080] ←───────┤
                   │                      │
                   ├──→ [SE Predictor:5001]
                   └──→ [DNA Analyzer:5002]
```

**Volumes:**
- `mysql_data` → Persists MySQL database
- `mongo_data` → Persists MongoDB database

**Health Checks:**
- MySQL: `mysqladmin ping`
- MongoDB: `mongosh ping`
- Kafka: List topics

---

## 🎓 Technologies Used

### Backend
- ☕ **Java 21** (LTS)
- 🍃 **Spring Boot 3.5.9** (Latest)
- 🔐 **Spring Security** (JWT)
- 🗄️ **Spring Data JPA** (MySQL)
- 🗃️ **Spring Data MongoDB**
- 📨 **Spring Kafka**
- 🏷️ **Lombok** (Code generation)

### Databases
- 🐬 **MySQL 8.0** (Relational)
- 🍃 **MongoDB 7.0** (Document)

### Messaging
- 📡 **Apache Kafka** (Event streaming)
- 🐘 **Zookeeper** (Kafka coordination)

### ML Services
- 🐍 **Python 3.11**
- 🌶️ **Flask 3.0** (Web framework)
- 📨 **kafka-python** (Kafka client)

### DevOps
- 🐳 **Docker** (Containerization)
- 🎵 **Docker Compose** (Orchestration)

---

**Total Files Created: 40+**
**Lines of Code: 3000+**
**Services: 7**
**Databases: 2**
**API Endpoints: 20+**
