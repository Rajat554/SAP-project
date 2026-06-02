@echo off
REM ─────────────────────────────────────────────────────────────
REM  WashWizard Hybrid Development Setup
REM  Connects your local laptop to the Cloud HANA database and
REM  XSUAA security layer for instant testing.
REM ─────────────────────────────────────────────────────────────
REM
REM  Prerequisites:
REM    1. You must be logged in to CF: cf login -a https://api.cf.ap21.hana.ondemand.com
REM    2. Your HANA Cloud instance must be running
REM
REM  Usage:
REM    Step 1: Run this script ONCE to bind your local project to cloud services
REM    Step 2: Run "npx cds watch --profile hybrid" to start the hybrid server
REM ─────────────────────────────────────────────────────────────

echo.
echo === WashWizard Hybrid Development Setup ===
echo.

echo [1/3] Binding to HANA HDI Container...
call cds bind -2 sap-project-hdi-container

echo.
echo [2/3] Binding to XSUAA...
call cds bind -2 sap-project-xsuaa

echo.
echo [3/3] Setup complete!
echo.
echo ─────────────────────────────────────────────────
echo  To start the hybrid server, run:
echo    npx cds watch --profile hybrid
echo.
echo  This will connect your local Node.js server to
echo  the live Cloud HANA database and XSUAA instance.
echo ─────────────────────────────────────────────────
echo.
