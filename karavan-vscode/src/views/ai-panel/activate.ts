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
import { openAIWebview, closeAIWebview, AIStateMachine } from './aiMachine';
import { initializeAuth } from './auth';

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
