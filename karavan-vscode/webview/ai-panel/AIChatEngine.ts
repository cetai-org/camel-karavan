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

import { RouteContext, ChatMessage } from './types';

/**
 * AIChatEngine handles AI backend communication and streaming responses
 */
export class AIChatEngine {
    private vscode: any;
    private conversationHistory: ChatMessage[] = [];

    constructor(vscode: any) {
        this.vscode = vscode;
    }

    public initialize() {
        // Initialize the chat engine
        console.log('AIChatEngine initialized');
    }

    /**
     * Send a message to the AI backend
     */
    public async sendMessage(content: string): Promise<void> {
        // Request context from extension
        this.vscode.postMessage({
            command: 'sendMessage',
            data: {
                content,
                conversationHistory: this.conversationHistory,
            },
        });
    }

    /**
     * Add a message to conversation history
     */
    public addToHistory(message: ChatMessage) {
        this.conversationHistory.push(message);
    }

    /**
     * Clear conversation history
     */
    public clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * Get conversation history
     */
    public getHistory(): ChatMessage[] {
        return this.conversationHistory;
    }
}
