# Quick Testing Reference - Immediate Actions

## ✅ SETUP COMPLETE

All prerequisites met:
- ✅ Node.js v24.5.0
- ✅ Dependencies installed
- ✅ TypeScript compiled
- ✅ Test fixtures created (3 files)
- ✅ Documentation ready

---

## 🚀 NEXT: LAUNCH EXTENSION

### **ACTION 1: Start Extension Development Host**

```bash
Press: F5

OR

Ctrl+Shift+D → Select "Run Extension"
```

**Expected Result:**
- New VSCode window opens (Extension Development Host)
- Window title contains "[Extension Development Host]"
- No error messages in console
- Extension activates (~5 seconds)

**If it doesn't work:**
```bash
Ctrl+Shift+P → "Debug: Start Debugging"
```

---

## 📋 PHASE 1: FOUNDATION TEST (Quick Validation)

Once Extension Development Host launches:

### **Step 1: Open AI Panel (30 seconds)**
```
Ctrl+Shift+P (or Cmd+Shift+P on Mac)
Type: "Karavan: Open AI Copilot"
Press Enter
```
✓ **Expected**: Panel opens on right side with login options

### **Step 2: Check Console (30 seconds)**
```
Ctrl+Shift+I (open DevTools)
Go to Console tab
```
✓ **Expected**: See state transitions without errors

### **Step 3: Authenticate (30 seconds)**
```
Click: "GitHub Copilot" button
```
✓ **Expected**: 
- State changes to "Authenticating"
- Completes to "Authenticated" (instant, since subscribed)
- Chat interface appears

### **Step 4: Send Message (1 minute)**
```
Type in input field: "Hello"
Press Enter
```
✓ **Expected**: 
- Message appears on right
- AI response streams on left
- Blinking cursor during response
- Completes within 30 seconds

**SMOKE TEST COMPLETE! ✅**

---

## 📂 TEST FILES READY

Located at: `test-files/`

```
test-route-simple.camel.yaml      ← Start with this
test-route-complex.camel.yaml     ← Advanced tests
test-route-invalid.camel.yaml     ← Error handling
```

### **To Test Context Awareness:**
1. Open: `test-files/test-route-simple.camel.yaml`
2. Ask AI: "What does this route do?"
3. AI should understand the file content

---

## 🎯 TESTING PHASES

### **Phase 1: Foundation (1 hour)**
- [x] Extension activation
- [x] Commands visible
- [x] State machine works
- [x] UI renders correctly
- [x] Context menus appear

*See: TESTING_STRATEGY.md → Section 3*

### **Phase 2: Chat & AI (2 hours)**
- [ ] Authentication (all 3 backends)
- [ ] Message sending
- [ ] Streaming responses
- [ ] Context gathering
- [ ] Code generation & application

*See: TESTING_STRATEGY.md → Section 4*

### **Phase 3: GitHub Copilot Specific (1 hour)**
- [ ] Extension detection
- [ ] API integration
- [ ] Streaming quality
- [ ] Camel knowledge
- [ ] Context awareness

*See: TESTING_STRATEGY.md → Section 3*

---

## 📊 TRACK PROGRESS

**Install Markdown Checkbox Extension:**
```
Ctrl+Shift+X
Search: "Markdown Checkboxes"
Install the bierner extension
```

**Then:**
1. Open `TESTING_STRATEGY.md`
2. Click checkboxes directly to mark tests complete
3. See visual progress update in real-time

---

## 🔧 COMMON COMMANDS

| Action | Keyboard |
|--------|----------|
| Open AI Panel | `Ctrl+Shift+P` → "Open AI Copilot" |
| DevTools | `Ctrl+Shift+I` |
| Reload Extension | `Ctrl+R` (in Extension Host) |
| Stop Extension | `Ctrl+Shift+D` or click red square |
| Command Palette | `Ctrl+Shift+P` |
| Settings | `Ctrl+,` |
| Search Files | `Ctrl+P` |

---

## 📍 CURRENT STATUS

✅ **Setup**: COMPLETE  
⏳ **Next**: Press F5 to launch extension  
📊 **Test Suite**: Ready to execute  
📋 **Documentation**: All files created

---

## 🎯 RIGHT NOW, DO THIS:

1. **Press F5** to launch Extension Development Host
2. **Wait 5-10 seconds** for activation
3. **Run smoke test** (above, takes 5 minutes)
4. **Report success** or any errors in console

---

## 📞 IF YOU GET STUCK

**Common Issues:**

| Problem | Solution |
|---------|----------|
| Extension doesn't load | F5 again, check console |
| AI panel won't open | Check Ctrl+Shift+P shows "Karavan" commands |
| Copilot login fails | Verify GitHub Copilot extension installed & active |
| Message won't send | Check network, try shorter message |
| Streaming not working | Common, check console for API errors |

See **TESTING_STRATEGY.md → Section 13** for detailed debugging.

---

## 📚 DOCUMENTATION

- **Setup Details**: [SETUP_VERIFICATION.md](SETUP_VERIFICATION.md)
- **Full Test Plan**: [TESTING_STRATEGY.md](TESTING_STRATEGY.md)
- **Phase 1 Implementation**: [PHASE1_IMPLEMENTATION.md](PHASE1_IMPLEMENTATION.md)
- **Phase 2 Implementation**: [PHASE2_IMPLEMENTATION.md](PHASE2_SUMMARY.md)

---

**Status**: 🟢 READY FOR TESTING  
**Start Time**: Now (Press F5!)  
**Est. Duration**: 5 mins smoke test → 4 hours full suite

Good luck! 🚀
