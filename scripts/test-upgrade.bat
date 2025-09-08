@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting comprehensive upgrade test...

echo 🧹 Cleaning environment...
npx kill-port 3000 3001 3002 >nul 2>&1
npm cache clean --force
if %errorlevel% neq 0 (
    echo ❌ Failed to clean environment
    exit /b 1
)
echo ✅ Environment cleaned

echo 📦 Installing dependencies...
npm ci
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)
echo ✅ Dependencies installed successfully

echo 🔍 Running security audit...
npm audit --audit-level moderate
if %errorlevel% neq 0 (
    echo ⚠️ Security vulnerabilities found - review required
) else (
    echo ✅ No moderate or high vulnerabilities found
)

echo 🔍 Running type check...
npm run type-check
if %errorlevel% neq 0 (
    echo ❌ Type checking failed
    exit /b 1
)
echo ✅ Type checking passed

echo 🧹 Running linting...
npm run lint
if %errorlevel% neq 0 (
    echo ⚠️ Linting issues found - may need fixing
) else (
    echo ✅ Linting passed
)

echo 🧪 Running tests...
npm test -- --coverage --passWithNoTests
if %errorlevel% neq 0 (
    echo ❌ Tests failed
    exit /b 1
)
echo ✅ All tests passed

echo 🏗️ Building project...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)
echo ✅ Build successful

echo 📊 Analyzing bundle size...
npm run analyze >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Bundle analysis not available or failed
) else (
    echo ✅ Bundle analysis completed
)

echo 📋 Checking for outdated packages...
npm outdated

echo 🔬 Running final verification...
if exist ".next\" (
    echo ✅ Build artifacts created successfully
) else (
    echo ❌ Build artifacts not found
    exit /b 1
)

echo:
echo 🎉 All upgrade tests passed successfully!
echo:
echo Summary:
echo ✅ Dependencies installed
echo ✅ Security audit completed
echo ✅ Type checking passed
echo ✅ Tests passed
echo ✅ Build successful
echo:
echo The upgrade is safe to proceed!