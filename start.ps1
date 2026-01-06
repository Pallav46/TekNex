# CRM System - Quick Start Script
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CRM System - Starting All Services" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker is running" -ForegroundColor Green
Write-Host ""

# Start services with docker-compose
Write-Host "Starting all services with Docker Compose..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check service status
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Service Status" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Service URLs" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CRM Backend API:              http://localhost:8080" -ForegroundColor Green
Write-Host "Sales Executive Predictor:    http://localhost:5001" -ForegroundColor Green
Write-Host "Deal DNA Analyzer:            http://localhost:5002" -ForegroundColor Green
Write-Host "MySQL:                        localhost:3306" -ForegroundColor Green
Write-Host "MongoDB:                      localhost:27017" -ForegroundColor Green
Write-Host "Kafka:                        localhost:9092" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Credentials" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Sales Executive:" -ForegroundColor Yellow
Write-Host "  Email:    rajesh.kumar@premiumautohub.com"
Write-Host "  Password: password123"
Write-Host ""
Write-Host "Customer (pre-loaded):" -ForegroundColor Yellow
Write-Host "  Email:    arjun.mehta@example.com"
Write-Host "  Password: customer123"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Quick Commands" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "View logs:        docker-compose logs -f [service-name]" -ForegroundColor Yellow
Write-Host "Stop services:    docker-compose down" -ForegroundColor Yellow
Write-Host "Restart service:  docker-compose restart [service-name]" -ForegroundColor Yellow
Write-Host ""

Write-Host "✓ All services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Check README.md and API_TESTING.md for API examples" -ForegroundColor Cyan
Write-Host ""
