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
import { getAccessToken, validateApiKey, validateGitHubCopilot, clearToken } from './auth';
import * as vscode from 'vscode';

export type LoginMethod = 'github-copilot' | 'openai' | 'local-llm' | 'aws-bedrock' | 'azure-openai';

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
    | { Authenticating: 'determineFlow' | 'apiKeyFlow' | 'githubCopilotFlow' | 'validatingApiKey' | 'validatingGitHubCopilot' };

export type AIMachineEvent =
    | { type: 'LOGIN' }
    | { type: 'LOGOUT' }
    | { type: 'API_KEY_AUTH'; apiKey: string }
    | { type: 'GITHUB_COPILOT_AUTH' }
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
            always: [
                {
                    target: 'Authenticated',
                    cond: 'hasValidToken',
                },
                {
                    target: 'Unauthenticated',
                },
            ],
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
                        GITHUB_COPILOT_AUTH: {
                            target: 'githubCopilotFlow',
                            actions: assign({
                                loginMethod: (_ctx) => 'github-copilot',
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
                            actions: assign({
                                userToken: (_ctx, event) => event.data,
                                errorMessage: (_ctx) => undefined,
                            }),
                        },
                        onError: {
                            target: '#karavan-ai.Unauthenticated',
                            actions: assign({
                                errorMessage: (_ctx, event) => event.data.message || 'API key validation failed',
                            }),
                        },
                    },
                },
                githubCopilotFlow: {
                    invoke: {
                        src: 'validateGitHubCopilot',
                        onDone: {
                            target: '#karavan-ai.Authenticated',
                            actions: assign({
                                userToken: (_ctx, event) => event.data,
                                errorMessage: (_ctx) => undefined,
                            }),
                        },
                        onError: {
                            target: '#karavan-ai.Unauthenticated',
                            actions: assign({
                                errorMessage: (_ctx, event) => event.data.message || 'GitHub Copilot authentication failed',
                            }),
                        },
                    },
                },
                validatingApiKey: {},
                validatingGitHubCopilot: {},
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
    guards: {
        hasValidToken: async (context) => {
            try {
                const token = await getAccessToken();
                if (token) {
                    context.userToken = { accessToken: token };
                    return true;
                }
            } catch (error) {
                console.error('Error checking for valid token:', error);
            }
            return false;
        },
    },
    actions: {
        clearAuthData: assign({
            loginMethod: (_ctx) => undefined,
            userToken: (_ctx) => undefined,
            errorMessage: (_ctx) => undefined,
        }),
    },
    services: {
        validateApiKey: async (_context, event) => {
            if (event.type === 'API_KEY_AUTH') {
                return await validateApiKey(event.apiKey);
            }
            throw new Error('Invalid event type for API key validation');
        },
        validateGitHubCopilot: async () => {
            return await validateGitHubCopilot();
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
