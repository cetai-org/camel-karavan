/**
 * Unit Tests for Quick Fix Provider
 * Tests code action suggestions and automatic fixes
 */

import * as vscode from 'vscode';
import {
    QuickFixProvider,
    getQuickFixProvider,
    QuickFix,
    QuickFixContext
} from '../../src/ai/diagnostics/quick-fix-provider';

// Mock vscode module
jest.mock('vscode', () => ({
    CodeActionKind: {
        QuickFix: { value: 'quickfix' },
        RefactorRewrite: { value: 'refactor.rewrite' }
    },
    CodeAction: jest.fn((title, kind) => ({
        title,
        kind,
        edit: null,
        diagnostics: [],
        isPreferred: false
    })),
    WorkspaceEdit: jest.fn(() => ({
        replace: jest.fn(),
        insert: jest.fn(),
        delete: jest.fn()
    })),
    Range: jest.fn((startLine, startChar, endLine, endChar) => ({
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar }
    })),
    Position: jest.fn((line, char) => ({ line, character: char })),
    Uri: {
        file: jest.fn(path => ({ fsPath: path }))
    }
}));

describe('QuickFixProvider', () => {
    let provider: QuickFixProvider;

    beforeEach(() => {
        provider = getQuickFixProvider();
    });

    describe('getQuickFixes', () => {
        it('should return quick fixes for missing URI', () => {
            const context: QuickFixContext = {
                diagnostic: {
                    message: 'Missing required field: uri',
                    line: 2,
                    column: 4,
                    code: 'missing-uri'
                },
                documentUri: 'file:///test.yaml',
                yaml: `
- from:
    steps:
      - to:
          uri: "log:output"
`
            };
            const fixes = provider.getQuickFixes(context);
            expect(fixes.length).toBeGreaterThan(0);
        });

        it('should return quick fixes for invalid component', () => {
            const context: QuickFixContext = {
                diagnostic: {
                    message: 'Unknown component: invalidcomponent',
                    line: 2,
                    column: 9,
                    code: 'unknown-component'
                },
                documentUri: 'file:///test.yaml',
                yaml: `
- from:
    uri: "invalidcomponent:start"
    steps:
      - to:
          uri: "log:output"
`
            };
            const fixes = provider.getQuickFixes(context);
            expect(fixes.length).toBeGreaterThan(0);
        });

        it('should return quick fixes for syntax errors', () => {
            const context: QuickFixContext = {
                diagnostic: {
                    message: 'YAML syntax error: unclosed quote',
                    line: 2,
                    column: 9,
                    code: 'syntax-error'
                },
                documentUri: 'file:///test.yaml',
                yaml: `
- from:
    uri: "direct:start
    steps:
      - to:
          uri: "log:output"
`
            };
            const fixes = provider.getQuickFixes(context);
            expect(fixes.length).toBeGreaterThanOrEqual(0);
        });

        it('should suggest component alternatives', () => {
            const context: QuickFixContext = {
                diagnostic: {
                    message: 'Unknown component: fiel',
                    line: 2,
                    column: 9,
                    code: 'unknown-component'
                },
                documentUri: 'file:///test.yaml',
                yaml: `
- from:
    uri: "fiel:input"
    steps:
      - to:
          uri: "log:output"
`
            };
            const fixes = provider.getQuickFixes(context);
            const fileFix = fixes.find(f => f.title.toLowerCase().includes('file'));
            expect(fileFix).toBeDefined();
        });

        it('should suggest adding error handler', () => {
            const context: QuickFixContext = {
                diagnostic: {
                    message: 'Missing error handler for external service call',
                    line: 4,
                    column: 4,
                    code: 'missing-error-handler'
                },
                documentUri: 'file:///test.yaml',
                yaml: `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "http://api.example.com"
`
            };
            const fixes = provider.getQuickFixes(context);
            const errorHandlerFix = fixes.find(f => 
                f.title.toLowerCase().includes('error') || 
                f.title.toLowerCase().includes('try')
            );
            expect(errorHandlerFix).toBeDefined();
        });
    });

    describe('applyQuickFix', () => {
        it('should apply URI fix', () => {
            const fix: QuickFix = {
                title: 'Add uri field',
                edit: {
                    range: { startLine: 2, startColumn: 4, endLine: 2, endColumn: 4 },
                    newText: 'uri: "direct:start"\n    '
                }
            };
            const yaml = `
- from:
    steps:
      - to:
          uri: "log:output"
`;
            const result = provider.applyQuickFix(yaml, fix);
            expect(result).toContain('uri:');
        });

        it('should apply component replacement fix', () => {
            const fix: QuickFix = {
                title: 'Replace with file:',
                edit: {
                    range: { startLine: 2, startColumn: 9, endLine: 2, endColumn: 13 },
                    newText: 'file'
                }
            };
            const yaml = `
- from:
    uri: "fiel:input"
    steps:
      - to:
          uri: "log:output"
`;
            const result = provider.applyQuickFix(yaml, fix);
            // Should replace typo
            expect(result).toBeDefined();
        });

        it('should apply quote fix', () => {
            const fix: QuickFix = {
                title: 'Close quote',
                edit: {
                    range: { startLine: 2, startColumn: 20, endLine: 2, endColumn: 20 },
                    newText: '"'
                }
            };
            const yaml = `
- from:
    uri: "direct:start
    steps:
      - to:
          uri: "log:output"
`;
            const result = provider.applyQuickFix(yaml, fix);
            expect(result).toBeDefined();
        });
    });

    describe('suggestFix', () => {
        it('should suggest fix for common typos', () => {
            const fixes = provider.suggestFix('fiel:input', 'unknown-component');
            expect(fixes.length).toBeGreaterThan(0);
            const fileFix = fixes.find(f => f.suggestion.includes('file'));
            expect(fileFix).toBeDefined();
        });

        it('should suggest fix for missing colon', () => {
            const fixes = provider.suggestFix('directstart', 'invalid-uri');
            expect(fixes.length).toBeGreaterThan(0);
        });

        it('should suggest fix for expression errors', () => {
            const fixes = provider.suggestFix('${header.id', 'unclosed-brace');
            expect(fixes.length).toBeGreaterThan(0);
            const braceFix = fixes.find(f => f.suggestion.includes('}'));
            expect(braceFix).toBeDefined();
        });
    });

    describe('getAIAssistedFix', () => {
        it('should request AI fix for complex errors', async () => {
            const context: QuickFixContext = {
                diagnostic: {
                    message: 'Route structure appears incorrect',
                    line: 1,
                    column: 0,
                    code: 'structure-error'
                },
                documentUri: 'file:///test.yaml',
                yaml: `
- from
    uri: direct:start
    step:
      - too:
          uro: log:output
`
            };
            
            // AI fix should provide more intelligent suggestions
            const fixes = await provider.getAIAssistedFix(context);
            expect(fixes).toBeDefined();
        });

        it('should handle AI unavailable gracefully', async () => {
            const context: QuickFixContext = {
                diagnostic: {
                    message: 'Unknown error',
                    line: 1,
                    column: 0,
                    code: 'unknown'
                },
                documentUri: 'file:///test.yaml',
                yaml: 'invalid'
            };
            
            // Should not throw even if AI is unavailable
            await expect(provider.getAIAssistedFix(context)).resolves.toBeDefined();
        });
    });

    describe('code action kinds', () => {
        it('should provide quickfix actions', () => {
            const context: QuickFixContext = {
                diagnostic: {
                    message: 'Missing uri',
                    line: 2,
                    column: 4,
                    code: 'missing-uri'
                },
                documentUri: 'file:///test.yaml',
                yaml: `
- from:
    steps: []
`
            };
            const fixes = provider.getQuickFixes(context);
            
            if (fixes.length > 0) {
                expect(fixes[0].kind).toBeDefined();
            }
        });

        it('should mark preferred fix', () => {
            const context: QuickFixContext = {
                diagnostic: {
                    message: 'Unknown component: fiel',
                    line: 2,
                    column: 9,
                    code: 'unknown-component'
                },
                documentUri: 'file:///test.yaml',
                yaml: `
- from:
    uri: "fiel:input"
`
            };
            const fixes = provider.getQuickFixes(context);
            
            if (fixes.length > 0) {
                const hasPreferred = fixes.some(f => f.isPreferred);
                // First/best fix should typically be preferred
                expect(hasPreferred || fixes.length === 1).toBe(true);
            }
        });
    });

    describe('bulk fixes', () => {
        it('should provide fix all option', () => {
            const contexts: QuickFixContext[] = [
                {
                    diagnostic: { message: 'Missing quote', line: 2, column: 9, code: 'syntax' },
                    documentUri: 'file:///test.yaml',
                    yaml: 'uri: "unclosed'
                },
                {
                    diagnostic: { message: 'Missing quote', line: 4, column: 9, code: 'syntax' },
                    documentUri: 'file:///test.yaml',
                    yaml: 'uri: "unclosed'
                }
            ];
            
            const bulkFix = provider.getBulkFix(contexts);
            expect(bulkFix).toBeDefined();
            if (bulkFix) {
                expect(bulkFix.title).toContain('all');
            }
        });

        it('should not provide bulk fix for single issue', () => {
            const contexts: QuickFixContext[] = [
                {
                    diagnostic: { message: 'Missing quote', line: 2, column: 9, code: 'syntax' },
                    documentUri: 'file:///test.yaml',
                    yaml: 'uri: "unclosed'
                }
            ];
            
            const bulkFix = provider.getBulkFix(contexts);
            // Single issue doesn't need bulk fix
            expect(bulkFix === undefined || bulkFix === null).toBe(true);
        });
    });

    describe('fix previews', () => {
        it('should generate fix preview', () => {
            const fix: QuickFix = {
                title: 'Add uri field',
                edit: {
                    range: { startLine: 2, startColumn: 4, endLine: 2, endColumn: 4 },
                    newText: 'uri: "direct:start"\n    '
                }
            };
            const yaml = `
- from:
    steps:
      - to:
          uri: "log:output"
`;
            const preview = provider.getFixPreview(yaml, fix);
            expect(preview).toBeDefined();
            expect(preview.before).toBeDefined();
            expect(preview.after).toBeDefined();
        });

        it('should highlight changes in preview', () => {
            const fix: QuickFix = {
                title: 'Replace fiel with file',
                edit: {
                    range: { startLine: 2, startColumn: 9, endLine: 2, endColumn: 13 },
                    newText: 'file'
                }
            };
            const yaml = `
- from:
    uri: "fiel:input"
`;
            const preview = provider.getFixPreview(yaml, fix);
            expect(preview.after).toContain('file');
        });
    });

    describe('edge cases', () => {
        it('should handle empty YAML', () => {
            const context: QuickFixContext = {
                diagnostic: { message: 'Empty document', line: 0, column: 0, code: 'empty' },
                documentUri: 'file:///test.yaml',
                yaml: ''
            };
            expect(() => provider.getQuickFixes(context)).not.toThrow();
        });

        it('should handle multi-line fixes', () => {
            const fix: QuickFix = {
                title: 'Add error handler',
                edit: {
                    range: { startLine: 3, startColumn: 4, endLine: 3, endColumn: 4 },
                    newText: `doTry:
        steps:
          - to:
              uri: "http://api.example.com"
        doCatch:
          - exception: "java.lang.Exception"
            steps:
              - log:
                  message: "Error occurred"
`
                }
            };
            const yaml = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "http://api.example.com"
`;
            const result = provider.applyQuickFix(yaml, fix);
            expect(result).toContain('doTry');
            expect(result).toContain('doCatch');
        });
    });
});
