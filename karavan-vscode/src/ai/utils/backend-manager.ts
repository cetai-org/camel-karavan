/**
 * Enhanced Backend Manager for AI Services
 * Handles backend selection, fallback, and health monitoring
 */

import * as vscode from 'vscode';
import { AIBackend, AIBackendConfig } from '../backends/base';
import { OpenAIBackend } from '../backends/openai';
import { GitHubCopilotBackend } from '../backends/copilot';
import { LocalLLMBackend } from '../backends/localllm';
import { getAccessToken, getAIConfig } from '../../views/ai-panel/auth';

export interface BackendStatus {
    name: string;
    available: boolean;
    lastChecked: Date;
    lastError?: string;
    responseTime?: number;
}

export interface BackendManagerOptions {
    enableFallback?: boolean;
    fallbackOrder?: string[];
    healthCheckInterval?: number;
}

/**
 * Enhanced backend manager with fallback and health monitoring
 */
export class BackendManager {
    private currentBackend: AIBackend | null = null;
    private backendStatuses: Map<string, BackendStatus> = new Map();
    private options: BackendManagerOptions;
    private healthCheckTimer?: NodeJS.Timer;
    private disposables: vscode.Disposable[] = [];

    constructor(options: BackendManagerOptions = {}) {
        this.options = {
            enableFallback: true,
            fallbackOrder: ['github-copilot', 'openai', 'local-llm'],
            healthCheckInterval: 60000, // 1 minute
            ...options,
        };

        // Listen for configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('karavan.ai')) {
                    this.resetBackend();
                }
            })
        );

        // Start health monitoring
        if (this.options.healthCheckInterval) {
            this.startHealthMonitoring();
        }
    }

    /**
     * Get the best available backend
     */
    async getBackend(): Promise<AIBackend> {
        const config = getAIConfig();

        // If current backend is valid, return it
        if (this.currentBackend) {
            const status = this.backendStatuses.get(config.backend);
            if (status?.available) {
                return this.currentBackend;
            }
        }

        // Try to initialize configured backend
        try {
            this.currentBackend = await this.createBackend(config.backend);
            return this.currentBackend;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.updateBackendStatus(config.backend, false, errorMessage);

            // Try fallback if enabled
            if (this.options.enableFallback) {
                const fallback = await this.tryFallback(config.backend);
                if (fallback) {
                    return fallback;
                }
            }

            throw new Error(`No AI backend available. Primary error: ${errorMessage}`);
        }
    }

    /**
     * Create a backend instance
     */
    private async createBackend(backendName: string): Promise<AIBackend> {
        const config = getAIConfig();
        const token = await getAccessToken();
        let backend: AIBackend;

        const startTime = Date.now();

        switch (backendName) {
            case 'openai': {
                const apiKey = token?.accessToken || config.apiKey;
                if (!apiKey) {
                    throw new Error('OpenAI API key not configured');
                }
                backend = new OpenAIBackend({
                    apiKey,
                    model: config.model || 'gpt-4',
                    maxTokens: 4096,
                    temperature: 0.7,
                });
                break;
            }

            case 'github-copilot': {
                backend = new GitHubCopilotBackend();
                break;
            }

            case 'local-llm': {
                backend = new LocalLLMBackend({
                    endpoint: config.localLlmEndpoint || 'http://localhost:11434',
                    model: config.model || 'llama2',
                });
                break;
            }

            default:
                throw new Error(`Unsupported AI backend: ${backendName}`);
        }

        // Initialize and verify
        await backend.initialize();
        
        if (!await backend.isAvailable()) {
            throw new Error(`Backend ${backendName} is not available`);
        }

        const responseTime = Date.now() - startTime;
        this.updateBackendStatus(backendName, true, undefined, responseTime);

        return backend;
    }

    /**
     * Try fallback backends
     */
    private async tryFallback(failedBackend: string): Promise<AIBackend | null> {
        const fallbackOrder = this.options.fallbackOrder || [];
        
        for (const backendName of fallbackOrder) {
            if (backendName === failedBackend) continue;

            try {
                console.log(`Trying fallback backend: ${backendName}`);
                const backend = await this.createBackend(backendName);
                
                vscode.window.showWarningMessage(
                    `Using ${backendName} as fallback AI backend`
                );
                
                this.currentBackend = backend;
                return backend;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.updateBackendStatus(backendName, false, errorMessage);
                console.log(`Fallback ${backendName} failed:`, errorMessage);
            }
        }

        return null;
    }

    /**
     * Update backend status
     */
    private updateBackendStatus(
        name: string,
        available: boolean,
        error?: string,
        responseTime?: number
    ): void {
        this.backendStatuses.set(name, {
            name,
            available,
            lastChecked: new Date(),
            lastError: error,
            responseTime,
        });
    }

    /**
     * Get all backend statuses
     */
    getBackendStatuses(): BackendStatus[] {
        return Array.from(this.backendStatuses.values());
    }

    /**
     * Check backend health
     */
    async checkHealth(backendName: string): Promise<BackendStatus> {
        const startTime = Date.now();
        
        try {
            const backend = await this.createBackend(backendName);
            const available = await backend.isAvailable();
            const responseTime = Date.now() - startTime;
            
            this.updateBackendStatus(backendName, available, undefined, responseTime);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.updateBackendStatus(backendName, false, errorMessage);
        }

        return this.backendStatuses.get(backendName)!;
    }

    /**
     * Start health monitoring
     */
    private startHealthMonitoring(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }

        this.healthCheckTimer = setInterval(async () => {
            const config = getAIConfig();
            await this.checkHealth(config.backend);
        }, this.options.healthCheckInterval);
    }

    /**
     * Stop health monitoring
     */
    stopHealthMonitoring(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
    }

    /**
     * Reset the current backend
     */
    resetBackend(): void {
        this.currentBackend = null;
    }

    /**
     * Switch to a different backend
     */
    async switchBackend(backendName: string): Promise<void> {
        this.resetBackend();
        
        // Update configuration
        await vscode.workspace.getConfiguration('karavan.ai').update(
            'backend',
            backendName,
            vscode.ConfigurationTarget.Global
        );

        // Initialize new backend
        this.currentBackend = await this.createBackend(backendName);
    }

    /**
     * Get current backend name
     */
    getCurrentBackendName(): string | undefined {
        return this.currentBackend?.name;
    }

    /**
     * Test a backend with a simple prompt
     */
    async testBackend(backendName: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
        const startTime = Date.now();
        
        try {
            const backend = await this.createBackend(backendName);
            
            // Send a test message
            let response = '';
            for await (const chunk of backend.sendMessage('Reply with "OK" only.', [])) {
                response += chunk;
                if (response.length > 100) break; // Limit response size for test
            }

            const responseTime = Date.now() - startTime;
            
            return {
                success: true,
                message: `Backend ${backendName} is working. Response time: ${responseTime}ms`,
                responseTime,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                message: `Backend ${backendName} test failed: ${errorMessage}`,
            };
        }
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.stopHealthMonitoring();
        this.disposables.forEach(d => d.dispose());
    }
}

// Singleton instance
let backendManagerInstance: BackendManager | undefined;

export function getBackendManager(): BackendManager {
    if (!backendManagerInstance) {
        backendManagerInstance = new BackendManager();
    }
    return backendManagerInstance;
}

export function disposeBackendManager(): void {
    if (backendManagerInstance) {
        backendManagerInstance.dispose();
        backendManagerInstance = undefined;
    }
}
