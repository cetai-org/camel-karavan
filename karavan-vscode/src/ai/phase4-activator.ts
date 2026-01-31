/**
 * Phase 4 Activator
 * Registers diagnostics, quick fixes, hover providers, and optimization commands
 */

import * as vscode from 'vscode';
import { getDiagnosticsProvider, disposeDiagnosticsProvider } from '../diagnostics/diagnostics-provider';
import { getQuickFixProvider, CamelQuickFixProvider } from '../diagnostics/quick-fix-provider';
import { getHoverProvider } from '../providers/hover-provider';
import { getCodeOptimizer } from '../optimization/code-optimizer';
import { getDocumentationAssistant } from '../assistance/documentation-assistant';
import { getBackendManager, disposeBackendManager } from '../utils/backend-manager';

const YAML_SELECTOR: vscode.DocumentSelector = [
    { language: 'yaml', scheme: 'file' },
    { language: 'yaml', scheme: 'untitled' },
];

export function activatePhase4Features(context: vscode.ExtensionContext): void {
    console.log('Activating Karavan AI Phase 4 features...');

    // Register diagnostics provider
    const diagnosticsProvider = getDiagnosticsProvider();
    context.subscriptions.push({
        dispose: () => disposeDiagnosticsProvider()
    });

    // Register quick fix provider
    const quickFixProvider = getQuickFixProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            YAML_SELECTOR,
            quickFixProvider,
            {
                providedCodeActionKinds: CamelQuickFixProvider.providedCodeActionKinds,
            }
        )
    );

    // Register hover provider
    const hoverProvider = getHoverProvider();
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(YAML_SELECTOR, hoverProvider)
    );

    // Register backend manager
    const backendManager = getBackendManager();
    context.subscriptions.push({
        dispose: () => disposeBackendManager()
    });

    // Register commands
    registerPhase4Commands(context);

    console.log('Karavan AI Phase 4 features activated');
}

