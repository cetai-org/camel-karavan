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
import * as http from 'http';
import { URL } from 'url';
import { AIBackend } from '../backends/base';
import { OpenAIBackend } from '../backends/openai';
import { LocalLLMBackend } from '../backends/localllm';
import { getAccessToken, getAIConfig } from '../../views/ai-panel/auth';
import type { LoginMethod } from '../../views/ai-panel/aiMachine';

let currentBackend: AIBackend | null = null;

async function selectLocalModel(endpoint: string, desiredModel: string): Promise<string> {
    // If the desired model already looks like a local model, try to use it
    const available = await getAvailableLocalModels(endpoint);
    if (available.length === 0) {
        console.warn('No local LLM models found at endpoint, falling back to desired model');
        return desiredModel;
    }

    if (available.includes(desiredModel)) {
        return desiredModel;
    }

    // If desired model is an OpenAI model, pick the first available local model
    const fallback = available[0];
    console.warn(`Desired model "${desiredModel}" not available locally. Using "${fallback}" instead.`);
    return fallback;
}

async function getAvailableLocalModels(endpoint: string): Promise<string[]> {
    return new Promise((resolve) => {
        try {
            const url = new URL(`${endpoint}/api/tags`);
            const req = http.get({
                hostname: url.hostname,
                port: url.port || 11434,
                path: url.pathname,
                method: 'GET',
            }, (res) => {
                let body = '';
                res.on('data', chunk => { body += chunk.toString(); });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        const models: string[] = (json?.models || []).map((m: any) => m.name || '').filter(Boolean);
                        resolve(models);
                    } catch (err) {
                        console.error('Failed to parse local LLM tags response:', err);
                        resolve([]);
                    }
                });
            });
            req.on('error', (error) => {
                console.error('Local LLM availability check failed:', error);
                resolve([]);
            });
            req.setTimeout(5000, () => {
                req.destroy();
                resolve([]);
            });
        } catch (error) {
            console.error('Local LLM availability check failed:', error);
            resolve([]);
        }
    });
}

/**
 * Get the configured AI backend
 */
export async function getAIBackend(preferredMethod?: LoginMethod): Promise<AIBackend> {
    const config = getAIConfig();
    const token = await getAccessToken();
    
    // Determine which backend to use
    let selectedBackend = preferredMethod || config.backend;
    
    // Map login method to backend name
    if (preferredMethod === 'local-llm') {
        selectedBackend = 'local-llm';
    } else if (preferredMethod === 'openai') {
        selectedBackend = 'openai';
    }

    // If backend is already initialized and config matches, return it
    if (currentBackend && currentBackend.name.toLowerCase().includes(selectedBackend)) {
        return currentBackend;
    }

    // Create new backend based on configuration
    switch (selectedBackend) {
        case 'openai': {
            const apiKey = token || config.apiKey;
            if (!apiKey) {
                throw new Error('OpenAI API key not configured');
            }
            currentBackend = new OpenAIBackend({
                apiKey,
                model: config.model || 'gpt-4',
            });
            break;
        }

        case 'local-llm': {
            const endpoint = config.localLlmEndpoint || 'http://localhost:11434';
            const desiredModel = config.model || 'llama2';
            const selectedModel = await selectLocalModel(endpoint, desiredModel);
            console.log(`Creating LocalLLMBackend with model: ${selectedModel}, endpoint: ${endpoint}`);
            currentBackend = new LocalLLMBackend({
                endpoint,
                model: selectedModel,
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
                const apiKey = config.apiKey || (await getAccessToken());
                if (!apiKey) return false;
                testBackend = new OpenAIBackend({ apiKey });
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
