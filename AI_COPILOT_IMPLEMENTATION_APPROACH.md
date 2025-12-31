# AI Copilot Implementation Approach for Karavan VSCode Extension

## Executive Summary

This document outlines the approach to port the AI Copilot feature from the WSO2 Ballerina VSCode extension to the Apache Camel Karavan VSCode extension. The implementation will enable context-aware code suggestions, intelligent completion, natural language route generation, and automated assistance for Apache Camel development.

**GitHub Issue**: [#8 - Implement AI Copilot for Karavan VSCode Extension](https://github.com/cetai-org/camel-karavan/issues/8)

**Reference Implementation**: WSO2 Ballerina VSCode Extension (`/home/user/work/cetai-org/vscode-extensions/workspaces/ballerina`)

---

## 1. Architecture Overview

### 1.1 Ballerina AI Copilot Architecture (Reference)

The Ballerina implementation uses a sophisticated architecture with the following key components:

```
┌─────────────────────────────────────────────────────────────┐
│                  VSCode Extension (Host)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AI Features Activator (features/ai/activator.ts)    │   │
│  │  - Copilot Login Commands                            │   │
│  │  - Command Registration                              │   │
│  │  - State Machine Integration                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AI Panel (views/ai-panel/)                          │   │
│  │  - activate.ts: Panel lifecycle management           │   │
│  │  - aiMachine.ts: XState state machine                │   │
│  │  - auth.ts: Authentication handlers                  │   │
│  │  - webview.ts: Webview panel creation                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  RPC Layer (RPCLayer.ts)                             │   │
│  │  - Bidirectional communication                       │   │
│  │  - Message passing between extension and webview     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ RPC Communication
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Webview (React Application)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AIPanel.tsx                                         │   │
│  │  - State-based UI rendering                          │   │
│  │  - LoginPanel, AIChat, DisabledWindow components     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AIChat Component (components/AIChat.tsx)            │   │
│  │  - Chat interface                                    │   │
│  │  - Message history                                   │   │
│  │  - Code generation display                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AIChatEngine.ts                                     │   │
│  │  - SSE (Server-Sent Events) handling                 │   │
│  │  - Stream processing                                 │   │
│  │  - Response parsing                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/SSE
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Backend Service                        │
│  - OpenAI API / Local LLM / AWS Bedrock                     │
│  - Context processing                                        │
│  - Code generation                                           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 State Machine Architecture

The Ballerina implementation uses **XState** for managing complex authentication and chat flows:

**States:**
- `Initialize`: Initial loading state
- `Unauthenticated`: User needs to log in
- `Authenticating`: Authentication in progress
  - `determineFlow`: Determining auth method
  - `ssoFlow`: SSO authentication
  - `apiKeyFlow`: API key authentication
  - `validatingApiKey`: Validating API key
  - `awsBedrockFlow`: AWS Bedrock authentication
  - `validatingAwsCredentials`: Validating AWS credentials
- `Authenticated`: User authenticated and ready
- `Disabled`: Feature disabled

**Events:**
- `LOGIN`: Initiate login
- `LOGOUT`: User logout
- `API_KEY_AUTH`: Use API key auth
- `SSO_AUTH`: Use SSO auth
- `AWS_BEDROCK_AUTH`: Use AWS Bedrock auth
- `AUTH_SUCCESS`: Authentication successful
- `AUTH_FAILED`: Authentication failed
- `DISPOSE`: Clean up state

---

## 2. Proposed Architecture for Karavan

### 2.1 Directory Structure

```
karavan-vscode/
├── src/
│   ├── ai/                              # NEW: AI Copilot features
│   │   ├── activator.ts                 # Feature activation
│   │   ├── completions.ts               # Inline code completions
│   │   ├── constants.ts                 # AI-related constants
│   │   ├── utils/
│   │   │   ├── auth.ts                  # Authentication utilities
│   │   │   ├── events.ts                # Event handlers
│   │   │   └── context.ts               # Context gathering for AI
│   │   └── agent/
│   │       └── route-generator.ts       # Natural language route generation
│   ├── views/
│   │   └── ai-panel/                    # NEW: AI Chat Panel
│   │       ├── activate.ts              # Panel activation
│   │       ├── aiMachine.ts             # XState state machine
│   │       ├── auth.ts                  # Auth logic
│   │       ├── webview.ts               # Webview management
│   │       └── utils.ts                 # Utility functions
│   ├── rpc/                             # NEW: RPC communication layer
│   │   ├── RPCLayer.ts                  # Main RPC handler
│   │   └── ai-panel-rpc.ts              # AI panel RPC methods
│   ├── extension.ts                     # Updated: Register AI features
│   └── utils.ts                         # Shared utilities
├── webview/
│   ├── ai-panel/                        # NEW: AI Panel React UI
│   │   ├── AIPanel.tsx                  # Main panel component
│   │   ├── LoginPanel.tsx               # Login UI
│   │   ├── AIChat.tsx                   # Chat interface
│   │   ├── AIChatEngine.ts              # Chat logic & SSE handling
│   │   ├── components/
│   │   │   ├── MessageList.tsx
│   │   │   ├── CodeBlock.tsx
│   │   │   └── RoutePreview.tsx         # Preview generated routes
│   │   └── utils/
│   │       └── sseUtils.ts              # SSE utilities
│   └── integration-designer/
│       └── utils/
│           └── CamelUi.tsx              # Updated: AI integration points
└── package.json                         # Updated: New commands & dependencies
```

### 2.2 Key Components to Implement

#### 2.2.1 Extension Side (TypeScript)

**File: `src/ai/activator.ts`**
- Register AI-related commands
- Initialize AI state machine
- Set up authentication handlers
- Integrate with Language Server (if applicable)

**File: `src/views/ai-panel/aiMachine.ts`**
- XState state machine for authentication flow
- State transitions for login/logout
- Context management for user tokens
- Support for multiple authentication methods:
  - GitHub Copilot integration
  - OpenAI API key
  - Local LLM endpoints
  - AWS Bedrock (optional)

**File: `src/views/ai-panel/webview.ts`**
- Create and manage webview panel
- Handle panel lifecycle (create, dispose, reveal)
- Set up HTML content with React app

**File: `src/rpc/RPCLayer.ts`**
- Message passing between extension and webview
- Request/response pattern
- Notification system
- Type-safe RPC methods

**File: `src/ai/agent/route-generator.ts`**
- Parse natural language descriptions
- Generate Camel YAML routes
- Suggest EIPs based on context
- Component and Kamelet recommendations

#### 2.2.2 Webview Side (React/TypeScript)

**File: `webview/ai-panel/AIPanel.tsx`**
- Main UI component
- State-based rendering:
  - Loading state → Spinner
  - Unauthenticated → LoginPanel
  - Authenticated → AIChat
  - Disabled → Error message

**File: `webview/ai-panel/AIChat.tsx`**
- Chat interface with message list
- Input field for user prompts
- Code preview area
- Route visualization
- Action buttons (Apply, Copy, Regenerate)

**File: `webview/ai-panel/AIChatEngine.ts`**
- SSE (Server-Sent Events) handling for streaming responses
- Message parsing and formatting
- Error handling and retry logic
- Context gathering from current file/project

**File: `webview/ai-panel/components/RoutePreview.tsx`**
- Display generated Camel route in YAML format
- Syntax highlighting
- Diff view for modifications
- Apply to file functionality

---

## 3. Implementation Phases

### Phase 1: Foundation Setup (Week 1-2)

**Goal**: Set up basic infrastructure and authentication

**Tasks**:
1. **Create directory structure**
   - Add `src/ai/` and `src/views/ai-panel/` directories
   - Add `webview/ai-panel/` directory
   - Set up TypeScript configurations

2. **Install dependencies**
   ```json
   {
     "dependencies": {
       "xstate": "^4.38.0",           // State machine
       "@vscode/webview-ui-toolkit": "^1.2.2",  // UI components (if not present)
       "react": "^18.2.0",             // UI framework (likely present)
       "react-dom": "^18.2.0"
     }
   }
   ```

3. **Implement authentication**
   - Port `auth.ts` logic from Ballerina
   - Support GitHub Copilot authentication
   - Support OpenAI API key authentication
   - Store tokens securely using VSCode SecretStorage API

4. **Create state machine**
   - Port XState machine from Ballerina's `aiMachine.ts`
   - Adapt states for Camel-specific flows
   - Implement event handlers

5. **Set up RPC layer**
   - Create bidirectional communication channel
   - Implement message serialization/deserialization
   - Type definitions for RPC methods

**Deliverables**:
- ✅ Basic AI panel that can be opened via command
- ✅ Login UI functional
- ✅ Authentication flow working
- ✅ State machine operational

### Phase 2: Chat Interface (Week 3-4)

**Goal**: Implement chat UI and communication with AI backend

**Tasks**:
1. **Build chat UI components**
   - Message list with sender identification
   - Input field with multi-line support
   - Code blocks with syntax highlighting
   - Loading indicators for streaming responses

2. **Implement SSE handling**
   - Stream processing for AI responses
   - Parse Server-Sent Events
   - Handle partial messages
   - Error recovery

3. **Context gathering**
   - Extract current file content
   - Get project metadata
   - Identify open routes and components
   - Gather diagnostics and errors

4. **Backend integration**
   - Connect to OpenAI API / GitHub Copilot / Local LLM
   - Send prompts with context
   - Process streaming responses
   - Handle rate limiting and errors

**Deliverables**:
- ✅ Functional chat interface
- ✅ Streaming AI responses displayed
- ✅ Context sent with prompts
- ✅ Error handling

### Phase 3: Code Generation Features (Week 5-6)

**Goal**: Implement Camel-specific code generation capabilities

**Tasks**:
1. **Route generation from natural language**
   - Parse user intent (e.g., "Create a REST API that consumes JSON and sends to Kafka")
   - Map to Camel components and EIPs
   - Generate YAML route structure
   - Validate generated code

2. **Component and EIP suggestions**
   - Recommend relevant components based on context
   - Suggest Enterprise Integration Patterns
   - Provide Kamelet recommendations
   - Auto-complete component properties

3. **Expression and property editing assistance**
   - Help with Simple language expressions
   - Suggest data transformations
   - Property value recommendations based on component metadata

4. **Integration with existing designer**
   - Hook into `CamelUi.tsx` methods:
     - `createNewRoute`
     - `createRouteFromComponent`
   - Add "Generate with AI" buttons in designer
   - Preview before applying

**Deliverables**:
- ✅ Natural language route generation working
- ✅ AI-generated routes can be applied to files
- ✅ Component and EIP suggestions functional
- ✅ Integration points in designer UI

### Phase 4: Advanced Features (Week 7-8)

**Goal**: Add diagnostics, documentation, and polish

**Tasks**:
1. **Diagnostics and quick-fix recommendations**
   - Analyze compilation/validation errors
   - Suggest fixes for common issues
   - Auto-fix simple problems

2. **Documentation assistant**
   - Explain Camel components in context
   - Provide examples for EIPs
   - Link to official Apache Camel docs

3. **Code optimization suggestions**
   - Recommend better EIP patterns
   - Performance optimization tips
   - Best practices enforcement

4. **Multi-backend support**
   - Abstract backend interface
   - Support multiple AI providers:
     - GitHub Copilot
     - OpenAI API
     - Azure OpenAI
     - Local LLM (Ollama, LM Studio)
     - AWS Bedrock
   - Allow switching between providers

**Deliverables**:
- ✅ Diagnostic analysis and fixes
- ✅ Documentation assistant
- ✅ Multiple AI backend support
- ✅ Settings UI for configuration

### Phase 5: Testing & Documentation (Week 9-10)

**Goal**: Comprehensive testing and user documentation

**Tasks**:
1. **Unit tests**
   - Test state machine transitions
   - Test RPC layer
   - Test context gathering
   - Test authentication flows

2. **Integration tests**
   - End-to-end route generation
   - Backend communication
   - UI interactions

3. **User documentation**
   - Setup guide for different AI backends
   - Usage examples and tutorials
   - Troubleshooting guide
   - Architecture documentation

4. **Performance optimization**
   - Optimize context gathering
   - Reduce bundle size
   - Lazy load components
   - Cache AI responses

**Deliverables**:
- ✅ Test coverage > 70%
- ✅ User documentation complete
- ✅ Performance benchmarks met
- ✅ Ready for beta release

---

## 4. Technical Implementation Details

### 4.1 State Machine Definition

```typescript
// src/views/ai-panel/aiMachine.ts
import { createMachine, assign } from 'xstate';

interface AIContext {
    loginMethod?: 'github-copilot' | 'openai' | 'local-llm' | 'aws-bedrock';
    userToken?: {
        accessToken: string;
        refreshToken?: string;
        expiresAt?: number;
    };
    errorMessage?: string;
}

type AIEvent =
    | { type: 'LOGIN' }
    | { type: 'LOGOUT' }
    | { type: 'API_KEY_AUTH'; apiKey: string }
    | { type: 'GITHUB_COPILOT_AUTH' }
    | { type: 'AUTH_SUCCESS'; token: any }
    | { type: 'AUTH_FAILED'; error: string }
    | { type: 'DISPOSE' };

export const aiMachine = createMachine<AIContext, AIEvent>({
    id: 'karavan-ai',
    initial: 'Initialize',
    context: {
        loginMethod: undefined,
        userToken: undefined,
        errorMessage: undefined,
    },
    states: {
        Initialize: {
            on: {
                LOGIN: 'Authenticating',
            },
        },
        Authenticating: {
            initial: 'determineFlow',
            states: {
                determineFlow: {
                    on: {
                        API_KEY_AUTH: 'apiKeyFlow',
                        GITHUB_COPILOT_AUTH: 'githubCopilotFlow',
                    },
                },
                apiKeyFlow: {
                    invoke: {
                        src: 'validateApiKey',
                        onDone: {
                            target: '#karavan-ai.Authenticated',
                            actions: assign({
                                userToken: (_ctx, event) => event.data,
                            }),
                        },
                        onError: {
                            target: '#karavan-ai.Unauthenticated',
                            actions: assign({
                                errorMessage: (_ctx, event) => event.data.message,
                            }),
                        },
                    },
                },
                githubCopilotFlow: {
                    invoke: {
                        src: 'authenticateWithGitHub',
                        onDone: {
                            target: '#karavan-ai.Authenticated',
                            actions: assign({
                                userToken: (_ctx, event) => event.data,
                            }),
                        },
                        onError: {
                            target: '#karavan-ai.Unauthenticated',
                            actions: assign({
                                errorMessage: (_ctx, event) => event.data.message,
                            }),
                        },
                    },
                },
            },
        },
        Unauthenticated: {
            on: {
                LOGIN: 'Authenticating',
            },
        },
        Authenticated: {
            on: {
                LOGOUT: {
                    target: 'Unauthenticated',
                    actions: assign({
                        userToken: (_ctx) => undefined,
                        loginMethod: (_ctx) => undefined,
                    }),
                },
            },
        },
        Disabled: {},
    },
    on: {
        DISPOSE: {
            target: 'Initialize',
            actions: assign({
                userToken: (_ctx) => undefined,
                loginMethod: (_ctx) => undefined,
                errorMessage: (_ctx) => undefined,
            }),
        },
    },
});
```

### 4.2 RPC Communication

```typescript
// src/rpc/ai-panel-rpc.ts
export interface AIPanelRPC {
    // Authentication
    getLoginMethod(): Promise<string>;
    getAccessToken(): Promise<string>;
    isCopilotSignedIn(): Promise<boolean>;
    promptGithubAuthorize(): Promise<boolean>;
    
    // Context gathering
    getCurrentRouteContext(): Promise<RouteContext>;
    getProjectMetadata(): Promise<ProjectMetadata>;
    getDiagnostics(): Promise<Diagnostic[]>;
    
    // Code generation
    generateRoute(prompt: string, context: RouteContext): Promise<string>;
    generateComponent(componentType: string, properties: any): Promise<string>;
    suggestEIP(scenario: string): Promise<EIPSuggestion[]>;
    
    // File operations
    applyGeneratedCode(filePath: string, code: string): Promise<boolean>;
    createNewFile(filePath: string, content: string): Promise<boolean>;
    
    // AI backend communication
    sendChatMessage(message: string, conversationId: string): Promise<void>;
    streamAIResponse(prompt: string, context: any): AsyncIterator<string>;
}

interface RouteContext {
    currentFile?: string;
    currentRoute?: any;
    selectedComponent?: any;
    camelVersion?: string;
    availableComponents?: string[];
}

interface ProjectMetadata {
    name: string;
    runtime: 'camel-main' | 'quarkus' | 'spring-boot';
    camelVersion: string;
    dependencies: string[];
}
```

### 4.3 Context Gathering for AI

```typescript
// src/ai/utils/context.ts
export async function gatherCamelContext(): Promise<AICamelContext> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return { hasContext: false };
    }

    const document = editor.document;
    const fileName = path.basename(document.fileName);
    const isYaml = fileName.endsWith('.camel.yaml') || fileName.endsWith('.yaml');
    
    let context: AICamelContext = {
        hasContext: true,
        fileName,
        isYaml,
    };

    if (isYaml) {
        // Parse current route
        const content = document.getText();
        context.currentRoute = parseYamlRoute(content);
        
        // Get cursor position context
        const position = editor.selection.active;
        context.cursorContext = getContextAtPosition(content, position);
    }

    // Get project info
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        context.projectMetadata = await getProjectMetadata(workspaceFolder.uri.fsPath);
    }

    // Get diagnostics
    context.diagnostics = vscode.languages.getDiagnostics(document.uri);

    return context;
}

