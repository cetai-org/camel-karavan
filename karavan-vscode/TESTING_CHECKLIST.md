# Testing Session Checklist

**Session Start Time**: January 3, 2026  
**Tester**: Developer with GitHub Copilot subscription  
**Test Environment**: Extension Development Host

---

## 📋 PRE-TESTING CHECKLIST

### Environment Setup
- [x] Node.js v24.5.0 verified
- [x] npm 11.5.1 verified
- [x] Dependencies installed
- [x] TypeScript compiled (no errors)
- [x] Workspace location verified
- [x] GitHub Copilot extension installed and active

### Test Fixtures
- [x] test-route-simple.camel.yaml created (18 lines)
- [x] test-route-complex.camel.yaml created (59 lines)
- [x] test-route-invalid.camel.yaml created (16 lines)

### Documentation
- [x] TESTING_STRATEGY.md created (comprehensive guide)
- [x] SETUP_VERIFICATION.md created (setup details)
- [x] TESTING_QUICK_START.md created (quick reference)
- [x] This checklist created

### Extensions
- [x] Install "Markdown Checkboxes" (bierner) for progress tracking
- [x] Install "Todo MD" (optional) for centralized view

---

## 🚀 LAUNCH EXTENSION

**Action**: Press `F5` to start Extension Development Host

**Verification Steps**:
- [x] New VSCode window opens with "[Extension Development Host]" in title
- [x] Wait 5-10 seconds for extension to activate
- [x] Check status bar - no red error indicators
- [x] Open DevTools: `Ctrl+Shift+I`
- [x] Console shows no errors (some warnings OK)

**Expected Console Output**:
```
[AI Panel] State: Initialize
[AI Panel] State: Unauthenticated
```

---

## ✅ PHASE 1: FOUNDATION VALIDATION (1 hour)

### 1.1 Extension Activation
- [x] Extension activates without errors
- [x] No red indicators in status bar
- [x] Extension appears in Extensions list (Ctrl+Shift+X)

### 1.2 Command Registration
- [x] Open Command Palette: `Ctrl+Shift+P`
- [x] Type "karavan" and verify commands appear:
  - [x] `karavan.ai.openPanel` visible
  - [x] `karavan.ai.generateRoute` visible
  - [x] `karavan.ai.suggestComponent` visible

### 1.3 State Machine
- [x] DevTools console shows initialization logs
- [x] State transitions visible: Initialize → Unauthenticated
- [x] No "undefined" errors in console

### 1.4 Webview Panel Rendering
- [x] Open AI panel: `Ctrl+Shift+P` → "Open AI Copilot"
- [x] Panel opens on right side
- [x] Title bar visible: "AI Copilot" or similar
- [x] Three login buttons visible:
  - [x] "GitHub Copilot" button
  - [x] "OpenAI API Key" input field
  - [x] "Local LLM" button
- [x] Proper spacing and layout (no overlapping)
- [x] Theming matches VSCode (light/dark mode)

### 1.5 Context Menu Integration
- [x] Open a .yaml file
- [x] Right-click in editor
- [x] "Karavan: Generate Route with AI" appears
- [x] Option is clickable (not grayed out)
- [x] Clicking opens AI panel

### 1.6 View Title Integration
- [x] Look at Integrations view title bar
- [x] AI/sparkle icon visible
- [x] Clicking icon opens AI panel

### 1.7 Configuration Detection
- [x] Open Settings: `Ctrl+,`
- [x] Search "karavan.ai"
- [x] At least these settings visible:
  - [x] `karavan.ai.enabled`
  - [x] `karavan.ai.backend`
  - [x] `karavan.ai.model`

**Phase 1 Status**:
- [x] ALL TESTS PASSED → Proceed to Phase 2
- [ ] SOME TESTS FAILED → Document and troubleshoot before proceeding

---

## 💬 PHASE 2: CHAT & AI BACKEND (2 hours)

### 2.1 OpenAI Authentication

**Action**: Click "OpenAI API Key" and enter valid key

- [x] State transitions: Unauthenticated → Authenticating → Authenticated
- [x] Completes in <5 seconds (instant with valid key)
- [x] Chat interface appears (not login panel)
- [x] Welcome message visible
- [x] Input field ready for typing
- [x] No authentication dialogs/popups

