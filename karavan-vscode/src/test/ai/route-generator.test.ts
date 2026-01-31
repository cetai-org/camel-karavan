/**
 * Unit Tests for Route Generator
 * Tests natural language parsing and route generation
 */

import { RouteGenerator, getRouteGenerator, Intent, RouteGenerationRequest } from '../../src/ai/agent/route-generator';

describe('RouteGenerator', () => {
    let generator: RouteGenerator;

    beforeEach(() => {
        generator = getRouteGenerator();
    });

    describe('parseIntent', () => {
        it('should parse REST API intent', () => {
            const intent = generator.parseIntent('Create a REST API endpoint');
            expect(intent.type).toBe('rest-api');
            expect(intent.source).toBe('rest');
        });

        it('should parse REST API with Kafka destination', () => {
            const intent = generator.parseIntent('Create a REST API that sends to Kafka');
            expect(intent.type).toBe('rest-api');
            expect(intent.components).toContain('rest');
        });

        it('should parse Kafka messaging intent', () => {
            const intent = generator.parseIntent('Consume messages from Kafka');
            expect(intent.type).toBe('messaging');
            expect(intent.destination).toBe('kafka');
        });

        it('should parse timer/scheduled intent', () => {
            const intent = generator.parseIntent('Run a scheduled task every minute');
            expect(intent.type).toBe('scheduled');
            expect(intent.source).toBe('timer');
        });

        it('should parse file processing intent', () => {
            const intent = generator.parseIntent('Watch a folder for new files');
            expect(intent.type).toBe('file-processing');
            expect(intent.source).toBe('file');
        });

        it('should parse transformation intent', () => {
            const intent = generator.parseIntent('Convert JSON to XML');
            expect(intent.type).toBe('transformation');
            expect(intent.transformation).toBe('json');
        });

        it('should detect EIP patterns in routing intent', () => {
            const intent = generator.parseIntent('Route based on conditions with choice');
            expect(intent.type).toBe('routing');
            expect(intent.eipPatterns).toContain('content-based-router');
        });

        it('should detect split pattern', () => {
            const intent = generator.parseIntent('Split the batch and process each item');
            expect(intent.eipPatterns).toContain('splitter');
        });

        it('should detect aggregate pattern', () => {
            const intent = generator.parseIntent('Aggregate messages into one');
            expect(intent.eipPatterns).toContain('aggregator');
        });

        it('should detect filter pattern', () => {
            const intent = generator.parseIntent('Filter messages based on priority');
            expect(intent.eipPatterns).toContain('message-filter');
        });

        it('should return custom type for unrecognized intents', () => {
            const intent = generator.parseIntent('Do something unusual');
            expect(intent.type).toBe('custom');
        });
    });

    describe('generateFromIntent', () => {
        it('should generate REST route', () => {
            const intent: Intent = {
                type: 'rest-api',
                source: 'rest',
                destination: 'direct'
            };
            const yaml = generator.generateFromIntent(intent);
            expect(yaml).toContain('rest:');
            expect(yaml).toContain('path:');
        });

        it('should generate messaging route', () => {
            const intent: Intent = {
                type: 'messaging',
                source: 'direct',
                destination: 'kafka'
            };
            const yaml = generator.generateFromIntent(intent);
            expect(yaml).toContain('from:');
            expect(yaml).toContain('kafka:');
        });

        it('should generate scheduled route', () => {
            const intent: Intent = {
                type: 'scheduled',
                source: 'timer',
                destination: 'log'
            };
            const yaml = generator.generateFromIntent(intent);
            expect(yaml).toContain('timer:');
            expect(yaml).toContain('period:');
        });

        it('should generate file processing route', () => {
            const intent: Intent = {
                type: 'file-processing',
                source: 'file',
                destination: 'direct'
            };
            const yaml = generator.generateFromIntent(intent);
            expect(yaml).toContain('file:');
            expect(yaml).toContain('move:');
        });
    });

    describe('validateYAML', () => {
        it('should validate correct YAML', () => {
            const yaml = `- from:
    uri: timer:test
    steps:
      - to: log:info`;
            const result = generator.validateYAML(yaml);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject empty YAML', () => {
            const result = generator.validateYAML('');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Generated YAML is empty');
        });

        it('should reject YAML without route definition', () => {
            const yaml = `key: value`;
            const result = generator.validateYAML(yaml);
            expect(result.valid).toBe(false);
        });

        it('should detect tabs in YAML', () => {
            const yaml = "- from:\n\turi: timer:test";
            const result = generator.validateYAML(yaml);
            expect(result.errors).toContain('YAML uses tabs instead of spaces');
        });
    });

    describe('extractComponents', () => {
        it('should extract components from route', () => {
            const yaml = `- from:
    uri: timer:test
    steps:
      - to: kafka:my-topic
      - to: log:info`;
            const components = generator.extractComponents(yaml);
            expect(components).toContain('timer');
            expect(components).toContain('kafka');
            expect(components).toContain('log');
        });

        it('should return unique components', () => {
            const yaml = `- from:
    uri: kafka:input
    steps:
      - to: kafka:output`;
            const components = generator.extractComponents(yaml);
            const kafkaCount = components.filter(c => c === 'kafka').length;
            expect(kafkaCount).toBe(1);
        });
    });

    describe('extractPatterns', () => {
        it('should extract choice pattern', () => {
            const yaml = `- from:
    uri: direct:start
    steps:
      - choice:
          when:
            - simple: "\${header.type} == 'A'"`;
            const patterns = generator.extractPatterns(yaml);
            expect(patterns).toContain('content-based-router');
        });

        it('should extract split pattern', () => {
            const yaml = `- from:
    uri: direct:start
    steps:
      - split:
          simple: "\${body}"`;
            const patterns = generator.extractPatterns(yaml);
            expect(patterns).toContain('splitter');
        });

        it('should extract multiple patterns', () => {
            const yaml = `- from:
    uri: direct:start
    steps:
      - split:
          simple: "\${body}"
      - filter:
          simple: "\${body} > 0"`;
            const patterns = generator.extractPatterns(yaml);
            expect(patterns).toContain('splitter');
            expect(patterns).toContain('message-filter');
        });
    });

    describe('buildPrompt', () => {
        it('should include user prompt', () => {
            const request: RouteGenerationRequest = {
                prompt: 'Create a REST API'
            };
            const prompt = generator.buildPrompt(request);
            expect(prompt).toContain('Create a REST API');
        });

        it('should include runtime context', () => {
            const request: RouteGenerationRequest = {
                prompt: 'Create a route',
                context: {
                    runtime: 'quarkus',
                    camelVersion: '4.0.0'
                }
            };
            const prompt = generator.buildPrompt(request);
            expect(prompt).toContain('quarkus');
            expect(prompt).toContain('4.0.0');
        });

        it('should include guidelines', () => {
            const request: RouteGenerationRequest = {
                prompt: 'Create a route'
            };
            const prompt = generator.buildPrompt(request);
            expect(prompt).toContain('YAML');
            expect(prompt).toContain('Camel');
        });
    });
});
