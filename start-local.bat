
@echo off
echo ===================================================
echo License Manager - Local Docker Setup
echo ===================================================

echo Checking Docker installation...
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker is not installed or not running.
    echo Please install Docker Desktop and try again.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker Compose is not available.
    echo Please ensure Docker Desktop includes Docker Compose.
    pause
    exit /b 1
)

echo Stopping any existing containers...
docker-compose down

echo Building and starting License Manager...
docker-compose up --build -d

echo Waiting for services to start...
timeout /t 10 /nobreak > nul

echo ===================================================
echo License Manager is now running locally!
echo ===================================================
echo.
echo Web Interface: http://localhost
echo API Endpoints: http://localhost:3001/api
echo Database: PostgreSQL on localhost:5432
echo.
echo Default admin login:
echo Email: admin@example.com
echo Password: admin123
echo.
echo To stop the application, run:
echo docker-compose down
echo.
echo To view logs, run:
echo docker-compose logs -f
echo ===================================================

pause
