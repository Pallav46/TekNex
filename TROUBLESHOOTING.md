# Troubleshooting Guide

## Common Issues and Solutions

### 1. Docker Compose Fails to Start

**Issue**: Services fail to start or timeout
```
ERROR: Service 'crm-backend' failed to build
```

**Solutions**:
- Ensure Docker Desktop is running
- Check Docker has enough resources (4GB+ RAM)
- Clean Docker cache: `docker system prune -a`
- Restart Docker Desktop

---

### 2. MySQL Connection Errors

**Issue**: 
```
Could not open JDBC Connection
Communications link failure
```

**Solutions**:
- Wait 30-60 seconds for MySQL to fully initialize
- Check MySQL container logs: `docker-compose logs mysql`
- Verify MySQL is healthy: `docker-compose ps`
- Try restarting MySQL: `docker-compose restart mysql`

---

### 3. MongoDB Connection Issues

**Issue**:
```
Failed to connect to MongoDB
```

**Solutions**:
- Check MongoDB logs: `docker-compose logs mongodb`
- Ensure port 27017 is not in use: `netstat -ano | findstr :27017`
- Restart MongoDB: `docker-compose restart mongodb`

---

### 4. Kafka Not Ready

**Issue**:
```
Error connecting to node kafka:9092
```

**Solutions**:
- Kafka needs 30-60 seconds to start
- Check Zookeeper is running: `docker-compose ps zookeeper`
- Restart Kafka: `docker-compose restart kafka zookeeper`
- Check logs: `docker-compose logs kafka`

---

### 5. data.sql Not Loading

**Issue**: Pre-loaded customers/dealers not present

**Solutions**:
- Check application logs: `docker-compose logs crm-backend`
- Verify `spring.jpa.defer-datasource-initialization=true` is set
- Manually run data.sql:
  ```bash
  docker exec -it crm_mysql mysql -uroot -proot123 crm_db < crm/src/main/resources/data.sql
  ```

---

### 6. JWT Token Invalid

**Issue**:
```
401 Unauthorized
Invalid JWT token
```

**Solutions**:
- Ensure you copied the full token
- Token expires after 24 hours - login again
- Include "Bearer " prefix: `Authorization: Bearer <token>`
- Check token in Postman variables

---

### 7. Kafka Topics Not Created

**Issue**: Messages not flowing between services

**Solutions**:
- List topics: 
  ```bash
  docker exec -it crm_kafka kafka-topics --list --bootstrap-server localhost:9092
  ```
- Manually create topics:
  ```bash
  docker exec -it crm_kafka kafka-topics --create --topic sales-executive-match-request --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
  ```

---

### 8. Flask Services Not Responding

**Issue**: ML services return 502 or timeout

**Solutions**:
- Check service logs:
  ```bash
  docker-compose logs sales-executive-predictor
  docker-compose logs deal-dna-analyzer
  ```
- Verify ports 5001 and 5002 are not in use
- Restart services: `docker-compose restart sales-executive-predictor`

---

### 9. Port Already in Use

**Issue**:
```
Bind for 0.0.0.0:8080 failed: port is already allocated
```

**Solutions**:
- Check what's using the port:
  ```powershell
  netstat -ano | findstr :8080
  ```
- Kill the process or change port in docker-compose.yml
- Common conflicting ports: 8080, 3306, 27017, 9092

---

### 10. Gradle Build Fails

**Issue**: CRM backend fails to build in Docker

**Solutions**:
- Ensure Java 21 is available in container
- Check Dockerfile uses correct base image
- Try building locally first:
  ```bash
  cd crm
  ./gradlew clean build
  ```
- Check for compilation errors in logs

---

## Testing Connection to Services

### Test MySQL
```bash
docker exec -it crm_mysql mysql -uroot -proot123 -e "SHOW DATABASES;"
```

### Test MongoDB
```bash
docker exec -it crm_mongodb mongosh --eval "show dbs"
```

### Test Kafka
```bash
docker exec -it crm_kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Test CRM Backend
```bash
curl http://localhost:8080/actuator/health
# If actuator not enabled, try:
curl http://localhost:8080/api/dealers
```

### Test Flask Services
```bash
curl http://localhost:5001/health
curl http://localhost:5002/health
```

---

## Clean Start

If all else fails, do a complete clean restart:

```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Clean Docker system
docker system prune -a

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
```

---

## Checking Logs

### View All Logs
```bash
docker-compose logs -f
```

### View Specific Service
```bash
docker-compose logs -f crm-backend
docker-compose logs -f mysql
docker-compose logs -f kafka
```

### View Last 100 Lines
```bash
docker-compose logs --tail=100 crm-backend
```

---

## Database Connection Strings

### For local development (without Docker):

**MySQL:**
```
jdbc:mysql://localhost:3306/crm_db
username: root
password: root123
```

**MongoDB:**
```
mongodb://localhost:27017/crm_mongodb
```

**Kafka:**
```
localhost:9092
```

---

## Manual Testing Without Docker

### 1. Start MySQL locally
```bash
# Install MySQL 8.0
# Create database: CREATE DATABASE crm_db;
```

### 2. Start MongoDB locally
```bash
# Install MongoDB 7.0
# Start: mongod
```

### 3. Start Kafka locally
```bash
# Install Kafka
bin/zookeeper-server-start.sh config/zookeeper.properties
bin/kafka-server-start.sh config/server.properties
```

### 4. Run Spring Boot
```bash
cd crm
./gradlew bootRun
```

### 5. Run Flask Services
```bash
cd predict-sales-executive
python app.py

cd dna
python app.py
```

---

## Getting Help

1. Check logs first: `docker-compose logs -f`
2. Verify all services are up: `docker-compose ps`
3. Test individual services with curl
4. Check README.md and API_TESTING.md
5. Review IMPLEMENTATION_SUMMARY.md

---

## Health Check Commands

```bash
# Check Docker
docker --version
docker-compose --version

# Check running containers
docker ps

# Check container resource usage
docker stats

# Check networks
docker network ls

# Check volumes
docker volume ls
```
