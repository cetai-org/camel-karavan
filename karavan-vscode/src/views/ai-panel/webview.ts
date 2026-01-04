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

        // Subscribe to state machine changes
        const stateSubscription = AIStateMachine.service().subscribe((state) => {
            console.log('AI State changed:', state.value);
            this.sendStateUpdate();
        });
        this.disposables.push({ dispose: () => stateSubscription.unsubscribe() });

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
            case 'debug':
                // Log debug messages from webview
                if (message.keyEvent) {
                    console.log('DEBUG - Key event:', JSON.stringify(message.keyEvent));
                } else if (message.text) {
                    console.log('DEBUG -', message.text);
                }
                break;

            case 'getState':
                this.sendStateUpdate();
                break;
            
            case 'login':
                const { method, apiKey } = message.data || {};
                
                if (method === 'openai' && apiKey) {
                    AIStateMachine.service().send({ type: 'LOGIN' });
                    AIStateMachine.service().send({ 
                        type: 'API_KEY_AUTH', 
                        apiKey 
                    });
                } else if (method === 'local-llm') {
                    AIStateMachine.service().send({ type: 'LOGIN' });
                    AIStateMachine.service().send({ type: 'LOCAL_LLM_AUTH', endpoint: 'http://localhost:11434' });
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
        console.log('Sending state update:', JSON.stringify(snapshot.value), 'Context:', snapshot.context);
        this.panel.webview.postMessage({
            command: 'stateUpdate',
            data: {
                state: snapshot.value,
                context: snapshot.context,
                defaultPrompt: this.defaultPrompt,
            },
        });
    }

    private async handleChatMessage(data: any): Promise<void> {
        const { content, conversationHistory } = data;
        
        try {
            console.log('Handling chat message:', content);
            
            // Import backend utilities
            const { getAIBackend, resetBackend } = await import('../../ai/utils/backend');
            const { gatherCamelContext, buildPromptContext, getCurrentDiagnostics } = await import('../../ai/utils/context');
            
            // Reset backend to ensure fresh initialization with correct config
            resetBackend();
            
            // Get the current login method from state machine
            const snapshot = AIStateMachine.getSnapshot();
            const loginMethod = snapshot.context.loginMethod;
            console.log('Login method:', loginMethod);
            
            // Get the current AI backend using the login method
            console.log('Getting AI backend...');
            const backend = await getAIBackend(loginMethod);
            console.log('Backend obtained:', backend.name);
            
            // Gather context
            const camelContext = await gatherCamelContext();
            const diagnostics = getCurrentDiagnostics();
            const contextString = buildPromptContext(camelContext, diagnostics);
            
            console.log('Camel context gathered:', camelContext);
            console.log('Context string:', contextString);
            
            // Generate unique message ID for streaming
            const messageId = Date.now().toString();
            
            // Stream response
            try {
                console.log('Calling backend.sendMessage...');
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
                console.error('Error in sendMessage:', error);
                this.panel.webview.postMessage({
                    command: 'error',
                    data: error instanceof Error ? error.message : 'Failed to get AI response',
                });
            }
        } catch (error) {
            console.error('Error in handleChatMessage:', error);
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
        const extensionPath = vscode.extensions.getExtension('camel-karavan.karavan')?.extensionPath || '';
        const aiPanelJs = this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'dist', 'ai-panel.js')));
        const aiPanelCss = this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'dist', 'ai-panel.css')));
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'none'; 
                   style-src ${this.panel.webview.cspSource} 'unsafe-inline' https://cdn.jsdelivr.net; 
                   script-src ${this.panel.webview.cspSource} 'unsafe-inline'; 
                   font-src ${this.panel.webview.cspSource} https://cdn.jsdelivr.net; 
                   connect-src https: http: ws: wss:;">
    <title>Karavan AI Copilot</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.33/dist/codicon.css">
    <link rel="stylesheet" href="${aiPanelCss}">
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
    <script>
        // Acquire the VS Code API once and cache it globally before any other scripts load
        window.__vscodeApi = acquireVsCodeApi();
    </script>
    <script src="${aiPanelJs}"></script>
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
