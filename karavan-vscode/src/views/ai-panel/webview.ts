/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { AIStateMachine } from './aiMachine';

export class AIPanelWebview {
    public static currentPanel: AIPanelWebview | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private defaultPrompt: any;

    constructor(defaultPrompt?: any) {
        this.defaultPrompt = defaultPrompt;

        this.panel = vscode.window.createWebviewPanel(
            'karavanAIPanel',
            'Karavan AI Copilot',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(vscode.extensions.getExtension('camel-karavan.karavan')?.extensionPath || '', 'dist'))
                ],
            }
        );

        this.panel.iconPath = vscode.Uri.file(
            path.join(vscode.extensions.getExtension('camel-karavan.karavan')?.extensionPath || '', 'icons', 'karavan.png')
        );

        this.panel.webview.html = this.getWebviewContent();

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                await this.handleMessage(message);
            },
            null,
            this.disposables
        );

        this.panel.onDidDispose(
            () => {
                this.dispose();
            },
            null,
            this.disposables
        );

        // Send initial state to webview
        setTimeout(() => {
            this.sendStateUpdate();
        }, 100);
    }

    public getWebview(): vscode.Webview | undefined {
        return this.panel?.webview;
    }

    private async handleMessage(message: any): Promise<void> {
        console.log('AI Panel received message:', message.command);

        switch (message.command) {
            case 'getState':
                this.sendStateUpdate();
                break;
            
            case 'login':
                const { method, apiKey } = message.data || {};
                
                if (method === 'github-copilot') {
                    AIStateMachine.service().send({ type: 'GITHUB_COPILOT_AUTH' });
                } else if (method === 'openai' && apiKey) {
                    AIStateMachine.service().send({ 
                        type: 'API_KEY_AUTH', 
                        apiKey 
                    });
                } else if (method === 'local-llm') {
                    // For local LLM, we don't need API key validation
                    // Just transition to authenticated state
                    AIStateMachine.service().send({ type: 'AUTH_SUCCESS', token: { accessToken: 'local-llm' } });
                }
                break;

            case 'logout':
                AIStateMachine.service().send({ type: 'LOGOUT' });
                break;

            case 'sendMessage':
                // Handle AI chat messages
                await this.handleChatMessage(message.data);
                break;

            case 'applyCode':
                // Handle code application to files
                await this.applyGeneratedCode(message.data);
                break;

            case 'getHistory':
                // Send chat history to webview
                this.panel.webview.postMessage({
                    command: 'loadHistory',
                    data: { messages: [] }, // TODO: Load from storage
                });
                break;

            case 'clearHistory':
                // Clear chat history
                // TODO: Implement persistence
                break;

            case 'openSettings':
                vscode.commands.executeCommand('workbench.action.openSettings', 'karavan.ai');
                break;

            default:
                console.warn('Unknown message command:', message.command);
        }
    }

    private sendStateUpdate(): void {
        const snapshot = AIStateMachine.getSnapshot();
        this.panel.webview.postMessage({
            command: 'stateUpdate',
            state: snapshot.value,
            context: snapshot.context,
            defaultPrompt: this.defaultPrompt,
        });
    }

    private async handleChatMessage(data: any): Promise<void> {
        const { content, conversationHistory } = data;
        
        try {
            // Import backend utilities
            const { getAIBackend } = await import('../../ai/utils/backend');
            const { gatherCamelContext, buildPromptContext, getCurrentDiagnostics } = await import('../../ai/utils/context');
            
            // Get the current AI backend
            const backend = await getAIBackend();
            
            // Gather context
            const camelContext = await gatherCamelContext();
            const diagnostics = getCurrentDiagnostics();
            const contextString = buildPromptContext(camelContext, diagnostics);
            
            // Generate unique message ID for streaming
            const messageId = Date.now().toString();
            
            // Stream response
            try {
                for await (const chunk of backend.sendMessage(content, conversationHistory || [], contextString)) {
                    this.panel.webview.postMessage({
                        command: 'streamChunk',
                        data: {
                            messageId,
                            chunk,
                        },
                    });
                }
                
                // Signal completion
                this.panel.webview.postMessage({
                    command: 'streamComplete',
                    data: { messageId },
                });
            } catch (error) {
                this.panel.webview.postMessage({
                    command: 'error',
                    data: error instanceof Error ? error.message : 'Failed to get AI response',
                });
            }
        } catch (error) {
            this.panel.webview.postMessage({
                command: 'error',
                data: error instanceof Error ? error.message : 'Failed to initialize AI backend',
            });
        }
    }

    private async applyGeneratedCode(data: any): Promise<void> {
        const { code, filePath } = data;
        
        try {
            const editor = vscode.window.activeTextEditor;
            
            if (editor && !filePath) {
                // Insert at cursor position in active editor
                const position = editor.selection.active;
                await editor.edit(editBuilder => {
                    editBuilder.insert(position, code);
                });
                vscode.window.showInformationMessage('Code inserted successfully');
            } else if (filePath) {
                // Update existing file
                const uri = vscode.Uri.file(filePath);
                await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));
                await vscode.window.showTextDocument(uri);
                vscode.window.showInformationMessage('Code applied successfully');
            } else {
                // Create new file
                const uri = await vscode.window.showSaveDialog({
                    filters: {
                        'YAML files': ['yaml', 'yml'],
                        'All files': ['*']
                    },
                    defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
                });

                if (uri) {
                    await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));
                    await vscode.window.showTextDocument(uri);
                    vscode.window.showInformationMessage('File created successfully');
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage('Failed to apply code: ' + (error as Error).message);
            this.panel.webview.postMessage({
                command: 'error',
                data: 'Failed to apply code: ' + (error as Error).message,
            });
        }
    }

    private getWebviewContent(): string {
        // For Phase 2, we use a simple HTML structure that loads the React components
        // The actual React app will be built separately and served
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'none'; 
                   style-src ${this.panel.webview.cspSource} 'unsafe-inline'; 
                   script-src ${this.panel.webview.cspSource} 'unsafe-inline'; 
                   font-src ${this.panel.webview.cspSource}; 
                   connect-src https:;">
    <title>Karavan AI Copilot</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.33/dist/codicon.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            overflow: hidden;
        }
        #root {
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script type="module">
        // Acquire VS Code API
        const vscode = acquireVsCodeApi();
        
        // Import and mount React app would go here
        // For now, we'll use vanilla JS to demonstrate the structure
        
        ${this.getInlineReactApp()}
    </script>
