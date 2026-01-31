/**
 * Unit Tests for EIP Suggester
 * Tests EIP pattern suggestions based on scenarios
 */

import { EIPSuggester, getEIPSuggester, EIPSuggestionContext } from '../../src/ai/suggestions/eip-suggester';

describe('EIPSuggester', () => {
    let suggester: EIPSuggester;

    beforeEach(() => {
        suggester = getEIPSuggester();
    });

    describe('suggestPatterns', () => {
        it('should return suggestions for empty context', () => {
            const suggestions = suggester.suggestPatterns({});
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.length).toBeLessThanOrEqual(8);
        });

        it('should suggest splitter for batch messages', () => {
            const context: EIPSuggestionContext = {
                messageType: 'batch',
                scenario: 'process batch'
            };
            const suggestions = suggester.suggestPatterns(context);
            const splitterSuggestion = suggestions.find(s => s.pattern.name === 'splitter');
            expect(splitterSuggestion).toBeDefined();
            expect(splitterSuggestion!.relevance).toBeGreaterThan(20);
        });

        it('should suggest aggregator for batch collection', () => {
            const context: EIPSuggestionContext = {
                messageType: 'batch',
                scenario: 'aggregate'
            };
            const suggestions = suggester.suggestPatterns(context);
            const aggregatorSuggestion = suggestions.find(s => s.pattern.name === 'aggregator');
            expect(aggregatorSuggestion).toBeDefined();
        });

        it('should suggest content-based-router for conditional routing', () => {
            const context: EIPSuggestionContext = {
                routingLogic: 'conditional'
            };
            const suggestions = suggester.suggestPatterns(context);
            const cbrSuggestion = suggestions.find(s => s.pattern.name === 'content-based-router');
            expect(cbrSuggestion).toBeDefined();
            expect(cbrSuggestion!.relevance).toBeGreaterThan(20);
        });

        it('should suggest multicast for parallel routing', () => {
            const context: EIPSuggestionContext = {
                routingLogic: 'parallel'
            };
            const suggestions = suggester.suggestPatterns(context);
            const multicastSuggestion = suggestions.find(s => s.pattern.name === 'multicast');
            expect(multicastSuggestion).toBeDefined();
        });

        it('should suggest recipient-list for dynamic routing', () => {
            const context: EIPSuggestionContext = {
                routingLogic: 'dynamic'
            };
            const suggestions = suggester.suggestPatterns(context);
            const recipientListSuggestion = suggestions.find(s => s.pattern.name === 'recipient-list');
            expect(recipientListSuggestion).toBeDefined();
        });

        it('should suggest retry for error handling', () => {
            const context: EIPSuggestionContext = {
                errorHandling: true
            };
            const suggestions = suggester.suggestPatterns(context);
            const retrySuggestion = suggestions.find(s => s.pattern.name === 'retry');
            expect(retrySuggestion).toBeDefined();
        });

        it('should suggest enricher for data enrichment', () => {
            const context: EIPSuggestionContext = {
                dataEnrichment: true
            };
            const suggestions = suggester.suggestPatterns(context);
            const enricherSuggestion = suggestions.find(s => s.pattern.name === 'enricher');
            expect(enricherSuggestion).toBeDefined();
        });

        it('should sort by relevance', () => {
            const context: EIPSuggestionContext = {
                scenario: 'split and process'
            };
            const suggestions = suggester.suggestPatterns(context);
            
            for (let i = 1; i < suggestions.length; i++) {
                expect(suggestions[i - 1].relevance).toBeGreaterThanOrEqual(suggestions[i].relevance);
            }
        });
    });

    describe('suggestForProblem', () => {
        it('should suggest splitter for split problem', () => {
            const suggestions = suggester.suggestForProblem('I need to split a batch of messages');
            const splitterSuggestion = suggestions.find(s => s.pattern.name === 'splitter');
            expect(splitterSuggestion).toBeDefined();
        });

        it('should suggest aggregator for combine problem', () => {
            const suggestions = suggester.suggestForProblem('I need to combine multiple messages');
            const aggregatorSuggestion = suggestions.find(s => s.pattern.name === 'aggregator');
            expect(aggregatorSuggestion).toBeDefined();
        });

        it('should suggest CBR for conditional problem', () => {
            const suggestions = suggester.suggestForProblem('I need to route based on conditions');
            const cbrSuggestion = suggestions.find(s => s.pattern.name === 'content-based-router');
            expect(cbrSuggestion).toBeDefined();
        });

        it('should suggest retry for error problem', () => {
            const suggestions = suggester.suggestForProblem('I need to handle errors and retry');
            const retrySuggestion = suggestions.find(s => s.pattern.name === 'retry');
            expect(retrySuggestion).toBeDefined();
        });

        it('should suggest enricher for lookup problem', () => {
            const suggestions = suggester.suggestForProblem('I need to lookup additional data');
            const enricherSuggestion = suggestions.find(s => s.pattern.name === 'enricher');
            expect(enricherSuggestion).toBeDefined();
        });

        it('should suggest multicast for parallel problem', () => {
            const suggestions = suggester.suggestForProblem('I need to send to multiple destinations in parallel');
            const multicastSuggestion = suggestions.find(s => s.pattern.name === 'multicast');
            expect(multicastSuggestion).toBeDefined();
        });
    });

    describe('getPatternDetails', () => {
        it('should return details for known pattern', () => {
            const details = suggester.getPatternDetails('splitter');
            expect(details).toBeDefined();
            expect(details!.name).toBe('splitter');
            expect(details!.yamlStructure).toBeDefined();
        });

        it('should return undefined for unknown pattern', () => {
            const details = suggester.getPatternDetails('nonexistent');
            expect(details).toBeUndefined();
        });
    });

    describe('generateRouteWithPattern', () => {
        it('should generate route with pattern', () => {
            const route = suggester.generateRouteWithPattern('splitter', 'direct:start');
            expect(route).toContain('from:');
            expect(route).toContain('direct:start');
            expect(route).toContain('split:');
        });

        it('should use default from uri if not provided', () => {
            const route = suggester.generateRouteWithPattern('splitter');
            expect(route).toContain('direct:start');
        });

        it('should return empty for unknown pattern', () => {
            const route = suggester.generateRouteWithPattern('nonexistent');
            expect(route).toBe('');
        });
    });

    describe('suggestForCommonScenarios', () => {
        it('should return scenarios with suggestions', () => {
            const scenarios = suggester.suggestForCommonScenarios();
            expect(Object.keys(scenarios).length).toBeGreaterThan(0);
            
            for (const [scenario, suggestions] of Object.entries(scenarios)) {
                expect(suggestions.length).toBeGreaterThan(0);
            }
        });

        it('should include batch processing scenario', () => {
            const scenarios = suggester.suggestForCommonScenarios();
            const batchKey = Object.keys(scenarios).find(k => k.toLowerCase().includes('batch'));
            expect(batchKey).toBeDefined();
        });

        it('should include error handling scenario', () => {
            const scenarios = suggester.suggestForCommonScenarios();
            const errorKey = Object.keys(scenarios).find(k => k.toLowerCase().includes('error'));
            expect(errorKey).toBeDefined();
        });
    });
});