interface AICamelContext {
    hasContext: boolean;
    fileName?: string;
    isYaml?: boolean;
    currentRoute?: any;
    cursorContext?: {
        inComponent?: boolean;
        componentType?: string;
        propertyName?: string;
    };
    projectMetadata?: ProjectMetadata;
    diagnostics?: vscode.Diagnostic[];
}
```

### 4.4 AI Backend Integration

```typescript
// src/ai/backends/base.ts
export interface AIBackend {
    name: string;
    authenticate(): Promise<boolean>;
    isAuthenticated(): Promise<boolean>;
    logout(): Promise<void>;
    
    generateCode(prompt: string, context: any): AsyncIterator<string>;
    chat(message: string, history: ChatMessage[]): AsyncIterator<string>;
}

// src/ai/backends/openai.ts
export class OpenAIBackend implements AIBackend {
    name = 'OpenAI';
    private apiKey?: string;

    async authenticate(): Promise<boolean> {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API key',
            password: true,
        });
        
        if (apiKey) {
            this.apiKey = apiKey;
            await vscode.workspace.getConfiguration().update(
                'karavan.ai.openaiApiKey',
                apiKey,
                vscode.ConfigurationTarget.Global
            );
            return true;
        }
        return false;
    }

    async *generateCode(prompt: string, context: any): AsyncIterator<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert in Apache Camel integration framework. Help generate Camel routes in YAML format.',
                    },
                    {
                        role: 'user',
                        content: `${prompt}\n\nContext: ${JSON.stringify(context)}`,
                    },
                ],
                stream: true,
            }),
        });

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;
                    
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content;
                        if (content) {
                            yield content;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }
    
    // Implement other methods...
}

