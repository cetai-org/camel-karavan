/**
 * Request Debouncer
 * Debounces rapid requests to reduce API calls and improve performance
 */

export interface DebouncerOptions {
    delay: number;           // Debounce delay in ms
    maxWait: number;         // Maximum wait time before forcing execution
    leading: boolean;        // Execute on leading edge
    trailing: boolean;       // Execute on trailing edge
}

const DEFAULT_OPTIONS: DebouncerOptions = {
    delay: 300,
    maxWait: 2000,
    leading: false,
    trailing: true
};

export class Debouncer<T extends (...args: any[]) => any> {
    private timeoutId: NodeJS.Timeout | null = null;
    private lastInvokeTime = 0;
    private lastCallTime = 0;
    private lastArgs: Parameters<T> | null = null;
    private lastThis: any = null;
    private result: ReturnType<T> | undefined;
    private pendingPromise: Promise<ReturnType<T>> | null = null;
    private pendingResolve: ((value: ReturnType<T>) => void) | null = null;
    private pendingReject: ((reason: any) => void) | null = null;

    constructor(
        private func: T,
        private options: Partial<DebouncerOptions> = {}
    ) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Execute the debounced function
     */
    call(...args: Parameters<T>): Promise<ReturnType<T>> {
        const time = Date.now();
        const isInvoking = this.shouldInvoke(time);

        this.lastArgs = args;
        this.lastCallTime = time;

        if (isInvoking) {
            if (!this.timeoutId) {
                return this.leadingEdge(time);
            }
            if (this.options.maxWait) {
                // Handle invocations in a tight loop
                this.timeoutId = setTimeout(() => this.timerExpired(), this.options.delay);
                return this.invokeFunc(time);
            }
        }

        if (!this.timeoutId) {
            this.timeoutId = setTimeout(() => this.timerExpired(), this.options.delay);
        }

        // Return pending promise or create new one
        if (!this.pendingPromise) {
            this.pendingPromise = new Promise((resolve, reject) => {
                this.pendingResolve = resolve;
                this.pendingReject = reject;
            });
        }

        return this.pendingPromise;
    }

    /**
     * Cancel pending execution
     */
    cancel(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.lastArgs = null;
        this.lastCallTime = 0;
        
        if (this.pendingReject) {
            this.pendingReject(new Error('Debounced call cancelled'));
            this.pendingPromise = null;
            this.pendingResolve = null;
            this.pendingReject = null;
        }
    }

    /**
     * Immediately execute pending function
     */
    flush(): Promise<ReturnType<T>> | undefined {
        if (!this.timeoutId) {
            return undefined;
        }
        return this.trailingEdge(Date.now());
    }

    /**
     * Check if there's a pending execution
     */
    pending(): boolean {
        return this.timeoutId !== null;
    }

    private shouldInvoke(time: number): boolean {
        const timeSinceLastCall = time - this.lastCallTime;
        const timeSinceLastInvoke = time - this.lastInvokeTime;

        return (
            this.lastCallTime === 0 ||
            timeSinceLastCall >= this.options.delay! ||
            timeSinceLastCall < 0 ||
            (this.options.maxWait !== undefined && 
             timeSinceLastInvoke >= this.options.maxWait)
        );
    }

    private timerExpired(): void {
        const time = Date.now();
        if (this.shouldInvoke(time)) {
            this.trailingEdge(time);
        } else {
            // Restart timer
            this.timeoutId = setTimeout(
                () => this.timerExpired(),
                this.remainingWait(time)
            );
        }
    }

    private remainingWait(time: number): number {
        const timeSinceLastCall = time - this.lastCallTime;
        const timeSinceLastInvoke = time - this.lastInvokeTime;
        const timeWaiting = this.options.delay! - timeSinceLastCall;

        return this.options.maxWait !== undefined
            ? Math.min(timeWaiting, this.options.maxWait - timeSinceLastInvoke)
            : timeWaiting;
    }

    private leadingEdge(time: number): Promise<ReturnType<T>> {
        this.lastInvokeTime = time;
        this.timeoutId = setTimeout(() => this.timerExpired(), this.options.delay);

        if (this.options.leading) {
            return this.invokeFunc(time);
        }

        if (!this.pendingPromise) {
            this.pendingPromise = new Promise((resolve, reject) => {
                this.pendingResolve = resolve;
                this.pendingReject = reject;
            });
        }

        return this.pendingPromise;
    }

    private trailingEdge(time: number): Promise<ReturnType<T>> {
        this.timeoutId = null;

        if (this.options.trailing && this.lastArgs) {
            return this.invokeFunc(time);
        }

        this.lastArgs = null;
        return Promise.resolve(this.result as ReturnType<T>);
    }

