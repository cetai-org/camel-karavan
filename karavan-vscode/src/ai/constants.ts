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

/**
 * AI Constants
 */

export const AI_COMMANDS = {
    OPEN_PANEL: 'karavan.ai.openPanel',
    CLOSE_PANEL: 'karavan.ai.closePanel',
    GENERATE_ROUTE: 'karavan.ai.generateRoute',
    SUGGEST_COMPONENT: 'karavan.ai.suggestComponent',
} as const;

export const AI_CONFIG_KEYS = {
    ENABLED: 'karavan.ai.enabled',
    BACKEND: 'karavan.ai.backend',
    MODEL: 'karavan.ai.model',
    OPENAI_API_KEY: 'karavan.ai.openaiApiKey',
    LOCAL_LLM_ENDPOINT: 'karavan.ai.localLlmEndpoint',
} as const;
