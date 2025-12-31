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
                AIStateMachine.service().send({ type: 'LOGIN' });
                break;

            case 'apiKeyAuth':
                AIStateMachine.service().send({ 
                    type: 'API_KEY_AUTH', 
                    apiKey: message.apiKey 
                });
                break;

            case 'githubCopilotAuth':
                AIStateMachine.service().send({ type: 'GITHUB_COPILOT_AUTH' });
                break;

            case 'logout':
                AIStateMachine.service().send({ type: 'LOGOUT' });
                break;

            case 'sendMessage':
                // Handle AI chat messages
                await this.handleChatMessage(message.text, message.context);
                break;

            case 'applyCode':
                // Handle code application to files
                await this.applyGeneratedCode(message.code, message.filePath);
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

    private async handleChatMessage(text: string, context: any): Promise<void> {
        // This will be implemented in Phase 2
        // For now, just echo back
        this.panel.webview.postMessage({
            command: 'chatResponse',
            message: {
                role: 'assistant',
                content: `You said: ${text}. (AI integration coming in Phase 2)`,
            },
        });
    }

    private async applyGeneratedCode(code: string, filePath?: string): Promise<void> {
        try {
            if (!filePath) {
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
                }
            } else {
                // Update existing file
                const uri = vscode.Uri.file(filePath);
                await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));
                await vscode.window.showTextDocument(uri);
            }

            vscode.window.showInformationMessage('Code applied successfully');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to apply code: ' + (error as Error).message);
        }
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Karavan AI Copilot</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: var(--vscode-foreground);
            margin-bottom: 20px;
        }
        .login-panel {
            background-color: var(--vscode-editor-background);
            padding: 30px;
            border-radius: 8px;
            border: 1px solid var(--vscode-panel-border);
        }
        .auth-option {
            margin: 15px 0;
            padding: 15px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            cursor: pointer;
        }
        .auth-option:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 14px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        input {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        .chat-container {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 100px);
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 10px;
        }
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 4px;
        }
        .user-message {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            text-align: right;
        }
        .assistant-message {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
        }
        .input-container {
            display: flex;
            gap: 10px;
        }
        .loading {
            text-align: center;
            padding: 40px;
        }
        .error {
            color: var(--vscode-errorForeground);
            padding: 10px;
            border: 1px solid var(--vscode-errorForeground);
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container" id="app">
        <div class="loading">
            <h2>Loading AI Copilot...</h2>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentState = 'Initialize';
        let messages = [];

        function render() {
            const app = document.getElementById('app');
            
            if (currentState === 'Initialize' || currentState === 'Authenticating') {
                app.innerHTML = '<div class="loading"><h2>Initializing...</h2></div>';
            } else if (currentState === 'Unauthenticated') {
                app.innerHTML = renderLoginPanel();
            } else if (currentState === 'Authenticated') {
                app.innerHTML = renderChatPanel();
                setupChatListeners();
            } else {
                app.innerHTML = '<div class="error"><h2>Unknown state: ' + currentState + '</h2></div>';
            }
        }

        function renderLoginPanel() {
            return \`
                <div class="login-panel">
                    <h1>Welcome to Karavan AI Copilot</h1>
                    <p>Choose your authentication method:</p>
                    
                    <div class="auth-option" onclick="authWithGitHubCopilot()">
                        <h3>GitHub Copilot</h3>
                        <p>Use your GitHub Copilot subscription</p>
                    </div>

                    <div class="auth-option">
                        <h3>OpenAI API Key</h3>
                        <input type="password" id="apiKey" placeholder="Enter your OpenAI API key">
                        <button onclick="authWithApiKey()">Connect</button>
                    </div>

                    <div class="auth-option" onclick="authWithLocalLLM()">
                        <h3>Local LLM</h3>
                        <p>Connect to a local LLM (Ollama, LM Studio, etc.)</p>
                    </div>
                </div>
            \`;
        }

        function renderChatPanel() {
            const messageHtml = messages.map(msg => \`
                <div class="message \${msg.role}-message">
                    <strong>\${msg.role === 'user' ? 'You' : 'AI'}:</strong>
                    <div>\${msg.content}</div>
                </div>
            \`).join('');

            return \`
                <div class="chat-container">
                    <h1>Karavan AI Copilot</h1>
                    <div class="messages" id="messages">
                        \${messageHtml || '<p>Start a conversation about your Camel integration...</p>'}
                    </div>
                    <div class="input-container">
                        <input type="text" id="chatInput" placeholder="Describe the integration you want to create..." />
                        <button onclick="sendMessage()">Send</button>
                    </div>
                    <button onclick="logout()" style="margin-top: 10px;">Logout</button>
                </div>
            \`;
        }

        function setupChatListeners() {
            const input = document.getElementById('chatInput');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                });
            }
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
