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

import { AIBackend, AIBackendConfig } from './base';
import { ChatMessage } from '../../../webview/ai-panel/types';

/**
 * Local LLM backend implementation (Ollama, LM Studio, etc.)
 */
export class LocalLLMBackend implements AIBackend {
    public readonly name = 'Local LLM';
    private config: AIBackendConfig;
    private baseUrl: string;

    constructor(config: AIBackendConfig) {
        this.config = {
            model: 'llama2',
            temperature: 0.7,
            ...config,
        };
        this.baseUrl = config.endpoint || 'http://localhost:11434';
    }

    public async initialize(): Promise<void> {
        // Check if local LLM is running
        const available = await this.isAvailable();
        if (!available) {
            throw new Error(`Local LLM is not available at ${this.baseUrl}`);
        }
    }

    public async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
            });
            return response.ok;
        } catch (error) {
            console.error('Local LLM availability check failed:', error);
            return false;
        }
    }

    public async *sendMessage(
        message: string,
        history: ChatMessage[],
        context?: any
    ): AsyncIterableIterator<string> {
        const prompt = this.buildPrompt(message, history, context);

        // Ollama API format
        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.config.model,
                prompt,
                stream: true,
                options: {
                    temperature: this.config.temperature,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Local LLM error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.response) {
                            yield json.response;
                        }
                        if (json.done) {
                            return;
                        }
                    } catch (error) {
                        console.error('Failed to parse JSON:', line);
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    private buildPrompt(message: string, history: ChatMessage[], context?: any): string {
        let prompt = `You are an expert AI assistant for Apache Camel integration development.\n\n`;

        if (context) {
            prompt += `Context:\n${context}\n\n`;
        }

        prompt += `Conversation:\n`;
        for (const msg of history.slice(-10)) {
            prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        }

        prompt += `User: ${message}\nAssistant:`;

        return prompt;
    }
}