function registerPhase4Commands(context: vscode.ExtensionContext): void {
    // Fix with AI command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'karavan.ai.fixWithAI',
            async (uri: vscode.Uri, diagnostic: vscode.Diagnostic) => {
                const document = await vscode.workspace.openTextDocument(uri);
                const docAssistant = getDocumentationAssistant();
                
                // Get explanation for the error
                const explanation = docAssistant.explainError(diagnostic.message);
                
                // Open AI panel with context
                vscode.commands.executeCommand('karavan.ai.openPanel', {
                    prompt: `Fix this error in my Camel route:\n\nError: ${diagnostic.message}\n\nExplanation: ${explanation}\n\nAffected code:\n${document.getText(diagnostic.range)}`,
                });
            }
        )
    );

    // Explain error command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'karavan.ai.explainError',
            async (uri: vscode.Uri, diagnostic: vscode.Diagnostic) => {
                const docAssistant = getDocumentationAssistant();
                const explanation = docAssistant.explainError(diagnostic.message);
                
                // Show information message with explanation
                const result = await vscode.window.showInformationMessage(
                    explanation,
                    'Fix with AI',
                    'Open Documentation'
                );
                
                if (result === 'Fix with AI') {
                    vscode.commands.executeCommand('karavan.ai.fixWithAI', uri, diagnostic);
                } else if (result === 'Open Documentation') {
                    vscode.env.openExternal(
                        vscode.Uri.parse('https://camel.apache.org/manual/error-handler.html')
                    );
                }
            }
        )
    );

    // Extract to route command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'karavan.ai.extractToRoute',
            async (uri: vscode.Uri, range: vscode.Range) => {
                const document = await vscode.workspace.openTextDocument(uri);
                const selectedText = document.getText(range);
                
                // Generate a route name
                const routeName = await vscode.window.showInputBox({
                    prompt: 'Enter name for the extracted route',
                    placeHolder: 'processData',
                    validateInput: (value) => {
                        if (!value || !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(value)) {
                            return 'Route name must start with a letter and contain only letters, numbers, and hyphens';
                        }
                        return undefined;
                    },
                });
                
                if (!routeName) return;

                const edit = new vscode.WorkspaceEdit();
                
                // Replace selected code with direct:routeName call
                edit.replace(uri, range, `- to: direct:${routeName}`);
                
                // Add new route at the end of the file
                const lastLine = document.lineCount - 1;
                const lastLineEnd = document.lineAt(lastLine).range.end;
                
                const newRoute = `\n\n# Extracted route: ${routeName}\n- from:\n    uri: direct:${routeName}\n    steps:\n${selectedText.split('\n').map(line => '      ' + line.trim()).join('\n')}`;
                
                edit.insert(uri, lastLineEnd, newRoute);
                
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage(`Extracted to direct:${routeName}`);
            }
        )
    );

    // Wrap with error handler command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'karavan.ai.wrapWithErrorHandler',
            async (uri: vscode.Uri, range: vscode.Range) => {
                const document = await vscode.workspace.openTextDocument(uri);
                const selectedText = document.getText(range);
                const indent = getIndentation(document.lineAt(range.start.line).text);

                const wrappedCode = `${indent}- doTry:\n${indent}    steps:\n${selectedText.split('\n').map(line => indent + '      ' + line.trim()).join('\n')}\n${indent}- doCatch:\n${indent}    exception:\n${indent}      - java.lang.Exception\n${indent}    steps:\n${indent}      - log:\n${indent}          message: "Error: \${exception.message}"\n${indent}          loggingLevel: ERROR`;

                const edit = new vscode.WorkspaceEdit();
                edit.replace(uri, range, wrappedCode);
                
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Wrapped with error handler');
            }
        )
    );

    // Add logging command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'karavan.ai.addLogging',
            async (uri: vscode.Uri, range: vscode.Range) => {
                const document = await vscode.workspace.openTextDocument(uri);
                const selectedText = document.getText(range);
                const indent = getIndentation(document.lineAt(range.start.line).text);

                const loggedCode = `${indent}- log:\n${indent}    message: "Before processing: \${body}"\n${selectedText}\n${indent}- log:\n${indent}    message: "After processing: \${body}"`;

                const edit = new vscode.WorkspaceEdit();
                edit.replace(uri, range, loggedCode);
                
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Added logging before and after');
            }
        )
    );

    // Optimize code command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'karavan.ai.optimizeCode',
            async (uri: vscode.Uri, range?: vscode.Range) => {
                const document = await vscode.workspace.openTextDocument(uri);
                const text = range ? document.getText(range) : document.getText();
                
                const optimizer = getCodeOptimizer();
                const result = optimizer.analyzeRoute(text);
                
                if (result.suggestions.length === 0) {
                    vscode.window.showInformationMessage('✅ No optimization suggestions found. Your code looks good!');
                    return;
                }

                // Show quick pick with suggestions
                const items = result.suggestions.map(s => ({
                    label: `$(${getSeverityIcon(s.severity)}) ${s.title}`,
                    description: s.category,
                    detail: s.description,
                    suggestion: s,
                }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `Found ${result.suggestions.length} suggestions (Score: ${result.score}/100)`,
                    canPickMany: false,
                });

                if (selected && selected.suggestion.suggestedCode) {
                    const edit = new vscode.WorkspaceEdit();
                    const fullRange = range || new vscode.Range(
                        new vscode.Position(0, 0),
                        new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length)
                    );
                    
                    const optimizedCode = optimizer.applySuggestion(text, selected.suggestion);
                    edit.replace(uri, fullRange, optimizedCode);
                    
                    await vscode.workspace.applyEdit(edit);
                    vscode.window.showInformationMessage(`Applied: ${selected.suggestion.title}`);
                }
            }
        )
    );

    // Analyze route command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'karavan.ai.analyzeRoute',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active editor');
                    return;
                }

                const document = editor.document;
                if (document.languageId !== 'yaml') {
                    vscode.window.showErrorMessage('This command works only with YAML files');
                    return;
                }

                const optimizer = getCodeOptimizer();
                const result = optimizer.analyzeRoute(document.getText());

                // Create a webview to show results
                const panel = vscode.window.createWebviewPanel(
                    'camelAnalysis',
                    'Route Analysis',
                    vscode.ViewColumn.Beside,
                    { enableScripts: true }
                );

                panel.webview.html = generateAnalysisHtml(result);
            }
        )
    );

    // Check backend health command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'karavan.ai.checkBackendHealth',
            async () => {
                const backendManager = getBackendManager();
                const backends = ['github-copilot', 'openai', 'local-llm'];
                
                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: 'Checking AI backends...',
                        cancellable: false,
                    },
                    async (progress) => {
                        const results: string[] = [];
                        
                        for (let i = 0; i < backends.length; i++) {
                            const backend = backends[i];
                            progress.report({ 
                                increment: (100 / backends.length),
                                message: `Checking ${backend}...` 
                            });
                            
                            const testResult = await backendManager.testBackend(backend);
                            const icon = testResult.success ? '✅' : '❌';
                            results.push(`${icon} ${backend}: ${testResult.success ? `OK (${testResult.responseTime}ms)` : testResult.message}`);
                        }
                        
                        vscode.window.showInformationMessage(
                            'Backend Health Check',
                            { modal: true, detail: results.join('\n') }
                        );
                    }
                );
            }
        )
    );

    // Switch backend command
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'karavan.ai.switchBackend',
            async () => {
                const backends = [
                    { label: 'GitHub Copilot', description: 'Recommended', value: 'github-copilot' },
                    { label: 'OpenAI', description: 'Requires API key', value: 'openai' },
                    { label: 'Local LLM', description: 'Requires Ollama', value: 'local-llm' },
                ];

                const selected = await vscode.window.showQuickPick(backends, {
                    placeHolder: 'Select AI backend',
                });

                if (selected) {
                    const backendManager = getBackendManager();
                    try {
                        await backendManager.switchBackend(selected.value);
                        vscode.window.showInformationMessage(`Switched to ${selected.label}`);
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        vscode.window.showErrorMessage(`Failed to switch backend: ${errorMessage}`);
                    }
                }
            }
        )
    );
}

