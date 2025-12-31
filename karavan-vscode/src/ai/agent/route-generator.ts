/**
 * Natural language route generation for Apache Camel
 * Parses user intents and generates YAML route definitions
 */

import * as vscode from 'vscode';
import { COMMON_COMPONENTS, EIP_PATTERNS, INTENT_KEYWORDS, ROUTE_TEMPLATES, getComponentSuggestions, getEIPSuggestions } from '../knowledge/camel-metadata';

export interface RouteGenerationRequest {
    prompt: string;
    context?: {
        existingRoutes?: string[];
        availableComponents?: string[];
        runtime?: 'camel-main' | 'quarkus' | 'spring-boot';
        camelVersion?: string;
    };
}

export interface RouteGenerationResult {
    yaml: string;
    explanation: string;
    components: string[];
    patterns: string[];
    warnings?: string[];
}

export interface Intent {
    type: 'rest-api' | 'messaging' | 'file-processing' | 'scheduled' | 'transformation' | 'routing' | 'custom';
    source?: string;
    destination?: string;
    transformation?: string;
    eipPatterns?: string[];
    components?: string[];
}

/**
 * Route generator using AI and metadata
 */
export class RouteGenerator {
    /**
     * Parse natural language into structured intent
     */
    parseIntent(prompt: string): Intent {
        const promptLower = prompt.toLowerCase();
        
        // Detect REST API intent
        if (INTENT_KEYWORDS.rest.some(kw => promptLower.includes(kw))) {
            return {
                type: 'rest-api',
                source: 'rest',
                destination: this.detectDestination(promptLower),
                components: ['rest'],
            };
        }
        
        // Detect messaging intent
        if (INTENT_KEYWORDS.kafka.some(kw => promptLower.includes(kw))) {
            return {
                type: 'messaging',
                source: this.detectSource(promptLower),
                destination: 'kafka',
                components: ['kafka'],
            };
        }
        
        // Detect scheduled/timer intent
        if (INTENT_KEYWORDS.timer.some(kw => promptLower.includes(kw))) {
            return {
                type: 'scheduled',
                source: 'timer',
                destination: this.detectDestination(promptLower),
                components: ['timer'],
            };
        }
        
        // Detect file processing intent
        if (INTENT_KEYWORDS.file.some(kw => promptLower.includes(kw))) {
            return {
                type: 'file-processing',
                source: 'file',
                destination: this.detectDestination(promptLower),
                components: ['file'],
            };
        }
        
        // Detect transformation intent
        if (INTENT_KEYWORDS.transformation.some(kw => promptLower.includes(kw))) {
            return {
                type: 'transformation',
                transformation: this.detectTransformation(promptLower),
            };
        }
        
        // Detect routing patterns
        if (INTENT_KEYWORDS.routing.some(kw => promptLower.includes(kw))) {
            const eipPatterns = this.detectEIPPatterns(promptLower);
            return {
                type: 'routing',
                eipPatterns,
            };
        }
        
        // Default to custom
        return {
            type: 'custom',
            source: this.detectSource(promptLower),
            destination: this.detectDestination(promptLower),
        };
    }
    
    /**
     * Detect source endpoint from prompt
     */
    private detectSource(prompt: string): string | undefined {
        if (prompt.includes('rest') || prompt.includes('api')) return 'rest';
        if (prompt.includes('timer') || prompt.includes('schedule')) return 'timer';
        if (prompt.includes('file') || prompt.includes('folder')) return 'file';
        if (prompt.includes('kafka')) return 'kafka';
        if (prompt.includes('jms')) return 'jms';
        if (prompt.includes('direct')) return 'direct';
        return undefined;
    }
    
    /**
     * Detect destination endpoint from prompt
     */
    private detectDestination(prompt: string): string | undefined {
        if (prompt.includes('kafka')) return 'kafka';
        if (prompt.includes('database') || prompt.includes('sql')) return 'sql';
        if (prompt.includes('file')) return 'file';
        if (prompt.includes('http') || prompt.includes('rest client')) return 'http';
        if (prompt.includes('jms')) return 'jms';
        if (prompt.includes('log')) return 'log';
        return undefined;
    }
    
    /**
     * Detect transformation requirements
     */
    private detectTransformation(prompt: string): string | undefined {
        if (prompt.includes('json')) return 'json';
        if (prompt.includes('xml')) return 'xml';
        if (prompt.includes('csv')) return 'csv';
        if (prompt.includes('yaml')) return 'yaml';
        return undefined;
    }
    
    /**
     * Detect EIP patterns from prompt
     */
    private detectEIPPatterns(prompt: string): string[] {
        const patterns: string[] = [];
        
        if (prompt.includes('split') || prompt.includes('batch')) {
            patterns.push('splitter');
        }
        if (prompt.includes('aggregate') || prompt.includes('combine')) {
            patterns.push('aggregator');
        }
        if (prompt.includes('choice') || prompt.includes('conditional') || prompt.includes('if')) {
            patterns.push('content-based-router');
        }
        if (prompt.includes('filter')) {
            patterns.push('message-filter');
        }
        if (prompt.includes('enrich') || prompt.includes('lookup')) {
            patterns.push('enricher');
        }
        if (prompt.includes('multicast') || prompt.includes('parallel')) {
            patterns.push('multicast');
        }
        if (prompt.includes('retry') || prompt.includes('error')) {
            patterns.push('retry');
        }
        
        return patterns;
    }
    
