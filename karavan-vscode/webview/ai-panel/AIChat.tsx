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

import * as React from 'react';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './types';
import { AIChatEngine } from './AIChatEngine';
import './AIChat.css';

declare const acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

export const AIChat: React.FC = () => {
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [chatEngine] = React.useState(() => new AIChatEngine(vscode));

    React.useEffect(() => {
        // Initialize chat engine
        chatEngine.initialize();

        // Listen for messages from extension
        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            
            switch (message.command) {
                case 'chatResponse':
                    handleChatResponse(message.data);
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
                    setMessages(message.data.messages || []);
                    break;
            }
        };

        window.addEventListener('message', messageHandler);
        
        // Request message history on mount
        vscode.postMessage({ command: 'getHistory' });

        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, [chatEngine]);

    const handleSendMessage = async (content: string) => {
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            await chatEngine.sendMessage(content);
        } catch (error) {
            console.error('Failed to send message:', error);
            handleError(error instanceof Error ? error.message : 'Failed to send message');
        }
    };

    const handleChatResponse = (data: { content: string }) => {
        const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.content,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
    };

    const handleStreamChunk = (data: { messageId: string; chunk: string }) => {
        setMessages(prev => {
            const existingMessage = prev.find(m => m.id === data.messageId);
            
            if (existingMessage) {
                return prev.map(m =>
                    m.id === data.messageId
                        ? { ...m, content: m.content + data.chunk, isStreaming: true }
                        : m
                );
            } else {
                // Create new streaming message
                const newMessage: ChatMessage = {
                    id: data.messageId,
                    role: 'assistant',
                    content: data.chunk,
                    timestamp: Date.now(),
                    isStreaming: true,
                };
                return [...prev, newMessage];
            }
        });
    };

    const handleStreamComplete = () => {
        setMessages(prev =>
            prev.map(m => ({ ...m, isStreaming: false }))
        );
        setIsLoading(false);
    };

    const handleError = (error: string) => {
        const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            error,
        };

        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
    };

    const handleApplyCode = (code: string) => {
        vscode.postMessage({
            command: 'applyCode',
            data: { code },
        });
    };

    return (
        <div className="ai-chat">
            <div className="chat-header">
                <h3>
                    <i className="codicon codicon-sparkle"></i>
                    AI Copilot
                </h3>
                <div className="chat-actions">
                    <button
                        className="icon-button"
                        title="Clear chat"
                        onClick={() => {
                            setMessages([]);
                            vscode.postMessage({ command: 'clearHistory' });
                        }}
                    >
                        <i className="codicon codicon-clear-all"></i>
                    </button>
                    <button
                        className="icon-button"
                        title="Settings"
                        onClick={() => {
                            vscode.postMessage({ command: 'openSettings' });
                        }}
                    >
                        <i className="codicon codicon-settings-gear"></i>
                    </button>
                </div>
            </div>

            <MessageList messages={messages} isLoading={isLoading} />

            <ChatInput
                onSend={handleSendMessage}
                disabled={isLoading}
            />
        </div>
    );
};
