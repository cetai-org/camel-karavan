#!/bin/bash

# Karavan AI Panel - Pre-Test Validation Script
# Run this before starting manual tests

echo "================================================"
echo "Karavan AI Panel - Pre-Test Validation"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

echo "📋 Checking Prerequisites..."
echo ""

# 1. Check if package.json exists
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} package.json not found"
    ((FAIL++))
fi

# 2. Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} node_modules not found - Run: npm install"
    ((FAIL++))
fi

# 3. Check if out/extension.js exists (compiled)
if [ -f "out/extension.js" ]; then
    echo -e "${GREEN}✓${NC} Extension compiled (out/extension.js)"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Extension not compiled - Watch task running?"
    ((WARN++))
fi

# 4. Check if webview files compiled
if [ -f "dist/webview.js" ]; then
    echo -e "${GREEN}✓${NC} Webview compiled (dist/webview.js)"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Webview not compiled - Watch task running?"
    ((WARN++))
fi

echo ""
echo "📦 Checking Package Configuration..."
echo ""

# 5. Check if AI commands are registered
if grep -q "karavan.ai.openPanel" package.json; then
    echo -e "${GREEN}✓${NC} Command 'karavan.ai.openPanel' registered"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Command 'karavan.ai.openPanel' NOT found"
    ((FAIL++))
fi

if grep -q "karavan.ai.generateRoute" package.json; then
    echo -e "${GREEN}✓${NC} Command 'karavan.ai.generateRoute' registered"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Command 'karavan.ai.generateRoute' NOT found"
    ((FAIL++))
fi

# 6. Check if context menu configured
if grep -q "editor/context" package.json; then
    echo -e "${GREEN}✓${NC} Context menu configured"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Context menu may not be configured"
    ((WARN++))
fi

echo ""
echo "📁 Checking Source Files..."
echo ""

# 7. Check AI panel source files
if [ -f "src/views/ai-panel/activate.ts" ]; then
    echo -e "${GREEN}✓${NC} activate.ts found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} activate.ts NOT found"
    ((FAIL++))
fi

if [ -f "src/views/ai-panel/webview.ts" ]; then
    echo -e "${GREEN}✓${NC} webview.ts found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} webview.ts NOT found"
    ((FAIL++))
fi

if [ -f "src/views/ai-panel/aiMachine.ts" ]; then
    echo -e "${GREEN}✓${NC} aiMachine.ts found"
    ((PASS++))
else
    echo -e "${RED}✗${NC} aiMachine.ts NOT found"
    ((FAIL++))
fi

echo ""
echo "🔧 Checking Launch Configuration..."
echo ""

# 8. Check launch.json
if [ -f ".vscode/launch.json" ]; then
    echo -e "${GREEN}✓${NC} .vscode/launch.json found"
    ((PASS++))
    
    if grep -q "Extension" .vscode/launch.json; then
        echo -e "${GREEN}✓${NC} Extension debug config found"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠${NC} Extension debug config may be missing"
        ((WARN++))
    fi
else
    echo -e "${YELLOW}⚠${NC} .vscode/launch.json not found"
    ((WARN++))
fi

echo ""
echo "================================================"
echo "Summary:"
echo "================================================"
echo -e "${GREEN}✓ Passed:${NC} $PASS"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARN"
echo -e "${RED}✗ Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical checks passed! Ready to test.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Make sure watch task is running: npm run watch"
    echo "  2. Press F5 to launch Extension Development Host"
    echo "  3. Follow AI_PANEL_SMOKE_TEST.md"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Please fix issues before testing.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Run: npm install"
    echo "  - Run: npm run watch"
    echo "  - Check package.json for command registration"
    echo ""
    exit 1
fi
