# AI Panel Quick Test Commands

## Quick Reference

### 🚀 Test 2: Open AI Panel
```
Ctrl+Shift+P → Karavan: Open AI Copilot
```

### 🎯 Test 4: Generate Route Command
```
Ctrl+Shift+P → Karavan: Generate Route with AI
Test prompt: "REST API that receives JSON and logs it"
```

### 📝 Test 5: Context Menu
1. Create file: `test-route.camel.yaml`
2. Right-click in editor
3. Look for: "Karavan: Generate Route with AI"

---

## Key Files to Inspect

### Extension Code:
- [src/views/ai-panel/activate.ts](src/views/ai-panel/activate.ts) - Command registration
- [src/views/ai-panel/webview.ts](src/views/ai-panel/webview.ts) - Webview setup
- [src/views/ai-panel/aiMachine.ts](src/views/ai-panel/aiMachine.ts) - State management

### Webview Code:
- [webview/ai-panel/components/](webview/ai-panel/components/) - UI components

### Configuration:
- [package.json](package.json) - Lines 587-601 (commands)
- [package.json](package.json) - Lines 650-660 (context menu)

---

## Expected Command IDs

1. `karavan.ai.openPanel` - Opens AI panel
2. `karavan.ai.generateRoute` - Generate route with input
3. `karavan.ai.suggestComponent` - Suggest component (bonus)

---

## What to Check in DevTools Console

### ✅ Good Signs:
- "Activating extension..."
- "AI Panel activated"
- Webpack HMR messages (if in dev mode)

### 🔴 Bad Signs:
- `Error:` followed by stack trace
- `Failed to load resource`
- `Uncaught (in promise)`
- `TypeError`, `ReferenceError`

---

## Quick Debugging Tips

### If panel doesn't open:
1. Check Console for errors
2. Verify command registered: `vscode.commands.getCommands()` in DevTools
3. Check if webview HTML loads

### If commands don't appear:
1. Reload window: `Ctrl+R` in Extension Host
2. Check `package.json` commands section
3. Verify extension activated

### If context menu missing:
1. Check file extension is `.yaml`
2. Right-click in **editor**, not explorer
3. Check `package.json` menus → editor/context

---

## Test Files

Create these for testing:

```yaml
# test-route.camel.yaml
- route:
    from:
      uri: "timer:tick"
```

```yaml
# simple.yaml
hello: world
```
