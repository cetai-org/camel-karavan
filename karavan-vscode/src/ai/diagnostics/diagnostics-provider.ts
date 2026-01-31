/**
 * Diagnostics Provider for Camel YAML files
 * Integrates with VS Code diagnostics to show validation errors in real-time
 */

import * as vscode from 'vscode';
import { validateCamelYAML, ValidationResult, ValidationError } from '../utils/yaml-validator';

export class CamelDiagnosticsProvider implements vscode.Disposable {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('camel-yaml');
        this.disposables.push(this.diagnosticCollection);

        // Watch for document changes
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(e => this.validateDocument(e.document))
        );

        // Watch for document open
        this.disposables.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.validateDocument(doc))
        );

        // Watch for document save
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(doc => this.validateDocument(doc))
        );

        // Validate all open documents
        vscode.workspace.textDocuments.forEach(doc => this.validateDocument(doc));
    }

    /**
     * Check if document is a Camel YAML file
     */
    private isCamelYamlFile(document: vscode.TextDocument): boolean {
        if (document.languageId !== 'yaml') {
            return false;
        }

        const fileName = document.fileName.toLowerCase();
        if (!fileName.endsWith('.yaml') && !fileName.endsWith('.yml')) {
            return false;
        }

        // Check content for Camel-specific patterns
        const content = document.getText();
        return content.includes('- from:') || 
               content.includes('- rest:') || 
               content.includes('uri:') ||
               content.includes('route:');
    }

    /**
     * Validate a document and update diagnostics
     */
    public validateDocument(document: vscode.TextDocument): void {
        if (!this.isCamelYamlFile(document)) {
            return;
        }

        const content = document.getText();
        const result = validateCamelYAML(content);
        
        const diagnostics: vscode.Diagnostic[] = [];

        // Add errors
        for (const error of result.errors) {
            const diagnostic = this.createDiagnostic(
                document,
                error,
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        }

        // Add warnings
        for (const warning of result.warnings) {
            const diagnostic = this.createDiagnostic(
                document,
                warning,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostics.push(diagnostic);
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    /**
     * Create a VS Code diagnostic from validation error
     */
    private createDiagnostic(
        document: vscode.TextDocument,
        error: ValidationError,
        severity: vscode.DiagnosticSeverity
    ): vscode.Diagnostic {
        let range: vscode.Range;

        if (error.line !== undefined && error.line > 0) {
            // Use line number from validation
            const lineIndex = Math.min(error.line - 1, document.lineCount - 1);
            const line = document.lineAt(lineIndex);
            
            if (error.column !== undefined) {
                const startPos = new vscode.Position(lineIndex, Math.max(0, error.column - 1));
                const endPos = new vscode.Position(lineIndex, line.text.length);
                range = new vscode.Range(startPos, endPos);
            } else {
                range = line.range;
            }
        } else {
            // Try to find the error location by searching for the path
            range = this.findErrorRange(document, error);
        }

        const diagnostic = new vscode.Diagnostic(range, error.message, severity);
        diagnostic.source = 'Karavan AI';
        diagnostic.code = error.code || 'camel-validation';

        return diagnostic;
    }

    /**
     * Find the range for an error based on its path
     */
    private findErrorRange(document: vscode.TextDocument, error: ValidationError): vscode.Range {
        const content = document.getText();
        const lines = content.split('\n');

        // Try to find by path segments
        if (error.path) {
            const pathParts = error.path.split('.');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                for (const part of pathParts) {
                    if (line.includes(part + ':') || line.includes(part)) {
                        return document.lineAt(i).range;
                    }
                }
            }
        }

        // Default to first line
        return document.lineAt(0).range;
    }

    /**
     * Clear diagnostics for a document
     */
    public clearDiagnostics(document: vscode.TextDocument): void {
        this.diagnosticCollection.delete(document.uri);
    }

    /**
     * Get current diagnostics for a document
     */
    public getDiagnostics(document: vscode.TextDocument): readonly vscode.Diagnostic[] {
        return this.diagnosticCollection.get(document.uri) || [];
    }

    /**
     * Refresh diagnostics for all open documents
     */
    public refreshAll(): void {
        vscode.workspace.textDocuments.forEach(doc => this.validateDocument(doc));
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}

// Singleton instance
let diagnosticsProviderInstance: CamelDiagnosticsProvider | undefined;

export function getDiagnosticsProvider(): CamelDiagnosticsProvider {
    if (!diagnosticsProviderInstance) {
        diagnosticsProviderInstance = new CamelDiagnosticsProvider();
    }
    return diagnosticsProviderInstance;
}

export function disposeDiagnosticsProvider(): void {
    if (diagnosticsProviderInstance) {
        diagnosticsProviderInstance.dispose();
        diagnosticsProviderInstance = undefined;
    }
}
