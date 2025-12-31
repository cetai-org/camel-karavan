# Quick Start Guide - Karavan AI Copilot

## For Developers

### Build and Test

1. **Install dependencies**:
   ```bash
   cd karavan-vscode
   npm install
   ```

2. **Compile TypeScript**:
   ```bash
   npm run compile
   ```

3. **Launch Extension Development Host**:
   - Open `karavan-vscode` folder in VSCode
   - Press `F5` to launch Extension Development Host
   - A new VSCode window will open with the extension loaded

4. **Test AI Panel**:
   - In the new window, open Command Palette (`Ctrl+Shift+P`)
   - Type and run: "Karavan: Open AI Copilot"
   - The AI panel should open on the right side

### Quick Test Scenarios

#### Test 1: Open AI Panel
```
✓ Command Palette → "Karavan: Open AI Copilot"
✓ Verify panel opens
✓ Verify login options displayed
```

#### Test 2: OpenAI Authentication
```
✓ Click "OpenAI API Key" option
✓ Enter API key: sk-... (your real key)
✓ Verify "Connecting..." message
✓ Verify transitions to chat interface
```

#### Test 3: Commands
```
✓ Command Palette → "Karavan: Generate Route with AI"
✓ Enter: "REST API that sends to Kafka"
✓ Verify AI panel opens with prompt
```

#### Test 4: Context Menu
```
✓ Create/Open a .yaml file
✓ Right-click in editor
✓ Select "Karavan: Generate Route with AI"
✓ Verify prompt dialog appears
```

## For End Users

### Installation
1. Install the Karavan extension from VSCode Marketplace
2. Reload VSCode
3. AI Copilot is ready to use!

### First Time Setup

1. **Open AI Panel**:
   - Click the sparkle (✨) icon in the Integrations view, OR
   - Press `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Shift+K` (Mac), OR
   - Command Palette → "Karavan: Open AI Copilot"

2. **Choose Authentication Method**:
   
   **Option A: GitHub Copilot** (Recommended if you have it)
   - Click "GitHub Copilot"
   - Extension will check if GitHub Copilot is installed
   - Follow any prompts to authorize

   **Option B: OpenAI API Key**
   - Click "OpenAI API Key"
   - Enter your API key from https://platform.openai.com/api-keys
   - Click "Connect"
   
   **Option C: Local LLM**
   - Install Ollama or similar: https://ollama.ai/
   - Start Ollama: `ollama serve`
   - Click "Local LLM" in AI panel
   - Default endpoint: http://localhost:11434

3. **Start Using**:
   Once authenticated, you'll see a chat interface where you can:
   - Describe integration routes you want to create
   - Ask for help with Camel components
   - Get suggestions for EIPs (Enterprise Integration Patterns)

### Example Usage

#### Generate a REST to Kafka Route
1. Open AI Panel
2. Type: "Create a REST API endpoint that accepts JSON and publishes to Kafka"
3. AI will generate the Camel YAML route
4. Click "Apply" to add it to your project

#### Get Component Suggestions
1. Open AI Panel  
2. Type: "What component should I use to read files from FTP?"
3. AI will suggest appropriate components with configuration examples

### Configuration

Open VSCode Settings (`Ctrl+,`) and search for "Karavan AI":

- **Enable/Disable**: `karavan.ai.enabled`
- **AI Backend**: `karavan.ai.backend` (openai, github-copilot, local-llm)
- **Model**: `karavan.ai.model` (gpt-4, gpt-3.5-turbo, etc.)
- **Local LLM Endpoint**: `karavan.ai.localLlmEndpoint`

### Keyboard Shortcuts

- `Ctrl+Shift+K` (Windows/Linux) / `Cmd+Shift+K` (Mac): Open AI Panel

### Troubleshooting

#### Panel doesn't open
- Check if extension is activated: Look for "Karavan" in Extensions view
- Reload VSCode: Command Palette → "Reload Window"
- Check Developer Console: Help → Toggle Developer Tools

#### Authentication fails
- **OpenAI**: Verify API key is valid at https://platform.openai.com/api-keys
- **GitHub Copilot**: Ensure extension is installed and you're signed in
- **Local LLM**: Check if Ollama is running: `curl http://localhost:11434`

#### API key not saving
- VSCode Secret Storage might be locked
- Try logging out and logging in again
- Check VSCode logs: Help → Toggle Developer Tools → Console tab

## Development Tips

### State Machine Debugging
```typescript
// In aiMachine.ts, the state machine logs state changes
AIStateMachine.service().subscribe((state) => {
    console.log('AI State:', state.value);
});
```

### Token Management
```typescript
// Check stored token
const token = await getAccessToken();
console.log('Has token:', !!token);

// Clear token for testing
await clearToken();
```

### Webview Communication
```typescript
// From extension → webview
panel.webview.postMessage({
    command: 'testMessage',
    data: { test: true }
});

// From webview → extension (in HTML)
vscode.postMessage({
    command: 'testResponse',
    value: 'Hello from webview'
});
```

## Next Steps

After Phase 1, you should:
1. ✅ Be able to open AI panel
2. ✅ Be able to authenticate
3. ✅ See basic chat interface
4. ⏳ Wait for Phase 2 for actual AI responses
5. ⏳ Wait for Phase 3 for code generation

## Getting Help

- **Issues**: https://github.com/cetai-org/camel-karavan/issues
- **Documentation**: See AI_COPILOT_IMPLEMENTATION_APPROACH.md
- **Camel Docs**: https://camel.apache.org/

---

**Version**: Phase 1  
**Last Updated**: December 31, 2025
