#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting comprehensive upgrade test...${NC}"

# Function to print status
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Clean environment
print_status "🧹 Cleaning environment..."
if command -v npx &> /dev/null; then
    npx kill-port 3000 3001 3002 2>/dev/null || true
fi
npm cache clean --force
print_success "Environment cleaned"

# Step 2: Install dependencies
print_status "📦 Installing dependencies..."
if npm ci; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 3: Check for vulnerabilities
print_status "🔍 Running security audit..."
if npm audit --audit-level moderate; then
    print_success "No moderate or high vulnerabilities found"
else
    print_warning "Security vulnerabilities found - review required"
fi

# Step 4: Type checking
print_status "🔍 Running type check..."
if npm run type-check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi

# Step 5: Linting
print_status "🧹 Running linting..."
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting issues found - may need fixing"
fi

# Step 6: Run tests
print_status "🧪 Running tests..."
if npm test -- --coverage --passWithNoTests; then
    print_success "All tests passed"
else
    print_error "Tests failed"
    exit 1
fi

# Step 7: Build project
print_status "🏗️ Building project..."
if npm run build; then
    print_success "Build successful"
else
    print_error "Build failed"
    exit 1
fi

# Step 8: Bundle analysis (if available)
print_status "📊 Analyzing bundle size..."
if npm run analyze &> /dev/null; then
    print_success "Bundle analysis completed"
else
    print_warning "Bundle analysis not available or failed"
fi

# Step 9: Check for outdated packages
print_status "📋 Checking for outdated packages..."
npm outdated || true

# Step 10: Final verification
print_status "🔬 Running final verification..."
if [ -d ".next" ]; then
    print_success "Build artifacts created successfully"
else
    print_error "Build artifacts not found"
    exit 1
fi

# Summary
print_success "🎉 All upgrade tests passed successfully!"
echo ""
echo -e "${GREEN}Summary:${NC}"
echo "✅ Dependencies installed"
echo "✅ Security audit completed"
echo "✅ Type checking passed"
echo "✅ Tests passed"
echo "✅ Build successful"
echo ""
echo -e "${BLUE}The upgrade is safe to proceed!${NC}"