/**
 * AI Response Cache
 * Caches AI responses to improve performance and reduce API calls
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';

export interface CacheEntry<T> {
    value: T;
    timestamp: number;
    hits: number;
    size: number;
}

export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    entries: number;
    hitRate: number;
}

export interface CacheOptions {
    maxSize: number;          // Maximum cache size in bytes
    ttl: number;              // Time to live in milliseconds
    maxEntries: number;       // Maximum number of entries
    persistToStorage: boolean; // Persist to workspace storage
}

const DEFAULT_OPTIONS: CacheOptions = {
    maxSize: 10 * 1024 * 1024,  // 10MB
    ttl: 3600000,               // 1 hour
    maxEntries: 500,
    persistToStorage: true
};

export class AICache<T = any> {
    private cache: Map<string, CacheEntry<T>> = new Map();
    private options: CacheOptions;
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        size: 0,
        entries: 0,
        hitRate: 0
    };
    private context?: vscode.ExtensionContext;
    private storageKey: string = 'karavan.ai.cache';

    constructor(options: Partial<CacheOptions> = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Initialize cache with extension context for persistence
     */
    initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        if (this.options.persistToStorage) {
            this.loadFromStorage();
        }
    }

    /**
     * Generate cache key from input
     */
    private generateKey(input: string | object): string {
        const data = typeof input === 'string' ? input : JSON.stringify(input);
        return crypto.createHash('md5').update(data).digest('hex');
    }

    /**
     * Calculate approximate size of value
     */
    private calculateSize(value: T): number {
        return JSON.stringify(value).length * 2; // Approximate UTF-16 size
    }

    /**
     * Get value from cache
     */
    get(input: string | object): T | undefined {
        const key = this.generateKey(input);
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            this.updateHitRate();
            return undefined;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > this.options.ttl) {
            this.delete(key);
            this.stats.misses++;
            this.updateHitRate();
            return undefined;
        }

        // Update hit count
        entry.hits++;
        this.stats.hits++;
        this.updateHitRate();

        return entry.value;
    }

    /**
     * Set value in cache
     */
    set(input: string | object, value: T): void {
        const key = this.generateKey(input);
        const size = this.calculateSize(value);

        // Check if value is too large
        if (size > this.options.maxSize / 4) {
            console.warn('Cache entry too large, skipping');
            return;
        }

        // Evict if necessary
        this.evictIfNeeded(size);

        const entry: CacheEntry<T> = {
            value,
            timestamp: Date.now(),
            hits: 0,
            size
        };

        this.cache.set(key, entry);
        this.stats.size += size;
        this.stats.entries = this.cache.size;

        // Persist to storage
        if (this.options.persistToStorage) {
            this.saveToStorage();
        }
    }

    /**
     * Delete entry from cache
     */
    delete(key: string): boolean {
        const entry = this.cache.get(key);
        if (entry) {
            this.stats.size -= entry.size;
            this.cache.delete(key);
            this.stats.entries = this.cache.size;
            return true;
        }
        return false;
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            size: 0,
            entries: 0,
            hitRate: 0
        };

        if (this.options.persistToStorage && this.context) {
            this.context.workspaceState.update(this.storageKey, undefined);
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Check if key exists and is valid
     */
    has(input: string | object): boolean {
        const key = this.generateKey(input);
        const entry = this.cache.get(key);
        
        if (!entry) {
            return false;
        }

        // Check expiration
        if (Date.now() - entry.timestamp > this.options.ttl) {
            this.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Get or compute value
     */
    async getOrCompute(
        input: string | object,
        compute: () => Promise<T>
    ): Promise<T> {
        const cached = this.get(input);
        if (cached !== undefined) {
            return cached;
        }

        const value = await compute();
        this.set(input, value);
        return value;
    }

    /**
     * Evict entries if cache is too large
     */
    private evictIfNeeded(requiredSpace: number): void {
        // Check size limit
        while (this.stats.size + requiredSpace > this.options.maxSize && this.cache.size > 0) {
            this.evictLRU();
        }

        // Check entry limit
        while (this.cache.size >= this.options.maxEntries && this.cache.size > 0) {
            this.evictLRU();
        }
    }

    /**
     * Evict least recently used entry
     */
    private evictLRU(): void {
        let oldestKey: string | undefined;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            const score = entry.timestamp + (entry.hits * 60000); // Bonus for hits
            if (score < oldestTime) {
                oldestTime = score;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }

    /**
     * Update hit rate statistic
     */
    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    }

    /**
     * Load cache from workspace storage
     */
    private loadFromStorage(): void {
        if (!this.context) return;

        try {
            const data = this.context.workspaceState.get<{
                entries: [string, CacheEntry<T>][];
                stats: CacheStats;
            }>(this.storageKey);

            if (data) {
                // Filter out expired entries
                const now = Date.now();
                const validEntries = data.entries.filter(
                    ([, entry]) => now - entry.timestamp < this.options.ttl
                );

                this.cache = new Map(validEntries);
                this.stats = data.stats;
                this.stats.entries = this.cache.size;
                
                // Recalculate size
                this.stats.size = 0;
                for (const entry of this.cache.values()) {
                    this.stats.size += entry.size;
                }
            }
        } catch (error) {
            console.warn('Failed to load cache from storage:', error);
        }
    }

    /**
     * Save cache to workspace storage
     */
    private saveToStorage(): void {
        if (!this.context) return;

        try {
            const data = {
                entries: Array.from(this.cache.entries()),
                stats: this.stats
            };
            this.context.workspaceState.update(this.storageKey, data);
        } catch (error) {
            console.warn('Failed to save cache to storage:', error);
        }
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.options.ttl) {
                this.delete(key);
                removed++;
            }
        }

        if (removed > 0 && this.options.persistToStorage) {
            this.saveToStorage();
        }

        return removed;
    }
}

// Global cache instances
let routeCache: AICache<string>;
let componentCache: AICache<any>;
let suggestionCache: AICache<any[]>;

export function getRouteCache(): AICache<string> {
    if (!routeCache) {
        routeCache = new AICache<string>({
            ttl: 1800000, // 30 minutes for routes
            maxEntries: 100
        });
    }
    return routeCache;
}

export function getComponentCache(): AICache<any> {
    if (!componentCache) {
        componentCache = new AICache<any>({
            ttl: 86400000, // 24 hours for component info
            maxEntries: 200
        });
    }
    return componentCache;
}

export function getSuggestionCache(): AICache<any[]> {
    if (!suggestionCache) {
        suggestionCache = new AICache<any[]>({
            ttl: 300000, // 5 minutes for suggestions
            maxEntries: 500
        });
    }
    return suggestionCache;
}

export function initializeCaches(context: vscode.ExtensionContext): void {
    getRouteCache().initialize(context);
    getComponentCache().initialize(context);
    getSuggestionCache().initialize(context);
}

export function clearAllCaches(): void {
    getRouteCache().clear();
    getComponentCache().clear();
    getSuggestionCache().clear();
}

export function getAllCacheStats(): {
    route: CacheStats;
    component: CacheStats;
    suggestion: CacheStats;
} {
    return {
        route: getRouteCache().getStats(),
        component: getComponentCache().getStats(),
        suggestion: getSuggestionCache().getStats()
    };
}
