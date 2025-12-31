# Karavan AI Panel - Visual Testing Guide

## What You Should See

### Test 2: AI Panel Opens

**Expected UI:**
```
┌─────────────────────────────────────────────┐
│ Karavan AI Copilot                    [×]   │ ← Panel title
├─────────────────────────────────────────────┤
│                                             │
│  Welcome to Karavan AI Copilot              │
│  Choose your authentication method:         │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ GitHub Copilot                     │    │ ← Clickable option
│  │ Use your GitHub Copilot subscription│   │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ OpenAI API Key                     │    │
│  │ [____________________________]     │    │ ← Input field
│  │        [Connect]                   │    │ ← Button
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ Local LLM                          │    │ ← Clickable option
│  │ Connect to a local LLM (Ollama...) │    │
│  └────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

**Location:** Right side of VS Code window (Column.Beside)

---

### Test 4: Generate Route Command

**Input Dialog:**
```
┌─────────────────────────────────────────────┐
│  Describe the integration route you want    │
│  to create                                   │
│                                             │
│  [e.g., REST API that consumes JSON and...] │ ← Placeholder
│  [_____________________________________]     │ ← Your input
│                                             │
│           [Cancel]  [OK]                    │
└─────────────────────────────────────────────┘
```

**After entering prompt:**
- AI Panel should open (if not already open)
- Your prompt should be visible somewhere in the panel

---

### Test 6: After Authentication

**Chat Interface:**
```
┌─────────────────────────────────────────────┐
│ Karavan AI Copilot                    [×]   │
├─────────────────────────────────────────────┤
│  Karavan AI Copilot                         │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ Messages Area                        │  │
│  │                                      │  │
│  │ Start a conversation about your      │  │
│  │ Camel integration...                 │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [Describe the integration you want to...] │ ← Chat input
│  [Send]                                     │
│                                             │
│  [Logout]                                   │
└─────────────────────────────────────────────┘
```

---

## State Transitions

```
┌─────────────┐
│ Initialize  │ ← Loading screen (brief)
└──────┬──────┘
       │
       v
┌─────────────────┐
│ Unauthenticated │ ← Login panel with 3 options
└────────┬────────┘
         │
         │ (user clicks auth option)
         │
         v
┌──────────────┐
│ Authenticated│ ← Chat interface
└──────────────┘
```

---

## Commands in Package.json

### karavan.ai.openPanel
- **Title:** "Karavan: Open AI Copilot"
- **Icon:** `$(sparkle)`
- **Action:** Opens AI panel on the right side

### karavan.ai.generateRoute
- **Title:** "Karavan: Generate Route with AI"
- **Icon:** `$(sparkle)`
- **Action:** Shows input box → Opens AI panel with prompt
- **Context Menu:** Appears in `.yaml` files (editor/context)

### karavan.ai.suggestComponent
- **Title:** "Karavan: Suggest Component"
- **Action:** (Bonus feature)

---

## Messages Between Extension & Webview

### From Extension to Webview:
```javascript
{
    command: 'stateUpdate',
    state: 'Unauthenticated' | 'Authenticated',
    messages: [...],
    defaultPrompt: "..." // if triggered by generateRoute
}
```

### From Webview to Extension:
```javascript
// Authentication
{ command: 'githubCopilotAuth' }
{ command: 'apiKeyAuth', apiKey: 'sk-...' }
{ command: 'localLLMAuth' }

// Chat
{ command: 'sendMessage', message: '...' }
{ command: 'logout' }
{ command: 'getState' }
```

---

## CSS Variables Used

The UI uses VS Code's theme variables:
- `--vscode-foreground` - Main text color
- `--vscode-button-background` - Button colors
- `--vscode-input-background` - Input fields
- `--vscode-panel-border` - Borders
- `--vscode-list-hoverBackground` - Hover effects

This ensures the panel matches your VS Code theme!

---

## Testing Tips

### To see state changes:
1. Open Developer Tools
2. Go to Console
3. Look for: `AI Panel received message: ...`

### To test all auth options:
1. Click "GitHub Copilot" → Should trigger auth flow
2. Enter API key → Click "Connect" → Should show chat
3. Click "Local LLM" → Should trigger local LLM setup

### To test chat after auth:
1. Type a message in the input
2. Press Enter or click "Send"
3. Message should appear in messages area
4. (AI response will depend on backend implementation)

---

## File Structure Reference

```
src/views/ai-panel/
  ├── activate.ts       ← Command registration
  ├── aiMachine.ts      ← State machine (XState)
  ├── auth.ts           ← Authentication logic
  ├── webview.ts        ← Webview HTML generation
  └── index.ts          ← Exports

webview/ai-panel/
  └── components/       ← (Currently empty - future React components)
```
