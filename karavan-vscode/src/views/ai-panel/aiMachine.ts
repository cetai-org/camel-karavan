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

import { createMachine, assign, interpret, Interpreter } from 'xstate';
import { AIPanelWebview } from './webview';
import { getAccessToken, validateApiKey, clearToken, storeLoginMethod, getStoredLoginMethod } from './auth';
import * as vscode from 'vscode';

export type LoginMethod = 'openai' | 'local-llm' | 'aws-bedrock' | 'azure-openai';

export interface AIUserToken {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
}

export interface AIMachineContext {
    loginMethod?: LoginMethod;
    userToken?: AIUserToken;
    errorMessage?: string;
}

export type AIMachineStateValue =
    | 'Initialize'
    | 'Unauthenticated'
    | 'Authenticated'
    | 'Disabled'
    | { Authenticating: 'determineFlow' | 'apiKeyFlow' | 'validatingApiKey' };

export type AIMachineEvent =
    | { type: 'LOGIN' }
    | { type: 'LOGOUT' }
    | { type: 'API_KEY_AUTH'; apiKey: string }
    | { type: 'LOCAL_LLM_AUTH'; endpoint: string }
    | { type: 'AUTH_SUCCESS'; token: AIUserToken }
    | { type: 'AUTH_FAILED'; error: string }
    | { type: 'DISPOSE' };

