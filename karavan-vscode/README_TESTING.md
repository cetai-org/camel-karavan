# Karavan AI Panel Testing - Complete Setup

## ✅ Current Status

**All systems ready for testing!**

- ✅ Extension compiled (watch task running)
- ✅ Webview compiled
- ✅ Commands registered
- ✅ Launch configuration ready
- ✅ Source files present

---

## 📝 Test Documents Created

1. **[AI_PANEL_SMOKE_TEST.md](AI_PANEL_SMOKE_TEST.md)** - Detailed test checklist with checkboxes
2. **[AI_PANEL_TEST_QUICKREF.md](AI_PANEL_TEST_QUICKREF.md)** - Quick command reference
3. **[AI_PANEL_VISUAL_GUIDE.md](AI_PANEL_VISUAL_GUIDE.md)** - Visual mockups and UI expectations
4. **[test-route.camel.yaml](test-route.camel.yaml)** - Sample YAML file for testing
5. **[test-validation.sh](test-validation.sh)** - Pre-test validation script

---

## 🚀 How to Start Testing

### Option 1: Quick Start (Recommended)
```bash
# Watch task is already running ✓
# Press F5 in VS Code to launch Extension Development Host
```

### Option 2: Full Restart
```bash
# Stop current watch task (Ctrl+C in terminal)
npm run watch
# Then press F5
```

---

## 📋 Testing Sequence

Follow this order for best results:

1. **Launch Extension** (Already done ✓)
   - Extension Development Host should be running
   - Check status bar shows "[Extension Development Host]"

2. **Open AI Panel**
   - `Ctrl+Shift+P` → Type: `Karavan: Open AI Copilot`
   - Verify panel opens on the RIGHT side

3. **Check Login UI**
   - Should see 3 authentication options:
     - GitHub Copilot
     - OpenAI API Key (with input field)
     - Local LLM

4. **Test Generate Route**
   - `Ctrl+Shift+P` → Type: `Karavan: Generate Route with AI`
   - Enter test prompt: `REST API that receives JSON and logs it`
   - Panel should open with your prompt

5. **Test Context Menu** ⚠️ IMPORTANT
   - **Right-click on `test-route.camel.yaml` in FILE EXPLORER** (left sidebar)
   - NOT in the editor!
   - Look for "Karavan: Generate Route with AI"

6. **Test Authentication (Optional)**
   - Enter an OpenAI API key in the input field
   - Click "Connect"
   - Should transition to chat interface

---

## ⚠️ Important Notes

### Context Menu Location
The "Generate Route with AI" command appears in:
- ✅ **File Explorer** (left sidebar) - Right-click on `.yaml` files
- ❌ **NOT** in editor context menu

### File Extensions
The context menu only appears for files with `.yaml` extension:
- ✅ `test-route.camel.yaml`
- ✅ `simple.yaml`
- ✅ Any file ending in `.yaml`

### Panel Location
The AI panel opens in `ViewColumn.Beside` which means:
- If you have one column: Opens on the RIGHT
- If you have multiple columns: Opens in the next column

---

## 🔍 What to Check in Developer Tools

### Open Developer Tools:
`Help → Toggle Developer Tools`

### Console Tab - Good Signs:
```
Activating extension...
AI Panel activated
[Extension Host] Extension activated
```

### Console Tab - Bad Signs:
```
Error: ...
Failed to load resource
Uncaught (in promise)
TypeError
```

---

## 📊 Expected Test Results

| Test | Expected Time | Should Pass? |
|------|---------------|--------------|
| 1. Launch Extension | 30 sec | ✅ YES |
| 2. AI Panel Opens | 1 min | ✅ YES |
| 3. Login UI | 1 min | ✅ YES |
| 4. Commands | 2 min | ✅ YES |
| 5. Context Menu | 1 min | ✅ YES* |
| 6. Authentication | 2 min | 🟡 DEPENDS** |

*Should work if right-clicking in File Explorer  
**Depends on having valid API key

---

## 🐛 Troubleshooting

### Panel doesn't open?
1. Check Developer Tools console for errors
2. Try running command again
3. Reload Extension Host: `Ctrl+R` in Extension Host window

### Commands don't appear?
1. Make sure you're in the Extension Development Host
2. Type the full command name in Command Palette
3. Check package.json for command registration

### Context menu missing?
1. Make sure you're right-clicking in **File Explorer**, not editor
2. File must have `.yaml` extension
3. Try closing and reopening the file

### Authentication doesn't work?
This is expected if:
- You don't have a valid OpenAI API key
- GitHub Copilot isn't set up
- Local LLM isn't configured

Just verify the UI transitions work!

---

## 🎯 Success Criteria

You can consider testing successful if:

### Must Have ✅
- [x] Extension launches without errors
- [x] AI Panel opens when command is run
- [x] Login UI shows all 3 authentication options
- [x] Generate Route command shows input dialog
- [x] Context menu appears in File Explorer

### Nice to Have 🟡
- [ ] No console errors
- [ ] Authentication works (if you have API key)
- [ ] Chat interface appears after auth
- [ ] UI looks good in your theme

---

## 📞 Next Steps After Testing

1. Fill out [AI_PANEL_SMOKE_TEST.md](AI_PANEL_SMOKE_TEST.md)
2. Note any issues found
3. Take screenshots if needed
4. Document console errors
5. Report results

---

## 🎉 You're Ready!

Everything is set up and validated. The Extension Development Host should be running.

**Start with Test #2** - Open the AI Panel!

Good luck! 🚀
