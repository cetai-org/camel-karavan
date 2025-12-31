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
import { AIBackend } from '../backends/base';
import { OpenAIBackend } from '../backends/openai';
import { GitHubCopilotBackend } from '../backends/copilot';
import { LocalLLMBackend } from '../backends/localllm';
import { getAccessToken, getAIConfig } from '../../views/ai-panel/auth';

let currentBackend: AIBackend | null = null;

/**
 * Get the configured AI backend
 */
export async function getAIBackend(): Promise<AIBackend> {
    const config = getAIConfig();
    const token = await getAccessToken();

    // If backend is already initialized and config matches, return it
    if (currentBackend && currentBackend.name.toLowerCase().includes(config.backend)) {
        return currentBackend;
    }

    // Create new backend based on configuration
    switch (config.backend) {
        case 'openai': {
            const apiKey = token?.accessToken || config.apiKey;
            if (!apiKey) {
                throw new Error('OpenAI API key not configured');
            }
            currentBackend = new OpenAIBackend({
                apiKey,
                model: config.model || 'gpt-4',
            });
            break;
        }

        case 'github-copilot': {
            currentBackend = new GitHubCopilotBackend();
            break;
        }

        case 'local-llm': {
            currentBackend = new LocalLLMBackend({
                endpoint: config.localLlmEndpoint || 'http://localhost:11434',
                model: config.model || 'llama2',
            });
            break;
        }

        default:
            throw new Error(`Unsupported AI backend: ${config.backend}`);
    }

    // Initialize the backend
    try {
        await currentBackend.initialize();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to initialize ${config.backend}: ${errorMessage}`);
        throw error;
    }

    return currentBackend;
}

/**
 * Reset the current backend (useful when configuration changes)
 */
export function resetBackend(): void {
    currentBackend = null;
}

/**
 * Check if a backend is available
 */
export async function checkBackendAvailability(backend: string): Promise<boolean> {
    try {
        const config = getAIConfig();
        let testBackend: AIBackend;

        switch (backend) {
            case 'openai': {
                const apiKey = config.apiKey || (await getAccessToken())?.accessToken;
                if (!apiKey) return false;
                testBackend = new OpenAIBackend({ apiKey });
                break;
            }

            case 'github-copilot': {
                testBackend = new GitHubCopilotBackend();
                break;
            }

            case 'local-llm': {
                testBackend = new LocalLLMBackend({
                    endpoint: config.localLlmEndpoint || 'http://localhost:11434',
                });
                break;
            }

            default:
                return false;
        }

        return await testBackend.isAvailable();
    } catch (error) {
        console.error(`Backend availability check failed for ${backend}:`, error);
        return false;
    }
}
