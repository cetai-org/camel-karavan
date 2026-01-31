/**
 * Lazy Loader
 * Implements lazy loading for expensive AI operations
 */

import * as vscode from 'vscode';

export interface LazyLoadOptions {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}

const DEFAULT_OPTIONS: LazyLoadOptions = {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
};

export type LoaderState = 'idle' | 'loading' | 'loaded' | 'error';

export class LazyLoader<T> {
    private value: T | undefined;
    private error: Error | undefined;
    private loadPromise: Promise<T> | undefined;
    private state: LoaderState = 'idle';
    private loadCount = 0;
    private options: LazyLoadOptions;

    constructor(
        private loader: () => Promise<T>,
        options: LazyLoadOptions = {}
    ) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Get the loaded value, loading if necessary
     */
    async get(): Promise<T> {
        if (this.state === 'loaded' && this.value !== undefined) {
            return this.value;
        }

        if (this.state === 'loading' && this.loadPromise) {
            return this.loadPromise;
        }

        return this.load();
    }

    /**
     * Force reload the value
     */
    async reload(): Promise<T> {
        this.state = 'idle';
        this.value = undefined;
        this.error = undefined;
        this.loadPromise = undefined;
        return this.load();
    }

    /**
     * Get value if loaded, undefined otherwise
     */
    getValue(): T | undefined {
        return this.value;
    }

    /**
     * Get current state
     */
    getState(): LoaderState {
        return this.state;
    }

    /**
     * Check if loaded
     */
    isLoaded(): boolean {
        return this.state === 'loaded';
    }

    /**
     * Get any error that occurred
     */
    getError(): Error | undefined {
        return this.error;
    }

    /**
     * Preload the value
     */
    preload(): void {
        if (this.state === 'idle') {
            this.load().catch(() => {
                // Ignore preload errors
            });
        }
    }

    /**
     * Reset to initial state
     */
    reset(): void {
        this.state = 'idle';
        this.value = undefined;
        this.error = undefined;
        this.loadPromise = undefined;
        this.loadCount = 0;
    }

    /**
     * Internal load function with retry logic
     */
    private async load(): Promise<T> {
        this.state = 'loading';
        this.loadCount++;

        this.loadPromise = this.loadWithTimeout()
            .then(value => {
                this.value = value;
                this.state = 'loaded';
                this.error = undefined;
                return value;
            })
            .catch(async (error) => {
                if (this.loadCount < this.options.retryAttempts!) {
                    await this.delay(this.options.retryDelay!);
                    return this.load();
                }
                this.error = error;
                this.state = 'error';
                throw error;
            });

        return this.loadPromise;
    }

    /**
     * Load with timeout
     */
    private loadWithTimeout(): Promise<T> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Load timeout'));
            }, this.options.timeout);

            this.loader()
                .then(value => {
                    clearTimeout(timeout);
                    resolve(value);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Lazy module loader for AI features
 */
export class LazyModuleLoader {
    private modules: Map<string, LazyLoader<any>> = new Map();

    /**
     * Register a lazy module
     */
    register<T>(name: string, loader: () => Promise<T>, options?: LazyLoadOptions): void {
        this.modules.set(name, new LazyLoader(loader, options));
    }

    /**
     * Get a module, loading if necessary
     */
    async get<T>(name: string): Promise<T> {
        const loader = this.modules.get(name);
        if (!loader) {
            throw new Error(`Module not registered: ${name}`);
        }
        return loader.get();
    }

    /**
     * Check if module is loaded
     */
    isLoaded(name: string): boolean {
        const loader = this.modules.get(name);
        return loader?.isLoaded() ?? false;
    }

    /**
     * Preload specific modules
     */
    preload(names: string[]): void {
        for (const name of names) {
            const loader = this.modules.get(name);
            loader?.preload();
        }
    }

    /**
     * Preload all modules
     */
    preloadAll(): void {
        for (const loader of this.modules.values()) {
            loader.preload();
        }
    }

    /**
     * Get loading status for all modules
     */
    getStatus(): Map<string, LoaderState> {
        const status = new Map<string, LoaderState>();
        for (const [name, loader] of this.modules.entries()) {
            status.set(name, loader.getState());
        }
        return status;
    }

    /**
     * Reset all modules
     */
    resetAll(): void {
        for (const loader of this.modules.values()) {
            loader.reset();
        }
    }
}

// Global module loader
let moduleLoader: LazyModuleLoader;

export function getModuleLoader(): LazyModuleLoader {
    if (!moduleLoader) {
        moduleLoader = new LazyModuleLoader();
        registerDefaultModules();
    }
    return moduleLoader;
}

/**
 * Register default AI modules
 */
function registerDefaultModules(): void {
    const loader = getModuleLoader();

    // Route Generator - loaded on first use
    loader.register('route-generator', async () => {
        const { RouteGenerator } = await import('../agent/route-generator');
        return new RouteGenerator();
    });

    // Component Suggester - loaded on first use
    loader.register('component-suggester', async () => {
        const { ComponentSuggester } = await import('../suggestions/component-suggester');
        return new ComponentSuggester();
    });

    // EIP Suggester - loaded on first use
    loader.register('eip-suggester', async () => {
        const { EIPSuggester } = await import('../suggestions/eip-suggester');
        return new EIPSuggester();
    });

    // Expression Helper - loaded on first use
    loader.register('expression-helper', async () => {
        const { ExpressionHelper } = await import('../assistance/expression-helper');
        return new ExpressionHelper();
    });

    // Code Optimizer - loaded on first use
    loader.register('code-optimizer', async () => {
        const { CodeOptimizer } = await import('../optimization/code-optimizer');
        return new CodeOptimizer();
    });

    // Diagnostics Provider - loaded immediately (needed for real-time validation)
    loader.register('diagnostics-provider', async () => {
        const { DiagnosticsProvider } = await import('../diagnostics/diagnostics-provider');
        return new DiagnosticsProvider();
    }, { timeout: 5000 });

    // Quick Fix Provider - loaded on first error
    loader.register('quick-fix-provider', async () => {
        const { QuickFixProvider } = await import('../diagnostics/quick-fix-provider');
        return new QuickFixProvider();
    });
}

/**
 * Initialize lazy loading with preloading of essential modules
 */
export function initializeLazyLoading(context: vscode.ExtensionContext): void {
    const loader = getModuleLoader();
    
    // Preload diagnostics provider immediately (needed for real-time validation)
    loader.preload(['diagnostics-provider']);

    // Preload other modules after a delay to not block startup
    setTimeout(() => {
        loader.preload(['component-suggester', 'eip-suggester']);
    }, 5000);
}

/**
 * Lazy value holder with auto-refresh
 */
export class LazyValue<T> {
    private loader: LazyLoader<T>;
    private refreshInterval?: NodeJS.Timeout;

    constructor(
        private loadFn: () => Promise<T>,
        private refreshMs?: number,
        options?: LazyLoadOptions
    ) {
        this.loader = new LazyLoader(loadFn, options);
    }

    async get(): Promise<T> {
        return this.loader.get();
    }

    getValue(): T | undefined {
        return this.loader.getValue();
    }

    startAutoRefresh(): void {
        if (this.refreshMs && !this.refreshInterval) {
            this.refreshInterval = setInterval(() => {
                this.loader.reload().catch(() => {
                    // Ignore refresh errors
                });
            }, this.refreshMs);
        }
    }

    stopAutoRefresh(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
        }
    }

    dispose(): void {
        this.stopAutoRefresh();
        this.loader.reset();
    }
}