    /**
     * Generate route YAML from intent
     */
    generateFromIntent(intent: Intent): string {
        switch (intent.type) {
            case 'rest-api':
                return this.generateRestRoute(intent);
            case 'messaging':
                return this.generateMessagingRoute(intent);
            case 'scheduled':
                return this.generateScheduledRoute(intent);
            case 'file-processing':
                return this.generateFileRoute(intent);
            default:
                return this.generateGenericRoute(intent);
        }
    }
    
    /**
     * Generate REST API route
     */
    private generateRestRoute(intent: Intent): string {
        const destination = intent.destination || 'direct:process';
        return `- rest:
    path: /api/resource
    get:
      - to: ${destination}:get
    post:
      consumes: application/json
      produces: application/json
      - to: ${destination}:post`;
    }
    
    /**
     * Generate messaging route
     */
    private generateMessagingRoute(intent: Intent): string {
        const source = intent.source || 'direct:start';
        return `- from:
    uri: ${source}
    steps:
      - marshal:
          json: {}
      - to: kafka:my-topic
        parameters:
          brokers: localhost:9092`;
    }
    
    /**
     * Generate scheduled route
     */
    private generateScheduledRoute(intent: Intent): string {
        const destination = intent.destination || 'log:info';
        return `- from:
    uri: timer:scheduler
    parameters:
      period: 60000
    steps:
      - setBody:
          constant: "Scheduled task executed"
      - to: ${destination}`;
    }
    
    /**
     * Generate file processing route
     */
    private generateFileRoute(intent: Intent): string {
        const destination = intent.destination || 'direct:processFile';
        return `- from:
    uri: file:inbox
    parameters:
      move: processed
      moveFailed: error
    steps:
      - log: "Processing file: \${header.CamelFileName}"
      - to: ${destination}`;
    }
    
    /**
     * Generate generic route with EIP patterns
     */
    private generateGenericRoute(intent: Intent): string {
        let yaml = `- from:
    uri: ${intent.source || 'direct:start'}
    steps:`;
        
        // Add EIP patterns if detected
        if (intent.eipPatterns && intent.eipPatterns.length > 0) {
            for (const patternName of intent.eipPatterns) {
                const pattern = EIP_PATTERNS.find(p => p.name === patternName);
                if (pattern) {
                    yaml += `\n      ${pattern.yamlStructure.split('\n').join('\n      ')}`;
                }
            }
        } else {
            yaml += `\n      - log: "Processing message"`;
        }
        
        // Add destination
        if (intent.destination) {
            yaml += `\n      - to: ${intent.destination}`;
        }
        
        return yaml;
    }
    
    /**
     * Build AI prompt for route generation
     */
    buildPrompt(request: RouteGenerationRequest): string {
        const { prompt, context } = request;
        
        let systemPrompt = `You are an expert Apache Camel developer. Generate a Camel YAML route based on the user's request.

IMPORTANT GUIDELINES:
1. Generate ONLY valid Camel YAML route definition
2. Use proper YAML syntax with correct indentation
3. Include helpful comments for complex patterns
4. Use appropriate Camel components and EIP patterns
5. Follow Camel best practices
6. Return ONLY the YAML route, no explanations before or after

`;
        
        if (context?.runtime) {
            systemPrompt += `Runtime: ${context.runtime}\n`;
        }
        if (context?.camelVersion) {
            systemPrompt += `Camel Version: ${context.camelVersion}\n`;
        }
        
        systemPrompt += `\nAvailable components: rest, kafka, timer, file, direct, seda, http, sql, jms, log, bean, transform, marshal, unmarshal, choice, split, aggregate, enrich, wireTap, multicast

User Request: ${prompt}

Generate the Camel YAML route:`;
        
        return systemPrompt;
    }
    
    /**
     * Validate generated YAML
     */
    validateYAML(yaml: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        // Basic validation
        if (!yaml || yaml.trim().length === 0) {
            errors.push('Generated YAML is empty');
            return { valid: false, errors };
        }
        
        // Check for YAML structure
        if (!yaml.includes('- from:') && !yaml.includes('- rest:')) {
            errors.push('YAML must contain a route definition (- from: or - rest:)');
        }
        
        // Check indentation (should use spaces, not tabs)
        if (yaml.includes('\t')) {
            errors.push('YAML uses tabs instead of spaces');
        }
        
        // Check for common mistakes
        if (yaml.includes('uri:') && !yaml.includes('steps:')) {
            errors.push('Route is missing steps definition');
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    /**
     * Extract components used in route
     */
    extractComponents(yaml: string): string[] {
        const components = new Set<string>();
        const componentRegex = /(?:uri:|to:)\s+([a-z-]+):/g;
        
        let match;
        while ((match = componentRegex.exec(yaml)) !== null) {
            components.add(match[1]);
        }
        
        return Array.from(components);
    }
    
    /**
     * Extract EIP patterns used in route
     */
    extractPatterns(yaml: string): string[] {
        const patterns = new Set<string>();
        
        if (yaml.includes('- choice:')) patterns.add('content-based-router');
        if (yaml.includes('- split:')) patterns.add('splitter');
        if (yaml.includes('- aggregate:')) patterns.add('aggregator');
        if (yaml.includes('- filter:')) patterns.add('message-filter');
        if (yaml.includes('- enrich:')) patterns.add('enricher');
        if (yaml.includes('- wireTap:')) patterns.add('wire-tap');
        if (yaml.includes('- multicast:')) patterns.add('multicast');
        if (yaml.includes('- onException:')) patterns.add('retry');
        
        return Array.from(patterns);
    }
}

/**
 * Get singleton instance
 */
let routeGeneratorInstance: RouteGenerator | undefined;

export function getRouteGenerator(): RouteGenerator {
    if (!routeGeneratorInstance) {
        routeGeneratorInstance = new RouteGenerator();
    }
    return routeGeneratorInstance;
}
