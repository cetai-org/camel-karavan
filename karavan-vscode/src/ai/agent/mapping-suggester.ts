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

import { AIBackend } from '../backends/base';

export interface MappingRequest {
    sourceSchemaName: string;
    sourceSchemaContent: string;
    targetSchemaName: string;
    targetSchemaContent: string;
    mappingType?: 'mapstruct' | 'atlasmap';
}

export interface MappingSuggestion {
    mappingCode: string;
    explanation: string;
    unmappedFields: string[];
}

/**
 * AI-assisted field mapping suggester for airline retailing schemas.
 * Builds grounded prompts from source/target schema snippets and parses
 * MapStruct or AtlasMap skeletons out of the model response.
 */
export class MappingSuggester {

    buildPrompt(request: MappingRequest): string {
        const type = request.mappingType || 'mapstruct';
        return [
            'You are an integration architect for airline retailing systems.',
            'Suggest field mappings between the following source and target schemas.',
            '',
            `Output format: ${type === 'mapstruct' ? 'a MapStruct Java interface' : 'an AtlasMap ADM XML skeleton'}.`,
            'Include only the skeleton with method/field mappings; do not include explanations inside the code block.',
            'After the code block, list any fields you could not map confidently.',
            '',
            `Source schema "${request.sourceSchemaName}":`,
            '---',
            request.sourceSchemaContent,
            '---',
            '',
            `Target schema "${request.targetSchemaName}":`,
            '---',
            request.targetSchemaContent,
            '---',
            '',
            'Respond in this structure:',
            '1. A short explanation of the mapping approach.',
            '2. The generated code inside a fenced code block.',
            '3. A "Unmapped fields:" line followed by the list.',
        ].join('\n');
    }

    async suggest(request: MappingRequest, backend: AIBackend): Promise<MappingSuggestion> {
        const prompt = this.buildPrompt(request);
        const chunks: string[] = [];
        for await (const chunk of backend.sendMessage(prompt, [], {})) {
            chunks.push(chunk);
        }
        return this.parseResponse(chunks.join(''));
    }

    parseResponse(raw: string): MappingSuggestion {
        const codeBlockMatch = raw.match(/```(?:java|xml|adm)?\s*([\s\S]*?)```/);
        const mappingCode = codeBlockMatch ? codeBlockMatch[1].trim() : raw.trim();

        const explanationMatch = raw.match(/(?:^|\n)([\s\S]*?)(?=```|Unmapped fields:)/i);
        const explanation = explanationMatch
            ? explanationMatch[1].replace(/\n{2,}/g, '\n').trim()
            : '';

        const unmappedMatch = raw.match(/Unmapped fields:([\s\S]*?)(?=\n{2,}|$)/i);
        const unmappedFields = unmappedMatch
            ? unmappedMatch[1]
                .split('\n')
                .map(line => line.replace(/^[-*\s]+/, '').trim())
                .filter(line => line.length > 0)
            : [];

        return { mappingCode, explanation, unmappedFields };
    }
}

let instance: MappingSuggester | undefined;

export function getMappingSuggester(): MappingSuggester {
    if (!instance) {
        instance = new MappingSuggester();
    }
    return instance;
}

export function resetMappingSuggester(): void {
    instance = undefined;
}