</body>
</html>`;
    }

    private getInlineReactApp(): string {
        // This is a temporary inline implementation
        // In production, this would load the bundled React app
        return `
        const root = document.getElementById('root');
        let currentState = null;
        let messages = [];

        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            handleMessage(message);
        });

        function handleMessage(message) {
            console.log('Webview received:', message.command);
            
            switch (message.command) {
                case 'stateUpdate':
                    currentState = message;
                    render();
                    break;
                case 'streamChunk':
                    handleStreamChunk(message.data);
                    break;
                case 'streamComplete':
                    handleStreamComplete();
                    break;
                case 'error':
                    handleError(message.data);
                    break;
                case 'loadHistory':
                    messages = message.data.messages || [];
                    render();
                    break;
            }
        }

        function handleStreamChunk(data) {
            const { messageId, chunk } = data;
            const existingMsg = messages.find(m => m.id === messageId);
            
            if (existingMsg) {
                existingMsg.content += chunk;
                existingMsg.isStreaming = true;
            } else {
                messages.push({
                    id: messageId,
                    role: 'assistant',
                    content: chunk,
                    timestamp: Date.now(),
                    isStreaming: true
                });
            }
            render();
        }

        function handleStreamComplete() {
            messages = messages.map(m => ({ ...m, isStreaming: false }));
            render();
        }

        function handleError(error) {
            messages.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: '',
                error,
                timestamp: Date.now()
            });
            render();
        }

        function render() {
            if (!currentState) {
                root.innerHTML = renderLoading('Loading AI Copilot...');
                return;
            }

            const state = typeof currentState.state === 'string' 
                ? currentState.state 
                : Object.keys(currentState.state)[0];

            switch (state) {
                case 'Initialize':
                    root.innerHTML = renderLoading('Initializing...');
                    break;
                case 'Unauthenticated':
                    root.innerHTML = renderLoginPanel();
                    setupLoginListeners();
                    break;
                case 'Authenticating':
                    root.innerHTML = renderLoading('Authenticating...');
                    break;
                case 'Authenticated':
                    root.innerHTML = renderChatPanel();
                    setupChatListeners();
                    break;
                case 'Disabled':
                    root.innerHTML = renderDisabled();
                    break;
                default:
                    root.innerHTML = renderError('Unknown state');
            }
        }

        function renderLoading(message) {
            return \`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 16px;">
                    <div style="width: 40px; height: 40px; border: 3px solid var(--vscode-progressBar-background); border-top-color: var(--vscode-textLink-foreground); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="color: var(--vscode-descriptionForeground);">\${message}</p>
                </div>
                <style>
                    @keyframes spin { to { transform: rotate(360deg); } }
                </style>
            \`;
        }

        function renderLoginPanel() {
            return \`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 32px; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <div style="font-size: 64px; margin-bottom: 16px; color: var(--vscode-textLink-foreground);">
                            <i class="codicon codicon-sparkle"></i>
                        </div>
                        <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 600;">Welcome to Karavan AI Copilot</h2>
                        <p style="margin: 0; color: var(--vscode-descriptionForeground);">Choose your preferred authentication method</p>
                    </div>
                    
                    <div style="width: 100%; display: flex; flex-direction: column; gap: 16px;">
                        <div style="padding: 20px; background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: 6px;">
                            <button id="copilot-btn" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                <i class="codicon codicon-github" style="font-size: 24px;"></i>
                                <div style="flex: 1; text-align: left;">
                                    <div style="font-weight: 600;">GitHub Copilot</div>
                                    <div style="font-size: 12px; opacity: 0.8;">Recommended if you have GitHub Copilot</div>
                                </div>
                                <i class="codicon codicon-arrow-right"></i>
                            </button>
                        </div>
                        
                        <div style="padding: 20px; background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: 6px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                <i class="codicon codicon-key" style="font-size: 18px;"></i>
                                <strong>OpenAI API Key</strong>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <input id="api-key-input" type="password" placeholder="sk-..." style="flex: 1; padding: 8px 12px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; font-family: monospace; font-size: 13px;">
                                <button id="api-key-btn" style="padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer;">Connect</button>
                            </div>
                        </div>
                        
                        <div style="padding: 20px; background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: 6px;">
                            <button id="local-llm-btn" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-button-border); border-radius: 4px; cursor: pointer;">
                                <i class="codicon codicon-server" style="font-size: 24px;"></i>
                                <div style="flex: 1; text-align: left;">
                                    <div style="font-weight: 600;">Local LLM</div>
                                    <div style="font-size: 12px; opacity: 0.8;">Connect to Ollama or similar</div>
                                </div>
                                <i class="codicon codicon-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            \`;
        }

        function renderChatPanel() {
            const messagesHtml = messages.map(msg => {
                const isUser = msg.role === 'user';
                return \`
                    <div style="display: flex; flex-direction: column; gap: 8px; align-items: \${isUser ? 'flex-end' : 'flex-start'};">
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--vscode-descriptionForeground);">
                            <i class="codicon codicon-\${isUser ? 'account' : 'sparkle'}"></i>
                            <span style="font-weight: 600;">\${isUser ? 'You' : 'AI Copilot'}</span>
                        </div>
                        <div style="max-width: 85%; padding: 12px 16px; border-radius: 8px; background: var(\${isUser ? '--vscode-input-background' : '--vscode-editor-background'}); border: 1px solid var(--vscode-panel-border);">
                            \${msg.error ? \`<div style="color: var(--vscode-errorForeground);"><i class="codicon codicon-error"></i> \${msg.error}</div>\` : msg.content}
                            \${msg.isStreaming ? '<span style="animation: blink 1s step-start infinite;">▊</span>' : ''}
                        </div>
                    </div>
                \`;
            }).join('');

            return \`
                <div style="display: flex; flex-direction: column; height: 100vh;">
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editorGroupHeader-tabsBackground);">
                        <h3 style="margin: 0; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            <i class="codicon codicon-sparkle" style="color: var(--vscode-textLink-foreground);"></i>
                            AI Copilot
                        </h3>
                        <button id="clear-btn" style="padding: 4px 8px; background: transparent; color: var(--vscode-foreground); border: none; cursor: pointer; border-radius: 4px;">
                            <i class="codicon codicon-clear-all"></i>
                        </button>
                    </div>
                    
                    <div id="messages" style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px;">
                        \${messagesHtml || '<div style="text-align: center; padding: 48px; color: var(--vscode-descriptionForeground);"><i class="codicon codicon-sparkle" style="font-size: 48px; display: block; margin-bottom: 16px; color: var(--vscode-textLink-foreground);"></i><h2>Karavan AI Copilot</h2><p>Ask me to help you create Apache Camel integration routes!</p></div>'}
                    </div>
                    
                    <div style="padding: 16px; border-top: 1px solid var(--vscode-panel-border);">
                        <div style="display: flex; gap: 8px;">
                            <input id="chat-input" type="text" placeholder="Ask AI to help with Camel routes..." style="flex: 1; padding: 10px 12px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px;">
                            <button id="send-btn" style="padding: 10px 20px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer;">
                                <i class="codicon codicon-send"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes blink { 50% { opacity: 0; } }
                </style>
            \`;
        }

        function renderDisabled() {
            return \`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 32px;">
                    <i class="codicon codicon-error" style="font-size: 48px; color: var(--vscode-editorError-foreground); margin-bottom: 16px;"></i>
                    <h2>AI Copilot Disabled</h2>
                    <p style="color: var(--vscode-descriptionForeground);">Enable it in settings to continue.</p>
                </div>
            \`;
        }

        function renderError(message) {
            return \`<div style="padding: 20px; color: var(--vscode-errorForeground);">Error: \${message}</div>\`;
        }

        function setupLoginListeners() {
            document.getElementById('copilot-btn')?.addEventListener('click', () => {
                vscode.postMessage({ command: 'login', data: { method: 'github-copilot' } });
            });
            
            document.getElementById('api-key-btn')?.addEventListener('click', () => {
                const apiKey = document.getElementById('api-key-input').value;
                vscode.postMessage({ command: 'login', data: { method: 'openai', apiKey } });
            });
            
            document.getElementById('local-llm-btn')?.addEventListener('click', () => {
                vscode.postMessage({ command: 'login', data: { method: 'local-llm' } });
            });
        }

        function setupChatListeners() {
            const input = document.getElementById('chat-input');
            const sendBtn = document.getElementById('send-btn');
            const clearBtn = document.getElementById('clear-btn');
            
            const sendMessage = () => {
                const content = input.value.trim();
                if (!content) return;
                
                messages.push({
                    id: Date.now().toString(),
                    role: 'user',
                    content,
                    timestamp: Date.now()
                });
                
                vscode.postMessage({
                    command: 'sendMessage',
                    data: { content, conversationHistory: messages }
                });
                
                input.value = '';
                render();
                setTimeout(() => {
                    const msgContainer = document.getElementById('messages');
                    msgContainer.scrollTop = msgContainer.scrollHeight;
                }, 100);
            };
            
            sendBtn?.addEventListener('click', sendMessage);
            input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
            clearBtn?.addEventListener('click', () => {
                messages = [];
                vscode.postMessage({ command: 'clearHistory' });
                render();
            });
        }

        // Request initial state
        vscode.postMessage({ command: 'getState' });
        `;
    }

        function authWithGitHubCopilot() {
            vscode.postMessage({ command: 'githubCopilotAuth' });
        }

        function authWithApiKey() {
            const apiKey = document.getElementById('apiKey').value;
            if (apiKey) {
                vscode.postMessage({ command: 'apiKeyAuth', apiKey });
            }
        }

        function authWithLocalLLM() {
            vscode.postMessage({ command: 'localLlmAuth' });
        }

        function sendMessage() {
            const input = document.getElementById('chatInput');
            if (input && input.value.trim()) {
                const text = input.value.trim();
                messages.push({ role: 'user', content: text });
                vscode.postMessage({ command: 'sendMessage', text });
                input.value = '';
                render();
            }
        }

        function logout() {
            vscode.postMessage({ command: 'logout' });
            messages = [];
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'stateUpdate') {
                currentState = typeof message.state === 'object' ? 'Authenticating' : message.state;
                render();
            } else if (message.command === 'chatResponse') {
                messages.push(message.message);
                render();
                const messagesDiv = document.getElementById('messages');
                if (messagesDiv) {
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
            }
        });

        // Request initial state
        vscode.postMessage({ command: 'getState' });
    </script>
</body>
</html>`;
    }

    public dispose(): void {
        AIPanelWebview.currentPanel = undefined;

        this.panel.dispose();

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
