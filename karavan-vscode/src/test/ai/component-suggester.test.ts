/**
 * Unit Tests for Component Suggester
 * Tests context-aware component suggestions
 */

import { ComponentSuggester, getComponentSuggester, SuggestionContext } from '../../src/ai/suggestions/component-suggester';

describe('ComponentSuggester', () => {
    let suggester: ComponentSuggester;

    beforeEach(() => {
        suggester = getComponentSuggester();
    });

    describe('suggestComponents', () => {
        it('should return suggestions for empty context', () => {
            const suggestions = suggester.suggestComponents({});
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.length).toBeLessThanOrEqual(10);
        });

        it('should suggest kafka for messaging keywords', () => {
            const context: SuggestionContext = {
                selectedText: 'send message to kafka'
            };
            const suggestions = suggester.suggestComponents(context);
            const kafkaSuggestion = suggestions.find(s => s.component.name === 'kafka');
            expect(kafkaSuggestion).toBeDefined();
            expect(kafkaSuggestion!.relevance).toBeGreaterThan(0);
        });

        it('should suggest rest for API keywords', () => {
            const context: SuggestionContext = {
                selectedText: 'create REST API endpoint'
            };
            const suggestions = suggester.suggestComponents(context);
            const restSuggestion = suggestions.find(s => s.component.name === 'rest');
            expect(restSuggestion).toBeDefined();
        });

        it('should suggest timer for scheduling keywords', () => {
            const context: SuggestionContext = {
                selectedText: 'schedule periodic task'
            };
            const suggestions = suggester.suggestComponents(context);
            const timerSuggestion = suggestions.find(s => s.component.name === 'timer');
            expect(timerSuggestion).toBeDefined();
        });

        it('should suggest file for file processing', () => {
            const context: SuggestionContext = {
                selectedText: 'process files from folder'
            };
            const suggestions = suggester.suggestComponents(context);
            const fileSuggestion = suggestions.find(s => s.component.name === 'file');
            expect(fileSuggestion).toBeDefined();
        });

        it('should favor consumers for consumer route type', () => {
            const context: SuggestionContext = {
                routeType: 'consumer'
            };
            const suggestions = suggester.suggestComponents(context);
            const consumerComponents = ['timer', 'file', 'kafka', 'jms', 'rest'];
            const hasConsumer = suggestions.some(s => 
                consumerComponents.includes(s.component.name) && s.relevance > 0
            );
            expect(hasConsumer).toBe(true);
        });

        it('should favor producers for producer route type', () => {
            const context: SuggestionContext = {
                routeType: 'producer'
            };
            const suggestions = suggester.suggestComponents(context);
            const producerComponents = ['kafka', 'jms', 'file', 'http', 'sql', 'log'];
            const hasProducer = suggestions.some(s => 
                producerComponents.includes(s.component.name) && s.relevance > 0
            );
            expect(hasProducer).toBe(true);
        });

        it('should penalize existing components', () => {
            const contextWithExisting: SuggestionContext = {
                selectedText: 'kafka',
                existingComponents: ['kafka']
            };
            const contextWithout: SuggestionContext = {
                selectedText: 'kafka'
            };
            
            const withExisting = suggester.suggestComponents(contextWithExisting);
            const without = suggester.suggestComponents(contextWithout);
            
            const kafkaWithExisting = withExisting.find(s => s.component.name === 'kafka');
            const kafkaWithout = without.find(s => s.component.name === 'kafka');
            
            expect(kafkaWithExisting!.relevance).toBeLessThan(kafkaWithout!.relevance);
        });

        it('should sort by relevance descending', () => {
            const context: SuggestionContext = {
                selectedText: 'http api rest'
            };
            const suggestions = suggester.suggestComponents(context);
            
            for (let i = 1; i < suggestions.length; i++) {
                expect(suggestions[i - 1].relevance).toBeGreaterThanOrEqual(suggestions[i].relevance);
            }
        });

        it('should limit to 10 suggestions', () => {
            const suggestions = suggester.suggestComponents({});
            expect(suggestions.length).toBeLessThanOrEqual(10);
        });
    });

    describe('suggestNextComponent', () => {
        it('should suggest based on existing route', () => {
            const routeYaml = `- from:
    uri: rest:/api
    steps:
      - log: test`;
            const suggestions = suggester.suggestNextComponent(routeYaml);
            expect(suggestions.length).toBeGreaterThan(0);
        });

        it('should extract existing components from route', () => {
            const routeYaml = `- from:
    uri: kafka:input
    steps:
      - to: kafka:output`;
            const suggestions = suggester.suggestNextComponent(routeYaml);
            // Should have kafka in existing, so it might be ranked lower
            expect(suggestions.length).toBeGreaterThan(0);
        });
    });

    describe('getComponentDetails', () => {
        it('should return details for known component', () => {
            const details = suggester.getComponentDetails('kafka');
            expect(details).toBeDefined();
            expect(details!.name).toBe('kafka');
            expect(details!.description).toBeDefined();
        });

        it('should return undefined for unknown component', () => {
            const details = suggester.getComponentDetails('nonexistent');
            expect(details).toBeUndefined();
        });
    });

    describe('generateComponentExample', () => {
        it('should generate from example', () => {
            const example = suggester.generateComponentExample('timer', 'from');
            expect(example).toContain('from:');
            expect(example).toContain('timer');
        });

        it('should generate to example', () => {
            const example = suggester.generateComponentExample('kafka', 'to');
            expect(example).toContain('to:');
            expect(example).toContain('kafka');
        });

        it('should include parameters when available', () => {
            const example = suggester.generateComponentExample('timer', 'from');
            // Timer should have parameters like period
            expect(example.length).toBeGreaterThan(10);
        });
    });
});
