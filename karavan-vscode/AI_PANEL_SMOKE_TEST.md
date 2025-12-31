# Karavan AI Panel - Quick Smoke Test Results

**Date:** December 31, 2025  
**Extension Version:** 4.14.2  
**Test Duration:** ~10 minutes

## Prerequisites ✅

- [x] Extension compiled successfully (watch task running)
- [x] Extension Development Host launched
- [ ] Developer Tools ready (Help → Toggle Developer Tools)

---

## Test 1: Launch Extension (2 minutes) ⏱️

### Steps:
1. Press `F5` or use Debug → Start Debugging
2. Wait for new VS Code window to open (Extension Development Host)
3. Check bottom-left corner shows "[Extension Development Host]"

### Expected Result:
- ✅ New VS Code window opens
- ✅ Extension activates without errors
- ✅ Status bar shows extension is active

### Actual Result:
- [ ] PASS
- [ ] FAIL (describe issue):

---

## Test 2: Test AI Panel Opens (1 minute) ⏱️

### Steps:
1. In Extension Development Host window:
   - Press `Ctrl+Shift+P` (Linux/Windows) or `Cmd+Shift+P` (Mac)
2. Type: `Karavan: Open AI Copilot`
3. Press Enter
4. Open Developer Tools: `Help → Toggle Developer Tools`
5. Check Console tab for errors

### Expected Result:
- ✅ Command appears in Command Palette with sparkle icon ($(sparkle))
- ✅ AI Panel opens on the RIGHT side
- ✅ Panel title shows "Karavan AI Copilot" or similar
- ✅ NO console errors (red text in DevTools)

### Actual Result:
- [ ] PASS
- [ ] FAIL (describe issue):

### Screenshot Location:
- [ ] Panel opened successfully

### Console Errors (if any):
```
[Paste any errors here]
```

---

## Test 3: Test Login UI (1 minute) ⏱️

### Steps:
1. With AI Panel open, examine the UI
2. Look for authentication options
3. Check layout and styling

### Expected Result:
Three authentication options visible:
1. ✅ **GitHub Copilot** button/option
2. ✅ **OpenAI API Key** option with input field
3. ✅ **Local LLM** option

UI Quality:
- ✅ No layout issues (buttons aligned, text readable)
- ✅ Input field for API key is visible and functional
- ✅ Proper spacing and margins
- ✅ Icons render correctly

### Actual Result:
- [ ] PASS - All 3 options visible
- [ ] PARTIAL - Some options visible (list which):
- [ ] FAIL (describe issue):

### UI Issues Found:
```
[Describe any layout problems, missing elements, etc.]
```

---

## Test 4: Test Commands (2 minutes) ⏱️

### Steps:
1. Press `Ctrl+Shift+P` again
2. Type: `Karavan: Generate Route with AI`
3. Press Enter
4. Enter test prompt: `REST API that receives JSON and logs it`
5. Press Enter or click OK

### Expected Result:
- ✅ Command appears in Command Palette
- ✅ Input dialog appears with:
  - Prompt: "Describe the integration route you want to create"
  - Placeholder: "e.g., REST API that consumes JSON and sends to Kafka"
- ✅ After entering text, AI panel opens (if not already open)
- ✅ Input text is passed to the panel

### Actual Result:
- [ ] PASS
- [ ] FAIL (describe issue):

### Test Prompt Used:
```
[The prompt you entered]
```

---

## Test 5: Test Context Menu (1 minute) ⏱️

### Steps:
1. Create a new file: `test-route.camel.yaml` or `test.yaml`
2. Right-click in the editor (with the YAML file active)
3. Look for "Karavan: Generate Route with AI" in context menu
4. Click it (optional - will open input dialog again)

### Expected Result:
- ✅ Context menu shows "Karavan: Generate Route with AI"
- ✅ Menu item appears in "karavan@10" group
- ✅ Only appears for `.yaml` files
- ✅ Clicking opens input dialog

### Actual Result:
- [ ] PASS
- [ ] FAIL (describe issue):

### File Extension Tested:
- [ ] `.yaml`
- [ ] `.camel.yaml`
- [ ] Other: __________

---

## Test 6: Test Authentication (Optional - 2 minutes) ⏱️

> **Note:** Only if you have an OpenAI API key available

### Steps:
1. In AI Panel, locate the "OpenAI API Key" input field
2. Enter a valid OpenAI API key (or test key)
3. Click "Connect" or "Submit" button
4. Wait for state transition
5. Observe the UI change

### Expected Result:
- ✅ Input field accepts text
- ✅ "Connect" button is clickable
- ✅ Loading indicator appears (optional)
- ✅ UI transitions to **chat interface**
- ✅ Chat UI shows:
  - Message input area
  - Send button
  - Chat history area (even if empty)

### Actual Result:
- [ ] PASS
- [ ] PARTIAL (describe what worked):
- [ ] FAIL (describe issue):
- [ ] SKIPPED (no API key available)

### API Key Used:
- [ ] Valid OpenAI key
- [ ] Test/mock key
- [ ] Invalid key (for error testing)

---

## Summary Checklist

| Test | Status | Time | Notes |
|------|--------|------|-------|
| 1. Launch Extension | ⬜ PASS / ⬜ FAIL | ____ min | |
| 2. AI Panel Opens | ⬜ PASS / ⬜ FAIL | ____ min | |
| 3. Login UI | ⬜ PASS / ⬜ FAIL | ____ min | |
| 4. Commands | ⬜ PASS / ⬜ FAIL | ____ min | |
| 5. Context Menu | ⬜ PASS / ⬜ FAIL | ____ min | |
| 6. Authentication | ⬜ PASS / ⬜ FAIL / ⬜ SKIP | ____ min | |

**Total Time:** _______ minutes

---

## Critical Issues Found 🔴

1. 
2. 
3. 

## Minor Issues Found 🟡

1. 
2. 
3. 

## Nice to Have / Future 🔵

1. 
2. 
3. 

---

## DevTools Console Log

```
[Paste relevant console output here - warnings, errors, info messages]
```

---

## Additional Notes

```
[Any other observations, suggestions, or context]
```

---

## Sign-Off

- [ ] All critical tests passed
- [ ] Ready for next phase
- [ ] Issues documented and tracked

**Tester Name:** ________________  
**Date:** ________________  
**Signature:** ________________