    private invokeFunc(time: number): Promise<ReturnType<T>> {
        const args = this.lastArgs!;
        this.lastArgs = null;
        this.lastInvokeTime = time;

        try {
            const result = this.func.apply(this.lastThis, args);
            
            // Handle async functions
            if (result instanceof Promise) {
                return result.then(value => {
                    this.result = value;
                    if (this.pendingResolve) {
                        this.pendingResolve(value);
                        this.pendingPromise = null;
                        this.pendingResolve = null;
                        this.pendingReject = null;
                    }
                    return value;
                }).catch(error => {
                    if (this.pendingReject) {
                        this.pendingReject(error);
                        this.pendingPromise = null;
                        this.pendingResolve = null;
                        this.pendingReject = null;
                    }
                    throw error;
                });
            }

            this.result = result;
            if (this.pendingResolve) {
                this.pendingResolve(result);
                this.pendingPromise = null;
                this.pendingResolve = null;
                this.pendingReject = null;
            }
            return Promise.resolve(result);
        } catch (error) {
            if (this.pendingReject) {
                this.pendingReject(error);
                this.pendingPromise = null;
                this.pendingResolve = null;
                this.pendingReject = null;
            }
            return Promise.reject(error);
        }
    }
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    options?: Partial<DebouncerOptions>
): Debouncer<T> {
    return new Debouncer(func, options);
}

/**
 * Request throttler for rate limiting
 */
export class Throttler<T extends (...args: any[]) => any> {
    private lastCallTime = 0;
    private timeoutId: NodeJS.Timeout | null = null;
    private lastArgs: Parameters<T> | null = null;

    constructor(
        private func: T,
        private interval: number
    ) {}

    call(...args: Parameters<T>): Promise<ReturnType<T>> {
        const now = Date.now();
        const remaining = this.interval - (now - this.lastCallTime);

        if (remaining <= 0) {
            this.lastCallTime = now;
            return Promise.resolve(this.func(...args));
        }

        this.lastArgs = args;

        if (!this.timeoutId) {
            return new Promise((resolve, reject) => {
                this.timeoutId = setTimeout(() => {
                    this.timeoutId = null;
                    this.lastCallTime = Date.now();
                    try {
                        const result = this.func(...this.lastArgs!);
                        if (result instanceof Promise) {
                            result.then(resolve).catch(reject);
                        } else {
                            resolve(result);
                        }
                    } catch (error) {
                        reject(error);
                    }
                }, remaining);
            });
        }

        return new Promise((resolve, reject) => {
            const existingTimeout = this.timeoutId;
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }
            this.timeoutId = setTimeout(() => {
                this.timeoutId = null;
                this.lastCallTime = Date.now();
                try {
                    const result = this.func(...this.lastArgs!);
                    if (result instanceof Promise) {
                        result.then(resolve).catch(reject);
                    } else {
                        resolve(result);
                    }
                } catch (error) {
                    reject(error);
                }
            }, remaining);
        });
    }

    cancel(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.lastArgs = null;
    }
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    interval: number
): Throttler<T> {
    return new Throttler(func, interval);
}

/**
 * Concurrent request limiter
 */
export class ConcurrencyLimiter {
    private running = 0;
    private queue: Array<{
        fn: () => Promise<any>;
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];

    constructor(private maxConcurrent: number = 3) {}

    async run<T>(fn: () => Promise<T>): Promise<T> {
        if (this.running < this.maxConcurrent) {
            this.running++;
            try {
                const result = await fn();
                this.running--;
                this.processQueue();
                return result;
            } catch (error) {
                this.running--;
                this.processQueue();
                throw error;
            }
        }

        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
        });
    }

    private processQueue(): void {
        if (this.queue.length > 0 && this.running < this.maxConcurrent) {
            const { fn, resolve, reject } = this.queue.shift()!;
            this.running++;
            fn()
                .then(result => {
                    this.running--;
                    resolve(result);
                    this.processQueue();
                })
                .catch(error => {
                    this.running--;
                    reject(error);
                    this.processQueue();
                });
        }
    }

    get pendingCount(): number {
        return this.queue.length;
    }

    get runningCount(): number {
        return this.running;
    }
}

// Global instances
let validationDebouncer: Debouncer<any>;
let suggestionThrottler: Throttler<any>;
let requestLimiter: ConcurrencyLimiter;

export function getValidationDebouncer(
    validateFn: () => Promise<any>
): Debouncer<any> {
    if (!validationDebouncer) {
        validationDebouncer = debounce(validateFn, {
            delay: 500,
            maxWait: 2000
        });
    }
    return validationDebouncer;
}

export function getSuggestionThrottler(
    suggestFn: () => Promise<any>
): Throttler<any> {
    if (!suggestionThrottler) {
        suggestionThrottler = throttle(suggestFn, 1000);
    }
    return suggestionThrottler;
}

export function getRequestLimiter(): ConcurrencyLimiter {
    if (!requestLimiter) {
        requestLimiter = new ConcurrencyLimiter(3);
    }
    return requestLimiter;
}
