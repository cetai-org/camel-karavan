/**
 * Quick Fix Provider for Camel YAML files
 * Provides code actions to fix common validation errors
 */

import * as vscode from 'vscode';
import { COMMON_COMPONENTS, EIP_PATTERNS } from '../knowledge/camel-metadata';

interface QuickFix {
    title: string;
    diagnosticCode: string | RegExp;
    createEdit: (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => vscode.WorkspaceEdit | undefined;
}

export class CamelQuickFixProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.Refactor,
    ];

    private quickFixes: QuickFix[] = [
        // Fix missing steps
        {
            title: 'Add steps section',
            diagnosticCode: /missing.*steps/i,
            createEdit: (document, diagnostic) => {
                const edit = new vscode.WorkspaceEdit();
                const line = document.lineAt(diagnostic.range.start.line);
                const indent = this.getIndentation(line.text) + '  ';
                
                edit.insert(
                    document.uri,
                    new vscode.Position(diagnostic.range.end.line + 1, 0),
                    `${indent}steps:\n${indent}  - log: "TODO: Add steps"\n`
                );
                return edit;
            }
        },
        // Fix missing uri
        {
            title: 'Add uri property',
            diagnosticCode: /missing.*uri/i,
            createEdit: (document, diagnostic) => {
                const edit = new vscode.WorkspaceEdit();
                const line = document.lineAt(diagnostic.range.start.line);
                const indent = this.getIndentation(line.text) + '  ';
                
                edit.insert(
                    document.uri,
                    new vscode.Position(diagnostic.range.end.line + 1, 0),
                    `${indent}uri: direct:start\n`
                );
                return edit;
            }
        },
        // Fix tabs to spaces
        {
            title: 'Convert tabs to spaces',
            diagnosticCode: /tabs.*instead.*spaces/i,
            createEdit: (document, diagnostic) => {
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    new vscode.Position(0, 0),
                    new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length)
                );
                const content = document.getText().replace(/\t/g, '  ');
                edit.replace(document.uri, fullRange, content);
                return edit;
            }
        },
        // Fix empty steps array
        {
            title: 'Add default step',
            diagnosticCode: /steps.*empty/i,
            createEdit: (document, diagnostic) => {
                const edit = new vscode.WorkspaceEdit();
                const line = document.lineAt(diagnostic.range.start.line);
                const indent = this.getIndentation(line.text) + '  ';
                
                edit.insert(
                    document.uri,
                    new vscode.Position(diagnostic.range.end.line + 1, 0),
                    `${indent}- log: "Processing message"\n`
                );
                return edit;
            }
        },
        // Fix missing 'from' in route
        {
            title: 'Add from section',
            diagnosticCode: /route.*must.*from/i,
            createEdit: (document, diagnostic) => {
                const edit = new vscode.WorkspaceEdit();
                const line = document.lineAt(diagnostic.range.start.line);
                const indent = this.getIndentation(line.text);
                
                edit.replace(
                    document.uri,
                    line.range,
                    `${indent}- from:\n${indent}    uri: timer:tick\n${indent}    steps:\n${indent}      - log: "Hello"\n`
                );
                return edit;
            }
        },
        // Fix unknown step type with suggestions
        {
            title: 'Replace with suggested step',
            diagnosticCode: /unknown.*step/i,
            createEdit: (document, diagnostic) => {
                // Extract the unknown step name from the error
                const line = document.lineAt(diagnostic.range.start.line);
                const match = line.text.match(/^\s*-\s*(\w+):/);
                
                if (match) {
                    const unknownStep = match[1].toLowerCase();
                    const suggestion = this.findSimilarStep(unknownStep);
                    
                    if (suggestion) {
                        const edit = new vscode.WorkspaceEdit();
                        const startPos = line.text.indexOf(match[1]);
                        const range = new vscode.Range(
                            new vscode.Position(diagnostic.range.start.line, startPos),
                            new vscode.Position(diagnostic.range.start.line, startPos + match[1].length)
                        );
                        edit.replace(document.uri, range, suggestion);
                        return edit;
                    }
                }
                return undefined;
            }
        },
    ];

    /**
     * Provide code actions for diagnostics
     */
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source !== 'Karavan AI') {
                continue;
            }

            // Find matching quick fixes
            for (const fix of this.quickFixes) {
                const matches = typeof fix.diagnosticCode === 'string'
                    ? diagnostic.message.includes(fix.diagnosticCode)
                    : fix.diagnosticCode.test(diagnostic.message);

                if (matches) {
                    const edit = fix.createEdit(document, diagnostic);
                    if (edit) {
                        const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
                        action.edit = edit;
                        action.diagnostics = [diagnostic];
                        action.isPreferred = true;
                        actions.push(action);
                    }
                }
            }

            // Add AI-powered fix suggestions
            actions.push(...this.createAIFixActions(document, diagnostic));
        }

        // Add refactor actions for selected code
        if (!range.isEmpty) {
            actions.push(...this.createRefactorActions(document, range));
        }

        return actions;
    }

    /**
     * Create AI-powered fix actions
     */
    private createAIFixActions(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        // AI-assisted fix action
        const aiFixAction = new vscode.CodeAction(
            'Fix with AI Copilot',
            vscode.CodeActionKind.QuickFix
        );
        aiFixAction.command = {
            title: 'Fix with AI Copilot',
            command: 'karavan.ai.fixWithAI',
            arguments: [document.uri, diagnostic],
        };
        actions.push(aiFixAction);

        // Explain error action
        const explainAction = new vscode.CodeAction(
            'Explain this error',
            vscode.CodeActionKind.QuickFix
        );
        explainAction.command = {
            title: 'Explain this error',
            command: 'karavan.ai.explainError',
            arguments: [document.uri, diagnostic],
        };
        actions.push(explainAction);

        return actions;
    }

    /**
     * Create refactor actions for selected code
     */
    private createRefactorActions(
        document: vscode.TextDocument,
        range: vscode.Range
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];
        const selectedText = document.getText(range);

        // Extract to subroute
        if (selectedText.includes('- ')) {
            const extractAction = new vscode.CodeAction(
                'Extract to direct route',
                vscode.CodeActionKind.Refactor
            );
            extractAction.command = {
                title: 'Extract to direct route',
                command: 'karavan.ai.extractToRoute',
                arguments: [document.uri, range],
            };
            actions.push(extractAction);
        }

        // Wrap with try-catch (onException)
        const wrapAction = new vscode.CodeAction(
            'Wrap with error handler',
            vscode.CodeActionKind.Refactor
        );
        wrapAction.command = {
            title: 'Wrap with error handler',
            command: 'karavan.ai.wrapWithErrorHandler',
            arguments: [document.uri, range],
        };
        actions.push(wrapAction);

        // Add logging
        const loggingAction = new vscode.CodeAction(
            'Add logging before/after',
            vscode.CodeActionKind.Refactor
        );
        loggingAction.command = {
            title: 'Add logging',
            command: 'karavan.ai.addLogging',
            arguments: [document.uri, range],
        };
        actions.push(loggingAction);

        // Optimize with AI
        const optimizeAction = new vscode.CodeAction(
            'Optimize with AI',
            vscode.CodeActionKind.Refactor
        );
        optimizeAction.command = {
            title: 'Optimize with AI',
            command: 'karavan.ai.optimizeCode',
            arguments: [document.uri, range],
        };
        actions.push(optimizeAction);

        return actions;
    }

    /**
     * Get indentation from a line
     */
    private getIndentation(line: string): string {
        const match = line.match(/^(\s*)/);
        return match ? match[1] : '';
    }

    /**
     * Find similar step name for typos
     */
    private findSimilarStep(unknownStep: string): string | undefined {
        const knownSteps = [
            'log', 'to', 'toD', 'from', 'setHeader', 'setBody', 'setProperty',
            'removeHeader', 'removeHeaders', 'removeProperty', 'removeProperties',
            'transform', 'marshal', 'unmarshal', 'bean', 'process',
            'choice', 'when', 'otherwise', 'split', 'aggregate', 'filter',
            'multicast', 'recipientList', 'routingSlip', 'dynamicRouter',
            'enrich', 'pollEnrich', 'wireTap', 'delay', 'throttle',
            'onException', 'doTry', 'doCatch', 'doFinally',
            'loop', 'threads', 'convertBodyTo', 'validate',
        ];

        // Simple Levenshtein-like similarity check
        let bestMatch: string | undefined;
        let bestScore = 0;

        for (const step of knownSteps) {
            const score = this.similarity(unknownStep.toLowerCase(), step.toLowerCase());
            if (score > bestScore && score > 0.6) {
                bestScore = score;
                bestMatch = step;
            }
        }

        return bestMatch;
    }

    /**
     * Calculate string similarity (0-1)
     */
    private similarity(s1: string, s2: string): number {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        
        if (longer.length === 0) {
            return 1.0;
        }
        
        const costs: number[] = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) {
                costs[s2.length] = lastValue;
            }
        }
        
        return (longer.length - costs[s2.length]) / longer.length;
    }
}

// Singleton instance
let quickFixProviderInstance: CamelQuickFixProvider | undefined;

export function getQuickFixProvider(): CamelQuickFixProvider {
    if (!quickFixProviderInstance) {
        quickFixProviderInstance = new CamelQuickFixProvider();
    }
    return quickFixProviderInstance;
}
