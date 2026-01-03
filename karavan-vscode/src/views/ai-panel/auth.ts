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

import * as vscode from 'vscode';
import { AIUserToken, LoginMethod } from './aiMachine';

const TOKEN_KEY = 'karavan.ai.token';
const LOGIN_METHOD_KEY = 'karavan.ai.loginMethod';

let secretStorage: vscode.SecretStorage | undefined;

export function initializeAuth(context: vscode.ExtensionContext): void {
    secretStorage = context.secrets;
}

/**
 * Get the stored access token
 */
export async function getAccessToken(): Promise<string | undefined> {
    if (!secretStorage) {
        throw new Error('Secret storage not initialized');
    }
    return await secretStorage.get(TOKEN_KEY);
}

/**
 * Store access token securely
 */
export async function storeToken(token: string): Promise<void> {
    if (!secretStorage) {
        throw new Error('Secret storage not initialized');
    }
    await secretStorage.store(TOKEN_KEY, token);
}

/**
 * Clear stored token
 */
export async function clearToken(): Promise<void> {
    if (!secretStorage) {
        throw new Error('Secret storage not initialized');
    }
    await secretStorage.delete(TOKEN_KEY);
    await secretStorage.delete(LOGIN_METHOD_KEY);
}

/**
 * Store login method
 */
export async function storeLoginMethod(method: LoginMethod): Promise<void> {
    if (!secretStorage) {
        throw new Error('Secret storage not initialized');
    }
    await secretStorage.store(LOGIN_METHOD_KEY, method);
}

/**
 * Get stored login method
 */
export async function getStoredLoginMethod(): Promise<LoginMethod | undefined> {
    if (!secretStorage) {
        throw new Error('Secret storage not initialized');
    }
    const method = await secretStorage.get(LOGIN_METHOD_KEY);
    if (method && ['openai', 'local-llm', 'aws-bedrock', 'azure-openai'].includes(method)) {
        return method as LoginMethod;
    }
    return undefined;
}

/**
 * Get login method from configuration
 */
export function getLoginMethod(): LoginMethod {
    const config = vscode.workspace.getConfiguration('karavan.ai');
    return config.get<LoginMethod>('backend', 'openai');
}

/**
 * Validate OpenAI API key
 */
export async function validateApiKey(apiKey: string): Promise<AIUserToken> {
    try {
        // Test the API key with a simple request
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error('Invalid API key');
        }

        // Store the valid API key
        await storeToken(apiKey);

        return {
            accessToken: apiKey,
        };
    } catch (error) {
        throw new Error('Failed to validate OpenAI API key: ' + (error as Error).message);
    }
}

/**
 * Prompt user to enter API key
 */
export async function promptForApiKey(): Promise<string | undefined> {
    const loginMethod = getLoginMethod();
    
    let prompt: string;
    let placeholder: string;
    
    switch (loginMethod) {
        case 'openai':
            prompt = 'Enter your OpenAI API key';
            placeholder = 'sk-...';
            break;
        case 'azure-openai':
            prompt = 'Enter your Azure OpenAI API key';
            placeholder = 'Your Azure OpenAI key';
            break;
        case 'local-llm':
            prompt = 'Enter your local LLM endpoint';
            placeholder = 'http://localhost:11434';
            break;
        default:
            prompt = 'Enter your API key';
            placeholder = '';
    }

    const apiKey = await vscode.window.showInputBox({
        prompt,
        placeholder,
        password: loginMethod !== 'local-llm',
        ignoreFocusOut: true,
    });

    return apiKey;
}

/**
 * Logout and clear authentication
 */
export async function logout(): Promise<void> {
    await clearToken();
    vscode.window.showInformationMessage('Logged out from AI Copilot');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const token = await getAccessToken();
    return token !== undefined && token !== '';
}

/**
 * Get AI backend configuration
 */
export function getAIConfig() {
    const config = vscode.workspace.getConfiguration('karavan.ai');
    const result = {
        enabled: config.get<boolean>('enabled', true),
        backend: config.get<LoginMethod>('backend', 'openai'),
        model: config.get<string>('model', 'gpt-4'),
        localLlmEndpoint: config.get<string>('localLlmEndpoint', 'http://localhost:11434'),
    };
    console.log('getAIConfig() returning:', JSON.stringify(result, null, 2));
    return result;
}
