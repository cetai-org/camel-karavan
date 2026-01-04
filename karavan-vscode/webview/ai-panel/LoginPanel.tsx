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
import vscode from '../vscode';
import './LoginPanel.css';

export const LoginPanel: React.FC = () => {
    const [apiKey, setApiKey] = React.useState('');
    const [isValidating, setIsValidating] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleApiKeyLogin = () => {
        if (!apiKey.trim()) {
            setError('Please enter an API key');
            return;
        }

        setIsValidating(true);
        setError('');
        vscode.postMessage({
            command: 'login',
            data: {
                method: 'openai',
                apiKey: apiKey.trim(),
            },
        });
    };

    const handleLocalLlmLogin = () => {
        setIsValidating(true);
        setError('');
        vscode.postMessage({
            command: 'login',
            data: { method: 'local-llm' },
        });
    };

    React.useEffect(() => {
        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            
            if (message.command === 'loginError') {
                setIsValidating(false);
                setError(message.data.error);
            }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, []);

    return (
        <div className="login-panel">
            <div className="login-header">
                <div className="login-icon">
                    <i className="codicon codicon-sparkle"></i>
                </div>
                <h2>Welcome to Karavan AI Copilot</h2>
                <p>Choose your preferred authentication method to get started</p>
            </div>

            <div className="login-options">
                {/* OpenAI API Key Option */}
                <div className="login-option">
                    <div className="option-header">
                        <i className="codicon codicon-key"></i>
                        <strong>OpenAI API Key</strong>
                    </div>
                    <div className="api-key-form">
                        <input
                            type="password"
                            className="api-key-input"
                            placeholder="sk-..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleApiKeyLogin();
                                }
                            }}
                            disabled={isValidating}
                        />
                        <button
                            className="login-button-small"
                            onClick={handleApiKeyLogin}
                            disabled={isValidating || !apiKey.trim()}
                        >
                            Connect
                        </button>
                    </div>
                    <p className="option-description">
                        Get your API key from{' '}
                        <a href="https://platform.openai.com/api-keys" target="_blank">
                            OpenAI Platform
                        </a>
                    </p>
                </div>

                {/* Local LLM Option */}
                <div className="login-option">
                    <button
                        className="login-button local"
                        onClick={handleLocalLlmLogin}
                        disabled={isValidating}
                    >
                        <i className="codicon codicon-server"></i>
                        <div className="button-content">
                            <strong>Local LLM</strong>
                            <span>Connect to Ollama or similar</span>
                        </div>
                        <i className="codicon codicon-arrow-right"></i>
                    </button>
                </div>
            </div>

            {error && (
                <div className="login-error">
                    <i className="codicon codicon-error"></i>
                    {error}
                </div>
            )}

            {isValidating && (
                <div className="login-validating">
                    <div className="spinner-small"></div>
                    Validating credentials...
                </div>
            )}

            <div className="login-footer">
                <p>
                    Your credentials are stored securely using VSCode's SecretStorage API
                </p>
            </div>
        </div>
    );
};
