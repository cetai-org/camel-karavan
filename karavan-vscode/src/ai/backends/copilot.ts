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
import { AIBackend } from './base';
import { ChatMessage } from '../../../webview/ai-panel/types';

/**
 * GitHub Copilot backend implementation
 * Uses VSCode's GitHub Copilot extension API
 */
export class GitHubCopilotBackend implements AIBackend {
    public readonly name = 'GitHub Copilot';
    private copilotApi: any;
    private isDevMode = false;

    constructor() {}

    public async initialize(): Promise<void> {
        // Check if GitHub Copilot extension is installed
        let copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
        
        // If not found with standard ID, search for it
        if (!copilotExtension) {
            console.log('Standard GitHub.copilot ID not found. Searching for Copilot extension...');
            
            // List all extensions to find the right one
            const allExtensions = vscode.extensions.all;
            console.log('All installed extensions:', allExtensions.map(e => e.id).join(', '));
            
            // Try alternate IDs
            copilotExtension = vscode.extensions.getExtension('GitHub.copilot-chat') ||
                              vscode.extensions.getExtension('github.copilot') ||
                              vscode.extensions.getExtension('github.copilot-chat') ||
                              allExtensions.find(e => 
                                  e.id.toLowerCase().includes('copilot') && 
                                  e.id.toLowerCase().includes('github')
                              );
        }
        
        if (copilotExtension) {
            // GitHub Copilot is available
            console.log('Found GitHub Copilot extension:', copilotExtension.id);
            
            if (!copilotExtension.isActive) {
                console.log('Activating GitHub Copilot extension...');
                await copilotExtension.activate();
            }
            
            const extensionExports = copilotExtension.exports;
            console.log('Extension exports:', Object.keys(extensionExports || {}));
            
            // The copilot-chat extension uses getAPI() to return the actual API
            if (extensionExports?.getAPI) {
                console.log('Calling getAPI() to get Copilot Chat API...');
                try {
                    this.copilotApi = extensionExports.getAPI();
                    console.log('GitHub Copilot API obtained. API methods:', Object.keys(this.copilotApi || {}));
                } catch (error) {
                    console.error('Failed to get Copilot API:', error);
                    this.copilotApi = null;
                    this.isDevMode = true;
                }
            } else {
                // Direct API access (older versions)
                this.copilotApi = extensionExports;
                console.log('Using direct API access. Available methods:', Object.keys(this.copilotApi || {}));
            }
        } else {
            // GitHub Copilot not installed - use development mode
            // This allows testing without the extension
            console.warn('GitHub Copilot extension not found. Using development mode.');
            this.isDevMode = true;
            this.copilotApi = null;
        }
    }

    public async isAvailable(): Promise<boolean> {
        try {
            const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
            return !!copilotExtension || this.isDevMode;
        } catch (error) {
            return this.isDevMode;
        }
    }

    public async *sendMessage(
        message: string,
        history: ChatMessage[],
        context?: any
    ): AsyncIterableIterator<string> {
        if (this.isDevMode) {
            // Development mode: return a mock response
            yield* this.sendDevModeMessage(message, history, context);
        } else if (this.copilotApi) {
            // Production mode: use actual GitHub Copilot API
            yield* this.sendProductionMessage(message, history, context);
        } else {
            throw new Error('GitHub Copilot is not initialized');
        }
    }

