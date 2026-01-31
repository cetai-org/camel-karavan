# Karavan AI Copilot - Troubleshooting Guide

This guide helps resolve common issues with the Karavan AI Copilot feature.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Connection Issues](#connection-issues)
3. [AI Response Issues](#ai-response-issues)
4. [Diagnostics & Validation Issues](#diagnostics--validation-issues)
5. [Performance Issues](#performance-issues)
6. [Error Messages Reference](#error-messages-reference)
7. [Getting Support](#getting-support)

---

## Quick Diagnostics

### Check AI Status

Run the diagnostic command to quickly identify issues:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "Karavan: Diagnose AI Issues"
3. Review the report:

```
Karavan AI Diagnostics Report
==============================
✓ Extension loaded
✓ Backend configured: openai
✗ Connection failed: Timeout after 10s
✓ Diagnostics provider active
✓ Quick fix provider active

Recommendations:
- Check your internet connection
- Verify API key is valid
- Try reducing timeout in settings
```

### Collect Logs

Enable verbose logging for troubleshooting:

```json
{
  "karavan.ai.logging.level": "debug",
  "karavan.ai.logging.file": "/tmp/karavan-ai.log"
}
```

Then check the Output panel:
- `View > Output`
- Select "Karavan AI" from dropdown

---

## Connection Issues

### OpenAI Connection Problems

#### Error: "API key invalid"

**Symptoms:**
- Chat returns "Authentication failed"
- Status shows "Invalid API key"

**Solutions:**

1. Verify key format:
   - Must start with `sk-`
   - No extra spaces or newlines
   
2. Check key permissions:
   - Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Ensure key is not revoked
   - Verify key has required permissions

3. Re-enter key:
   ```
   Ctrl+Shift+P → "Karavan: Set OpenAI API Key"
   ```

4. Check organization (if applicable):
   ```json
   { "karavan.ai.openai.organization": "org-..." }
   ```

#### Error: "Rate limit exceeded"

**Symptoms:**
- "Too many requests" error
- Responses stop working temporarily

**Solutions:**

1. Wait and retry (usually 1 minute)

2. Reduce request frequency:
   ```json
   {
     "karavan.ai.debounce.delay": 1000,
     "karavan.ai.maxConcurrent": 1
   }
   ```

3. Check your OpenAI usage:
   - Visit [platform.openai.com/usage](https://platform.openai.com/usage)
   - Verify you have available quota

4. Use a different model:
   ```json
   { "karavan.ai.openai.model": "gpt-3.5-turbo" }
   ```

#### Error: "Request timeout"

**Symptoms:**
- Requests hang indefinitely
- "Timeout" error after delay

**Solutions:**

1. Increase timeout:
   ```json
   { "karavan.ai.openai.timeout": 60000 }
   ```

2. Check internet connection

3. Try a different network (proxy issues)

4. Check OpenAI status: [status.openai.com](https://status.openai.com)

### GitHub Copilot Issues

#### Error: "Copilot not available"

**Symptoms:**
- "GitHub Copilot extension not found"
- "Not signed in to GitHub"

**Solutions:**

1. Install Copilot extension:
   ```
   Ctrl+Shift+X → Search "GitHub Copilot" → Install
   ```

2. Sign in to GitHub:
   - Click Accounts icon in Activity Bar
   - Select "Sign in with GitHub"

3. Check subscription:
   - Visit [github.com/settings/copilot](https://github.com/settings/copilot)
   - Verify subscription is active

4. Restart VS Code after changes

#### Error: "Copilot disabled for this language"

**Solutions:**

1. Enable for YAML files:
   ```json
   {
     "github.copilot.enable": {
       "yaml": true
     }
   }
   ```

2. Check workspace trust:
   - Workspace must be trusted for Copilot to work
   - `Ctrl+Shift+P → "Workspaces: Manage Workspace Trust"`

### Local LLM (Ollama) Issues

#### Error: "Cannot connect to Ollama"

**Symptoms:**
- "Connection refused"
- "ECONNREFUSED"

**Solutions:**

1. Check if Ollama is running:
   ```bash
   # macOS/Linux
   pgrep ollama
   
   # Or check service
   systemctl status ollama
   ```

2. Start Ollama:
   ```bash
   ollama serve
   ```

3. Verify endpoint:
   ```bash
   curl http://localhost:11434/api/tags
   ```

4. Check firewall (if remote):
   ```bash
   # Allow port 11434
   sudo ufw allow 11434
   ```

#### Error: "Model not found"

**Solutions:**

1. List available models:
   ```bash
   ollama list
   ```

2. Pull the required model:
   ```bash
   ollama pull codellama:13b
   ```

3. Update configuration with exact name:
   ```json
   { "karavan.ai.local.model": "codellama:13b" }
   ```

#### Error: "Out of memory"

**Symptoms:**
- Ollama crashes
- "OOM" errors in logs

**Solutions:**

1. Use smaller model:
   ```bash
   ollama pull codellama:7b
   ```
   ```json
   { "karavan.ai.local.model": "codellama:7b" }
   ```

2. Close other applications

3. Check system memory:
   ```bash
   free -h  # Linux
   vm_stat  # macOS
   ```

4. Configure Ollama memory limit:
   ```bash
   OLLAMA_MAX_LOADED_MODELS=1 ollama serve
   ```

---

## AI Response Issues

### Poor Quality Responses

**Symptoms:**
- Irrelevant suggestions
- Incorrect YAML syntax
- Missing components

**Solutions:**

1. Be more specific:
   ```
   ❌ "Create a route"
   ✓ "Create a Camel route that reads JSON files from /input, 
      transforms them to XML, and sends to ActiveMQ queue 'orders'"
   ```

2. Provide context:
   ```
   ✓ "I'm using Camel 4.0 with Spring Boot. Create a route that..."
   ```

3. Use explicit commands:
   ```
   /generate file to kafka route
   /explain this choice block
   ```

4. Try different model:
   ```json
   { "karavan.ai.openai.model": "gpt-4" }  // More capable than 3.5
   ```

### Incomplete Responses

**Symptoms:**
- Response cuts off mid-sentence
- YAML is truncated

**Solutions:**

1. Increase max tokens:
   ```json
   { "karavan.ai.openai.maxTokens": 8192 }
   ```

2. Ask for simpler output:
   ```
   "Create a basic file to log route, no error handling needed"
   ```

3. Request in parts:
   ```
   "First, create the source component"
   "Now add the transformation"
   "Finally, add error handling"
   ```

### Hallucinated Components

**Symptoms:**
- AI suggests non-existent components
- Invalid component options

**Solutions:**

1. Verify with documentation:
   ```
   "What are the actual options for the kafka component?"
   ```

2. Enable validation:
   ```json
   { "karavan.ai.diagnostics.validateComponents": true }
   ```

3. Use component suggestion instead:
   ```
   /component kafka
   ```

---

## Diagnostics & Validation Issues

### Diagnostics Not Appearing

**Symptoms:**
- No squiggles on errors
- Problems panel empty

**Solutions:**

1. Enable diagnostics:
   ```json
   { "karavan.ai.diagnostics.enabled": true }
   ```

2. Check file type:
   - Only `.yaml` and `.yml` files are validated
   - File must be in a Camel project

3. Force re-validation:
   - Make a small edit to the file
   - Or run: `Ctrl+Shift+P → "Karavan: Validate Current File"`

4. Check for conflicting extensions:
   - Disable other YAML validators temporarily
   - Check Output panel for errors

### False Positives

**Symptoms:**
- Valid YAML marked as error
- Known components flagged as unknown

**Solutions:**

1. Update component catalog:
   ```
   Ctrl+Shift+P → "Karavan: Update Component Catalog"
   ```

2. Adjust severity threshold:
   ```json
   { "karavan.ai.diagnostics.severity": "error" }  // Only show errors
   ```

3. Disable specific rules:
   ```json
   {
     "karavan.ai.diagnostics.disabledRules": [
       "unknown-component",
       "deprecated-option"
     ]
   }
   ```

4. Report false positive:
   - Right-click on diagnostic
   - Select "Report False Positive"

### Quick Fixes Not Working

**Symptoms:**
- No lightbulb appears
- Fixes don't apply correctly

**Solutions:**

1. Position cursor on error:
   - Click on the underlined text
   - Wait for lightbulb to appear

2. Save file first:
   - Quick fixes require saved state
   - `Ctrl+S` before fixing

3. Use keyboard shortcut:
   - `Ctrl+.` to show quick fixes

4. Try AI fix:
   - "Ask AI to fix this" option
   - Better for complex errors

---

## Performance Issues

### Slow Response Times

**Symptoms:**
- AI takes 10+ seconds to respond
- UI freezes during requests

**Solutions:**

1. Enable caching:
   ```json
   {
     "karavan.ai.cache.enabled": true,
     "karavan.ai.cache.ttl": 3600000
   }
   ```

2. Reduce request complexity:
   - Ask simpler questions
   - Break into smaller requests

3. Use faster model:
   ```json
   { "karavan.ai.openai.model": "gpt-3.5-turbo" }
   ```

4. Check network latency:
   ```bash
   ping api.openai.com
   ```

### High Memory Usage

**Symptoms:**
- VS Code becomes slow
- High RAM usage

**Solutions:**

1. Clear cache:
   ```
   Ctrl+Shift+P → "Karavan: Clear AI Cache"
   ```

2. Limit history:
   ```json
   { "karavan.ai.chat.maxHistory": 20 }
   ```

3. Disable unused features:
   ```json
   {
     "karavan.ai.hover.enabled": false,
     "karavan.ai.suggestions.autoShow": false
   }
   ```

4. Restart extension:
   ```
   Ctrl+Shift+P → "Developer: Restart Extension Host"
   ```

### Frequent Disconnections

**Symptoms:**
- Connection drops mid-conversation
- Need to re-authenticate often

**Solutions:**

1. Check network stability

2. Increase keepalive:
   ```json
   { "karavan.ai.connection.keepalive": true }
   ```

3. Enable auto-reconnect:
   ```json
   { "karavan.ai.connection.autoReconnect": true }
   ```

4. Check for VPN/proxy interference

---

## Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `AUTH_FAILED` | Invalid API key | Re-enter key in settings |
| `RATE_LIMITED` | Too many requests | Wait, then reduce frequency |
| `TIMEOUT` | Slow network/server | Increase timeout setting |
| `MODEL_NOT_FOUND` | Invalid model name | Check available models |
| `CONTEXT_LENGTH_EXCEEDED` | Input too long | Reduce message size |
| `SERVER_ERROR` | Provider issue | Check status page, retry later |
| `NETWORK_ERROR` | Connection failed | Check internet, proxy settings |
| `INVALID_RESPONSE` | Malformed AI response | Retry, use different model |
| `BACKEND_NOT_CONFIGURED` | Missing settings | Complete setup wizard |
| `EXTENSION_CONFLICT` | Other extension issue | Disable conflicting extensions |

---

## Getting Support

### Self-Service Resources

1. **Documentation:**
   - [User Guide](AI_COPILOT_USER_GUIDE.md)
   - [Setup Guide](AI_COPILOT_SETUP.md)

2. **Community:**
   - [GitHub Discussions](https://github.com/apache/camel-karavan/discussions)
   - [Camel Users Mailing List](https://camel.apache.org/community/mailing-list/)

3. **FAQ:**
   - Check the FAQ section in the user guide

### Reporting Issues

When reporting issues, include:

1. **Environment:**
   ```
   Ctrl+Shift+P → "Karavan: Copy Environment Info"
   ```

2. **Error logs:**
   ```
   View > Output → Select "Karavan AI"
   ```

3. **Steps to reproduce:**
   - What you did
   - What you expected
   - What happened

4. **Configuration (sanitized):**
   - Backend type
   - Model used
   - Relevant settings

### Contact

- **GitHub Issues:** [apache/camel-karavan/issues](https://github.com/apache/camel-karavan/issues)
- **Security Issues:** security@apache.org

---

## Recovery Procedures

### Reset AI Configuration

If all else fails, reset to defaults:

1. Open settings.json
2. Remove all `karavan.ai.*` settings
3. Run: `Ctrl+Shift+P → "Karavan: Setup AI Assistant"`

### Reinstall Extension

1. Uninstall: `Ctrl+Shift+X → Karavan → Uninstall`
2. Restart VS Code
3. Reinstall from Marketplace
4. Reconfigure AI settings

### Clear All Data

```bash
# Remove extension data (Linux/macOS)
rm -rf ~/.vscode/extensions/karavan-*
rm -rf ~/.config/Code/User/globalStorage/karavan.*

# Windows
rmdir /s "%USERPROFILE%\.vscode\extensions\karavan-*"
rmdir /s "%APPDATA%\Code\User\globalStorage\karavan.*"
```

---

*If this guide didn't resolve your issue, please [open an issue](https://github.com/apache/camel-karavan/issues/new) with the details.*