export const aiMachine = createMachine<AIMachineContext, AIMachineEvent>({
    id: 'karavan-ai',
    initial: 'Initialize',
    predictableActionArguments: true,
    context: {
        loginMethod: undefined,
        userToken: undefined,
        errorMessage: undefined,
    },
    on: {
        DISPOSE: {
            target: 'Initialize',
            actions: assign({
                loginMethod: (_ctx) => undefined,
                userToken: (_ctx) => undefined,
                errorMessage: (_ctx) => undefined,
            }),
        },
    },
    states: {
        Initialize: {
            invoke: {
                src: 'checkStoredToken',
                onDone: [
                    {
                        target: 'Authenticated',
                        cond: (_ctx, event) => event.data !== null,
                        actions: assign({
                            userToken: (_ctx, event) => ({ accessToken: event.data.token }),
                            loginMethod: (_ctx, event) => event.data.loginMethod || 'openai',
                        }),
                    },
                    {
                        target: 'Unauthenticated',
                    },
                ],
                onError: {
                    target: 'Unauthenticated',
                },
            },
        },
        Unauthenticated: {
            on: {
                LOGIN: 'Authenticating',
            },
        },
        Authenticating: {
            initial: 'determineFlow',
            states: {
                determineFlow: {
                    on: {
                        API_KEY_AUTH: {
                            target: 'apiKeyFlow',
                            actions: assign({
                                loginMethod: (_ctx) => 'openai',
                            }),
                        },
                        LOCAL_LLM_AUTH: {
                            target: 'validatingApiKey',
                            actions: assign({
                                loginMethod: (_ctx) => 'local-llm',
                            }),
                        },
                    },
                },
                apiKeyFlow: {
                    invoke: {
                        src: 'validateApiKey',
                        onDone: {
                            target: '#karavan-ai.Authenticated',
                            actions: ['saveLoginMethodOnApiKeyAuth', assign({
                                userToken: (_ctx, event) => event.data,
                                errorMessage: (_ctx) => undefined,
                                loginMethod: (ctx) => ctx.loginMethod || 'openai',
                            })],
                        },
                        onError: {
                            target: '#karavan-ai.Unauthenticated',
                            actions: assign({
                                errorMessage: (_ctx, event) => event.data.message || 'API key validation failed',
                            }),
                        },
                    },
                },
                validatingApiKey: {
                    invoke: {
                        src: 'validateLocalLLM',
                        onDone: {
                            target: '#karavan-ai.Authenticated',
                            actions: ['saveLoginMethodOnLocalLLM', assign({
                                userToken: (_ctx, event) => ({ accessToken: event.data.endpoint }),
                                errorMessage: (_ctx) => undefined,
                                loginMethod: (_ctx) => 'local-llm',
                            })],
                        },
                        onError: {
                            target: '#karavan-ai.Unauthenticated',
                            actions: assign({
                                errorMessage: (_ctx, event) => event.data.message || 'Local LLM connection failed',
                            }),
                        },
                    },
                },
            },
        },
        Authenticated: {
            on: {
                LOGOUT: {
                    target: 'Unauthenticated',
                    actions: ['clearAuthData'],
                },
            },
        },
        Disabled: {
            type: 'final',
        },
    },
},
{
    guards: {},
    actions: {
        clearAuthData: assign({
            loginMethod: (_ctx) => undefined,
            userToken: (_ctx) => undefined,
            errorMessage: (_ctx) => undefined,
        }),
        saveLoginMethodOnApiKeyAuth: (ctx) => {
            storeLoginMethod('openai').catch(err => console.error('Failed to store login method:', err));
        },
        saveLoginMethodOnLocalLLM: (ctx) => {
            storeLoginMethod('local-llm').catch(err => console.error('Failed to store login method:', err));
        },
    },
    services: {
        checkStoredToken: async () => {
            try {
                const token = await getAccessToken();
                if (token) {
                    const loginMethod = await getStoredLoginMethod();
                    return { token, loginMethod } || null;
                }
                return null;
            } catch (error) {
                console.error('Error checking for stored token:', error);
                return null;
            }
        },
        validateApiKey: async (_context, event) => {
            if (event.type === 'API_KEY_AUTH') {
                return await validateApiKey(event.apiKey);
            }
            throw new Error('Invalid event type for API key validation');
        },
        validateLocalLLM: async (_context, event) => {
            if (event.type === 'LOCAL_LLM_AUTH') {
                // Check if local LLM is available
                const endpoint = event.endpoint || 'http://localhost:11434';
                try {
                    const response = await fetch(`${endpoint}/api/tags`, {
                        method: 'GET',
                    });
                    if (!response.ok) {
                        throw new Error(`Local LLM is not available at ${endpoint}`);
                    }
                    // Store endpoint as token
                    const config = vscode.workspace.getConfiguration('karavan.ai');
                    const storedEndpoint = config.get<string>('localLlmEndpoint', endpoint);
                    await vscode.workspace.getConfiguration('karavan.ai').update('localLlmEndpoint', storedEndpoint, vscode.ConfigurationTarget.Global);
                    return { endpoint: storedEndpoint };
                } catch (error: any) {
                    throw new Error(`Failed to connect to Local LLM: ${error.message}`);
                }
            }
            throw new Error('Invalid event type for Local LLM validation');
        },
    },
});

// Singleton service instance
let aiServiceInstance: Interpreter<AIMachineContext, any, AIMachineEvent> | undefined;

export class AIStateMachine {
    static service(): Interpreter<AIMachineContext, any, AIMachineEvent> {
        if (!aiServiceInstance) {
            aiServiceInstance = interpret(aiMachine);
            aiServiceInstance.start();
        }
        return aiServiceInstance;
    }

    static dispose(): void {
        if (aiServiceInstance) {
            aiServiceInstance.stop();
            aiServiceInstance = undefined;
        }
    }

    static getSnapshot() {
        return AIStateMachine.service().state;
    }
}

export const openAIWebview = (defaultPrompt?: any) => {
    if (!AIPanelWebview.currentPanel) {
        AIPanelWebview.currentPanel = new AIPanelWebview(defaultPrompt);
    } else {
        AIPanelWebview.currentPanel.getWebview()?.reveal();
    }
};

export const closeAIWebview = () => {
    if (AIPanelWebview.currentPanel) {
        AIPanelWebview.currentPanel.dispose();
        AIPanelWebview.currentPanel = undefined;
    }
};

/**
 * Open AI Panel with optional prompt
 */
export function openAIPanelWithPrompt(prompt?: any): void {
    vscode.commands.executeCommand('karavan.ai.openPanel', prompt);
}
