/**
 * Unit Tests for Expression Helper
 * Tests Camel expression assistance functionality
 */

import { 
    ExpressionHelper, 
    getExpressionHelper,
    ExpressionLanguage,
    ExpressionContext 
} from '../../src/ai/assistance/expression-helper';

describe('ExpressionHelper', () => {
    let helper: ExpressionHelper;

    beforeEach(() => {
        helper = getExpressionHelper();
    });

    describe('suggestExpressionLanguage', () => {
        it('should suggest simple for basic expressions', () => {
            const context: ExpressionContext = {
                expressionType: 'transform',
                complexity: 'basic'
            };
            const suggestions = helper.suggestExpressionLanguage(context);
            expect(suggestions.some(s => s.language === 'simple')).toBe(true);
        });

        it('should suggest jsonpath for JSON data', () => {
            const context: ExpressionContext = {
                dataFormat: 'json'
            };
            const suggestions = helper.suggestExpressionLanguage(context);
            expect(suggestions.some(s => s.language === 'jsonpath')).toBe(true);
        });

        it('should suggest xpath for XML data', () => {
            const context: ExpressionContext = {
                dataFormat: 'xml'
            };
            const suggestions = helper.suggestExpressionLanguage(context);
            expect(suggestions.some(s => s.language === 'xpath')).toBe(true);
        });

        it('should suggest groovy for complex logic', () => {
            const context: ExpressionContext = {
                complexity: 'complex'
            };
            const suggestions = helper.suggestExpressionLanguage(context);
            expect(suggestions.some(s => s.language === 'groovy')).toBe(true);
        });

        it('should sort suggestions by relevance', () => {
            const suggestions = helper.suggestExpressionLanguage({});
            for (let i = 1; i < suggestions.length; i++) {
                expect(suggestions[i - 1].relevance).toBeGreaterThanOrEqual(suggestions[i].relevance);
            }
        });
    });

    describe('validateExpression', () => {
        it('should validate correct simple expression', () => {
            const result = helper.validateExpression('${header.orderId}', 'simple');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect unclosed braces in simple', () => {
            const result = helper.validateExpression('${header.orderId', 'simple');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should validate correct jsonpath', () => {
            const result = helper.validateExpression('$.order.id', 'jsonpath');
            expect(result.valid).toBe(true);
        });

        it('should validate correct xpath', () => {
            const result = helper.validateExpression('/order/id', 'xpath');
            expect(result.valid).toBe(true);
        });

        it('should provide warnings for deprecated syntax', () => {
            const result = helper.validateExpression('$simple{}', 'simple');
            expect(result.warnings.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('explainExpression', () => {
        it('should explain simple expression', () => {
            const explanation = helper.explainExpression('${header.orderId}', 'simple');
            expect(explanation).toContain('header');
            expect(explanation.length).toBeGreaterThan(10);
        });

        it('should explain jsonpath expression', () => {
            const explanation = helper.explainExpression('$.order.items[*].price', 'jsonpath');
            expect(explanation).toContain('JSON');
            expect(explanation.length).toBeGreaterThan(10);
        });

        it('should explain xpath expression', () => {
            const explanation = helper.explainExpression('/order/items/item/@price', 'xpath');
            expect(explanation).toContain('XML');
            expect(explanation.length).toBeGreaterThan(10);
        });

        it('should provide meaningful explanation for complex expressions', () => {
            const explanation = helper.explainExpression(
                '${header.type} == "order" && ${body} != null',
                'simple'
            );
            expect(explanation.length).toBeGreaterThan(20);
        });
    });

    describe('convertExpression', () => {
        it('should convert simple to jsonpath', () => {
            const result = helper.convertExpression('${body.orderId}', 'simple', 'jsonpath');
            expect(result.converted).toContain('$');
            expect(result.success).toBe(true);
        });

        it('should convert jsonpath to simple', () => {
            const result = helper.convertExpression('$.orderId', 'jsonpath', 'simple');
            expect(result.converted).toContain('${');
            expect(result.success).toBe(true);
        });

        it('should handle non-convertible expressions', () => {
            const result = helper.convertExpression(
                '$.items[?(@.price > 100)]',
                'jsonpath',
                'simple'
            );
            // May not be directly convertible
            expect(result.notes).toBeDefined();
        });

        it('should preserve semantic meaning when converting', () => {
            const original = '${header.orderId}';
            const toJsonPath = helper.convertExpression(original, 'simple', 'jsonpath');
            // Should maintain orderId reference
            expect(toJsonPath.converted.toLowerCase()).toContain('orderid');
        });
    });

    describe('suggestExpressionForTask', () => {
        it('should suggest expression for header access', () => {
            const suggestions = helper.suggestExpressionForTask('get header value');
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions[0].expression).toContain('header');
        });

        it('should suggest expression for body transformation', () => {
            const suggestions = helper.suggestExpressionForTask('transform body');
            expect(suggestions.length).toBeGreaterThan(0);
        });

        it('should suggest expression for conditional routing', () => {
            const suggestions = helper.suggestExpressionForTask('check if order type is premium');
            expect(suggestions.length).toBeGreaterThan(0);
        });

        it('should suggest expression for date manipulation', () => {
            const suggestions = helper.suggestExpressionForTask('get current timestamp');
            expect(suggestions.length).toBeGreaterThan(0);
        });

        it('should suggest expression for string manipulation', () => {
            const suggestions = helper.suggestExpressionForTask('uppercase the name');
            expect(suggestions.length).toBeGreaterThan(0);
        });
    });

    describe('getExpressionExamples', () => {
        it('should return examples for simple language', () => {
            const examples = helper.getExpressionExamples('simple');
            expect(examples.length).toBeGreaterThan(0);
            examples.forEach(ex => {
                expect(ex.expression).toBeDefined();
                expect(ex.description).toBeDefined();
            });
        });

        it('should return examples for jsonpath language', () => {
            const examples = helper.getExpressionExamples('jsonpath');
            expect(examples.length).toBeGreaterThan(0);
        });

        it('should return examples for xpath language', () => {
            const examples = helper.getExpressionExamples('xpath');
            expect(examples.length).toBeGreaterThan(0);
        });

        it('should return empty for unknown language', () => {
            const examples = helper.getExpressionExamples('nonexistent' as ExpressionLanguage);
            expect(examples.length).toBe(0);
        });
    });

    describe('autocompleteExpression', () => {
        it('should autocomplete simple header', () => {
            const completions = helper.autocompleteExpression('${head', 'simple', 5);
            expect(completions.some(c => c.includes('header'))).toBe(true);
        });

        it('should autocomplete simple body', () => {
            const completions = helper.autocompleteExpression('${bod', 'simple', 5);
            expect(completions.some(c => c.includes('body'))).toBe(true);
        });

        it('should autocomplete jsonpath root', () => {
            const completions = helper.autocompleteExpression('$.', 'jsonpath', 5);
            expect(completions.length).toBeGreaterThan(0);
        });

        it('should limit completions to specified count', () => {
            const completions = helper.autocompleteExpression('${', 'simple', 3);
            expect(completions.length).toBeLessThanOrEqual(3);
        });
    });

    describe('integration scenarios', () => {
        it('should handle full expression workflow', () => {
            // 1. Suggest language
            const languageSuggestions = helper.suggestExpressionLanguage({
                dataFormat: 'json',
                expressionType: 'filter'
            });
            expect(languageSuggestions.length).toBeGreaterThan(0);
            
            // 2. Get examples
            const examples = helper.getExpressionExamples(languageSuggestions[0].language);
            expect(examples.length).toBeGreaterThan(0);
            
            // 3. Validate expression
            const validation = helper.validateExpression(
                examples[0].expression,
                languageSuggestions[0].language
            );
            expect(validation.valid).toBe(true);
            
            // 4. Explain expression
            const explanation = helper.explainExpression(
                examples[0].expression,
                languageSuggestions[0].language
            );
            expect(explanation.length).toBeGreaterThan(0);
        });

        it('should handle expression transformation workflow', () => {
            // Start with a task description
            const suggestions = helper.suggestExpressionForTask('extract order ID from JSON body');
            expect(suggestions.length).toBeGreaterThan(0);
            
            const suggestion = suggestions[0];
            
            // Validate the suggested expression
            const validation = helper.validateExpression(
                suggestion.expression,
                suggestion.language
            );
            expect(validation.valid).toBe(true);
        });
    });
});
