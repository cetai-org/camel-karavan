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
import * as path from 'path';
import * as fs from 'fs';
import { openAIWebview, closeAIWebview, AIStateMachine } from './aiMachine';
import { initializeAuth, promptForApiKey, validateApiKey } from './auth';
import { getAIBackend } from '../../ai/utils/backend';
import { OpenAIBackend } from '../../ai/backends/openai';
import { getMappingSuggester, MappingRequest } from '../../ai/agent/mapping-suggester';

export function activateAiPanel(context: vscode.ExtensionContext): void {
    // Initialize authentication
    initializeAuth(context);

    // Register open AI panel command
    context.subscriptions.push(
        vscode.commands.registerCommand('karavan.ai.openPanel', async (defaultPrompt?: any) => {
            openAIWebview(defaultPrompt);
        })
    );

    // Register close AI panel command
    context.subscriptions.push(
        vscode.commands.registerCommand('karavan.ai.closePanel', () => {
            closeAIWebview();
        })
    );

    // Register generate route command
    context.subscriptions.push(
        vscode.commands.registerCommand('karavan.ai.generateRoute', async () => {
            const prompt = await vscode.window.showInputBox({
                prompt: 'Describe the integration route you want to create',
                placeHolder: 'e.g., REST API that consumes JSON and sends to Kafka',
                ignoreFocusOut: true,
            });

            if (prompt) {
                openAIWebview({
                    type: 'text',
                    text: prompt,
                    command: 'generateRoute',
                });
            }
        })
    );

    // Register suggest component command
    context.subscriptions.push(
        vscode.commands.registerCommand('karavan.ai.suggestComponent', async () => {
            const useCase = await vscode.window.showInputBox({
                prompt: 'Describe what you want to achieve',
                placeHolder: 'e.g., Send data to a database',
                ignoreFocusOut: true,
            });

            if (useCase) {
                openAIWebview({
                    type: 'text',
                    text: `Suggest Camel components for: ${useCase}`,
                    command: 'suggestComponent',
                });
            }
        })
    );

    // Register suggest mapping command (C2 Smart Data Mapper)
    context.subscriptions.push(
        vscode.commands.registerCommand('karavan.ai.suggestMapping', async (uri?: vscode.Uri) => {
            const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!rootPath) {
                vscode.window.showErrorMessage('Karavan mapping suggestions require an open workspace.');
                return;
            }

            const sourceUri = uri || (await pickFile('Select source schema file'));
            if (!sourceUri) {
                return;
            }

            const targetUri = await pickFile('Select target schema file');
            if (!targetUri) {
                return;
            }

            const mappingType = await vscode.window.showQuickPick(
                [
                    { label: 'MapStruct Java interface', value: 'mapstruct' as const },
                    { label: 'AtlasMap ADM skeleton', value: 'atlasmap' as const },
                ],
                { placeHolder: 'Select mapping output format', ignoreFocusOut: true }
            );
            if (!mappingType) {
                return;
            }

            try {
                const sourceContent = fs.readFileSync(sourceUri.fsPath, 'utf-8');
                const targetContent = fs.readFileSync(targetUri.fsPath, 'utf-8');

                const request: MappingRequest = {
                    sourceSchemaName: path.basename(sourceUri.fsPath),
                    sourceSchemaContent: sourceContent,
                    targetSchemaName: path.basename(targetUri.fsPath),
                    targetSchemaContent: targetContent,
                    mappingType: mappingType.value,
                };

                await vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        title: 'Karavan AI is suggesting field mappings...',
                        cancellable: false,
                    },
                    async () => {
                        let backend;
                        let usedPromptKey = false;
                        try {
                            backend = await getAIBackend();
                        } catch (error) {
                            const message = error instanceof Error ? error.message : '';
                            if (message.toLowerCase().includes('api key')) {
                                const apiKey = await promptForApiKey();
                                if (!apiKey) {
                                    vscode.window.showWarningMessage('Mapping suggestion cancelled: API key required.');
                                    return;
                                }
                                try {
                                    await validateApiKey(apiKey);
                                    backend = await getAIBackend();
                                } catch (validateError) {
                                    // If secret-storage auth fails, create backend directly with the prompted key
                                    backend = new OpenAIBackend({ apiKey, model: vscode.workspace.getConfiguration('karavan.ai').get('model', 'gpt-4') });
                                    await backend.initialize();
                                    usedPromptKey = true;
                                }
                            } else {
                                throw error;
                            }
                        }
                        if (usedPromptKey) {
                            vscode.window.showInformationMessage('Using the API key you provided for this session.');
                        }
                        const suggester = getMappingSuggester();
                        const suggestion = await suggester.suggest(request, backend);

                        const baseName = `${path.parse(sourceUri.fsPath).name}-to-${path.parse(targetUri.fsPath).name}`;
                        const ext = mappingType.value === 'mapstruct' ? '.mapping.java' : '.mapping.adm';
                        const outputPath = path.join(rootPath, `${baseName}${ext}`);

                        const header = `// AI-suggested ${mappingType.value} mapping from ${request.sourceSchemaName} to ${request.targetSchemaName}\n`;
                        const explanationBlock = suggestion.explanation
                            ? `// Explanation: ${suggestion.explanation.replace(/\n/g, '\n// ')}\n`
                            : '';
                        const unmappedBlock = suggestion.unmappedFields.length
                            ? `// Unmapped fields: ${suggestion.unmappedFields.join(', ')}\n`
                            : '';

                        fs.writeFileSync(
                            outputPath,
                            `${header}${explanationBlock}${unmappedBlock}\n${suggestion.mappingCode}`,
                            'utf-8'
                        );

                        const doc = await vscode.workspace.openTextDocument(outputPath);
                        await vscode.window.showTextDocument(doc, { preview: false });
                        vscode.window.showInformationMessage(`Mapping suggestion written to ${path.basename(outputPath)}`);
                    }
                );
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Mapping suggestion failed: ${message}`);
            }
        })
    );

    // Subscribe to state machine changes
    AIStateMachine.service().subscribe((state) => {
        console.log('AI State changed to:', state.value);
    });

    // Cleanup on deactivation
    context.subscriptions.push({
        dispose: () => {
            AIStateMachine.dispose();
            closeAIWebview();
        },
    });

    console.log('Karavan AI Panel activated');
}

async function pickFile(title: string): Promise<vscode.Uri | undefined> {
    const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        openLabel: title,
    });
    return uris && uris.length > 0 ? uris[0] : undefined;
}
