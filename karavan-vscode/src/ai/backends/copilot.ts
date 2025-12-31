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

    constructor() {}

    public async initialize(): Promise<void> {
        // Check if GitHub Copilot extension is installed
        const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
        
        if (!copilotExtension) {
            throw new Error('GitHub Copilot extension is not installed');
        }

        if (!copilotExtension.isActive) {
            await copilotExtension.activate();
        }

        this.copilotApi = copilotExtension.exports;
    }

    public async isAvailable(): Promise<boolean> {
        try {
            const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
            return !!copilotExtension;
        } catch (error) {
            return false;
        }
    }

    public async *sendMessage(
        message: string,
        history: ChatMessage[],
        context?: any
    ): AsyncIterableIterator<string> {
        if (!this.copilotApi) {
            throw new Error('GitHub Copilot is not initialized');
        }

        // Build prompt with context
        const fullPrompt = this.buildPrompt(message, history, context);

        try {
            // Use GitHub Copilot Chat API if available
            // Note: This is a placeholder - actual API may differ
            const response = await this.copilotApi.chat?.sendMessage?.(fullPrompt);
            
            if (response && typeof response === 'string') {
                yield response;
            } else if (response && Symbol.asyncIterator in response) {
                // If streaming is supported
                for await (const chunk of response) {
                    yield chunk;
                }
            } else {
                throw new Error('Unexpected response format from GitHub Copilot');
            }
        } catch (error) {
            throw new Error(`GitHub Copilot error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
