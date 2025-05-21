
@echo off
echo ===================================================
echo Building License Manager Frontend
echo ===================================================

REM Navigate to the project root (one level up from server)
cd ..

echo Current directory: %cd%

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in the PATH.
    echo Please install Node.js and try again.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed or not in the PATH.
    echo Please install npm and try again.
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

if %ERRORLEVEL% neq 0 (
    echo Error: Failed to install dependencies.
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo Building frontend application...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo Error: Build process failed.
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo Build completed successfully!
echo.
echo The frontend has been built and is ready to be served.
echo You can now run the server or install it as a service.
echo ===================================================
echo.

pause
