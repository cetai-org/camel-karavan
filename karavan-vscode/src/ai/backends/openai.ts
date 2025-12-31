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
import { SSEParser, parseOpenAIStream } from '../utils/sseUtils';

/**
 * OpenAI backend implementation
 */
export class OpenAIBackend implements AIBackend {
    public readonly name = 'OpenAI';
    private config: AIBackendConfig;
    private baseUrl = 'https://api.openai.com/v1';

    constructor(config: AIBackendConfig) {
        this.config = {
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000,
            ...config,
        };
    }

    public async initialize(): Promise<void> {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key is required');
        }
        
        // Validate API key
        await this.isAvailable();
    }

    public async isAvailable(): Promise<boolean> {
        if (!this.config.apiKey) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
            });
            return response.ok;
        } catch (error) {
            console.error('OpenAI availability check failed:', error);
            return false;
        }
    }

    public async *sendMessage(
        message: string,
        history: ChatMessage[],
        context?: any
    ): AsyncIterableIterator<string> {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        // Build messages array
        const messages = this.buildMessages(message, history, context);

        // Make streaming request
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        // Process streaming response
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        const parser = new SSEParser();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim().startsWith('data:')) {
                        const content = parseOpenAIStream(line);
                        if (content) {
                            yield content;
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    private buildMessages(message: string, history: ChatMessage[], context?: any): any[] {
        const messages: any[] = [
            {
                role: 'system',
                content: this.getSystemPrompt(context),
            },
        ];

        // Add conversation history
        for (const msg of history) {
            messages.push({
                role: msg.role,
                content: msg.content,
            });
        }

        // Add current message
        messages.push({
            role: 'user',
            content: message,
        });

        return messages;
    }

    private getSystemPrompt(context?: any): string {
        let prompt = `You are an expert AI assistant for Apache Camel integration development. 
You help users create, modify, and understand Apache Camel routes and integrations.

Your responses should:
- Be concise and focused on Camel concepts
- Provide working YAML examples when requested
- Use proper Camel EIP (Enterprise Integration Pattern) names
- Suggest appropriate Camel components for the use case
- Follow Camel best practices

When generating routes, use YAML format compatible with Camel DSL.`;

        if (context) {
            prompt += `\n\nCurrent Context:\n${context}`;
        }

        return prompt;
    }
}
