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

import { ChatMessage } from '../../../webview/ai-panel/types';

export interface SSEChunk {
    event?: string;
    data: string;
    id?: string;
    retry?: number;
}

/**
 * Parse Server-Sent Events (SSE) stream
 */
export class SSEParser {
    private buffer: string = '';
    private eventHandlers: Map<string, (data: string) => void> = new Map();
    private messageHandler?: (chunk: SSEChunk) => void;

    constructor() {}

    /**
     * Register event handler for specific event types
     */
    public on(event: string, handler: (data: string) => void) {
        this.eventHandlers.set(event, handler);
    }

    /**
     * Register handler for all messages
     */
    public onMessage(handler: (chunk: SSEChunk) => void) {
        this.messageHandler = handler;
    }

    /**
     * Process incoming chunk of data
     */
    public processChunk(chunk: string): SSEChunk[] {
        this.buffer += chunk;
        const chunks: SSEChunk[] = [];

        // Split by double newline (message separator)
        const messages = this.buffer.split('\n\n');
        
        // Keep last incomplete message in buffer
        this.buffer = messages.pop() || '';

        for (const message of messages) {
            if (!message.trim()) continue;

            const parsed = this.parseMessage(message);
            if (parsed) {
                chunks.push(parsed);
                
                // Call registered handlers
                if (this.messageHandler) {
                    this.messageHandler(parsed);
                }
                
                if (parsed.event && this.eventHandlers.has(parsed.event)) {
                    this.eventHandlers.get(parsed.event)!(parsed.data);
                }
            }
        }

        return chunks;
    }

    /**
     * Parse a single SSE message
     */
    private parseMessage(message: string): SSEChunk | null {
        const lines = message.split('\n');
        const chunk: SSEChunk = { data: '' };

        for (const line of lines) {
            if (line.startsWith('event:')) {
                chunk.event = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
                const data = line.substring(5).trim();
                chunk.data += (chunk.data ? '\n' : '') + data;
            } else if (line.startsWith('id:')) {
                chunk.id = line.substring(3).trim();
            } else if (line.startsWith('retry:')) {
                chunk.retry = parseInt(line.substring(6).trim(), 10);
            }
        }

        return chunk.data ? chunk : null;
    }

    /**
     * Reset parser state
     */
    public reset() {
        this.buffer = '';
    }
}

/**
 * Stream manager for handling SSE connections
 */
export class SSEStreamManager {
    private abortController?: AbortController;
    private isStreaming: boolean = false;

    /**
     * Start streaming from an endpoint
     */
    public async startStream(
        url: string,
        options: {
            headers?: Record<string, string>;
            body?: string;
            method?: string;
            onChunk: (chunk: string) => void;
            onComplete: () => void;
            onError: (error: Error) => void;
        }
    ): Promise<void> {
        // Cancel any existing stream
        this.stopStream();

        this.abortController = new AbortController();
        this.isStreaming = true;

        try {
            const response = await fetch(url, {
                method: options.method || 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    ...options.headers,
                },
                body: options.body,
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body is not readable');
            }

            const decoder = new TextDecoder();
            
            while (this.isStreaming) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                options.onChunk(chunk);
            }

            options.onComplete();
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Stream was intentionally cancelled
                return;
            }
            options.onError(error instanceof Error ? error : new Error(String(error)));
        } finally {
            this.isStreaming = false;
        }
    }

    /**
     * Stop current stream
     */
    public stopStream() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = undefined;
        }
        this.isStreaming = false;
    }

    /**
     * Check if currently streaming
     */
    public get streaming(): boolean {
        return this.isStreaming;
    }
}

/**
 * Parse OpenAI-style streaming response
 */
export function parseOpenAIStream(chunk: string): string {
    try {
        // OpenAI returns data in format: data: {"choices":[{"delta":{"content":"text"}}]}
        if (chunk.startsWith('data: ')) {
            const jsonStr = chunk.substring(6);
            
            // Check for [DONE] signal
            if (jsonStr.trim() === '[DONE]') {
                return '';
            }

            const data = JSON.parse(jsonStr);
            return data.choices?.[0]?.delta?.content || '';
        }
    } catch (error) {
        console.error('Failed to parse OpenAI stream chunk:', error);
    }
    return '';
}

/**
 * Parse GitHub Copilot-style streaming response
 */
export function parseGitHubCopilotStream(chunk: string): string {
    try {
        // Similar to OpenAI format
        return parseOpenAIStream(chunk);
    } catch (error) {
        console.error('Failed to parse GitHub Copilot stream chunk:', error);
    }
    return '';
}
