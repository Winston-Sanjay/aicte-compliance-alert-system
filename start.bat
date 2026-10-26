@echo off
title AICTE Approval Workflow System (SIH26262)

echo =======================================================================
echo          AICTE Approval Workflow Automation System
echo      Compliance Monitoring and Alert Management System
echo             Smart India Hackathon 2026 - SIH26262
echo =======================================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: 1. Free ports 5000 and 3000 if previously occupied
echo [NETWORK] Checking ports 5000 and 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>nul

:: 2. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH!
    echo Please install Node.js v18 or newer from https://nodejs.org
    pause
    exit /b 1
)

:: 3. Check and Install Backend Dependencies
if not exist "%ROOT_DIR%backend\node_modules" (
    echo [SETUP] Installing backend dependencies...
    cd /d "%ROOT_DIR%backend"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Backend npm install failed!
        pause
        exit /b 1
    )
    cd /d "%ROOT_DIR%"
)

:: 4. Check and Install Frontend Dependencies
if not exist "%ROOT_DIR%frontend\node_modules" (
    echo [SETUP] Installing frontend dependencies...
    cd /d "%ROOT_DIR%frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend npm install failed!
        pause
        exit /b 1
    )
    cd /d "%ROOT_DIR%"
)

:: 5. Create uploads directory if needed
if not exist "%ROOT_DIR%backend\uploads" (
    mkdir "%ROOT_DIR%backend\uploads" 2>nul
)

:: 6. Database Setup and Verification
cd /d "%ROOT_DIR%backend"

:: Check if PostgreSQL is available on port 5432
netstat -aon | findstr ":5432" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 goto TRY_POSTGRES
goto CONFIGURE_SQLITE

:TRY_POSTGRES
echo [DATABASE] Local PostgreSQL server detected on port 5432.
if not exist "%ROOT_DIR%backend\.env" (
    echo [DATABASE] Creating backend .env for PostgreSQL...
    (
        echo DATABASE_URL="postgresql://postgres:1234@localhost:5432/aicte_db?schema=public"
        echo PGUSER=postgres
        echo PGHOST=localhost
        echo PGPASSWORD=1234
        echo PGDATABASE=aicte_db
        echo PGPORT=5432
        echo FRONTEND_PORT=3000
        echo BACKEND_PORT=5000
        echo PORT=5000
        echo TOKEN_KEY=aicte_sih_hackathon_2026_secret_key_very_secure
        echo JWT_SECRET=aicte_sih_hackathon_2026_secret_key_very_secure
        echo NODE_ENV=development
        echo UPLOAD_DIR=./uploads
        echo OCR_SERVICE_URL=http://localhost:8000
    ) > "%ROOT_DIR%backend\.env"
)
copy /y "%ROOT_DIR%backend\prisma\schema.postgresql.prisma" "%ROOT_DIR%backend\prisma\schema.prisma" >nul 2>nul
echo [DATABASE] Generating Prisma Client...
call npx prisma generate >nul 2>nul

call npx tsx src/check-db.ts >nul 2>nul
if %errorlevel% equ 0 (
    echo [DATABASE] PostgreSQL database verified and ready.
    goto DB_SETUP_DONE
)

echo [DATABASE] Initializing PostgreSQL schema...
call npx prisma db push >nul 2>nul
if %errorlevel% neq 0 (
    echo [DATABASE] PostgreSQL connection failed or unauthenticated.
    goto CONFIGURE_SQLITE
)
echo [DATABASE] Seeding PostgreSQL demo data...
call npm run db:seed >nul 2>nul
goto DB_SETUP_DONE

:CONFIGURE_SQLITE
echo [DATABASE] Activating Zero-Config Portable SQLite database...
(
    echo DATABASE_URL="file:./prisma/aicte.db"
    echo FRONTEND_PORT=3000
    echo BACKEND_PORT=5000
    echo PORT=5000
    echo TOKEN_KEY=aicte_sih_hackathon_2026_secret_key_very_secure
    echo JWT_SECRET=aicte_sih_hackathon_2026_secret_key_very_secure
    echo NODE_ENV=development
    echo UPLOAD_DIR=./uploads
    echo OCR_SERVICE_URL=http://localhost:8000
) > "%ROOT_DIR%backend\.env"
copy /y "%ROOT_DIR%backend\prisma\schema.sqlite.prisma" "%ROOT_DIR%backend\prisma\schema.prisma" >nul 2>nul
echo [DATABASE] Generating Prisma Client for SQLite...
call npx prisma generate >nul 2>nul

call npx tsx src/check-db.ts >nul 2>nul
if %errorlevel% equ 0 (
    echo [DATABASE] SQLite database verified and ready.
    goto DB_SETUP_DONE
)

echo [DATABASE] Initializing SQLite schema and demo data...
call npx prisma db push >nul 2>nul
call npm run db:seed >nul 2>nul

:DB_SETUP_DONE
cd /d "%ROOT_DIR%"

echo.
echo =======================================================================
echo  All dependencies verified. Starting AICTE Services...
echo =======================================================================
echo  Portal URL:       http://localhost:3000
echo  Backend API:      http://localhost:5000/api
echo.
echo  Demo Credentials (Pre-loaded):
echo  1. Institution User:  institution@demo.aicte  -  password: demo123
echo  2. Review Officer:    officer@demo.aicte      -  password: demo123
echo.
echo  [Press Ctrl+C to stop the application]
echo =======================================================================
echo.

:: Automatically open browser after 3 seconds in background
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Start both backend and frontend together with guaranteed working directories
call npx -y concurrently --kill-others -n "BACKEND,FRONTEND" -c "blue.bold,cyan.bold" "npm --prefix backend run dev" "npm --prefix frontend run dev"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application process exited with error code %errorlevel%.
    pause
)