// src/ai/backends/github-copilot.ts
export class GitHubCopilotBackend implements AIBackend {
    name = 'GitHub Copilot';
    
    async authenticate(): Promise<boolean> {
        // Use GitHub Copilot Chat API if available
        const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
        if (!copilotExtension) {
            vscode.window.showErrorMessage('GitHub Copilot extension is not installed');
            return false;
        }
        
        if (!copilotExtension.isActive) {
            await copilotExtension.activate();
        }
        
        // Check if user is signed in to Copilot
        // This requires using GitHub Copilot's API (if available)
        return true;
    }
    
    // Implement other methods...
}
```

---

## 5. Integration Points with Existing Karavan Code

### 5.1 Designer Integration

**File: `webview/integration-designer/utils/CamelUi.tsx`**

Add AI-powered methods:

```typescript
export class CamelUi {
    // Existing methods...
    static createNewRoute = (...) => { ... }
    static createRouteFromComponent = (...) => { ... }

    // NEW: AI-powered route creation
    static createRouteFromAI = async (
        projectId: string,
        naturalLanguagePrompt: string,
        after: (file: ProjectFile) => void
    ): Promise<void> => {
        // 1. Open AI panel
        vscode.postMessage({
            command: 'openAIPanel',
            data: {
                type: 'command-template',
                command: 'generateRoute',
                prompt: naturalLanguagePrompt,
            },
        });
        
        // 2. Wait for AI-generated route
        // 3. Validate generated YAML
        // 4. Create route file
        // 5. Execute callback
    };

