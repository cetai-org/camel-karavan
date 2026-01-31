# Karavan AI Copilot - Setup Guide

This guide covers the installation and configuration of the Karavan AI Copilot feature.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Extension Installation](#extension-installation)
3. [AI Backend Configuration](#ai-backend-configuration)
4. [Settings Reference](#settings-reference)
5. [Verification](#verification)
6. [Enterprise Configuration](#enterprise-configuration)

---

## System Requirements

### Minimum Requirements

- **VS Code**: Version 1.75.0 or higher
- **Node.js**: Version 16.x or higher (for local development)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Network**: Internet connection (for cloud AI backends)

### Supported Operating Systems

- Windows 10/11
- macOS 10.15 (Catalina) or higher
- Linux (Ubuntu 20.04+, Fedora 34+, or similar)

---

## Extension Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for "Karavan"
4. Click **Install**
5. Reload VS Code when prompted

### From VSIX File

For offline installation or pre-release versions:

```bash
# Install from command line
code --install-extension karavan-vscode-x.x.x.vsix

# Or in VS Code:
# 1. Open Command Palette (Ctrl+Shift+P)
# 2. Run "Extensions: Install from VSIX..."
# 3. Select the .vsix file
```

---

## AI Backend Configuration

The AI Copilot supports three backend options. Choose based on your needs:

| Backend | Best For | Requirements |
|---------|----------|--------------|
| GitHub Copilot | Enterprise users with Copilot subscription | Copilot license |
| OpenAI | Direct API access, custom models | OpenAI API key |
| Local LLM | Privacy, offline use, no API costs | Ollama installed |

### Option 1: GitHub Copilot (Recommended)

**Prerequisites:**
- GitHub Copilot subscription (Individual or Enterprise)
- GitHub Copilot extension installed in VS Code

**Setup Steps:**

1. Install GitHub Copilot extension:
   ```
   Ctrl+Shift+X → Search "GitHub Copilot" → Install
   ```

2. Sign in to GitHub:
   - Click the Accounts icon in the Activity Bar
   - Select "Sign in with GitHub"
   - Authorize VS Code

3. Configure Karavan to use Copilot:
   ```json
   {
     "karavan.ai.backend": "copilot",
     "karavan.ai.copilot.enabled": true
   }
   ```

4. Verify setup:
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run "Karavan: Check AI Status"
   - Should show "GitHub Copilot: Connected"

### Option 2: OpenAI API

**Prerequisites:**
- OpenAI account with API access
- API key with available credits

**Setup Steps:**

1. Get your API key:
   - Go to [platform.openai.com](https://platform.openai.com)
   - Navigate to API Keys section
   - Create a new secret key
   - Copy the key (shown only once!)

2. Configure in VS Code:

   **Method A: Settings UI**
   - Open Settings (`Ctrl+,`)
   - Search "Karavan AI"
   - Set Backend to "openai"
   - Paste API key in "OpenAI: Api Key"

   **Method B: settings.json**
   ```json
   {
     "karavan.ai.backend": "openai",
     "karavan.ai.openai.apiKey": "sk-...",
     "karavan.ai.openai.model": "gpt-4",
     "karavan.ai.openai.maxTokens": 4096
   }
   ```

3. (Optional) Configure organization:
   ```json
   {
     "karavan.ai.openai.organization": "org-..."
   }
   ```

**Security Note:** 
For sensitive API keys, use VS Code's Secret Storage:
```
Ctrl+Shift+P → "Karavan: Set OpenAI API Key"
```

### Option 3: Local LLM (Ollama)

**Prerequisites:**
- [Ollama](https://ollama.ai) installed
- At least one model pulled

**Setup Steps:**

1. Install Ollama:

   **macOS:**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

   **Linux:**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

   **Windows:**
   Download from [ollama.ai/download](https://ollama.ai/download)

2. Pull a model:
   ```bash
   # Recommended for code generation
   ollama pull codellama:13b
   
   # Alternative smaller model
   ollama pull codellama:7b
   
   # For more capable responses (requires more RAM)
   ollama pull llama2:70b
   ```

3. Start Ollama:
   ```bash
   ollama serve
   ```
   Note: On macOS/Windows, Ollama runs automatically after installation.

4. Configure Karavan:
   ```json
   {
     "karavan.ai.backend": "local",
     "karavan.ai.local.endpoint": "http://localhost:11434",
     "karavan.ai.local.model": "codellama:13b"
   }
   ```

5. Verify connection:
   ```bash
   # Test Ollama is responding
   curl http://localhost:11434/api/tags
   ```

**Model Recommendations:**

| Model | RAM Required | Best For |
|-------|--------------|----------|
| codellama:7b | 8GB | Basic code completion |
| codellama:13b | 16GB | General code generation |
| codellama:34b | 32GB | Complex reasoning |
| deepseek-coder:33b | 32GB | Advanced code tasks |

---

## Settings Reference

### Core Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `karavan.ai.enabled` | boolean | `true` | Enable/disable AI features |
| `karavan.ai.backend` | string | `"copilot"` | AI backend: copilot, openai, local |
| `karavan.ai.telemetry` | boolean | `false` | Send anonymous usage data |

### GitHub Copilot Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `karavan.ai.copilot.enabled` | boolean | `true` | Use Copilot when available |
| `karavan.ai.copilot.fallbackToOpenAI` | boolean | `false` | Fallback if Copilot unavailable |

### OpenAI Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `karavan.ai.openai.apiKey` | string | `""` | OpenAI API key |
| `karavan.ai.openai.model` | string | `"gpt-4"` | Model to use |
| `karavan.ai.openai.maxTokens` | number | `4096` | Max response tokens |
| `karavan.ai.openai.temperature` | number | `0.7` | Creativity (0-1) |
| `karavan.ai.openai.organization` | string | `""` | Organization ID |

### Local LLM Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `karavan.ai.local.endpoint` | string | `"http://localhost:11434"` | Ollama API endpoint |
| `karavan.ai.local.model` | string | `"codellama"` | Model name |
| `karavan.ai.local.timeout` | number | `60000` | Request timeout (ms) |

### Feature Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `karavan.ai.diagnostics.enabled` | boolean | `true` | Enable real-time validation |
| `karavan.ai.diagnostics.severity` | string | `"warning"` | Minimum severity to show |
| `karavan.ai.suggestions.autoShow` | boolean | `true` | Auto-show suggestions |
| `karavan.ai.optimization.enabled` | boolean | `true` | Enable optimization analysis |
| `karavan.ai.hover.enabled` | boolean | `true` | Show AI hover information |

### Performance Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `karavan.ai.cache.enabled` | boolean | `true` | Cache AI responses |
| `karavan.ai.cache.ttl` | number | `3600000` | Cache TTL (ms) |
| `karavan.ai.debounce.delay` | number | `500` | Input debounce (ms) |
| `karavan.ai.maxConcurrent` | number | `3` | Max concurrent requests |

---

## Verification

### Check AI Status

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "Karavan: Check AI Status"
3. Review the status output:

```
Karavan AI Status
-----------------
Backend: openai
Status: Connected ✓
Model: gpt-4
Response Time: 245ms
Rate Limit: 60/60 remaining
```

### Test Generation

1. Open AI Chat Panel (`Ctrl+Shift+K`)
2. Type: "Create a simple timer route"
3. Verify you receive a valid response:

```yaml
- from:
    uri: "timer:tick?period=5000"
    steps:
      - log:
          message: "Timer fired at ${date:now:HH:mm:ss}"
```

### Test Diagnostics

1. Create a new `.yaml` file
2. Paste invalid YAML:
   ```yaml
   - from:
       uri: "invalid
   ```
3. Verify you see error squiggles
4. Hover to see the error message

---

## Enterprise Configuration

### Proxy Configuration

For corporate networks requiring proxy:

```json
{
  "http.proxy": "http://proxy.company.com:8080",
  "http.proxyStrictSSL": true,
  "karavan.ai.openai.baseUrl": "https://proxy.company.com/openai"
}
```

### Custom OpenAI Endpoint

For Azure OpenAI or custom deployments:

```json
{
  "karavan.ai.backend": "openai",
  "karavan.ai.openai.baseUrl": "https://your-resource.openai.azure.com",
  "karavan.ai.openai.apiKey": "your-azure-key",
  "karavan.ai.openai.apiVersion": "2024-02-15-preview",
  "karavan.ai.openai.deploymentId": "your-deployment"
}
```

### Offline Mode

For air-gapped environments:

1. Install Ollama on internal network
2. Pull models while connected:
   ```bash
   ollama pull codellama:13b
   ```
3. Configure Karavan for local endpoint:
   ```json
   {
     "karavan.ai.backend": "local",
     "karavan.ai.local.endpoint": "http://internal-ollama:11434"
   }
   ```

### Centralized Configuration

For team-wide settings, use workspace settings:

`.vscode/settings.json`:
```json
{
  "karavan.ai.backend": "openai",
  "karavan.ai.openai.model": "gpt-4",
  "karavan.ai.diagnostics.enabled": true,
  "karavan.ai.optimization.enabled": true
}
```

---

## Troubleshooting Installation

### Extension Not Loading

1. Check VS Code version: `Help > About`
2. Check extension is enabled: `Ctrl+Shift+X` → Installed
3. Check for conflicts: Disable other extensions
4. View logs: `Help > Toggle Developer Tools > Console`

### API Connection Issues

**OpenAI:**
```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-..."
```

**Ollama:**
```bash
# Test endpoint
curl http://localhost:11434/api/tags

# Check service
systemctl status ollama  # Linux
```

### Performance Issues

1. Reduce max tokens:
   ```json
   { "karavan.ai.openai.maxTokens": 2048 }
   ```

2. Enable caching:
   ```json
   { "karavan.ai.cache.enabled": true }
   ```

3. Use lighter model:
   ```json
   { "karavan.ai.openai.model": "gpt-3.5-turbo" }
   ```

---

## Next Steps

After setup is complete:

1. Read the [User Guide](AI_COPILOT_USER_GUIDE.md) for feature details
2. Try the [Getting Started Tutorial](AI_COPILOT_TUTORIAL.md)
3. Check [Troubleshooting Guide](AI_COPILOT_TROUBLESHOOTING.md) if issues arise

---

*For support, visit [GitHub Issues](https://github.com/apache/camel-karavan/issues)*
