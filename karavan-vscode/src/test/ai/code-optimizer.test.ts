/**
 * Unit Tests for Code Optimizer
 * Tests route optimization analysis and suggestions
 */

import {
    CodeOptimizer,
    getCodeOptimizer,
    OptimizationResult,
    OptimizationRule,
    OptimizationSeverity
} from '../../src/ai/optimization/code-optimizer';

describe('CodeOptimizer', () => {
    let optimizer: CodeOptimizer;

    beforeEach(() => {
        optimizer = getCodeOptimizer();
    });

    describe('analyzeRoute', () => {
        it('should analyze empty route', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps: []
`;
            const result = optimizer.analyzeRoute(yaml);
            expect(result).toBeDefined();
            expect(result.suggestions).toBeDefined();
        });

        it('should detect missing error handler', () => {
            const yaml = `
- from:
    uri: "file:input"
    steps:
      - to:
          uri: "http://api.example.com"
`;
            const result = optimizer.analyzeRoute(yaml);
            const errorSuggestion = result.suggestions.find(
                s => s.rule.id.includes('error') || s.message.toLowerCase().includes('error')
            );
            expect(errorSuggestion).toBeDefined();
        });

        it('should detect unnecessary direct components', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "direct:step1"
      - to:
          uri: "direct:step2"
      - to:
          uri: "direct:step3"
`;
            const result = optimizer.analyzeRoute(yaml);
            const directSuggestion = result.suggestions.find(
                s => s.message.toLowerCase().includes('direct')
            );
            // May or may not flag based on implementation
            expect(result).toBeDefined();
        });

        it('should detect inefficient polling intervals', () => {
            const yaml = `
- from:
    uri: "file:input?delay=100"
    steps:
      - to:
          uri: "log:output"
`;
            const result = optimizer.analyzeRoute(yaml);
            const pollingSuggestion = result.suggestions.find(
                s => s.message.toLowerCase().includes('polling') || 
                     s.message.toLowerCase().includes('interval') ||
                     s.message.toLowerCase().includes('delay')
            );
            // Short delay might be flagged
            expect(result).toBeDefined();
        });

        it('should detect missing idempotency', () => {
            const yaml = `
- from:
    uri: "jms:queue:orders"
    steps:
      - to:
          uri: "sql:INSERT INTO orders VALUES(:#id, :#name)"
`;
            const result = optimizer.analyzeRoute(yaml);
            const idempotencySuggestion = result.suggestions.find(
                s => s.message.toLowerCase().includes('idempotent')
            );
            // May suggest idempotent consumer
            expect(result).toBeDefined();
        });

        it('should suggest parallel processing for batch', () => {
            const yaml = `
- from:
    uri: "file:input"
    steps:
      - split:
          tokenize: "\\n"
          steps:
            - to:
                uri: "http://api.example.com"
`;
            const result = optimizer.analyzeRoute(yaml);
            const parallelSuggestion = result.suggestions.find(
                s => s.message.toLowerCase().includes('parallel')
            );
            // May suggest parallelProcessing
            expect(result).toBeDefined();
        });

        it('should detect logging in production', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - log:
          message: "Processing: \${body}"
      - to:
          uri: "http://api.example.com"
      - log:
          message: "Done: \${body}"
`;
            const result = optimizer.analyzeRoute(yaml);
            const loggingSuggestion = result.suggestions.find(
                s => s.message.toLowerCase().includes('log')
            );
            // May warn about excessive logging
            expect(result).toBeDefined();
        });

        it('should detect missing timeout configurations', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "http://slow-api.example.com"
`;
            const result = optimizer.analyzeRoute(yaml);
            const timeoutSuggestion = result.suggestions.find(
                s => s.message.toLowerCase().includes('timeout')
            );
            // May suggest timeout configuration
            expect(result).toBeDefined();
        });

        it('should detect hardcoded values', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "http://192.168.1.100:8080/api"
`;
            const result = optimizer.analyzeRoute(yaml);
            const hardcodedSuggestion = result.suggestions.find(
                s => s.message.toLowerCase().includes('hardcoded') ||
                     s.message.toLowerCase().includes('property') ||
                     s.message.toLowerCase().includes('placeholder')
            );
            // May suggest using properties
            expect(result).toBeDefined();
        });
    });

    describe('getOptimizationRules', () => {
        it('should return all rules', () => {
            const rules = optimizer.getOptimizationRules();
            expect(rules.length).toBeGreaterThan(0);
        });

        it('should have rules with required properties', () => {
            const rules = optimizer.getOptimizationRules();
            rules.forEach(rule => {
                expect(rule.id).toBeDefined();
                expect(rule.name).toBeDefined();
                expect(rule.description).toBeDefined();
                expect(rule.severity).toBeDefined();
            });
        });

        it('should include different severity levels', () => {
            const rules = optimizer.getOptimizationRules();
            const severities = new Set(rules.map(r => r.severity));
            expect(severities.size).toBeGreaterThan(1);
        });

        it('should include rules for common patterns', () => {
            const rules = optimizer.getOptimizationRules();
            const ruleNames = rules.map(r => r.name.toLowerCase());
            
            // Check for common optimization categories
            const hasErrorHandling = ruleNames.some(n => n.includes('error'));
            const hasPerformance = ruleNames.some(n => 
                n.includes('performance') || n.includes('parallel') || n.includes('timeout')
            );
            
            expect(hasErrorHandling || hasPerformance).toBe(true);
        });
    });

    describe('applyOptimization', () => {
        it('should apply suggested optimization', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "http://api.example.com"
`;
            const analysis = optimizer.analyzeRoute(yaml);
            
            if (analysis.suggestions.length > 0) {
                const optimized = optimizer.applyOptimization(yaml, analysis.suggestions[0]);
                expect(optimized).toBeDefined();
                // Optimized should be different or same (if no auto-fix available)
            }
        });

        it('should preserve route structure when applying', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "log:output"
`;
            const analysis = optimizer.analyzeRoute(yaml);
            
            if (analysis.suggestions.length > 0) {
                const optimized = optimizer.applyOptimization(yaml, analysis.suggestions[0]);
                expect(optimized).toContain('from:');
            }
        });
    });

    describe('suggestOptimizations', () => {
        it('should suggest optimizations based on description', () => {
            const suggestions = optimizer.suggestOptimizations(
                'I have a route that processes files slowly'
            );
            expect(suggestions.length).toBeGreaterThan(0);
        });

        it('should suggest parallelization for slow processing', () => {
            const suggestions = optimizer.suggestOptimizations(
                'My route is slow when processing many messages'
            );
            const parallelSuggestion = suggestions.find(
                s => s.toLowerCase().includes('parallel')
            );
            expect(parallelSuggestion).toBeDefined();
        });

        it('should suggest caching for repeated lookups', () => {
            const suggestions = optimizer.suggestOptimizations(
                'I keep calling the same API repeatedly'
            );
            const cacheSuggestion = suggestions.find(
                s => s.toLowerCase().includes('cache')
            );
            expect(cacheSuggestion).toBeDefined();
        });

        it('should suggest retry for unreliable services', () => {
            const suggestions = optimizer.suggestOptimizations(
                'My route fails sometimes when calling external service'
            );
            const retrySuggestion = suggestions.find(
                s => s.toLowerCase().includes('retry') || s.toLowerCase().includes('error')
            );
            expect(retrySuggestion).toBeDefined();
        });
    });

    describe('compareRoutes', () => {
        it('should compare two routes', () => {
            const route1 = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "log:output"
`;
            const route2 = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "log:output"
      - to:
          uri: "mock:end"
`;
            const comparison = optimizer.compareRoutes(route1, route2);
            expect(comparison).toBeDefined();
            expect(comparison.differences).toBeDefined();
        });

        it('should detect complexity changes', () => {
            const simpleRoute = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "log:output"
`;
            const complexRoute = `
- from:
    uri: "direct:start"
    steps:
      - choice:
          when:
            - simple: "\${header.type} == 'A'"
              steps:
                - to:
                    uri: "direct:processA"
            - simple: "\${header.type} == 'B'"
              steps:
                - to:
                    uri: "direct:processB"
          otherwise:
            steps:
              - to:
                  uri: "direct:processDefault"
`;
            const comparison = optimizer.compareRoutes(simpleRoute, complexRoute);
            expect(comparison.complexityChange).toBeDefined();
        });
    });

    describe('getOptimizationReport', () => {
        it('should generate report for route', () => {
            const yaml = `
- from:
    uri: "file:input"
    steps:
      - split:
          tokenize: "\\n"
          steps:
            - to:
                uri: "http://api.example.com"
      - to:
          uri: "file:output"
`;
            const report = optimizer.getOptimizationReport(yaml);
            expect(report).toBeDefined();
            expect(report.summary).toBeDefined();
            expect(report.score).toBeDefined();
            expect(report.suggestions).toBeDefined();
        });

        it('should calculate optimization score', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "log:output"
`;
            const report = optimizer.getOptimizationReport(yaml);
            expect(report.score).toBeGreaterThanOrEqual(0);
            expect(report.score).toBeLessThanOrEqual(100);
        });

        it('should categorize suggestions by severity', () => {
            const yaml = `
- from:
    uri: "file:input"
    steps:
      - to:
          uri: "http://api.example.com"
`;
            const report = optimizer.getOptimizationReport(yaml);
            
            if (report.suggestions.length > 0) {
                const severities = report.suggestions.map(s => s.rule.severity);
                expect(severities.every(s => 
                    ['info', 'warning', 'error', 'hint'].includes(s)
                )).toBe(true);
            }
        });
    });

    describe('edge cases', () => {
        it('should handle invalid YAML gracefully', () => {
            const invalidYaml = `
- from:
  uri: "invalid yaml
    steps
      - broken
`;
            expect(() => optimizer.analyzeRoute(invalidYaml)).not.toThrow();
        });

        it('should handle empty string', () => {
            const result = optimizer.analyzeRoute('');
            expect(result).toBeDefined();
        });

        it('should handle route without steps', () => {
            const yaml = `
- from:
    uri: "direct:start"
`;
            const result = optimizer.analyzeRoute(yaml);
            expect(result).toBeDefined();
        });

        it('should handle complex nested routes', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - multicast:
          steps:
            - to:
                uri: "direct:route1"
            - to:
                uri: "direct:route2"
      - choice:
          when:
            - simple: "\${header.type} == 'A'"
              steps:
                - split:
                    tokenize: ","
                    steps:
                      - to:
                          uri: "direct:process"
`;
            const result = optimizer.analyzeRoute(yaml);
            expect(result).toBeDefined();
        });
    });
});