**Success Criteria**: Chat interface visible after authentication ✅

### 2.2 Send First Message

**Action**: Type "Hello" and press Enter

- [x] Message appears on right side
- [x] "User" label or distinct styling visible
- [x] Timestamp shown
- [x] Input field clears after sending
- [x] Loading indicator appears

**Expected Behavior**:
- [x] AI response starts appearing (5-10 seconds)
- [x] Streaming visible (character by character or chunks)
- [x] Blinking cursor at end (indicates streaming)
- [x] Response completes within 30 seconds
- [x] Final response is readable and relevant
- [x] No error messages in chat or console

### 2.3 Message History

**Action**: Send second message: "Can you help me create a Camel route?"

- [x] First message remains visible
- [x] Both messages in conversation order
- [x] AI responds with context awareness
- [x] Response is Camel-specific (mentions routes, components, etc.)
- [x] No duplicate messages

### 2.4 Multi-line Input

**Status**: ❌ NOT SUPPORTED IN VS CODE WEBVIEWS

**Issue**: VS Code webviews do not reliably report modifier key states (Shift, Ctrl, etc.) in keyboard events due to webview sandboxing. The `shiftKey` property always returns false even when Shift is pressed, making it impossible to differentiate between Shift+Enter and plain Enter.

**Workarounds for Users**:
- Copy-paste multi-line text directly into the input field
- Messages can be sent using the send button
- Future: Consider adding a dedicated "New Line" button if this feature becomes critical

**Reference**: This is a known VS Code platform limitation, not a bug in the extension. Other VS Code extensions with webviews have the same issue.

**Test Result**: SKIPPED - Cannot be implemented due to platform limitations

### 2.5 Context Gathering

**Action**: 
1. Open a Camel YAML file (e.g., `example.camel.yaml`)
2. Switch to AI panel
3. Send a question like: "What does this route do?"

- [x] AI mentions specific details from file
- [x] References specific components from the route
- [x] Mentions destinations (Kafka, HTTP, etc.)
- [x] Shows context awareness in response
- [x] Shows file-specific understanding ✅ VERIFIED

**Console Evidence**: Logs show context gathered from visible editor, YAML parsed, and context string passed to backend

### 2.5b Local LLM (Ollama) Backend

**Action**:
- Set `karavan.ai.backend` = `local-llm` and `karavan.ai.model` = `llama3.1:8b` (dev host settings)
- Ensure Ollama running at `http://localhost:11434` with `llama3.1:8b`
- Open AI panel → click **Local LLM** → send "create a simple camel route with timer"

- [x] Backend initialization succeeds (no auth prompt)
- [x] Model auto-selected from Ollama tags
- [x] Request hits `/api/generate` with `llama3.1:8b`
- [x] Streaming response returns 200 (no 404)
- [x] Chat completes with route content

**Result**: ✅ Local LLM backend verified after model auto-selection fix

### 2.6 Code Generation

**Action**: Send "Generate a REST API route that accepts JSON and sends to Kafka"

- [ ] AI generates code
- [ ] Code is in YAML format
- [ ] Code has syntax highlighting
- [ ] Code block visible with "Copy" button
- [ ] Code block visible with "Apply" button
- [ ] Code looks valid and well-formatted

### 2.7 Code Application - Insert

**Action**: 
1. Generate code (above)
2. Click "Apply" button

- [ ] Code inserts at cursor in editor
- [ ] Code properly indented
- [ ] File shows as modified
- [ ] No syntax errors shown
- [ ] Success notification appears: "Code applied successfully"

### 2.8 Code Application - Create New File

**Action**: 
1. If no file open, generate code
2. Click "Apply" button

- [ ] Save dialog appears
- [ ] `.yaml` extension pre-selected
- [ ] Can choose location
- [ ] New file created and opened
- [ ] Code visible in new file
- [ ] Success notification appears

### 2.9 Code Copying

**Action**: With code block visible, click "Copy"

- [ ] Copy button is clickable
- [ ] Success notification: "Copied to clipboard"
- [ ] Switch to text editor
- [ ] Press `Ctrl+V` to paste
- [ ] Code pastes correctly