function getIndentation(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
}

function getSeverityIcon(severity: string): string {
    switch (severity) {
        case 'warning': return 'warning';
        case 'suggestion': return 'lightbulb';
        case 'info': return 'info';
        default: return 'circle-outline';
    }
}

function generateAnalysisHtml(result: import('../optimization/code-optimizer').OptimizationResult): string {
    const severityColors: { [key: string]: string } = {
        'warning': '#f0ad4e',
        'suggestion': '#5bc0de',
        'info': '#5cb85c',
    };

    const suggestionItems = result.suggestions.map(s => `
        <div style="margin: 10px 0; padding: 10px; border-left: 3px solid ${severityColors[s.severity]}; background: var(--vscode-editor-background);">
            <strong>${s.title}</strong>
            <span style="float: right; font-size: 12px; padding: 2px 8px; background: ${severityColors[s.severity]}20; border-radius: 4px;">${s.category}</span>
            <p style="margin: 8px 0; color: var(--vscode-descriptionForeground);">${s.description}</p>
            ${s.suggestedCode ? `<pre style="background: var(--vscode-textCodeBlock-background); padding: 8px; overflow-x: auto;"><code>${escapeHtml(s.suggestedCode)}</code></pre>` : ''}
        </div>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            padding: 20px;
        }
        .score {
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
        }
        .summary {
            text-align: center;
            margin-bottom: 20px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <h1>Route Analysis</h1>
    <div class="score" style="color: ${result.score >= 80 ? '#5cb85c' : result.score >= 50 ? '#f0ad4e' : '#d9534f'};">
        ${result.score}/100
    </div>
    <p class="summary">${result.summary}</p>
    
    ${result.suggestions.length > 0 ? `
        <h2>Suggestions</h2>
        ${suggestionItems}
    ` : '<p style="text-align: center;">✅ No issues found!</p>'}
</body>
</html>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function deactivatePhase4Features(): void {
    disposeDiagnosticsProvider();
    disposeBackendManager();
}
