/**
 * Unit Tests for Mapping Suggester
 * Tests prompt construction and response parsing for the C2 Smart Data Mapper.
 */

import { MappingSuggester, getMappingSuggester, resetMappingSuggester, MappingRequest } from '../../src/ai/agent/mapping-suggester';
import { AIBackend } from '../../src/ai/backends/base';

describe('MappingSuggester', () => {
    let suggester: MappingSuggester;

    beforeEach(() => {
        resetMappingSuggester();
        suggester = getMappingSuggester();
    });

    const sampleRequest: MappingRequest = {
        sourceSchemaName: 'OrderCreateRQ.json',
        sourceSchemaContent: '{"order": {"passenger": {"firstName": "string", "lastName": "string"}}}',
        targetSchemaName: 'CreatePnrRQ.java',
        targetSchemaContent: 'public class CreatePnrRQ { String paxFirstName; String paxLastName; }',
        mappingType: 'mapstruct',
    };

    describe('buildPrompt', () => {
        it('should include source and target schema names', () => {
            const prompt = suggester.buildPrompt(sampleRequest);
            expect(prompt).toContain('OrderCreateRQ.json');
            expect(prompt).toContain('CreatePnrRQ.java');
        });

        it('should request MapStruct output by default', () => {
            const prompt = suggester.buildPrompt({ ...sampleRequest, mappingType: undefined });
            expect(prompt).toContain('MapStruct Java interface');
        });

        it('should request AtlasMap output when configured', () => {
            const prompt = suggester.buildPrompt({ ...sampleRequest, mappingType: 'atlasmap' });
            expect(prompt).toContain('AtlasMap ADM XML skeleton');
        });
    });

    describe('parseResponse', () => {
        it('should extract code from a fenced block', () => {
            const raw = 'Maps passenger names.\n```java\n@Mapper\npublic interface OrderMapper { }\n```\nUnmapped fields:\n- middleName';
            const result = suggester.parseResponse(raw);
            expect(result.mappingCode).toContain('@Mapper');
            expect(result.mappingCode).not.toContain('```');
            expect(result.unmappedFields).toContain('middleName');
        });

        it('should return full text when no code block is present', () => {
            const raw = 'No mapping possible';
            const result = suggester.parseResponse(raw);
            expect(result.mappingCode).toBe('No mapping possible');
            expect(result.unmappedFields).toEqual([]);
        });
    });

    describe('suggest', () => {
        it('should stream response through backend and parse result', async () => {
            const fakeBackend: AIBackend = {
                name: 'Fake',
                initialize: jest.fn(),
                isAvailable: jest.fn(),
                async *sendMessage() {
                    yield '```java\ninterface M {}\n```\nUnmapped fields:\n- id';
                },
            };

            const result = await suggester.suggest(sampleRequest, fakeBackend);
            expect(result.mappingCode).toContain('interface M');
            expect(result.unmappedFields).toContain('id');
        });
    });
});
