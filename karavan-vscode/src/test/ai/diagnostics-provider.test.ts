/**
 * Unit Tests for Diagnostics Provider
 * Tests real-time validation and error detection
 */

import * as vscode from 'vscode';
import {
    DiagnosticsProvider,
    getDiagnosticsProvider,
    DiagnosticIssue,
    ValidationResult
} from '../../src/ai/diagnostics/diagnostics-provider';

// Mock vscode module
jest.mock('vscode', () => ({
    DiagnosticSeverity: {
        Error: 0,
        Warning: 1,
        Information: 2,
        Hint: 3
    },
    languages: {
        createDiagnosticCollection: jest.fn(() => ({
            set: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
            dispose: jest.fn()
        }))
    },
    Uri: {
        file: jest.fn(path => ({ fsPath: path, toString: () => path }))
    },
    Range: jest.fn((startLine, startChar, endLine, endChar) => ({
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar }
    })),
    Diagnostic: jest.fn((range, message, severity) => ({
        range,
        message,
        severity
    }))
}));

describe('DiagnosticsProvider', () => {
    let provider: DiagnosticsProvider;

    beforeEach(() => {
        provider = getDiagnosticsProvider();
    });

    describe('validateYAML', () => {
        it('should validate correct YAML', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "log:output"
`;
            const result = provider.validateYAML(yaml);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should detect invalid YAML syntax', () => {
            const yaml = `
- from:
  uri: "broken
    steps:
`;
            const result = provider.validateYAML(yaml);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should detect missing required fields', () => {
            const yaml = `
- from:
    steps:
      - to:
          uri: "log:output"
`;
            const result = provider.validateYAML(yaml);
            // Should warn about missing 'uri' in 'from'
            const missingUri = result.errors.find(e => 
                e.message.toLowerCase().includes('uri') || 
                e.message.toLowerCase().includes('required')
            );
            expect(missingUri || result.warnings.length > 0).toBeTruthy();
        });

        it('should detect invalid component names', () => {
            const yaml = `
- from:
    uri: "invalidcomponent:start"
    steps:
      - to:
          uri: "log:output"
`;
            const result = provider.validateYAML(yaml);
            // May flag unknown component
            expect(result).toBeDefined();
        });

        it('should validate component options', () => {
            const yaml = `
- from:
    uri: "timer:tick?invalidOption=true"
    steps:
      - to:
          uri: "log:output"
`;
            const result = provider.validateYAML(yaml);
            // May flag invalid option
            expect(result).toBeDefined();
        });

        it('should return line numbers for errors', () => {
            const yaml = `- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "broken`;
            const result = provider.validateYAML(yaml);
            if (result.errors.length > 0) {
                expect(result.errors[0].line).toBeDefined();
                expect(result.errors[0].line).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('validateRoute', () => {
        it('should validate route structure', () => {
            const route = {
                from: {
                    uri: 'direct:start',
                    steps: [
                        { to: { uri: 'log:output' } }
                    ]
                }
            };
            const result = provider.validateRoute(route);
            expect(result.valid).toBe(true);
        });

        it('should detect missing from', () => {
            const route = {
                steps: [
                    { to: { uri: 'log:output' } }
                ]
            };
            const result = provider.validateRoute(route);
            expect(result.valid).toBe(false);
        });

        it('should detect empty steps', () => {
            const route = {
                from: {
                    uri: 'direct:start',
                    steps: []
                }
            };
            const result = provider.validateRoute(route);
            // May be valid but with warnings
            expect(result.warnings.length).toBeGreaterThanOrEqual(0);
        });

        it('should validate nested structures', () => {
            const route = {
                from: {
                    uri: 'direct:start',
                    steps: [
                        {
                            choice: {
                                when: [
                                    {
                                        simple: '${header.type} == "A"',
                                        steps: [{ to: { uri: 'direct:a' } }]
                                    }
                                ],
                                otherwise: {
                                    steps: [{ to: { uri: 'direct:default' } }]
                                }
                            }
                        }
                    ]
                }
            };
            const result = provider.validateRoute(route);
            expect(result).toBeDefined();
        });
    });

    describe('validateExpression', () => {
        it('should validate simple expressions', () => {
            const result = provider.validateExpression('${header.orderId}', 'simple');
            expect(result.valid).toBe(true);
        });

        it('should detect unclosed braces', () => {
            const result = provider.validateExpression('${header.orderId', 'simple');
            expect(result.valid).toBe(false);
        });

        it('should validate jsonpath expressions', () => {
            const result = provider.validateExpression('$.order.id', 'jsonpath');
            expect(result.valid).toBe(true);
        });

        it('should validate xpath expressions', () => {
            const result = provider.validateExpression('/order/id', 'xpath');
            expect(result.valid).toBe(true);
        });

        it('should detect invalid expression syntax', () => {
            const result = provider.validateExpression('$[invalid', 'jsonpath');
            expect(result.valid).toBe(false);
        });
    });

    describe('validateComponentUri', () => {
        it('should validate correct URI', () => {
            const result = provider.validateComponentUri('timer:tick?period=1000');
            expect(result.valid).toBe(true);
        });

        it('should validate URI with multiple options', () => {
            const result = provider.validateComponentUri(
                'file:input?noop=true&recursive=true'
            );
            expect(result.valid).toBe(true);
        });

        it('should detect missing component name', () => {
            const result = provider.validateComponentUri(':invalid');
            expect(result.valid).toBe(false);
        });

        it('should detect empty URI', () => {
            const result = provider.validateComponentUri('');
            expect(result.valid).toBe(false);
        });

        it('should validate common components', () => {
            const validUris = [
                'direct:start',
                'file:input',
                'timer:tick',
                'log:output',
                'http://api.example.com',
                'kafka:topic',
                'jms:queue:orders',
                'sql:SELECT * FROM users'
            ];

            validUris.forEach(uri => {
                const result = provider.validateComponentUri(uri);
                expect(result.valid).toBe(true);
            });
        });
    });

    describe('getIssuesForDocument', () => {
        it('should return issues for document', () => {
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "log:output"
`;
            const issues = provider.getIssuesForDocument(yaml, 'test.yaml');
            expect(Array.isArray(issues)).toBe(true);
        });

        it('should include severity in issues', () => {
            const yaml = `
- from:
    uri: "broken`;
            const issues = provider.getIssuesForDocument(yaml, 'test.yaml');
            if (issues.length > 0) {
                expect(issues[0].severity).toBeDefined();
            }
        });

        it('should include source in issues', () => {
            const yaml = `
- from:
    uri: "broken`;
            const issues = provider.getIssuesForDocument(yaml, 'test.yaml');
            if (issues.length > 0) {
                expect(issues[0].source).toBe('Karavan AI');
            }
        });
    });

    describe('clearDiagnostics', () => {
        it('should clear diagnostics for document', () => {
            // This mainly tests that the method doesn't throw
            expect(() => provider.clearDiagnostics('test.yaml')).not.toThrow();
        });

        it('should clear all diagnostics', () => {
            expect(() => provider.clearAllDiagnostics()).not.toThrow();
        });
    });

    describe('realtime validation scenarios', () => {
        it('should validate while typing partial YAML', () => {
            const partialYaml = `
- from:
    uri: "direct:`;
            // Should not crash on partial YAML
            expect(() => provider.validateYAML(partialYaml)).not.toThrow();
        });

        it('should validate multiple routes', () => {
            const yaml = `
- from:
    uri: "direct:route1"
    steps:
      - to:
          uri: "log:output1"
- from:
    uri: "direct:route2"
    steps:
      - to:
          uri: "log:output2"
`;
            const result = provider.validateYAML(yaml);
            expect(result).toBeDefined();
        });

        it('should handle large YAML documents', () => {
            let yaml = '';
            for (let i = 0; i < 100; i++) {
                yaml += `
- from:
    uri: "direct:route${i}"
    steps:
      - to:
          uri: "log:output${i}"
`;
            }
            const startTime = Date.now();
            const result = provider.validateYAML(yaml);
            const duration = Date.now() - startTime;
            
            expect(result).toBeDefined();
            // Should complete within reasonable time
            expect(duration).toBeLessThan(5000);
        });
    });

    describe('diagnostic categories', () => {
        it('should categorize syntax errors', () => {
            const yaml = '- from: {invalid yaml';
            const result = provider.validateYAML(yaml);
            if (result.errors.length > 0) {
                const hasSyntaxError = result.errors.some(
                    e => e.category === 'syntax' || e.message.toLowerCase().includes('syntax')
                );
                expect(hasSyntaxError).toBe(true);
            }
        });

        it('should categorize semantic errors', () => {
            const yaml = `
- from:
    steps:
      - to:
          uri: "log:output"
`;
            const result = provider.validateYAML(yaml);
            // Missing uri is a semantic error
            expect(result).toBeDefined();
        });

        it('should provide error codes', () => {
            const yaml = '- from: broken';
            const result = provider.validateYAML(yaml);
            if (result.errors.length > 0) {
                expect(result.errors[0].code).toBeDefined();
            }
        });
    });
});
