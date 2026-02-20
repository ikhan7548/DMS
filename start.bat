@echo off
title Ducklings Daycare Management System
echo ================================================
echo   Ducklings Daycare Management System
echo ================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found:
node --version
echo.

:: Install dependencies if node_modules is missing
if not exist "node_modules" goto :install_deps
goto :after_install

:install_deps
echo Installing dependencies - first-time setup...
echo This may take a few minutes...
echo.
call npm run install:all
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)
echo.
echo Dependencies installed successfully.
echo.

:after_install

:: Copy .env.example to .env if .env doesn't exist
if not exist ".env" if exist ".env.example" (
    echo Creating .env from .env.example...
    copy .env.example .env >nul
    echo.
)

:: Create data directory if it doesn't exist
if not exist "data" mkdir data

:: Check if this is a fresh install (no DB yet) before migration creates it
set NEEDS_SEED=0
if not exist "data\daycare.db" set NEEDS_SEED=1

:: Run database migration
echo Running database migration...
call npm run db:migrate
echo.

:: Seed database only on first run (fresh install)
if "%NEEDS_SEED%"=="0" goto :after_seed

:seed_db
echo Seeding database with initial data...
call npm run db:seed
echo.

:after_seed

:: Build the client
echo Building client...
call npm run build:client
if %errorlevel% neq 0 (
    echo ERROR: Failed to build client.
    pause
    exit /b 1
)
echo.

:: Open browser
echo Starting server on http://localhost:3001 ...
echo.
start "" "http://localhost:3001"

:: Start the server (this will block until Ctrl+C)
echo Press Ctrl+C to stop the server.
echo ================================================
echo.
call npx tsx server/src/index.ts
