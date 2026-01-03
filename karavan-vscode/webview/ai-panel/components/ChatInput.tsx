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

declare const acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

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
    const [isComposing, setIsComposing] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const handleSendClick = () => {
        if (input.trim() && !disabled) {
            onSend(input.trim());
            setInput('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // During composition (IME), don't interfere
        if (isComposing) return;
        
        // Only handle Enter key
        if (e.key !== 'Enter') {
            return;
        }
        
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        // Try to detect shift - check if this is a "regular" enter or a modified enter
        // In VS Code webviews, shiftKey detection is unreliable, so we'll use a different approach
        // Check the raw keyboard code to differentiate
        const isModifiedEnter = e.shiftKey || e.ctrlKey || e.altKey || e.metaKey;
        
        // If any modifier is pressed, try to insert newline
        if (isModifiedEnter) {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = input.substring(0, start) + '\n' + input.substring(end);
            setInput(newValue);
            
            // Move cursor after newline
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            }, 0);
            return;
        }
        
        // Plain Enter = send (with no modifiers)
        // Be very strict: only send if NONE of the modifiers are true
        if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            handleSendClick();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        
        // Auto-resize textarea
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    };

    const handleCompositionStart = () => {
        setIsComposing(true);
    };

    const handleCompositionEnd = () => {
        setIsComposing(false);
    };

    return (
        <div className="chat-input-form">
            <div className="chat-input-container">
                <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                />
                <button
                    type="button"
                    className="chat-send-button"
                    disabled={disabled || !input.trim()}
                    onClick={handleSendClick}
                    title="Send message (Enter)"
                >
                    <i className="codicon codicon-send"></i>
                </button>
            </div>
            <div className="chat-input-hint">
                Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line
            </div>
        </div>
    );
};