    // NEW: AI-assisted component configuration
    static suggestComponentProperties = async (
        componentName: string,
        useCase: string
    ): Promise<any> => {
        // Call AI backend to suggest property values
        const response = await vscode.postMessage({
            command: 'aiSuggestProperties',
            data: { componentName, useCase },
        });
        
        return response;
    };
}
```

### 5.2 Extension Activation

**File: `src/extension.ts`**

```typescript
import { activateAIFeatures } from './ai/activator';
import { activateAiPanel } from './views/ai-panel/activate';

export function activate(context: ExtensionContext) {
    // Existing activation code...
    
    // NEW: Activate AI features
    activateAIFeatures(context);
    activateAiPanel(context);

    // Register AI commands
    context.subscriptions.push(
        commands.registerCommand('karavan.ai.openPanel', () => {
            commands.executeCommand('karavan.ai.panel.open');
        })
    );

    context.subscriptions.push(
        commands.registerCommand('karavan.ai.generateRoute', async () => {
            const prompt = await window.showInputBox({
                prompt: 'Describe the integration route you want to create',
                placeHolder: 'e.g., REST API that consumes JSON and sends to Kafka',
            });
            
            if (prompt) {
                commands.executeCommand('karavan.ai.panel.open', {
                    type: 'text',
                    text: prompt,
                });
            }
        })
    );
}
```

### 5.3 Package.json Updates

```json
{
  "contributes": {
    "commands": [
      {
        "command": "karavan.ai.openPanel",
        "title": "Open AI Copilot",
        "category": "Karavan"
      },
      {
        "command": "karavan.ai.generateRoute",
        "title": "Generate Route with AI",
        "category": "Karavan",
        "icon": "$(sparkle)"
      },
      {
        "command": "karavan.ai.suggestComponent",
        "title": "Suggest Component",
        "category": "Karavan"
      }
    ],
    "configuration": {
      "title": "Karavan AI Copilot",
      "properties": {
        "karavan.ai.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable AI Copilot features"
        },
        "karavan.ai.backend": {
          "type": "string",
          "enum": ["github-copilot", "openai", "local-llm", "azure-openai", "aws-bedrock"],
          "default": "openai",
          "description": "AI backend to use"
        },
        "karavan.ai.openaiApiKey": {
          "type": "string",
          "default": "",
          "description": "OpenAI API Key (stored securely)"
        },
        "karavan.ai.localLlmEndpoint": {
          "type": "string",
          "default": "http://localhost:11434",
          "description": "Local LLM endpoint (e.g., Ollama)"
        },
        "karavan.ai.model": {
          "type": "string",
          "default": "gpt-4",
          "description": "AI model to use"
        }
      }
    },
    "menus": {
      "editor/context": [
        {
          "command": "karavan.ai.generateRoute",
          "when": "resourceExtname == .yaml",
          "group": "karavan@1"
        }
      ],
      "view/title": [
        {
          "command": "karavan.ai.openPanel",
          "when": "view == integrations",
          "group": "navigation"
        }
      ]
    },
    "keybindings": [
      {
        "command": "karavan.ai.openPanel",
        "key": "ctrl+shift+k",
        "mac": "cmd+shift+k"
      }
    ]
  }
}
```

---

## 6. AI Prompt Engineering for Camel

### 6.1 System Prompt Template

```typescript
const CAMEL_SYSTEM_PROMPT = `
You are an expert Apache Camel integration specialist. Your role is to help developers create, optimize, and troubleshoot Camel integration routes.

## Your Capabilities:
1. Generate Camel routes in YAML format following best practices
2. Suggest appropriate Enterprise Integration Patterns (EIPs)
3. Recommend Camel components based on use cases
4. Help configure component properties correctly
5. Explain Camel concepts and patterns
6. Debug and fix Camel route issues
7. Optimize route performance

## Guidelines:
- Always generate routes in YAML format (Camel YAML DSL)
- Use Camel ${camelVersion} compatible syntax and components
- Prefer Kamelets when available for common patterns
- Follow enterprise integration best practices
- Include error handling (doTry/doCatch)
- Add meaningful route IDs and descriptions
- Use property placeholders for configuration
- Consider performance and scalability

## Available Components:
${availableComponents.join(', ')}

## Current Project Context:
- Runtime: ${runtime}
- Camel Version: ${camelVersion}
- Dependencies: ${dependencies.join(', ')}

When generating routes, provide:
1. Complete YAML route definition
2. Brief explanation of the pattern used
3. Any required dependencies or configuration
4. Suggestions for testing
`;
```

### 6.2 Example Prompts and Expected Outputs

**Prompt 1**: "Create a REST API that accepts JSON and sends messages to Kafka"

**Expected AI Response**:
```yaml
- route:
    id: rest-to-kafka
    description: REST API endpoint that publishes to Kafka
    from:
      uri: "rest:post:/api/messages"
      description: "REST endpoint accepting JSON"
      steps:
        - log:
            message: "Received message: ${body}"
        - to:
            uri: "kafka:{{kafka.topic}}"
            parameters:
              brokers: "{{kafka.brokers}}"
              keySerializer: "org.apache.kafka.common.serialization.StringSerializer"
              valueSerializer: "org.apache.kafka.common.serialization.StringSerializer"
