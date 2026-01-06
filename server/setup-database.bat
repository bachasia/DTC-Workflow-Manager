@echo off
REM DTC Workflow Manager - Database Setup Script for Windows
REM This script creates a new database in your existing PostgreSQL instance

echo ========================================
echo DTC Workflow Manager - Database Setup
echo ========================================
echo.

REM Database configuration
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_PASSWORD=postgres123
set NEW_DB_NAME=dtc_workflow
set NEW_DB_USER=dtc_user
set NEW_DB_PASSWORD=dtc_password

echo Checking PostgreSQL connection...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "SELECT version();" >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Cannot connect to PostgreSQL. Please check:
    echo   - PostgreSQL is running: docker ps
    echo   - Credentials are correct
    pause
    exit /b 1
)

echo [OK] PostgreSQL connection successful
echo.

REM Create new database
echo Creating database '%NEW_DB_NAME%'...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %NEW_DB_NAME%;" >nul 2>&1

if errorlevel 1 (
    echo [WARN] Database '%NEW_DB_NAME%' already exists
) else (
    echo [OK] Database '%NEW_DB_NAME%' created
)

REM Create new user
echo Creating user '%NEW_DB_USER%'...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE USER %NEW_DB_USER% WITH PASSWORD '%NEW_DB_PASSWORD%';" >nul 2>&1

if errorlevel 1 (
    echo [WARN] User '%NEW_DB_USER%' already exists
) else (
    echo [OK] User '%NEW_DB_USER%' created
)

REM Grant privileges
echo Granting privileges...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE %NEW_DB_NAME% TO %NEW_DB_USER%;"
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %NEW_DB_NAME% -c "GRANT ALL ON SCHEMA public TO %NEW_DB_USER%;"

echo [OK] Privileges granted
echo.

REM Create .env file
echo Creating .env file...
(
echo # Database
echo DATABASE_URL="postgresql://%NEW_DB_USER%:%NEW_DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%NEW_DB_NAME%?schema=public"
echo.
echo # JWT Authentication
echo JWT_SECRET="change-this-to-a-secure-random-string-minimum-32-chars"
echo JWT_EXPIRES_IN="7d"
echo JWT_REFRESH_SECRET="change-this-refresh-secret-to-secure-string"
echo JWT_REFRESH_EXPIRES_IN="30d"
echo.
echo # Server
echo PORT=3001
echo NODE_ENV="development"
echo CORS_ORIGIN="http://localhost:5173"
echo.
echo # Lark (Feishu^) Integration
echo LARK_APP_ID="your-lark-app-id"
echo LARK_APP_SECRET="your-lark-app-secret"
echo LARK_VERIFICATION_TOKEN="your-webhook-verification-token"
echo LARK_ENCRYPT_KEY="your-encrypt-key"
echo.
echo # Lark Base Configuration
echo LARK_BASE_ID="your-lark-base-id"
echo LARK_REPORT_TABLE_ID="your-report-table-id"
echo.
echo # Lark Bot Configuration
echo LARK_BOT_NAME="DTC Workflow Bot"
echo.
echo # Gemini AI (for analytics^)
echo GEMINI_API_KEY="your-gemini-api-key"
echo.
echo # File Upload
echo MAX_FILE_SIZE=10485760
echo UPLOAD_DIR="./uploads"
echo.
echo # WebSocket
echo WS_PORT=3002
echo.
echo # Logging
echo LOG_LEVEL="info"
) > .env

echo [OK] .env file created
echo.

REM Verify database exists
echo Verifying setup...
set PGPASSWORD=%NEW_DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %NEW_DB_USER% -d %NEW_DB_NAME% -c "\l" >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Database verification failed
    pause
    exit /b 1
)

echo [OK] Database verification successful
echo.
echo ========================================
echo Database setup complete!
echo ========================================
echo.
echo Summary:
echo   Database: %NEW_DB_NAME%
echo   User: %NEW_DB_USER%
echo   Host: %DB_HOST%:%DB_PORT%
echo.
echo Next steps:
echo   1. Review and update .env file (Lark and Gemini API keys)
echo   2. Run: npm install
echo   3. Run: npm run prisma:generate
echo   4. Run: npm run prisma:migrate
echo   5. Run: npm run prisma:seed
echo   6. Run: npm run dev
echo.
pause