    private async *sendDevModeMessage(
        message: string,
        history: ChatMessage[],
        context?: any
    ): AsyncIterableIterator<string> {
        // In dev mode, try to use OpenAI as fallback if available
        try {
            const { OpenAIBackend } = await import('./openai');
            const { getAccessToken } = await import('../../views/ai-panel/auth');
            
            // Try to get API key from multiple sources
            let apiKey = process.env.OPENAI_API_KEY || '';
            
            // If no env var, try to get from stored token
            if (!apiKey) {
                const storedToken = await getAccessToken();
                // Check if stored token looks like an OpenAI key
                if (storedToken && storedToken.startsWith('sk-')) {
                    apiKey = storedToken;
                    console.log('Dev mode: Using stored OpenAI API key');
                }
            } else {
                console.log('Dev mode: Using OPENAI_API_KEY environment variable');
            }
            
            if (apiKey) {
                console.log('Dev mode: Initializing OpenAI fallback');
                const openaiBackend = new OpenAIBackend({
                    apiKey,
                    model: 'gpt-4',
                });
                
                try {
                    // Initialize the backend (validates API key)
                    await openaiBackend.initialize();
                    console.log('Dev mode: Using OpenAI fallback');
                    yield* openaiBackend.sendMessage(message, history, context);
                    return;
                } catch (initError) {
                    console.warn('Dev mode: OpenAI initialization failed:', initError);
                    // Fall through to mock responses
                }
            } else {
                console.log('Dev mode: No OpenAI API key available');
            }
        } catch (error) {
            console.log('Dev mode: Error setting up OpenAI fallback:', error);
        }

        // GitHub Copilot Chat extension doesn't expose a public API for extensions.
        // The API returned by getAPI() only contains internal properties.
        // In development/testing, we use mock responses.
        // For production use, consider:
        // 1. Using OpenAI API directly (authenticate with OpenAI backend)
        // 2. Using the Copilot Chat UI directly in VS Code
        // 3. Contributing to GitHub Copilot to add extension API support
        
        const mockResponses: { [key: string]: string } = {
            'hello': 'Hello! I\'m your Apache Camel development assistant. How can I help you with your integration routes today?',
            'what is camel': 'Apache Camel is a powerful open-source integration framework that uses enterprise integration patterns. It enables you to define routing and mediation rules in a domain-specific language (DSL). Camel supports hundreds of protocols and data formats out of the box, making it perfect for building complex integration solutions.',
            'how do i': 'I can help you with Apache Camel! Common tasks include:\n\n1. **Creating routes** - Define message flows between endpoints\n2. **Data transformation** - Convert between different formats\n3. **Error handling** - Set up error handlers and recovery strategies\n4. **Testing** - Write unit tests for your routes\n5. **Deployment** - Deploy to various runtimes (Camel Main, Quarkus, Spring Boot)\n\nWhat would you like help with?',
        };

        // Find best matching response or use default
        const lowerMessage = message.toLowerCase();
        let response = mockResponses['hello']; // default
        
        for (const [key, value] of Object.entries(mockResponses)) {
            if (lowerMessage.includes(key)) {
                response = value;
                break;
            }
        }

        if (!Object.keys(mockResponses).some(key => lowerMessage.includes(key))) {
            response = `**Development Mode Response**\n\nI'm running in development mode. The GitHub Copilot Chat extension doesn't expose a public API for extensions.\n\n**Note:** You authenticated with GitHub Copilot, but that backend doesn't have a callable API. To get real AI responses:\n- Use the OpenAI backend (authenticate with an OpenAI API key directly)\n- Or use GitHub Copilot Chat directly in VS Code (Ctrl+Shift+I)\n\n**For now, I can help with:**\n- Apache Camel routing patterns\n- Component integration questions  \n- Deployment strategies\n- Error handling approaches\n\nWhat would you like to learn about Camel?`;
        }
        
        // Simulate streaming by yielding in chunks
        const words = response.split(' ');
        for (const word of words) {
            yield word + ' ';
            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 20));
        }
    }

    private async *sendProductionMessage(
        message: string,
        history: ChatMessage[],
        context?: any
    ): AsyncIterableIterator<string> {
        // Build prompt with context
        const fullPrompt = this.buildPrompt(message, history, context);

        try {
            console.log('Attempting to call GitHub Copilot Chat API...');
            console.log('API object keys:', Object.keys(this.copilotApi || {}));
            
            // Try different possible APIs for Copilot Chat
            let response: any;
            
            // Try makeRequest (newer API)
            if (this.copilotApi?.makeRequest) {
                console.log('Using makeRequest API');
                response = await this.copilotApi.makeRequest(
                    { kind: 'ask', message: fullPrompt },
                    new vscode.CancellationTokenSource().token
                );
            }
            // Try sendRequest
            else if (this.copilotApi?.sendRequest) {
                console.log('Using sendRequest API');
                response = await this.copilotApi.sendRequest(fullPrompt);
            }
            // Try requestChatWithContext
            else if (this.copilotApi?.requestChatWithContext) {
                console.log('Using requestChatWithContext API');
                response = await this.copilotApi.requestChatWithContext(fullPrompt, context);
            }
            // Try chat.sendMessage
            else if (this.copilotApi?.chat?.sendMessage) {
                console.log('Using chat.sendMessage API');
                response = await this.copilotApi.chat.sendMessage(fullPrompt);
            }
            // Try direct sendMessage
            else if (this.copilotApi?.sendMessage) {
                console.log('Using sendMessage API');
                response = await this.copilotApi.sendMessage(fullPrompt);
            }
            else {
                // API doesn't have expected methods - fall back to dev mode
                console.warn('GitHub Copilot Chat API missing expected methods. Available:', Object.keys(this.copilotApi || {}));
                yield* this.sendDevModeMessage(message, history, context);
                return;
            }
            
            if (response && typeof response === 'string') {
                yield response;
            } else if (response?.text && typeof response.text === 'string') {
                // Response might have a text property
                yield response.text;
            } else if (response && Symbol.asyncIterator in response) {
                // If streaming is supported
                for await (const chunk of response) {
                    yield chunk;
                }
            } else if (response?.response) {
                // Response might be nested
                yield response.response;
            } else {
                console.error('Unexpected response format:', response);
                throw new Error('Unexpected response format from GitHub Copilot: ' + typeof response);
            }
        } catch (error) {
            console.error('GitHub Copilot Chat error:', error);
            // Fall back to dev mode on error
            console.log('Falling back to development mode');
            yield* this.sendDevModeMessage(message, history, context);
        }
    }

    private buildPrompt(message: string, history: ChatMessage[], context?: any): string {
        let prompt = `You are helping with Apache Camel development.\n\n`;

        if (context) {
            prompt += `Context:\n${context}\n\n`;
        }

        // Add recent history (last 5 messages)
        const recentHistory = history.slice(-5);
        for (const msg of recentHistory) {
            prompt += `${msg.role}: ${msg.content}\n`;
        }

        prompt += `user: ${message}\nassistant:`;

        return prompt;
    }
}
