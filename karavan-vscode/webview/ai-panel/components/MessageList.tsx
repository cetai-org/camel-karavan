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
import { ChatMessage } from '../types';
import { CodeBlock } from './CodeBlock';
import './MessageList.css';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading?: boolean;
    onApplyCode?: (code: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onApplyCode }) => {
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const renderMessageContent = (message: ChatMessage) => {
        const { content, error } = message;

        if (error) {
            return (
                <div className="message-error">
                    <i className="codicon codicon-error"></i>
                    {error}
                </div>
            );
        }

        // Parse content for code blocks
        const parts = parseContentWithCodeBlocks(content);
        console.log('MessageList - Parsed parts:', parts);

        return parts.map((part, index) => {
            if (part.type === 'code') {
                console.log('Rendering CodeBlock:', part);
                return (
                    <CodeBlock
                        key={index}
                        code={part.content}
                        language={part.language || 'yaml'}
                        onApply={onApplyCode}
                    />
                );
            }
            return (
                <div key={index} className="message-text">
                    {part.content.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i < part.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </div>
            );
        });
    };

    return (
        <div className="message-list">
            {messages.length === 0 && (
                <div className="welcome-message">
                    <div className="welcome-icon">
                        <i className="codicon codicon-sparkle"></i>
                    </div>
                    <h2>Karavan AI Copilot</h2>
                    <p>Ask me to help you create Apache Camel integration routes!</p>
                    <div className="example-prompts">
                        <p><strong>Try asking:</strong></p>
                        <ul>
                            <li>"Create a REST API that receives JSON and sends to Kafka"</li>
                            <li>"Generate a route that reads from a file and transforms to XML"</li>
                            <li>"How do I use the content-based router EIP?"</li>
                        </ul>
                    </div>
                </div>
            )}

            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`message message-${message.role}`}
                >
                    <div className="message-header">
                        <span className="message-role">
                            {message.role === 'user' ? (
                                <i className="codicon codicon-account"></i>
                            ) : (
                                <i className="codicon codicon-sparkle"></i>
                            )}
                            {message.role === 'user' ? 'You' : 'AI Copilot'}
                        </span>
                        <span className="message-timestamp">
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="message-content">
                        {renderMessageContent(message)}
                        {message.isStreaming && (
                            <span className="streaming-indicator">▊</span>
                        )}
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="message message-assistant">
                    <div className="message-header">
                        <span className="message-role">
                            <i className="codicon codicon-sparkle"></i>
                            AI Copilot
                        </span>
                    </div>
                    <div className="message-content">
                        <div className="loading-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};

// Helper function to parse content with code blocks
interface ContentPart {
    type: 'text' | 'code';
    content: string;
    language?: string;
}

function parseContentWithCodeBlocks(content: string): ContentPart[] {
    const parts: ContentPart[] = [];
    // Updated regex to handle code blocks with or without newline after language
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    
    console.log('parseContentWithCodeBlocks - Input content:', content.substring(0, 200));
    console.log('parseContentWithCodeBlocks - Testing regex...');

    while ((match = codeBlockRegex.exec(content)) !== null) {
        console.log('Found code block match:', {
            language: match[1],
            contentLength: match[2].length,
            content: match[2].substring(0, 100)
        });
        
        // Add text before code block
        if (match.index > lastIndex) {
            const textContent = content.substring(lastIndex, match.index).trim();
            if (textContent) {
                parts.push({ type: 'text', content: textContent });
            }
        }

        // Add code block
        parts.push({
            type: 'code',
            content: match[2].trim(),
            language: match[1] || 'yaml',
        });

        lastIndex = match.index + match[0].length;
    }

    console.log('parseContentWithCodeBlocks - Final parts count:', parts.length);
    
    // Add remaining text
    if (lastIndex < content.length) {
        const textContent = content.substring(lastIndex).trim();
        if (textContent) {
            parts.push({ type: 'text', content: textContent });
        }
    }

    // If no code blocks found, return entire content as text
    if (parts.length === 0) {
        console.log('No code blocks found, returning as text');
        parts.push({ type: 'text', content });
    }

    return parts;
}