```

**Explanation**: This route creates a REST endpoint that accepts POST requests, logs the incoming message, and forwards it to a Kafka topic. You'll need to configure the kafka.topic and kafka.brokers properties in your application.properties file.

---

**Prompt 2**: "Poll files from FTP and transform to JSON"

**Expected AI Response**:
```yaml
- route:
    id: ftp-to-json
    description: Poll FTP server and transform files to JSON
    from:
      uri: "ftp://{{ftp.host}}/{{ftp.path}}"
      parameters:
        username: "{{ftp.username}}"
        password: "{{ftp.password}}"
        delete: true
        delay: 5000
      steps:
        - log:
            message: "Processing file: ${header.CamelFileName}"
        - unmarshal:
            csv:
              lazyLoad: true
        - marshal:
            json:
              library: "Jackson"
        - to:
            uri: "file:{{output.directory}}"
            parameters:
              fileName: "${header.CamelFileName}.json"
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// tests/ai/aiMachine.test.ts
describe('AI State Machine', () => {
    it('should transition from Initialize to Unauthenticated on LOGIN', () => {
        const machine = interpret(aiMachine);
        machine.start();
        
        machine.send({ type: 'LOGIN' });
        
        expect(machine.state.matches('Authenticating')).toBe(true);
    });
    
    it('should authenticate with API key', async () => {
        // Test API key authentication flow
    });
});

