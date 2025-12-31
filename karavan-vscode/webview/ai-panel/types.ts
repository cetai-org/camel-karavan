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

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    isStreaming?: boolean;
    error?: string;
}

export interface RouteContext {
    currentFile?: string;
    currentRoute?: any;
    selectedComponent?: any;
    camelVersion?: string;
    availableComponents?: string[];
    fileName?: string;
    isYaml?: boolean;
}

export interface ProjectMetadata {
    name: string;
    runtime: 'camel-main' | 'quarkus' | 'spring-boot';
    camelVersion: string;
    dependencies: string[];
}

export type AIMachineState = 
    | 'Initialize'
    | 'Unauthenticated'
    | 'Authenticating'
    | 'Authenticated'
    | 'Disabled';

export interface AIMachineStateSnapshot {
    state: AIMachineState | { Authenticating: string };
    context: {
        loginMethod?: 'github-copilot' | 'openai' | 'local-llm';
        userToken?: {
            accessToken: string;
            refreshToken?: string;
            expiresAt?: number;
        };
        errorMessage?: string;
    };
}

export interface RPCMessage {
    command: string;
    data?: any;
}

export interface AIBackendConfig {
    backend: 'openai' | 'github-copilot' | 'local-llm' | 'azure-openai' | 'aws-bedrock';
    model?: string;
    endpoint?: string;
}
