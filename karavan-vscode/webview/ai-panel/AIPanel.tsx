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
import { AIMachineStateSnapshot } from './types';
import { AIChat } from './AIChat';
import { LoginPanel } from './LoginPanel';
import vscode from '../vscode';
import './AIPanel.css';

export const AIPanel: React.FC = () => {
    const [state, setState] = React.useState<AIMachineStateSnapshot | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        // Listen for state updates from extension
        const messageHandler = (event: MessageEvent) => {
            const message = event.data;

            switch (message.command) {
                case 'stateUpdate':
                    console.log('Received state update:', message.data);
                    setState(message.data);
                    setIsLoading(false);
                    break;
            }
        };

        window.addEventListener('message', messageHandler);

        // Request initial state
        vscode.postMessage({ command: 'getState' });

        return () => {
            window.removeEventListener('message', messageHandler);
        };
    }, []);

    const renderContent = () => {
        if (isLoading || !state) {
            console.log('Loading state - isLoading:', isLoading, 'state:', state);
            return (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading AI Copilot...</p>
                </div>
            );
        }

        console.log('Rendering with state:', state);
        if (!state.state) {
            console.error('State property is missing:', state);
            return (
                <div className="loading-container">
                    <p>Error: Invalid state</p>
                </div>
            );
        }
        
        const currentState = typeof state.state === 'string' 
            ? state.state 
            : (state.state && Object.keys(state.state)[0]) || 'Unauthenticated';

        switch (currentState) {
            case 'Initialize':
                return (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Initializing...</p>
                    </div>
                );

            case 'Unauthenticated':
                return <LoginPanel />;

            case 'Authenticating':
                return (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Authenticating...</p>
                        {state.context.errorMessage && (
                            <div className="error-message">
                                <i className="codicon codicon-error"></i>
                                {state.context.errorMessage}
                            </div>
                        )}
                    </div>
                );

            case 'Authenticated':
                return <AIChat />;

            case 'Disabled':
                return (
                    <div className="disabled-container">
                        <div className="disabled-icon">
                            <i className="codicon codicon-error"></i>
                        </div>
                        <h2>AI Copilot Disabled</h2>
                        <p>The AI Copilot feature is currently disabled.</p>
                        <p>Please enable it in the settings to continue.</p>
                        <button
                            className="primary-button"
                            onClick={() => {
                                vscode.postMessage({ command: 'openSettings' });
                            }}
                        >
                            Open Settings
                        </button>
                    </div>
                );

            default:
                return (
                    <div className="error-container">
                        <h2>Unknown State</h2>
                        <p>State: {JSON.stringify(state.state)}</p>
                    </div>
                );
        }
    };

    return (
        <div className="ai-panel">
            {renderContent()}
        </div>
    );
};