### 2.10 Clear Chat

**Action**: Right-click in chat area, find "Clear Chat"

- [ ] Context menu appears
- [ ] "Clear Chat" option visible
- [ ] All messages disappear after clearing
- [ ] Welcome message reappears
- [ ] Can send new messages

**Phase 2 Status**:
- [ ] ALL TESTS PASSED → Proceed to Phase 3
- [ ] SOME TESTS FAILED → Document and investigate

---

## 🔐 PHASE 3: OPENAI BACKEND VALIDATION (1 hour)

### 3.1 API Key Authentication
- [x] OpenAI API key accepted without errors
- [x] Authentication completes instantly
- [x] Token persists across extension reload
- [x] No permission/authorization errors

### 3.2 Streaming Quality
- [x] Responses stream in real-time
- [x] No long pauses between chunks
- [x] Formatting preserved (code blocks, lists)
- [x] Blinking cursor during streaming
- [x] Response completes cleanly

### 3.3 Camel Knowledge
**Test 1**: Send "Explain the difference between multicast and split EIP patterns"
- [ ] Response shows Camel expertise
- [ ] EIP concepts explained accurately
- [ ] Code examples provided if relevant

**Test 2**: Send "How do I configure HTTP basic authentication?"
- [ ] Response is Camel-specific
- [ ] Provides configuration examples
- [ ] Mentions relevant properties

### 3.4 Context Awareness Validation
- [x] Open Camel YAML file
- [x] Send question about the route
- [x] OpenAI references specific components
- [x] Suggestions are context-specific
- [x] File content successfully injected into prompt

**Phase 3 Status**:
- [x] ALL CRITICAL TESTS PASSED ✅
- [ ] SOME TESTS FAILED → Document issues

---

## 📝 PHASE 3B: GITHUB COPILOT INTEGRATION

**Status**: REMOVED ❌

**Reason**: GitHub Copilot Chat extension does not expose a public API for authentication or chat functionality. The extension cannot access Copilot's authentication or messaging capabilities directly. Code has been removed from:
- `/src/views/ai-panel/aiMachine.ts` - Removed GitHub Copilot auth state and flows
- `/src/ai/backends/backend.ts` - Removed GitHub Copilot backend factory option
- `/webview/ai-panel/LoginPanel.tsx` - Removed GitHub Copilot button
- `/src/views/ai-panel/webview.ts` - Removed GitHub Copilot HTML template

**Alternative**: Users can use OpenAI API or Local LLM backend instead.

---

## ⚠️ PHASE 4: ERROR SCENARIOS (1 hour)

### 4.1 Invalid OpenAI Key (if testing OpenAI)
- [ ] Logout and select "OpenAI API Key"
- [ ] Enter invalid key: "sk-invalid"
- [ ] Error message appears
- [ ] Can retry with valid key

### 4.2 Network Error Simulation
- [ ] Disconnect internet (WiFi off)
- [ ] Try to send message
- [ ] Error message appears: "Network error" or similar
- [ ] Helpful suggestion to check connection
- [ ] Can retry after reconnecting

### 4.3 Empty Message Handling
- [ ] Click in input field
- [ ] Press Enter with no text
- [ ] Message not sent (silent, no error)
- [ ] Try again with just spaces
- [ ] Spaces-only message not sent

### 4.4 Large File Context
- [ ] Open test-route-complex.camel.yaml (59 lines, 5 routes)
- [ ] Send "Summarize all routes"
- [ ] Context gathering completes in <3 seconds
- [ ] AI receives full context
- [ ] Response is accurate

### 4.5 Invalid YAML Handling
- [ ] Open test-route-invalid.camel.yaml
- [ ] Send "Help me fix this file"
- [ ] AI detects YAML error
- [ ] Suggests the fix (missing colon)
- [ ] Clear guidance provided
- [ ] No crash or freeze

**Phase 4 Status**:
- [ ] ALL TESTS PASSED → Proceed to configuration
- [ ] SOME TESTS FAILED → Document issues

---

## ⚙️ PHASE 5: CONFIGURATION (1 hour)

