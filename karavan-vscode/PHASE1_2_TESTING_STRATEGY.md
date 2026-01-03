# Karavan AI Copilot - Consolidated Testing Strategy

**Version**: 1.0  
**Date**: January 3, 2026  
**Phases Covered**: Phase 1 (Foundation) + Phase 2 (Chat & AI Backend)  
**Target Tester**: Developers with GitHub Copilot subscription

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Phase 1 Testing (Foundation Layer)](#phase-1-testing-foundation-layer)
4. [Phase 2 Testing (Chat & AI Backend)](#phase-2-testing-chat--ai-backend)
5. [GitHub Copilot Specific Testing](#github-copilot-specific-testing)
6. [Error Scenario Testing](#error-scenario-testing)
7. [Configuration Testing](#configuration-testing)
8. [Performance & Load Testing](#performance--load-testing)
9. [Advanced Testing Scenarios](#advanced-testing-scenarios)
10. [Test Execution Matrices](#test-execution-matrices)
11. [Quick Smoke Test (5 minutes)](#quick-smoke-test-5-minutes)
12. [Known Issues to Watch](#known-issues-to-watch)
13. [Debugging & Troubleshooting](#debugging--troubleshooting)
14. [Test Reporting Template](#test-reporting-template)

---

## Testing Overview

### Objectives
- ✅ Validate Phase 1 foundation: authentication, state machine, UI integration
- ✅ Validate Phase 2 functionality: chat interface, streaming responses, code application
- ✅ Ensure GitHub Copilot integration works seamlessly
- ✅ Verify error handling and recovery mechanisms
- ✅ Test context gathering accuracy
- ✅ Validate code generation and application features

### Scope
- **In Scope**: Extension commands, webview panels, authentication, chat interface, code generation, context gathering
- **Out of Scope**: Actual AI model quality, upstream API reliability, VSCode internal systems

### Test Duration
- **Quick Smoke Test**: 5 minutes
- **Full Phase 1**: 1 hour
- **Full Phase 2**: 2 hours
- **Complete Test Suite**: 4-5 hours

### Success Criteria
- All Phase 1 components initialize without errors
- Chat interface responds to messages with streaming output
- Context gathering extracts file and project information
- Code application successfully inserts/creates files
- Error handling displays user-friendly messages
- GitHub Copilot authentication works seamlessly

---

## Test Environment Setup

### Prerequisites
- **VSCode**: Latest stable version (1.85+)
- **Node.js**: v16+ and npm v8+
- **Git**: Latest version
- **GitHub Copilot**: Active subscription in VSCode
- **Camel Routes**: Sample `.yaml` files for testing (optional but recommended)

### Initial Setup

```bash
# 1. Navigate to workspace
cd /home/user/work/cetai-org/camel-karavan/karavan-vscode

# 2. Verify dependencies are installed
npm install

# 3. Compile TypeScript
npm run compile

# 4. Start watch mode for auto-compilation (keep terminal open)
npm run watch

# 5. Create sample test files (optional)
mkdir -p test-files
touch test-files/test-route.camel.yaml
```

### Sample Test Route File

Save as `test-files/test-route.camel.yaml`:

```yaml
- route:
    id: rest-to-kafka-route
    from:
      uri: rest:post:/api/orders
      steps:
        - log:
            message: "Received order: ${body}"
        - marshal:
            json: {}
        - to:
            uri: kafka:orders?brokers=localhost:9092
```

### Launch Extension

```bash
# Press F5 in VSCode to launch Extension Development Host
# Or use Command Palette: Debug: Start Debugging
# Extension will load in a new VSCode window
```

---

## Phase 1 Testing (Foundation Layer)

### 1.1 Extension Activation

**Objective**: Verify extension loads without errors and is discoverable

**Steps**:
1. Launch Extension Development Host (F5)
2. Wait for extension to activate (~5 seconds)
3. Check status bar - should show no errors
4. Open Command Palette (`Ctrl+Shift+P`)

**Expected Results**:
- [ ] Extension activates without errors
- [ ] No red error indicators in UI
- [ ] Command Palette responds normally
- [ ] Extension appears in Extensions view

**Pass Criteria**: All items checked, no errors in console

---

### 1.2 Command Registration

**Objective**: Verify all Karavan AI commands are registered and discoverable

**Steps**:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "karavan" and observe list
3. Look for these commands:
   - `karavan.ai.openPanel`
   - `karavan.ai.generateRoute`
   - `karavan.ai.suggestComponent`
   - `karavan.ai.closePanel` (if implemented)

**Expected Results**:
- [ ] All AI commands appear with sparkle/AI icon
- [ ] Commands have descriptions visible
- [ ] Keyboard shortcuts displayed (if configured)
- [ ] Other Karavan commands visible too

**Pass Criteria**: At least 3 main AI commands visible

---

### 1.3 State Machine Initialization

**Objective**: Verify XState machine initializes with correct state

**Steps**:
1. Open DevTools (`Ctrl+Shift+I` in Extension Host window)
2. Go to Console tab
3. Execute command `karavan.ai.openPanel`
4. Observe console logs for state transitions

**Expected Results**:
- [ ] Console shows initialization logs
- [ ] State transitions: `Initialize` → `Unauthenticated`
- [ ] No TypeScript or runtime errors
- [ ] AI panel opens successfully
- [ ] No "undefined" or "null" references

**Pass Criteria**: Clean state machine flow with no errors

---

### 1.4 Webview Panel Rendering

**Objective**: Verify webview UI renders correctly with proper styling

**Steps**:
1. With AI panel open, observe the panel interface
2. Check visual elements:
   - Title bar ("AI Copilot" or similar)
   - Three login option buttons/sections
   - Proper VSCode theming (light/dark mode)
   - No layout issues or overlapping elements

**Expected Results**:
- [ ] Panel title visible and readable
- [ ] GitHub Copilot button visible and enabled
- [ ] OpenAI API Key input field visible
- [ ] Local LLM button visible
- [ ] Buttons properly spaced and clickable
- [ ] Theming matches VSCode theme
- [ ] No visual glitches or rendering errors

**Pass Criteria**: All UI elements visible and properly styled

---

### 1.5 Context Menu Integration

**Objective**: Verify right-click context menu appears on YAML files

**Steps**:
1. Open or create a `.yaml` file (e.g., `test-route.camel.yaml`)
2. Right-click in the editor area
3. Scroll through context menu looking for AI option

**Expected Results**:
- [ ] Context menu appears
- [ ] "Karavan: Generate Route with AI" option visible
- [ ] Option is enabled (not grayed out)
- [ ] Option has AI-related icon
- [ ] Clicking opens AI panel with route generation prompt

**Pass Criteria**: Context menu option visible and functional

---

### 1.6 View Title Menu Integration

**Objective**: Verify AI button appears in view title bar

**Steps**:
1. Focus on the Explorer/Integrations view in sidebar
2. Look at view title bar (where sort, filter icons appear)
3. Check for AI/sparkle icon

**Expected Results**:
- [ ] AI icon visible in view title area
- [ ] Icon is clickable/hoverable
- [ ] Clicking opens AI panel
- [ ] Icon shows tooltip on hover

**Pass Criteria**: View title button visible and functional

---

### 1.7 Configuration Detection

**Objective**: Verify extension reads VSCode settings correctly

**Steps**:
1. Check VSCode Settings (`Ctrl+,`)
2. Search for "karavan.ai"
3. Observe available settings:
   - `karavan.ai.enabled`
   - `karavan.ai.backend`
   - `karavan.ai.model`
   - `karavan.ai.localLlmEndpoint`

**Expected Results**:
- [ ] All AI configuration keys listed
- [ ] Descriptions are clear
- [ ] Default values are set
- [ ] Can modify settings without errors

**Pass Criteria**: All expected settings present and editable

---

### 1.8 Panel Lifecycle

**Objective**: Verify panel can be opened, closed, and reopened correctly

**Steps**:
1. Open AI panel via command
2. Verify it appears
3. Close panel (click X or press Escape)
4. Reopen panel via different method (context menu)
5. Repeat step 4 one more time with view title

**Expected Results**:
- [ ] Panel opens from command
- [ ] Panel closes cleanly
- [ ] State preserved between closes/opens
- [ ] Panel reopens from context menu
- [ ] Panel reopens from view title
- [ ] No memory leaks or errors on repeated cycles
- [ ] Session context retained (if applicable)

**Pass Criteria**: Panel opens/closes smoothly multiple times

---

## Phase 2 Testing (Chat & AI Backend)

### 2.1 GitHub Copilot Authentication

**Objective**: Verify GitHub Copilot login works seamlessly (primary use case)

**Prerequisites**:
- GitHub Copilot extension installed
- GitHub Copilot subscription active
- VSCode signed in with GitHub account

**Steps**:
1. Open AI panel (`Ctrl+Shift+P` → "Open AI Copilot")
2. Observe login panel with three options
3. Click "GitHub Copilot" button
4. Observe state transitions

**Expected Results**:
- [ ] "GitHub Copilot" button is enabled (not disabled)
- [ ] Clicking button doesn't show error
- [ ] State transitions: `Unauthenticated` → `Authenticating` → `Authenticated`
- [ ] Chat interface appears (not login panel)
- [ ] Welcome message visible
- [ ] Input field ready for typing
- [ ] No authentication dialogs or popups
- [ ] Authentication completes in <5 seconds

**Pass Criteria**: GitHub Copilot authentication succeeds, chat interface appears

**Note**: This is your primary test path since you have an active subscription.

---

### 2.2 OpenAI API Key Authentication

**Objective**: Verify OpenAI API key input and validation works

**Prerequisites**:
- Valid OpenAI API key (format: `sk-...`)
- API key has active credits/usage

**Steps**:
1. Close AI panel or reset state (close and reopen)
2. Open AI panel again
3. Click "OpenAI API Key" input field
4. Type/paste your OpenAI API key
5. Press Enter or click authenticate button
6. Observe state transitions

**Expected Results**:
- [ ] Input field accepts text
- [ ] No characters visible (masked for security)
- [ ] Key is validated (format check)
- [ ] Invalid keys show error: "Invalid API key format"
- [ ] Valid keys proceed to authentication
- [ ] State transitions correctly
- [ ] Chat interface appears after success
- [ ] Key is stored securely (not visible in logs)

**Pass Criteria**: OpenAI authentication succeeds with valid key, fails gracefully with invalid key

---

### 2.3 Local LLM Authentication (Optional)

**Objective**: Verify Local LLM backend detection and connection

**Prerequisites** (if testing):
- Ollama installed and running locally
- Model pulled (e.g., `ollama pull llama2`)
- Server listening on `localhost:11434`

**Steps**:
1. Ensure Ollama is running: `ollama serve`
2. In another terminal, verify connectivity: `curl http://localhost:11434/api/tags`
3. In AI panel, click "Local LLM" button
4. Observe connection attempt

**Expected Results**:
- [ ] Button click triggers connection check
- [ ] If Ollama available: authenticates and shows chat interface
- [ ] If Ollama unavailable: shows error message
- [ ] Error message suggests starting Ollama
- [ ] State handling correct (Authenticating → success or failure)

**Pass Criteria**: Correctly detects and connects to local LLM (or shows appropriate error)

---

### 2.4 Chat Message Sending

**Objective**: Verify user can send messages and receive responses

**Prerequisites**:
- AI panel authenticated with any backend
- Chat interface visible

**Steps**:
1. Click in message input field
2. Type: `Hello, can you help me create a Camel route?`
3. Press `Enter` key
4. Observe message sending and response

**Expected Results**:
- [ ] Input field accepts text
- [ ] Text appears in message input
- [ ] Enter key sends message
- [ ] User message appears in chat with timestamp
- [ ] User message shows on right or distinct styling
- [ ] Loading indicator appears while waiting
- [ ] AI response appears after 5-30 seconds
- [ ] Response shows as "Assistant" message
- [ ] No error messages in console

**Pass Criteria**: Message sends and response arrives without errors

---

### 2.5 Streaming Response Display

**Objective**: Verify AI responses stream in real-time with visual feedback

**Prerequisites**:
- Chat authenticated and ready
- At least one message exchange completed

**Steps**:
1. Send another message: `Generate a REST API route that receives JSON and sends to Kafka`
2. Watch the response appear character by character (or in chunks)
3. Observe loading indicators

**Expected Results**:
- [ ] Response appears incrementally (streaming)
- [ ] Blinking cursor visible at end of response (indicates streaming)
- [ ] Response builds up progressively
- [ ] No long delays between chunks
- [ ] Response completes and cursor disappears
- [ ] Final response is complete and readable
- [ ] Streaming takes 10-40 seconds depending on response length
- [ ] No broken text or malformed chunks

**Pass Criteria**: Streaming response displays smoothly with visual indicator

---

### 2.6 Multi-message Conversation

**Objective**: Verify chat maintains context across multiple messages

**Prerequisites**:
- Chat active with history of messages

**Steps**:
1. Send: `Create a Kafka consumer route`
2. Wait for response
3. Send follow-up: `Add error handling to that route`
4. Observe if AI references the previous route

**Expected Results**:
- [ ] First response about Kafka consumer appears
- [ ] Second message sends successfully
- [ ] AI response acknowledges previous route
- [ ] AI understands context without re-explaining
- [ ] Messages display in chronological order
- [ ] Conversation flows naturally
- [ ] No duplicate messages in history

**Pass Criteria**: AI maintains conversation context across messages

---

### 2.7 Context Gathering - Current File

**Objective**: Verify AI knows about the file you're currently editing

**Prerequisites**:
- Have the sample Camel route file open
- AI panel authenticated

**Steps**:
1. Open `test-files/test-route.camel.yaml` (or your own route file)
2. Make sure it's the active editor
3. In AI chat, send: `What does this route do?`
4. Observe AI response

**Expected Results**:
- [ ] AI mentions specific routes from your file
- [ ] AI identifies REST endpoint: `/api/orders`
- [ ] AI mentions Kafka destination
- [ ] AI references marshaling to JSON
- [ ] Response shows file-specific understanding
- [ ] No generic "I don't see your file" messages
- [ ] Mentions specific component URIs from file

**Pass Criteria**: AI accurately describes the current route file

---

### 2.8 Context Gathering - Project Metadata

**Objective**: Verify AI knows about project configuration and runtime

**Prerequisites**:
- Chat authenticated
- Project directory open in VSCode

**Steps**:
1. Send: `What Camel runtime am I using?`
2. Observe response

**Expected Results**:
- [ ] AI identifies runtime (Quarkus, Spring Boot, or Camel Main)
- [ ] AI mentions detected Camel version (if available)
- [ ] Response is specific, not generic
- [ ] AI may reference pom.xml or build config

**Pass Criteria**: AI identifies project runtime correctly

---

### 2.9 Code Generation Request

**Objective**: Verify AI can generate Camel route code

**Prerequisites**:
- Chat authenticated
- No specific file open (or doesn't matter)

**Steps**:
1. Send: `Create a REST API route that accepts JSON orders and sends to an ActiveMQ queue`
2. Wait for response
3. Look for code block in response

**Expected Results**:
- [ ] AI provides response with code
- [ ] Code is in YAML format (Camel route format)
- [ ] Code block has syntax highlighting
- [ ] Code includes REST endpoint configuration
- [ ] Code includes ActiveMQ queue destination
- [ ] Code looks valid and well-formatted
- [ ] "Copy" button visible under code block
- [ ] "Apply" button visible under code block

**Pass Criteria**: AI generates valid Camel route code with copy/apply buttons

---

### 2.10 Code Application - Insert at Cursor

**Objective**: Verify generated code can be inserted into current file

**Prerequisites**:
- Sample route file open (e.g., `test-route.camel.yaml`)
- Code block generated in chat (from previous step)
- Cursor positioned in file

**Steps**:
1. Position cursor at end of route file
2. In chat, look at generated code block
3. Click "Apply" button
4. Observe file update

**Expected Results**:
- [ ] "Apply" button is clickable
- [ ] Code inserts at cursor position
- [ ] Code appears in file editor
- [ ] Code is properly indented
- [ ] File shows as modified (dot in tab name)
- [ ] VSCode shows file as edited (in source control)
- [ ] No syntax errors shown in editor
- [ ] Success notification appears: "Code applied successfully"

**Pass Criteria**: Code inserts into file at cursor without errors

---

### 2.11 Code Application - Create New File

**Objective**: Verify code can be saved to new file when no file open

**Prerequisites**:
- AI panel open (can be minimal file open)
- Code block generated in chat

**Steps**:
1. Click "Apply" button on code block
2. If no specific file open, observe file creation dialog
3. Enter filename: `generated-route.camel.yaml`
4. Choose location in project
5. Click Save

**Expected Results**:
- [ ] Save dialog appears (file picker)
- [ ] Dialog pre-selects `.yaml` extension
- [ ] Default location is project root or last used
- [ ] File is created with generated code
- [ ] File opens automatically in editor
- [ ] Code is visible and properly formatted
- [ ] Success notification shows

**Pass Criteria**: New file created with generated code

---

### 2.12 Code Copying

**Objective**: Verify code can be copied to clipboard

**Prerequisites**:
- Code block visible in chat

**Steps**:
1. In chat, look at code block
2. Click "Copy" button
3. Switch to text editor (or chat input)
4. Press `Ctrl+V` to paste

**Expected Results**:
- [ ] "Copy" button is clickable
- [ ] Cursor changes to show click feedback
- [ ] Success notification: "Copied to clipboard"
- [ ] Code pastes correctly when pasted
- [ ] Clipboard contains exact code from block
- [ ] Code formatting preserved

**Pass Criteria**: Code successfully copied to clipboard

---

### 2.13 Clear Chat History

**Objective**: Verify chat history can be cleared

**Prerequisites**:
- Chat with multiple messages visible

**Steps**:
1. Note the messages in chat
2. Right-click in chat area (or look for menu)
3. Find "Clear Chat" or similar option
4. Confirm action if prompted
5. Observe chat cleared

**Expected Results**:
- [ ] Right-click menu appears
- [ ] "Clear Chat" option visible
- [ ] Clicking shows confirmation (or clears immediately)
- [ ] All messages disappear
- [ ] Welcome message reappears
- [ ] Input field still functional
- [ ] Can send new messages after clear

**Pass Criteria**: Chat cleared successfully, welcome message returns

---

### 2.14 Message Input - Multi-line

**Objective**: Verify multi-line message input works (Shift+Enter)

**Prerequisites**:
- Chat authenticated

**Steps**:
1. Click in message input field
2. Type: `Line one`
3. Press `Shift+Enter` (not just Enter)
4. Type: `Line two`
5. Press `Shift+Enter` again
6. Type: `Line three`
7. Press `Enter` to send

**Expected Results**:
- [ ] Input field expands to show 3 lines
- [ ] `Shift+Enter` creates new line (not sending)
- [ ] Regular `Enter` sends complete message
- [ ] Message sends as multi-line content
- [ ] AI response handles multi-line input
- [ ] Newlines preserved in message history

**Pass Criteria**: Multi-line input works with Shift+Enter

---

## GitHub Copilot Specific Testing

### 3.1 Extension Detection

**Objective**: Verify GitHub Copilot extension is detected

**Prerequisites**:
- GitHub Copilot extension installed in VSCode

**Steps**:
1. In Extension Development Host, look at Extensions view
2. Search for "Copilot"
3. Verify GitHub Copilot extension visible
4. Check its status (should be running)

**Expected Results**:
- [ ] GitHub Copilot extension installed
- [ ] Extension status is "Running" (not disabled)
- [ ] No errors in extension details
- [ ] Copilot features available in main VSCode

**Pass Criteria**: GitHub Copilot extension active and available

---

### 3.2 Copilot API Integration

**Objective**: Verify extension can access Copilot Chat API

**Prerequisites**:
- GitHub Copilot authenticated
- VSCode signed in

**Steps**:
1. Open AI panel
2. Click GitHub Copilot login
3. Observe authentication process
4. Check console logs for API calls

**Expected Results**:
- [ ] No permission errors
- [ ] No "extension not available" messages
- [ ] Authentication completes in <5 seconds
- [ ] Console shows successful connection
- [ ] Chat interface appears

**Pass Criteria**: Copilot API accessible without permission errors

---

### 3.3 Copilot Streaming Quality

**Objective**: Verify Copilot responses stream smoothly

**Prerequisites**:
- Chat authenticated via GitHub Copilot
- Multiple messages sent

**Steps**:
1. Send: `Write a Camel route that reads from an FTP server, filters messages, and sends to a REST endpoint`
2. Watch response stream
3. Check response quality

**Expected Results**:
- [ ] Response streams in real-time
- [ ] No long pauses between chunks
- [ ] Response includes complete code if requested
- [ ] Response is Camel-specific and accurate
- [ ] No truncated responses
- [ ] Formatting preserved (code blocks, lists)

**Pass Criteria**: Copilot streaming is smooth and response quality is good

---

### 3.4 Copilot Camel Knowledge

**Objective**: Verify Copilot understands Camel concepts

**Prerequisite**:
- Chat authenticated with Copilot

**Steps**:
1. Send: `Explain the difference between multicast and split EIP patterns in Camel`
2. Observe response quality
3. Send: `How do I configure an HTTP component to use basic authentication?`
4. Observe response accuracy

**Expected Results**:
- [ ] Response shows Camel expertise
- [ ] Explains EIP concepts accurately
- [ ] Provides code examples if relevant
- [ ] Mentions Camel-specific configuration
- [ ] No generic programming responses
- [ ] Can answer follow-up questions about Camel

**Pass Criteria**: Copilot demonstrates solid Camel knowledge

---

### 3.5 Copilot Context Awareness

**Objective**: Verify Copilot uses project context in responses

**Prerequisites**:
- Sample route file open
- Chat authenticated with Copilot

**Steps**:
1. Open a Camel route file with specific configuration
2. Send: `Improve this route for better error handling`
3. Observe if Copilot references specific components/config

**Expected Results**:
- [ ] Copilot acknowledges current file
- [ ] Suggestions reference actual components in file
- [ ] Improvements are context-specific
- [ ] Not generic advice
- [ ] Maintains conversation thread

**Pass Criteria**: Copilot is context-aware and specific to your routes

---

## Error Scenario Testing

### 4.1 Invalid OpenAI API Key

**Objective**: Verify graceful error handling for invalid API keys

**Steps**:
1. Open AI panel
2. Click "OpenAI API Key"
3. Enter invalid key: `sk-invalid123`
4. Press Enter
5. Observe error handling

**Expected Results**:
- [ ] Error message appears: "Invalid API key format" or similar
- [ ] Clear error text describing the problem
- [ ] Helpful suggestion (e.g., "Check your API key")
- [ ] Can retry immediately
- [ ] Login panel reappears
- [ ] No exception or crash

**Pass Criteria**: Invalid key rejected with user-friendly message

---

### 4.2 Network Error - No Internet

**Objective**: Verify handling when network is unavailable

**Steps**:
1. Disconnect internet (disable WiFi or network adapter)
2. Open AI panel and authenticate
3. Try to send message
4. Observe error handling

**Expected Results**:
- [ ] Error message appears: "Network error" or "Connection failed"
- [ ] Message suggests checking internet
- [ ] Can retry after reconnecting
- [ ] No hanging or frozen UI
- [ ] UI remains responsive
- [ ] Clear error in chat or notification

**Pass Criteria**: Network error handled gracefully with recovery option

---

### 4.3 API Rate Limiting

**Objective**: Verify handling when API rate limits hit

**Prerequisites**:
- Send many messages in quick succession (10+)

**Steps**:
1. Authenticate (OpenAI or Copilot)
2. Rapidly send multiple messages
3. Wait for rate limit response

**Expected Results**:
- [ ] After several requests, appropriate error appears
- [ ] Error message: "Rate limit exceeded" or similar
- [ ] Suggests waiting before retrying
- [ ] Shows approximate wait time if available
- [ ] UI doesn't crash
- [ ] Can retry after appropriate delay

**Pass Criteria**: Rate limiting handled with user guidance

---

### 4.4 Malformed YAML in File

**Objective**: Verify context gathering handles invalid YAML gracefully

**Steps**:
1. Create file with invalid YAML:
   ```yaml
   - route:
       id: bad-route
       from:
         uri: rest:get
       steps  # missing colon here
         - log: {}
   ```
2. Open this file in editor
3. Send message: `Help me fix this route`
4. Observe how AI handles it

**Expected Results**:
- [ ] AI doesn't crash on parsing attempt
- [ ] AI mentions YAML syntax error
- [ ] AI suggests the fix
- [ ] Error message in chat (not VSCode error)
- [ ] Helpful guidance provided
- [ ] Can continue chatting

**Pass Criteria**: Invalid YAML handled gracefully with helpful guidance

---

### 4.5 Large File Context

**Objective**: Verify context gathering handles large files

**Steps**:
1. Create a large Camel route file (500+ lines, 5+ routes)
2. Open in editor
3. Send: `Summarize all routes in this file`
4. Observe context gathering performance

**Expected Results**:
- [ ] Context gathering completes in <3 seconds
- [ ] No timeout errors
- [ ] AI receives full file context
- [ ] Response is accurate for large file
- [ ] No performance degradation
- [ ] UI remains responsive

**Pass Criteria**: Large files handled without timeouts or errors

---

### 4.6 No Authentication Token

**Objective**: Verify handling when token is missing/expired

**Steps**:
1. Manually clear stored token (simulate expiration)
2. Try to send message without re-authenticating
3. Observe error handling

**Expected Results**:
- [ ] Error message: "Authentication required" or similar
- [ ] Redirects to login panel
- [ ] Can re-authenticate
- [ ] Clear guidance on what to do
- [ ] No cryptic error messages

**Pass Criteria**: Missing token handled with redirect to login

---

### 4.7 Empty Message Sending

**Objective**: Verify handling of empty or whitespace-only messages

**Steps**:
1. Click in input field
2. Press Enter with no text
3. Try again with just spaces/tabs
4. Observe handling

**Expected Results**:
- [ ] Empty message not sent
- [ ] Whitespace-only message not sent
- [ ] No error message (just no action)
- [ ] Input field clears
- [ ] Prompt remains ready for input
- [ ] No error in console

**Pass Criteria**: Empty messages silently ignored

---

## Configuration Testing

### 5.1 Configuration Property Discovery

**Objective**: Verify all AI configuration options available in settings

**Steps**:
1. Open VSCode Settings (`Ctrl+,`)
2. Search for "karavan.ai"
3. Review all settings

**Expected Results**:
- [ ] `karavan.ai.enabled` - boolean, default true
- [ ] `karavan.ai.backend` - dropdown, options: openai, github-copilot, local-llm
- [ ] `karavan.ai.model` - string, default gpt-4
- [ ] `karavan.ai.openaiApiKey` - password field
- [ ] `karavan.ai.localLlmEndpoint` - URL field, default localhost:11434
- [ ] Each has clear description
- [ ] Defaults are sensible

**Pass Criteria**: All configuration options present and documented

---

### 5.2 Backend Switching

**Objective**: Verify switching between backends via configuration

**Prerequisites**:
- At least two backends available (Copilot + OpenAI)

**Steps**:
1. Authenticate with GitHub Copilot
2. Close AI panel
3. Change setting: `karavan.ai.backend` to "openai"
4. Reload VSCode window (`Ctrl+R` or F5)
5. Open AI panel - should show OpenAI login

**Expected Results**:
- [ ] Setting change is respected
- [ ] Backend switches on reload
- [ ] Correct login panel appears
- [ ] Previous authentication is cleared
- [ ] New backend can be authenticated
- [ ] No errors during switch

**Pass Criteria**: Backend switching works correctly

---

### 5.3 Enabled/Disabled Toggle

**Objective**: Verify AI feature can be disabled via configuration

**Steps**:
1. Confirm AI panel works normally
2. Change setting: `karavan.ai.enabled` to false
3. Reload window
4. Try to open AI panel

**Expected Results**:
- [ ] Commands still visible (not hidden)
- [ ] AI panel shows "Disabled" message
- [ ] Cannot authenticate when disabled
- [ ] Helpful message explains feature is disabled
- [ ] Re-enable by setting to true
- [ ] Works again after re-enabling

**Pass Criteria**: Enable/disable toggle works correctly

---

### 5.4 Model Configuration

**Objective**: Verify model selection configuration

**Steps**:
1. With OpenAI authenticated, change: `karavan.ai.model` to "gpt-3.5-turbo"
2. Send a message
3. Observe response (should be faster but simpler)
4. Change back to "gpt-4"
5. Send another message

**Expected Results**:
- [ ] Setting change respected on next request
- [ ] Different models produce different response quality
- [ ] No errors with different model names
- [ ] Invalid models show error

**Pass Criteria**: Model configuration respected by backend

---

### 5.5 Local LLM Endpoint Configuration

**Objective**: Verify custom endpoint configuration for Local LLM

**Prerequisites**:
- Ollama running on custom port

**Steps**:
1. Start Ollama on non-standard port: `ollama serve --port 11435`
2. In settings, change: `karavan.ai.localLlmEndpoint` to "http://localhost:11435"
3. Open AI panel, select Local LLM
4. Should connect to custom endpoint

**Expected Results**:
- [ ] Custom endpoint setting is used
- [ ] Connection attempts to custom URL
- [ ] Success if Ollama running there
- [ ] Error if Ollama not on custom port
- [ ] Can switch back to default

**Pass Criteria**: Custom endpoint configuration used correctly

---

## Performance & Load Testing

### 6.1 Rapid Message Sending

**Objective**: Verify system handles multiple rapid messages

**Steps**:
1. Send 5 messages in rapid succession (1-2 seconds apart)
2. Observe queue/handling

**Expected Results**:
- [ ] Messages queue properly
- [ ] No messages dropped
- [ ] Each gets individual response
- [ ] Responses come in order
- [ ] No UI freezing or lag
- [ ] Performance acceptable

**Pass Criteria**: System handles rapid messages without loss or lag

---

### 6.2 Long Message Processing

**Objective**: Verify system handles very long user messages

**Steps**:
1. Compose a very long message (1000+ characters)
2. Send it
3. Observe AI response

**Expected Results**:
- [ ] Message sends without truncation
- [ ] AI receives full message
- [ ] Response is appropriate to full content
- [ ] No timeout or error
- [ ] Performance remains good

**Pass Criteria**: Long messages handled correctly

---

### 6.3 Large Context Gathering

**Objective**: Verify context gathering with large project

**Steps**:
1. Open large project with 20+ Camel routes
2. Send message: `How many routes are in this project?`
3. Measure time to response

**Expected Results**:
- [ ] Context gathering completes in <3 seconds
- [ ] AI counts routes correctly
- [ ] Response time acceptable
- [ ] No UI freezing
- [ ] Memory usage reasonable

**Pass Criteria**: Large context processed quickly

---

### 6.4 Extended Session Duration

**Objective**: Verify system stability over long usage

**Steps**:
1. Keep AI panel open for 30+ minutes
2. Periodically send messages
3. Monitor for memory leaks or crashes
4. Check console for error accumulation

**Expected Results**:
- [ ] No crashes or freezes
- [ ] Memory usage stays stable
- [ ] Responses remain consistent in speed
- [ ] Error count doesn't grow
- [ ] No UI responsiveness issues
- [ ] Session remains functional

**Pass Criteria**: Long session remains stable

---

### 6.5 Streaming Performance

**Objective**: Verify streaming is efficient and smooth

**Steps**:
1. Send multiple long response requests
2. Watch streaming speed and quality
3. Monitor CPU/memory during streaming

**Expected Results**:
- [ ] Streaming smooth without stuttering
- [ ] No long gaps between chunks
- [ ] CPU usage reasonable during streaming
- [ ] Memory grows slowly, not continuously
- [ ] 1000+ character response streams in <2 seconds
- [ ] Formatting preserved in chunks

**Pass Criteria**: Streaming is smooth and efficient

---

## Advanced Testing Scenarios

### 7.1 Component-Specific Guidance

**Objective**: Verify AI provides component-specific help

**Steps**:
1. Send: `How do I use the HTTP component in Camel?`
2. Request: `Show me an example of using the FTP component with error handling`
3. Request: `Explain database polling options in Camel`

**Expected Results**:
- [ ] AI provides component-specific documentation
- [ ] Code examples are accurate
- [ ] Configuration options mentioned
- [ ] Error handling patterns shown
- [ ] URI format correct for components

**Pass Criteria**: AI provides accurate component guidance

---

### 7.2 Route Refinement

**Objective**: Verify AI can help refine existing routes

**Steps**:
1. Open a Camel route file
2. Send: `How can I add timeout handling to this route?`
3. Send: `What's the best way to add persistence to this flow?`
4. Send: `Add monitoring/metrics to this route`

**Expected Results**:
- [ ] AI understands current route
- [ ] Suggestions are context-appropriate
- [ ] Code examples provided are compatible
- [ ] Performance improvements suggested
- [ ] Best practices mentioned

**Pass Criteria**: AI provides helpful refinement suggestions

---

### 7.3 Error Route Suggestions

**Objective**: Verify AI suggests error handling patterns

**Steps**:
1. Open a basic route file
2. Send: `Add comprehensive error handling to this route`

**Expected Results**:
- [ ] AI suggests onException clauses
- [ ] Mentions deadletter channels
- [ ] Suggests retry strategies
- [ ] Code is syntactically correct
- [ ] Patterns follow Camel best practices

**Pass Criteria**: Error handling patterns are helpful and accurate

---

### 7.4 EIP Pattern Recommendations

**Objective**: Verify AI recommends appropriate integration patterns

**Steps**:
1. Send: `I need to split messages and process in parallel, which EIP should I use?`
2. Send: `I have multiple data sources to merge, what's the best pattern?`
3. Send: `I need to implement content-based routing, how should I do this?`

**Expected Results**:
- [ ] Correct EIP patterns recommended
- [ ] Explanations of why each is appropriate
- [ ] Code examples provided
- [ ] Alternative approaches mentioned
- [ ] Performance considerations noted

**Pass Criteria**: EIP recommendations are accurate and helpful

---

### 7.5 Dependency Suggestion

**Objective**: Verify AI suggests necessary dependencies

**Steps**:
1. Send: `I want to use ActiveMQ in my route, what dependency do I need?`
2. Send: `How do I add MongoDB support to my Camel project?`

**Expected Results**:
- [ ] Correct Maven/Gradle coordinates provided
- [ ] Version information accurate
- [ ] Configuration examples shown
- [ ] Dependencies are actually available
- [ ] For your runtime (Quarkus/Spring/Main)

**Pass Criteria**: Dependency suggestions are accurate and applicable

---

## Test Execution Matrices

### Test Matrix 1: Authentication Backends

| Backend | Setup | Login | Chat | Streaming | Code Gen | Pass |
|---------|-------|-------|------|-----------|----------|------|
| GitHub Copilot | [✓] | [ ] | [ ] | [ ] | [ ] | [ ] |
| OpenAI API Key | [✓] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Local LLM | [✓] | [ ] | [ ] | [ ] | [ ] | [ ] |

### Test Matrix 2: Core Features

| Feature | Copilot | OpenAI | Local LLM | Pass |
|---------|---------|--------|-----------|------|
| Send Message | [ ] | [ ] | [ ] | [ ] |
| Streaming Response | [ ] | [ ] | [ ] | [ ] |
| Multi-message Conversation | [ ] | [ ] | [ ] | [ ] |
| Context Gathering | [ ] | [ ] | [ ] | [ ] |
| Code Generation | [ ] | [ ] | [ ] | [ ] |
| Code Application | [ ] | [ ] | [ ] | [ ] |
| Clear Chat | [ ] | [ ] | [ ] | [ ] |

### Test Matrix 3: Error Scenarios

| Error Scenario | Expected Behavior | Pass |
|---|---|---|
| Invalid API Key | Show error, allow retry | [ ] |
| Network Error | Show error, allow retry | [ ] |
| Empty Message | Ignore silently | [ ] |
| Large File | Process normally | [ ] |
| Malformed YAML | Parse gracefully | [ ] |
| Rate Limited | Show wait message | [ ] |

### Test Matrix 4: Configuration

| Setting | Test | Pass |
|---------|------|------|
| karavan.ai.enabled | Toggle on/off | [ ] |
| karavan.ai.backend | Switch backends | [ ] |
| karavan.ai.model | Change models | [ ] |
| localLlmEndpoint | Custom URL | [ ] |

---

## Quick Smoke Test (5 minutes)

For rapid validation, execute this sequence:

```
⏱ Start Timer

1. (30 sec) Launch Extension Host (F5)
   ✓ No errors in console
   
2. (30 sec) Open AI Panel (Ctrl+Shift+P → "Open AI Copilot")
   ✓ Login panel appears
   
3. (30 sec) Authenticate (Click GitHub Copilot)
   ✓ State transitions to Authenticated
   
4. (30 sec) Send Message ("Hello")
   ✓ Message appears, AI responds
   
5. (1 min) Observe Streaming ("Create a Camel route")
   ✓ Streaming response visible
   
6. (1 min) Apply Code
   ✓ Click Apply on code block
   ✓ Code inserts or new file creates
   
7. (30 sec) Test Context ("Explain current file")
   ✓ AI recognizes file content

⏱ Total: ~5 minutes
✅ PASS: All steps successful
❌ FAIL: Any step failed
```

---

## Known Issues to Watch

### Issue 1: GitHub Copilot Extension Not Detected
**Symptom**: "GitHub Copilot extension not found" error  
**Root Cause**: Extension not installed or disabled  
**Workaround**:
- Verify GitHub Copilot extension installed
- Enable it in Extensions view
- Reload VSCode window
- Retry authentication

### Issue 2: Streaming Response Cuts Off
**Symptom**: AI response ends prematurely  
**Root Cause**: SSE stream parser stops unexpectedly  
**Workaround**:
- Check network connectivity
- Verify API rate limits not hit
- Restart extension
- Try with simpler prompt

### Issue 3: Context Not Gathered
**Symptom**: AI responds generically to file-specific questions  
**Root Cause**: File not detected in context gathering  
**Workaround**:
- Ensure file is active editor
- Try sending file path explicitly in prompt
- Check YAML file has `.yaml` or `.yml` extension

### Issue 4: Code Insertion Fails
**Symptom**: "Apply" button doesn't insert code  
**Root Cause**: File permission issue or editor state  
**Workaround**:
- Ensure file is editable
- Try creating new file instead
- Check file extension is correct
- Manually copy/paste code

### Issue 5: YAML Parsing Errors
**Symptom**: "Invalid YAML" errors when gathering context  
**Root Cause**: Malformed YAML syntax in file  
**Workaround**:
- Fix YAML syntax in file
- Validate with online YAML validators
- Use proper indentation (2 spaces)
- Remove special characters

### Issue 6: Slow Response Times
**Symptom**: 60+ seconds to get response  
**Root Cause**: API overload, network latency, or large context  
**Workaround**:
- Verify internet connectivity
- Try smaller request
- Check API status (OpenAI status page)
- Reduce file context size

### Issue 7: Token Expiration
**Symptom**: "Token expired" after extended session  
**Root Cause**: Token refresh not implemented yet  
**Workaround**:
- Logout and re-authenticate
- Reload VSCode window
- Generate new API key

---

## Debugging & Troubleshooting

### Accessing Logs

#### Extension Console Logs
```
1. Open DevTools: Ctrl+Shift+I (in Extension Host window)
2. Go to Console tab
3. Look for messages prefixed with: [AI Panel]
4. Filter for errors: console.error()
```

#### Webview Console Logs
```
1. Right-click in AI panel
2. Select "Inspect"
3. Go to Console tab in DevTools
4. Look for webview-specific logs
```

### Debug Commands

```bash
# Check extension activation
# Look in VSCode Output panel → Extension Host

# Verify settings
Ctrl+, → Search "karavan.ai"

# Restart extension
Ctrl+Shift+P → "Developer: Reload Window"

# Check auth state
# Add breakpoint in auth.ts, Step through
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `undefined is not a function` | State machine not initialized | Reload window |
| `TypeError: Cannot read property 'postMessage'` | Webview not ready | Wait for webview initialization |
| `Cannot find module 'xstate'` | Dependencies not installed | Run `npm install` |
| `YAML parsing error` | Invalid route file | Fix YAML syntax |
| `401 Unauthorized` | Invalid API key | Check and re-enter key |
| `ECONNREFUSED localhost:11434` | Ollama not running | Start Ollama service |

---

## Test Reporting Template

Use this template to document test results:

```markdown
# Test Report: [Date]

## Test Environment
- OS: [Linux/Windows/macOS]
- VSCode Version: [version]
- Extension Version: [version from package.json]
- GitHub Copilot: [Installed/Not Installed] [Subscribed/Trial/Expired]

## Backend Tested
- [ ] GitHub Copilot
- [ ] OpenAI API Key
- [ ] Local LLM

## Phase 1 Testing (Foundation)

### Extension Activation
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

### Commands
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

### State Machine
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

### UI Rendering
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

## Phase 2 Testing (Chat)

### Authentication
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

### Chat Messaging
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

### Streaming Response
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

### Code Application
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

### Context Gathering
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

## Error Testing

### Invalid API Key
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

### Network Error
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

### YAML Parsing
- [ ] PASS - [ ] FAIL - [ ] SKIP
- Notes: ___________________________________

## Overall Result

**Total Tests**: ___  
**Passed**: ___  
**Failed**: ___  
**Skipped**: ___  

**Status**: [ ] Ready for Release [ ] Needs Fixes [ ] Blocking Issues

## Issues Found

### High Priority
1. ___________________________________
2. ___________________________________

### Medium Priority
1. ___________________________________
2. ___________________________________

### Low Priority
1. ___________________________________
2. ___________________________________

## Tester Signature
- Name: ___________________________________
- Date: ___________________________________
- Backend Used: ___________________________________
```

---

## Appendix: Quick Reference

### Keyboard Shortcuts
- Open AI Panel: `Ctrl+Shift+P` → "Open AI Copilot"
- Send Message: `Enter` (in chat input)
- Multi-line: `Shift+Enter` in input, then `Enter` to send
- DevTools: `Ctrl+Shift+I`
- Reload: `Ctrl+R` or `F5`
- Settings: `Ctrl+,`

### File Locations
- Extension: `/home/user/work/cetai-org/camel-karavan/karavan-vscode/`
- Config: `.vscode/settings.json`
- Logs: DevTools → Console tab
- Tests: `TESTING_STRATEGY.md`

### Useful Commands
```bash
# Compile
npm run compile

# Watch mode
npm run watch

# Launch Extension Host
F5

# Clean install
rm -rf node_modules && npm install
```

---

## Summary

This comprehensive testing strategy covers:
- ✅ **Phase 1**: Foundation, state machine, UI, commands
- ✅ **Phase 2**: Chat, streaming, context, code generation
- ✅ **GitHub Copilot**: Specific integration testing
- ✅ **Error Scenarios**: Comprehensive error handling tests
- ✅ **Configuration**: All settings and backend switching
- ✅ **Performance**: Load and stress testing
- ✅ **Debugging**: Tools and techniques for troubleshooting

**Estimated Time**: 4-5 hours for full test suite  
**Recommended Time**: 2-3 hours for focused testing  
**Quick Validation**: 5 minutes for smoke test

Good luck with testing! 🚀

---

**Document Version**: 1.0  
**Last Updated**: January 3, 2026  
**Next Review**: After Phase 3 implementation
