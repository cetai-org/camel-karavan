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
import * as http from 'http';
import { URL } from 'url';

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
        return new Promise((resolve) => {
            try {
                const url = new URL(`${this.baseUrl}/api/tags`);
                const req = http.get({
                    hostname: url.hostname,
                    port: url.port || 11434,
                    path: url.pathname,
                    method: 'GET',
                }, (res) => {
                    resolve(res.statusCode === 200);
                });
                req.on('error', (error) => {
                    console.error('Local LLM availability check failed:', error);
                    resolve(false);
                });
                req.setTimeout(5000, () => {
                    req.destroy();
                    resolve(false);
                });
            } catch (error) {
                console.error('Local LLM availability check failed:', error);
                resolve(false);
            }
        });
    }

    public async *sendMessage(
        message: string,
        history: ChatMessage[],
        context?: any
    ): AsyncIterableIterator<string> {
        const prompt = this.buildPrompt(message, history, context);
        const url = new URL(`${this.baseUrl}/api/generate`);
        
        const postData = JSON.stringify({
            model: this.config.model,
            prompt,
            stream: true,
            options: {
                temperature: this.config.temperature,
            },
        });

        console.log(`Sending request to ${url.href} with model: ${this.config.model}`);
        console.log(`Request details - hostname: ${url.hostname}, port: ${url.port}, path: ${url.pathname}`);

        const chunks: string[] = [];
        let responseComplete = false;
        let hasError: Error | null = null;
        
        const req = http.request({
            hostname: url.hostname,
            port: url.port || 11434,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        }, (res) => {
            console.log(`Response status: ${res.statusCode}`);
            if (res.statusCode !== 200) {
                hasError = new Error(`Local LLM error: ${res.statusCode} ${res.statusMessage}`);
                responseComplete = true;
                return;
            }

            let buffer = '';
            
            res.on('data', (chunk: Buffer) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (!line.trim()) continue;
                    
                    try {
                        const json = JSON.parse(line);
                        if (json.response) {
                            chunks.push(json.response);
                        }
                    } catch (error) {
                        console.error('Failed to parse JSON:', line);
                    }
                }
            });
            
            res.on('end', () => {
                if (buffer.trim()) {
                    try {
                        const json = JSON.parse(buffer);
                        if (json.response) {
                            chunks.push(json.response);
                        }
                    } catch (error) {
                        console.error('Failed to parse final JSON:', buffer);
                    }
                }
                responseComplete = true;
            });
        });

        req.on('error', (error) => {
            hasError = new Error(`Local LLM request failed: ${error.message}`);
            responseComplete = true;
        });

        req.write(postData);
        req.end();
        
        // Yield chunks as they come in
        while (!responseComplete || chunks.length > 0) {
            if (hasError) {
                throw hasError;
            }
            
            while (chunks.length > 0) {
                yield chunks.shift()!;
            }
            
            if (!responseComplete) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
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
