/**
 * Code Optimization Engine for Camel Routes
 * Analyzes routes and suggests performance improvements and best practices
 */

import * as vscode from 'vscode';
import { EIP_PATTERNS, COMMON_COMPONENTS } from '../knowledge/camel-metadata';

export interface OptimizationSuggestion {
    id: string;
    title: string;
    description: string;
    category: 'performance' | 'readability' | 'error-handling' | 'best-practice' | 'security';
    severity: 'info' | 'warning' | 'suggestion';
    location?: {
        line: number;
        column?: number;
    };
    currentCode?: string;
    suggestedCode?: string;
    documentation?: string;
}

export interface OptimizationResult {
    suggestions: OptimizationSuggestion[];
    score: number; // 0-100
    summary: string;
}

/**
 * Code optimization engine
 */
export class CodeOptimizer {
    private optimizationRules: OptimizationRule[] = [
        // Performance optimizations
        {
            id: 'use-direct-vm',
            category: 'performance',
            severity: 'suggestion',
            check: (yaml) => yaml.includes('direct:') && !yaml.includes('direct-vm:'),
            title: 'Consider using direct-vm for cross-bundle communication',
            description: 'If you need to call routes in different OSGI bundles, consider using direct-vm instead of direct.',
            suggestion: (match) => match.replace(/direct:(\w+)/g, 'direct-vm:$1'),
        },
        {
            id: 'parallel-multicast',
            category: 'performance',
            severity: 'suggestion',
            check: (yaml) => yaml.includes('multicast:') && !yaml.includes('parallelProcessing'),
            title: 'Enable parallel processing for multicast',
            description: 'Multicast can process branches in parallel for better performance.',
            suggestion: (match) => match.replace(/multicast:/g, 'multicast:\n    parallelProcessing: true'),
        },
        {
            id: 'streaming-splitter',
            category: 'performance',
            severity: 'suggestion',
            check: (yaml) => yaml.includes('split:') && !yaml.includes('streaming:'),
            title: 'Consider streaming mode for large datasets',
            description: 'For large datasets, streaming mode prevents loading all data into memory.',
            suggestion: (match) => match.replace(/split:/g, 'split:\n    streaming: true'),
        },
        {
            id: 'lazy-file-loading',
            category: 'performance',
            severity: 'suggestion',
            check: (yaml) => yaml.includes('file:') && !yaml.includes('lazyStartProducer'),
            title: 'Consider lazy loading for file producers',
            description: 'Lazy start can improve startup time by deferring producer initialization.',
        },
        {
            id: 'batch-kafka',
            category: 'performance',
            severity: 'info',
            check: (yaml) => yaml.includes('kafka:') && !yaml.includes('batching'),
            title: 'Configure batch settings for Kafka',
            description: 'Adjust batch.size and linger.ms for optimal Kafka throughput.',
        },

        // Error handling
        {
            id: 'missing-error-handler',
            category: 'error-handling',
            severity: 'warning',
            check: (yaml) => !yaml.includes('onException') && !yaml.includes('errorHandler'),
            title: 'Add error handling to routes',
            description: 'Routes without error handling may fail silently. Consider adding onException blocks.',
            suggestion: () => `# Add at route level:
- onException:
    exception:
      - java.lang.Exception
    handled:
      constant: true
    steps:
      - log:
          message: "Error: \${exception.message}"
          loggingLevel: ERROR
      - to: direct:errorHandler`,
        },
        {
            id: 'retry-missing',
            category: 'error-handling',
            severity: 'suggestion',
            check: (yaml) => (yaml.includes('http:') || yaml.includes('kafka:')) && !yaml.includes('redeliveryPolicy'),
            title: 'Add retry policy for external calls',
            description: 'External service calls should have retry policies for transient failures.',
            suggestion: () => `# Add redelivery policy:
redeliveryPolicy:
  maximumRedeliveries: 3
  redeliveryDelay: 1000
  backOffMultiplier: 2
  useExponentialBackOff: true`,
        },
        {
            id: 'circuit-breaker',
            category: 'error-handling',
            severity: 'info',
            check: (yaml) => yaml.includes('http:') && !yaml.includes('circuitBreaker'),
            title: 'Consider circuit breaker for HTTP calls',
            description: 'Circuit breaker pattern prevents cascading failures when external services are down.',
        },

        // Readability
        {
            id: 'long-route',
            category: 'readability',
            severity: 'suggestion',
            check: (yaml) => {
                const stepCount = (yaml.match(/^\s*-\s+\w+:/gm) || []).length;
                return stepCount > 15;
            },
            title: 'Consider splitting long routes',
            description: 'Routes with many steps are hard to maintain. Extract steps into sub-routes using direct.',
        },
        {
            id: 'hardcoded-values',
            category: 'readability',
            severity: 'warning',
            check: (yaml) => /localhost:\d+|192\.168\.\d+\.\d+|127\.0\.0\.1/.test(yaml),
            title: 'Externalize hardcoded values',
            description: 'Use property placeholders {{property}} instead of hardcoded URLs/IPs.',
            suggestion: (match) => match.replace(/localhost:(\d+)/g, '{{service.host}}:{{service.port}}'),
        },
        {
            id: 'missing-descriptions',
            category: 'readability',
            severity: 'info',
            check: (yaml) => !yaml.includes('description:') && yaml.includes('- from:'),
            title: 'Add route descriptions',
            description: 'Route descriptions help document the purpose of each route.',
        },
        {
            id: 'meaningful-names',
            category: 'readability',
            severity: 'suggestion',
            check: (yaml) => /direct:(?:start|input|process|output|end)/.test(yaml),
            title: 'Use descriptive endpoint names',
            description: 'Generic names like "start" or "process" should be replaced with meaningful names.',
        },

        // Best practices
        {
            id: 'use-beans',
            category: 'best-practice',
            severity: 'suggestion',
            check: (yaml) => yaml.includes('groovy:') || yaml.includes('javascript:'),
            title: 'Consider using beans instead of inline scripts',
            description: 'Beans are more maintainable and testable than inline scripts.',
        },
        {
            id: 'logging-best-practice',
            category: 'best-practice',
            severity: 'info',
            check: (yaml) => {
                const logCount = (yaml.match(/- log:/g) || []).length;
                const routeCount = (yaml.match(/- from:/g) || []).length;
                return routeCount > 0 && logCount < routeCount;
            },
            title: 'Add logging for observability',
            description: 'Add log steps at route entry/exit points for better debugging and monitoring.',
        },
        {
            id: 'idempotent-consumer',
            category: 'best-practice',
            severity: 'suggestion',
            check: (yaml) => (yaml.includes('kafka:') || yaml.includes('jms:')) && !yaml.includes('idempotentConsumer'),
            title: 'Consider idempotent consumer for message deduplication',
            description: 'Idempotent consumer prevents processing the same message twice.',
        },
        {
            id: 'validate-input',
            category: 'best-practice',
            severity: 'suggestion',
            check: (yaml) => yaml.includes('rest:') && yaml.includes('post:') && !yaml.includes('validate:'),
            title: 'Add input validation for REST endpoints',
            description: 'Validate incoming data before processing to catch errors early.',
        },

        // Security
        {
            id: 'credentials-in-code',
            category: 'security',
            severity: 'warning',
            check: (yaml) => /password\s*[:=]\s*\S+|apiKey\s*[:=]\s*\S+|secret\s*[:=]\s*\S+/i.test(yaml),
            title: 'Move credentials to secure storage',
            description: 'Credentials should not be hardcoded. Use secrets management or environment variables.',
            suggestion: (match) => match.replace(/password:\s*\S+/gi, 'password: {{secret:my-secret/password}}'),
        },
        {
            id: 'http-vs-https',
            category: 'security',
            severity: 'warning',
            check: (yaml) => /http:\/\/(?!localhost|127\.0\.0\.1)/.test(yaml),
            title: 'Use HTTPS for external connections',
            description: 'External HTTP calls should use HTTPS for secure communication.',
            suggestion: (match) => match.replace(/http:\/\//g, 'https://'),
        },
    ];

    /**
     * Analyze a YAML route and return optimization suggestions
     */
    analyzeRoute(yaml: string): OptimizationResult {
        const suggestions: OptimizationSuggestion[] = [];

        for (const rule of this.optimizationRules) {
            if (rule.check(yaml)) {
                const suggestion: OptimizationSuggestion = {
                    id: rule.id,
                    title: rule.title,
                    description: rule.description,
                    category: rule.category,
                    severity: rule.severity,
                    location: this.findRuleLocation(yaml, rule),
                };

                if (rule.suggestion) {
                    suggestion.suggestedCode = rule.suggestion(yaml);
                }

                suggestions.push(suggestion);
            }
        }

        // Calculate optimization score
        const score = this.calculateScore(suggestions);

        // Generate summary
        const summary = this.generateSummary(suggestions);

        return { suggestions, score, summary };
    }

    /**
     * Find the location of a rule match in YAML
     */
    private findRuleLocation(yaml: string, rule: OptimizationRule): { line: number; column?: number } | undefined {
        const lines = yaml.split('\n');
        
        // Try to find relevant line based on rule patterns
        const patterns: { [key: string]: RegExp } = {
            'use-direct-vm': /direct:/,
            'parallel-multicast': /multicast:/,
            'streaming-splitter': /split:/,
            'missing-error-handler': /- from:/,
            'hardcoded-values': /localhost:\d+|192\.168/,
            'credentials-in-code': /password|apiKey|secret/i,
            'http-vs-https': /http:\/\//,
        };

        const pattern = patterns[rule.id];
        if (pattern) {
            for (let i = 0; i < lines.length; i++) {
                if (pattern.test(lines[i])) {
                    return { line: i + 1 };
                }
            }
        }

        return undefined;
    }

    /**
     * Calculate an optimization score (0-100)
     */
    private calculateScore(suggestions: OptimizationSuggestion[]): number {
        let score = 100;

        for (const suggestion of suggestions) {
            switch (suggestion.severity) {
                case 'warning':
                    score -= 15;
                    break;
                case 'suggestion':
                    score -= 5;
                    break;
                case 'info':
                    score -= 2;
                    break;
            }
        }

        return Math.max(0, score);
    }

    /**
     * Generate a summary of optimization results
     */
    private generateSummary(suggestions: OptimizationSuggestion[]): string {
        if (suggestions.length === 0) {
            return '✅ Great job! No optimization suggestions found.';
        }

        const warnings = suggestions.filter(s => s.severity === 'warning').length;
        const improvements = suggestions.filter(s => s.severity === 'suggestion').length;
        const info = suggestions.filter(s => s.severity === 'info').length;

        const parts: string[] = [];
        if (warnings > 0) parts.push(`${warnings} warning(s)`);
        if (improvements > 0) parts.push(`${improvements} improvement(s)`);
        if (info > 0) parts.push(`${info} info`);

        return `Found ${parts.join(', ')} to consider.`;
    }

    /**
     * Get suggestions by category
     */
    getSuggestionsByCategory(
        result: OptimizationResult,
        category: OptimizationSuggestion['category']
    ): OptimizationSuggestion[] {
        return result.suggestions.filter(s => s.category === category);
    }

    /**
     * Apply an optimization suggestion to YAML
     */
    applySuggestion(yaml: string, suggestion: OptimizationSuggestion): string {
        if (!suggestion.suggestedCode) {
            return yaml;
        }

        // Find the matching rule
        const rule = this.optimizationRules.find(r => r.id === suggestion.id);
        if (rule?.suggestion) {
            return rule.suggestion(yaml);
        }

        return yaml;
    }

    /**
     * Get AI-powered optimization suggestions
     */
    async getAIOptimizations(yaml: string): Promise<OptimizationSuggestion[]> {
        // This would call the AI backend for more sophisticated suggestions
        // For now, return rule-based suggestions
        return this.analyzeRoute(yaml).suggestions;
    }
}

interface OptimizationRule {
    id: string;
    category: OptimizationSuggestion['category'];
    severity: OptimizationSuggestion['severity'];
    check: (yaml: string) => boolean;
    title: string;
    description: string;
    suggestion?: (yaml: string) => string;
}

// Singleton instance
let codeOptimizerInstance: CodeOptimizer | undefined;

export function getCodeOptimizer(): CodeOptimizer {
    if (!codeOptimizerInstance) {
        codeOptimizerInstance = new CodeOptimizer();
    }
    return codeOptimizerInstance;
}