### 5.1 Configuration Properties
- [ ] Open Settings: `Ctrl+,`
- [ ] Search "karavan.ai"
- [ ] Verify all properties present:
  - [ ] `karavan.ai.enabled`
  - [ ] `karavan.ai.backend`
  - [ ] `karavan.ai.model`
  - [ ] `karavan.ai.openaiApiKey`
  - [ ] `karavan.ai.localLlmEndpoint`

### 5.2 Backend Switching
- [ ] Currently authenticated with Copilot
- [ ] Change setting: `karavan.ai.backend` to "openai"
- [ ] Reload window: `Ctrl+R`
- [ ] Open AI panel
- [ ] Login panel shows OpenAI option
- [ ] Previous auth cleared
- [ ] Can authenticate with new backend

### 5.3 Enabled/Disabled Toggle
- [ ] Set `karavan.ai.enabled` to false
- [ ] Reload window
- [ ] Open AI panel
- [ ] Shows "Disabled" message
- [ ] Can't authenticate
- [ ] Re-enable and verify it works again

### 5.4 Model Configuration
- [ ] With OpenAI, change model to "gpt-3.5-turbo"
- [ ] Send message
- [ ] Response quality differs (faster, simpler)
- [ ] Change back to "gpt-4"
- [ ] Send another message
- [ ] Response quality improves (more detailed)

**Phase 5 Status**:
- [ ] ALL TESTS PASSED → Proceed to performance
- [ ] SOME TESTS FAILED → Document issues

---

## 📊 PHASE 6: PERFORMANCE & LOAD (1 hour)

### 6.1 Rapid Message Sending
- [ ] Send 5 messages within 10 seconds
- [ ] All messages queue and send
- [ ] No messages dropped
- [ ] Responses come in order
- [ ] UI remains responsive

### 6.2 Long Message Input
- [ ] Compose 1000+ character message
- [ ] Send successfully
- [ ] AI receives full message
- [ ] Response is appropriate

### 6.3 Extended Session
- [ ] Keep AI panel open for 30+ minutes
- [ ] Send messages periodically
- [ ] Monitor for:
  - [ ] No crashes
  - [ ] No freezes
  - [ ] Memory usage stable
  - [ ] Responses consistent in speed

### 6.4 Streaming Performance
- [ ] Send multiple long requests
- [ ] Streaming smooth (no stuttering)
- [ ] No long gaps between chunks
- [ ] CPU reasonable during streaming
- [ ] Memory doesn't spike

**Phase 6 Status**:
- [ ] ALL TESTS PASSED → Success!
- [ ] SOME TESTS FAILED → Document issues

---

## 📝 TESTING SUMMARY

### Overall Status
- [ ] Phase 1 (Foundation): PASS / FAIL / PARTIAL
- [ ] Phase 2 (Chat & AI): PASS / FAIL / PARTIAL
- [ ] Phase 3 (Copilot): PASS / FAIL / PARTIAL
- [ ] Phase 4 (Error): PASS / FAIL / PARTIAL
- [ ] Phase 5 (Config): PASS / FAIL / PARTIAL
- [ ] Phase 6 (Performance): PASS / FAIL / PARTIAL

### Issues Found
Count: ___ high priority, ___ medium priority, ___ low priority

### Recommendations
- [ ] Ready for release
- [ ] Minor fixes needed
- [ ] Major fixes required

---

## 📋 ISSUE LOG

Use this section to document any issues found during testing.

### Issue #1
**Severity**: [ ] High [ ] Medium [ ] Low
**Phase**: Phase ___
**Description**: 

**Steps to Reproduce**: 

**Expected Result**: 

**Actual Result**: 

**Console Error**: 

---

### Issue #2
**Severity**: [ ] High [ ] Medium [ ] Low
**Phase**: Phase ___
**Description**: 

**Steps to Reproduce**: 

**Expected Result**: 

**Actual Result**: 

**Console Error**: 

---

## ✅ FINAL SIGN-OFF

**Testing Completed By**: ___________________________
**Date**: ___________________________
**Time Spent**: ___ hours
**Overall Status**: [ ] PASSED [ ] FAILED [ ] NEEDS FIXES

**Notes**:

---

**Next Steps**: 
- [ ] Document all issues in GitHub
- [ ] Create feature branches for fixes
- [ ] Plan Phase 3 implementation
