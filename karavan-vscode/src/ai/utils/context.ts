/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { RouteContext, ProjectMetadata } from '../../webview/ai-panel/types';

/**
 * Gather context about the current Camel project and file
 */
export async function gatherCamelContext(): Promise<RouteContext> {
    // Try to get active editor first, fallback to visible editors
    let editor = vscode.window.activeTextEditor;
    
    if (!editor) {
        // If no active editor (likely because AI panel has focus), 
        // look for the first visible YAML editor
        const visibleEditors = vscode.window.visibleTextEditors;
        console.log('gatherCamelContext - No active editor, checking visible editors:', visibleEditors.length);
        
        editor = visibleEditors.find(e => 
            e.document.fileName.endsWith('.camel.yaml') || 
            e.document.fileName.endsWith('.yaml')
        );
        
        if (!editor && visibleEditors.length > 0) {
            // If no YAML file, use the first visible editor
            editor = visibleEditors[0];
        }
    }
    
    console.log('gatherCamelContext - Active editor:', editor ? editor.document.fileName : 'none');
    
    if (!editor) {
        console.log('gatherCamelContext - No active editor found');
        return { availableComponents: [] };
    }

    const document = editor.document;
    const fileName = document.fileName;
    const isYaml = fileName.endsWith('.camel.yaml') || fileName.endsWith('.yaml');

    console.log('gatherCamelContext - fileName:', fileName);
    console.log('gatherCamelContext - isYaml:', isYaml);

    const context: RouteContext = {
        currentFile: fileName,
        fileName: document.fileName.split('/').pop(),
        isYaml,
        availableComponents: [],
    };

    if (isYaml) {
        try {
            const content = document.getText();
            console.log('gatherCamelContext - Document content length:', content.length);
            const parsed = yaml.load(content) as any;
            console.log('gatherCamelContext - Parsed YAML:', parsed);
            
            // Extract current route information
            if (parsed && Array.isArray(parsed)) {
                context.currentRoute = parsed;
            } else if (parsed && parsed.route) {
                context.currentRoute = parsed.route;
            }

            console.log('gatherCamelContext - currentRoute set:', !!context.currentRoute);

            // Get cursor position context
            const position = editor.selection.active;
            context.selectedComponent = getComponentAtPosition(content, position);

        } catch (error) {
            console.error('Failed to parse YAML:', error);
        }
    }

    // Get project metadata
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const metadata = await getProjectMetadata(workspaceFolder.uri.fsPath);
        context.camelVersion = metadata.camelVersion;
        context.availableComponents = await getAvailableComponents(workspaceFolder.uri.fsPath);
    }

    return context;
}

/**
 * Get component/element at a specific position in the document
 */
function getComponentAtPosition(content: string, position: vscode.Position): any {
    const lines = content.split('\n');
    const currentLine = lines[position.line];
    
    // Simple heuristic: look for "- <component>:" pattern
    const match = currentLine.match(/^\s*-\s*(\w+):/);
    if (match) {
        return { name: match[1], line: position.line };
    }

    return null;
}

/**
 * Get project metadata (runtime, version, etc.)
 */
export async function getProjectMetadata(workspacePath: string): Promise<ProjectMetadata> {
    const metadata: ProjectMetadata = {
        name: workspacePath.split('/').pop() || 'Unknown',
        runtime: 'camel-main',
        camelVersion: '4.14.2',
        dependencies: [],
    };

    // Check for pom.xml (Maven)
    const pomPath = vscode.Uri.file(`${workspacePath}/pom.xml`);
    try {
        const pomContent = await vscode.workspace.fs.readFile(pomPath);
        const pomText = new TextDecoder().decode(pomContent);
        
        // Detect runtime
        if (pomText.includes('quarkus')) {
            metadata.runtime = 'quarkus';
        } else if (pomText.includes('spring-boot')) {
            metadata.runtime = 'spring-boot';
        }

        // Extract Camel version
        const versionMatch = pomText.match(/<camel\.version>(.*?)<\/camel\.version>/);
        if (versionMatch) {
            metadata.camelVersion = versionMatch[1];
        }

        // Extract dependencies
        const depMatches = pomText.matchAll(/<artifactId>(camel-.*?)<\/artifactId>/g);
        for (const match of depMatches) {
            metadata.dependencies.push(match[1]);
        }
    } catch (error) {
        // pom.xml not found, use defaults
    }

    // Check for application.properties
    const propsPath = vscode.Uri.file(`${workspacePath}/application.properties`);
    try {
        const propsContent = await vscode.workspace.fs.readFile(propsPath);
        const propsText = new TextDecoder().decode(propsContent);
        
        const versionMatch = propsText.match(/camel\.version\s*=\s*(.+)/);
        if (versionMatch) {
            metadata.camelVersion = versionMatch[1].trim();
        }
    } catch (error) {
        // application.properties not found
    }

    return metadata;
}

/**
 * Get list of available Camel components
 */
async function getAvailableComponents(workspacePath: string): Promise<string[]> {
    // This could be enhanced to read from Camel catalog or dependencies
    // For now, return common components
    return [
        'direct',
        'rest',
        'timer',
        'log',
        'file',
        'kafka',
        'http',
        'jms',
        'sql',
        'bean',
        'choice',
        'split',
        'aggregate',
        'enrich',
        'filter',
        'transform',
        'setHeader',
        'setProperty',
        'removeHeader',
        'process',
    ];
}

/**
 * Extract diagnostics/errors for current file
 */
export function getCurrentDiagnostics(): vscode.Diagnostic[] {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return [];
    }

    return vscode.languages.getDiagnostics(editor.document.uri);
}

/**
 * Build a prompt context string for AI
 */
export function buildPromptContext(context: RouteContext, diagnostics: vscode.Diagnostic[]): string {
    const parts: string[] = [];

    if (context.fileName) {
        parts.push(`File: ${context.fileName}`);
    }

    if (context.camelVersion) {
        parts.push(`Camel Version: ${context.camelVersion}`);
    }

    if (context.currentRoute) {
        parts.push(`Current Route:\n\`\`\`yaml\n${yaml.dump(context.currentRoute)}\n\`\`\``);
    }

    if (context.selectedComponent) {
        parts.push(`Selected Component: ${context.selectedComponent.name}`);
    }

    if (diagnostics.length > 0) {
        const errors = diagnostics.map(d => `- Line ${d.range.start.line + 1}: ${d.message}`).join('\n');
        parts.push(`Errors:\n${errors}`);
    }

    if (context.availableComponents && context.availableComponents.length > 0) {
        parts.push(`Available Components: ${context.availableComponents.slice(0, 20).join(', ')}`);
    }

    return parts.join('\n\n');
}
