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
import './ChatInput.css';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
    onSend, 
    disabled = false,
    placeholder = "Ask AI to help with Camel routes..." 
}) => {
    const [input, setInput] = React.useState('');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSend(input.trim());
            setInput('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        
        // Auto-resize textarea
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    };

    return (
        <form className="chat-input-form" onSubmit={handleSubmit}>
            <div className="chat-input-container">
                <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                />
                <button
                    type="submit"
                    className="chat-send-button"
                    disabled={disabled || !input.trim()}
                    title="Send message (Enter)"
                >
                    <i className="codicon codicon-send"></i>
                </button>
            </div>
            <div className="chat-input-hint">
                Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line
            </div>
        </form>
    );
};