// tests/ai/context.test.ts
describe('Context Gathering', () => {
    it('should extract route context from YAML file', async () => {
        const context = await gatherCamelContext();
        expect(context.hasContext).toBe(true);
        expect(context.isYaml).toBe(true);
    });
});
```

### 7.2 Integration Tests

```typescript
// tests/integration/ai-route-generation.test.ts
describe('AI Route Generation', () => {
    it('should generate valid Camel route from natural language', async () => {
        const prompt = 'REST API that sends to Kafka';
        const route = await generateRoute(prompt, mockContext);
        
        expect(route).toContain('rest:post');
        expect(route).toContain('kafka:');
        
        // Validate YAML syntax
        const parsed = yaml.parse(route);
        expect(parsed.route).toBeDefined();
    });
});
```

---

## 8. Security Considerations

### 8.1 Token Storage

- Use VSCode's `SecretStorage` API for storing API keys
- Never log or expose tokens in error messages
- Implement token refresh mechanisms
- Support token revocation

```typescript
// Secure token storage
const secrets = context.secrets;

async function storeToken(token: string): Promise<void> {
    await secrets.store('karavan.ai.token', token);
}

async function getToken(): Promise<string | undefined> {
    return await secrets.get('karavan.ai.token');
}

async function deleteToken(): Promise<void> {
    await secrets.delete('karavan.ai.token');
}
```

### 8.2 Data Privacy

- Don't send sensitive data to AI backends without user consent
- Allow users to review context before sending
- Provide opt-out for telemetry
- Support local-only AI backends

---

## 9. Performance Optimizations

### 9.1 Context Gathering

- Cache project metadata
- Lazy load component metadata
- Debounce context updates
- Use incremental parsing

### 9.2 UI Responsiveness

- Lazy load React components
- Virtual scrolling for long chat histories
- Web Worker for parsing large YAML files
- Optimize bundle size with code splitting

### 9.3 AI Response Handling

- Stream responses to UI incrementally
- Cancel in-flight requests when new prompt sent
- Implement request queuing
- Cache common responses

---

## 10. Future Enhancements

### 10.1 Short-term (3-6 months)

- Inline code completions (like GitHub Copilot)
- AI-powered debugging assistance
- Route optimization suggestions
- Pattern detection and refactoring

### 10.2 Long-term (6-12 months)

- Visual route builder with AI assistance
- Voice input for route generation
- Learning from user corrections
- Integration with Camel documentation
- Multi-step agent workflows
- Automated testing generation

---

## 11. Migration from Ballerina: Key Differences

| Aspect | Ballerina Implementation | Karavan Adaptation |
|--------|-------------------------|-------------------|
| **Language Syntax** | Ballerina language | Apache Camel YAML DSL |
| **Component Model** | Ballerina modules | Camel components, EIPs, Kamelets |
| **Type System** | Strong static typing | Schema-based validation |
| **Context** | Ballerina AST and syntax tree | YAML parsing, route metadata |
| **Documentation** | Ballerina API docs | Camel component catalog |
| **Error Handling** | Ballerina error types | Camel exception handling patterns |

**Key Adaptations Needed**:

1. **Replace Ballerina-specific context gathering** with Camel route parsing
2. **Adapt prompts** to generate Camel YAML instead of Ballerina code
3. **Use Camel component catalog** instead of Ballerina module registry
4. **Validate against Camel schema** instead of Ballerina compiler
5. **Integrate with Karavan designer** instead of Ballerina visualizer

---

## 12. Dependencies and Prerequisites

### 12.1 Required VSCode Extensions

- None (standalone implementation)

### 12.2 Optional Extensions for Enhanced Experience

- GitHub Copilot (for GitHub Copilot backend)
- YAML Language Support (for better YAML editing)

### 12.3 NPM Dependencies

```json
{
  "dependencies": {
    "xstate": "^4.38.0",
    "yaml": "^2.3.0",
    "eventsource": "^2.0.2"
  },
  "devDependencies": {
    "@types/eventsource": "^1.1.12"
  }
}
```

---

## 13. Acceptance Criteria (from GitHub Issue #8)

✅ **AI Copilot can suggest relevant Camel code snippets and help auto-complete routes**
- Inline completions functional
- Context-aware suggestions

✅ **User can generate routes from free-text descriptions**
- Natural language parser working
- Route generation accurate

✅ **Inline documentation and explanations appear as needed**
- Component documentation available
- EIP pattern explanations

✅ **All features are tested and documented**
- Unit tests > 70% coverage
- Integration tests passing
- User documentation complete

---

## 14. Conclusion

This implementation approach provides a comprehensive roadmap for porting the AI Copilot feature from the WSO2 Ballerina VSCode extension to Apache Camel Karavan. The phased approach ensures steady progress while maintaining code quality and user experience.

**Key Success Factors**:
1. Leverage existing Ballerina architecture and patterns
2. Adapt to Camel-specific domain and syntax
3. Maintain extensibility for multiple AI backends
4. Focus on developer productivity and ease of use
5. Ensure robust testing and documentation

**Estimated Timeline**: 10 weeks for full implementation
**Team Size**: 2-3 developers
**Risk Level**: Medium (dependent on AI backend availability and performance)

---

## 15. Next Steps

1. **Review this document** with the team and stakeholders
2. **Set up development environment** with necessary dependencies
3. **Create GitHub project board** with tasks from Phase 1
4. **Begin implementation** starting with Phase 1 foundation
5. **Establish weekly check-ins** to track progress
6. **Create demo videos** at end of each phase

---

## Appendix A: Reference Files from Ballerina

**Core Files to Study**:
- `/workspaces/ballerina/ballerina-extension/src/features/ai/activator.ts`
- `/workspaces/ballerina/ballerina-extension/src/views/ai-panel/activate.ts`
- `/workspaces/ballerina/ballerina-extension/src/views/ai-panel/aiMachine.ts`
- `/workspaces/ballerina/ballerina-visualizer/src/views/AIPanel/AIPanel.tsx`
- `/workspaces/ballerina/ballerina-visualizer/src/views/AIPanel/AIChatEngine.ts`
- `/workspaces/ballerina/ballerina-core/src/rpc-types/ai-panel/index.ts`
- `/workspaces/ballerina/ballerina-core/src/state-machine-types.ts`

**Total LOC to Port/Adapt**: ~5,000-7,000 lines of TypeScript/React code

---

## Appendix B: Useful Resources

- [Apache Camel Documentation](https://camel.apache.org/manual/)
- [Camel YAML DSL Reference](https://camel.apache.org/components/latest/others/yaml-dsl.html)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [XState Documentation](https://xstate.js.org/docs/)
- [GitHub Copilot API](https://docs.github.com/en/copilot)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)

---

**Document Version**: 1.0  
**Last Updated**: December 31, 2025  
**Author**: AI Implementation Team  
**Status**: Draft for Review
