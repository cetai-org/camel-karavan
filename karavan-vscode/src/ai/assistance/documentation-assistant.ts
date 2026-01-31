/**
 * Documentation Assistant for Apache Camel
 * Provides inline documentation, explanations, and links to official docs
 */

import * as vscode from 'vscode';
import { COMMON_COMPONENTS, EIP_PATTERNS, DATA_FORMATS, CamelComponent, EIPPattern } from '../knowledge/camel-metadata';

export interface DocumentationEntry {
    title: string;
    summary: string;
    description: string;
    syntax?: string;
    parameters?: ParameterDoc[];
    examples?: string[];
    links?: DocLink[];
    relatedPatterns?: string[];
    bestPractices?: string[];
}

export interface ParameterDoc {
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string;
    allowedValues?: string[];
}

export interface DocLink {
    title: string;
    url: string;
}

/**
 * Documentation assistant class
 */
export class DocumentationAssistant {
    private static readonly CAMEL_DOCS_BASE = 'https://camel.apache.org/components/latest';
    private static readonly CAMEL_EIP_BASE = 'https://camel.apache.org/components/latest/eips';

    /**
     * Get documentation for a component
     */
    getComponentDocumentation(componentName: string): DocumentationEntry | undefined {
        const component = COMMON_COMPONENTS.find(c => c.name.toLowerCase() === componentName.toLowerCase());
        
        if (!component) {
            return undefined;
        }

        return {
            title: `${component.name} Component`,
            summary: component.description,
            description: this.getComponentDescription(component),
            syntax: component.syntax,
            parameters: this.getComponentParameters(component),
            examples: this.getComponentExamples(component),
            links: this.getComponentLinks(component),
            relatedPatterns: this.getRelatedPatterns(component),
            bestPractices: this.getComponentBestPractices(component),
        };
    }

    /**
     * Get documentation for an EIP pattern
     */
    getEIPDocumentation(patternName: string): DocumentationEntry | undefined {
        const pattern = EIP_PATTERNS.find(p => 
            p.name.toLowerCase() === patternName.toLowerCase() ||
            p.name.toLowerCase().replace(/-/g, '') === patternName.toLowerCase()
        );
        
        if (!pattern) {
            return undefined;
        }

        return {
            title: `${this.formatPatternName(pattern.name)} Pattern`,
            summary: pattern.description,
            description: this.getEIPDescription(pattern),
            syntax: pattern.yamlStructure,
            parameters: this.getEIPParameters(pattern),
            examples: [pattern.yamlStructure],
            links: this.getEIPLinks(pattern),
            bestPractices: this.getEIPBestPractices(pattern),
        };
    }

    /**
     * Get documentation for Simple language expression
     */
    getExpressionDocumentation(expressionType: string): DocumentationEntry | undefined {
        const expressionDocs: { [key: string]: DocumentationEntry } = {
            'header': {
                title: 'Header Expression',
                summary: 'Access message headers in Camel routes',
                description: 'Headers are key-value pairs attached to messages. Use ${header.name} or ${headers.name} to access them.',
                syntax: '${header.headerName}',
                examples: [
                    '${header.contentType}',
                    '${header.CamelFileName}',
                    '${headers.Authorization}',
                ],
                links: [
                    { title: 'Simple Language', url: 'https://camel.apache.org/components/latest/languages/simple-language.html' }
                ],
                bestPractices: [
                    'Use header names in camelCase or kebab-case',
                    'Camel-specific headers start with "Camel"',
                    'Check for null before comparing: ${header.type} != null',
                ],
            },
            'body': {
                title: 'Body Expression',
                summary: 'Access and manipulate message body',
                description: 'The body is the main payload of the message. Use ${body} to access it and various functions to manipulate.',
                syntax: '${body}',
                examples: [
                    '${body}',
                    '${bodyAs(String)}',
                    '${body.length()}',
                    '${body.contains("text")}',
                ],
                links: [
                    { title: 'Simple Language', url: 'https://camel.apache.org/components/latest/languages/simple-language.html' }
                ],
                bestPractices: [
                    'Use bodyAs() to convert body type when needed',
                    'Check body type before calling methods',
                    'Use OGNL for complex object navigation',
                ],
            },
            'property': {
                title: 'Exchange Property Expression',
                summary: 'Access exchange properties that persist across routes',
                description: 'Exchange properties are stored on the Exchange and persist across route invocations, unlike headers.',
                syntax: '${exchangeProperty.propertyName}',
                examples: [
                    '${exchangeProperty.customerId}',
                    '${exchangeProperty.retryCount}',
                ],
                links: [
                    { title: 'Exchange Properties', url: 'https://camel.apache.org/manual/exchange.html' }
                ],
                bestPractices: [
                    'Use properties for data that needs to persist across routes',
                    'Use headers for data that should travel with the message',
                    'Clean up properties when no longer needed',
                ],
            },
        };

        return expressionDocs[expressionType.toLowerCase()];
    }

    /**
     * Get hover documentation for a position in the document
     */
    getHoverDocumentation(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.Hover | undefined {
        const line = document.lineAt(position.line).text;
        const wordRange = document.getWordRangeAtPosition(position);
        const word = wordRange ? document.getText(wordRange) : '';

        // Check for component
        const componentMatch = line.match(/(?:uri:|to:|from:)\s*([a-z]+):/i);
        if (componentMatch) {
            const doc = this.getComponentDocumentation(componentMatch[1]);
            if (doc) {
                return new vscode.Hover(this.formatDocumentation(doc));
            }
        }

        // Check for EIP
        const eipMatch = line.match(/^\s*-\s*(\w+):/);
        if (eipMatch) {
            const doc = this.getEIPDocumentation(eipMatch[1]);
            if (doc) {
                return new vscode.Hover(this.formatDocumentation(doc));
            }
        }

        // Check for expression
        const exprMatch = line.match(/\$\{(header|body|exchangeProperty)/i);
        if (exprMatch) {
            const doc = this.getExpressionDocumentation(exprMatch[1]);
            if (doc) {
                return new vscode.Hover(this.formatDocumentation(doc));
            }
        }

        return undefined;
    }

    /**
     * Format documentation for display
     */
    private formatDocumentation(doc: DocumentationEntry): vscode.MarkdownString {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.supportHtml = true;

        // Title and summary
        md.appendMarkdown(`## ${doc.title}\n\n`);
        md.appendMarkdown(`${doc.summary}\n\n`);

        // Syntax
        if (doc.syntax) {
            md.appendMarkdown(`**Syntax:**\n\`\`\`yaml\n${doc.syntax}\n\`\`\`\n\n`);
        }

        // Parameters
        if (doc.parameters && doc.parameters.length > 0) {
            md.appendMarkdown(`**Parameters:**\n\n`);
            for (const param of doc.parameters.slice(0, 5)) {
                const required = param.required ? '*(required)*' : '';
                md.appendMarkdown(`- \`${param.name}\` ${required}: ${param.description}\n`);
            }
            md.appendMarkdown('\n');
        }

        // Examples
        if (doc.examples && doc.examples.length > 0) {
            md.appendMarkdown(`**Example:**\n\`\`\`yaml\n${doc.examples[0]}\n\`\`\`\n\n`);
        }

        // Best practices
        if (doc.bestPractices && doc.bestPractices.length > 0) {
            md.appendMarkdown(`**Best Practices:**\n`);
            for (const practice of doc.bestPractices.slice(0, 3)) {
                md.appendMarkdown(`- ${practice}\n`);
            }
            md.appendMarkdown('\n');
        }

        // Links
        if (doc.links && doc.links.length > 0) {
            md.appendMarkdown(`**Documentation:**\n`);
            for (const link of doc.links) {
                md.appendMarkdown(`- [${link.title}](${link.url})\n`);
            }
        }

        return md;
    }

    /**
     * Get detailed component description
     */
    private getComponentDescription(component: CamelComponent): string {
        const descriptions: { [key: string]: string } = {
            'rest': 'The REST component allows you to define REST endpoints using the REST DSL. It supports various HTTP methods (GET, POST, PUT, DELETE) and can integrate with OpenAPI specifications.',
            'kafka': 'Apache Kafka component enables consuming and producing messages from Kafka topics. It supports batch processing, transactions, and exactly-once semantics.',
            'timer': 'The Timer component generates message exchanges at specified intervals. Useful for scheduling periodic tasks, polling, or triggering batch jobs.',
            'file': 'The File component provides access to file systems. It can consume files from directories, produce files, and supports various file operations like move, delete, and rename.',
            'direct': 'The Direct component provides synchronous in-VM invocation of routes. It allows decomposing routes into smaller, reusable parts.',
            'seda': 'The SEDA component provides asynchronous in-VM invocation with a SEDA queue. Useful for decoupling and parallel processing.',
            'http': 'The HTTP component is an HTTP client for calling external REST APIs. It supports all HTTP methods, headers, and authentication.',
            'sql': 'The SQL component allows executing SQL queries against databases. It supports select, insert, update, delete operations and stored procedures.',
            'jms': 'The JMS component provides messaging capabilities using Java Message Service. It supports queues, topics, and various JMS providers.',
        };

        return descriptions[component.name] || component.description;
    }

    /**
     * Get component parameters documentation
     */
    private getComponentParameters(component: CamelComponent): ParameterDoc[] {
        const params: ParameterDoc[] = [];
        
        if (component.commonProperties) {
            for (const [name, desc] of Object.entries(component.commonProperties)) {
                params.push({
                    name,
                    type: 'string',
                    required: false,
                    description: desc,
                });
            }
        }

        return params;
    }

    /**
     * Get component examples
     */
    private getComponentExamples(component: CamelComponent): string[] {
        return component.examples || [];
    }

    /**
     * Get component documentation links
     */
    private getComponentLinks(component: CamelComponent): DocLink[] {
        return [
            {
                title: `${component.name} Component Reference`,
                url: `${DocumentationAssistant.CAMEL_DOCS_BASE}/${component.name}-component.html`,
            },
        ];
    }

    /**
     * Get related EIP patterns for a component
     */
    private getRelatedPatterns(component: CamelComponent): string[] {
        const patterns: string[] = [];
        
        // Suggest patterns based on component type
        if (component.name === 'rest') {
            patterns.push('content-based-router', 'message-filter');
        } else if (component.name === 'kafka' || component.name === 'jms') {
            patterns.push('splitter', 'aggregator', 'retry');
        } else if (component.name === 'file') {
            patterns.push('splitter', 'enricher');
        }

        return patterns;
    }

    /**
     * Get best practices for a component
     */
    private getComponentBestPractices(component: CamelComponent): string[] {
        const practices: { [key: string]: string[] } = {
            'rest': [
                'Use proper HTTP methods (GET for reads, POST for creates)',
                'Define content types (consumes/produces)',
                'Implement proper error handling with onException',
            ],
            'kafka': [
                'Configure appropriate batch size for performance',
                'Use idempotent consumers for exactly-once processing',
                'Set proper acknowledgment mode',
            ],
            'timer': [
                'Use fixedRate for consistent scheduling',
                'Set appropriate initial delay',
                'Consider using Quartz for complex scheduling',
            ],
            'file': [
                'Use move/moveFailed for processed files',
                'Set appropriate readLock strategy',
                'Consider using noop for read-only access',
            ],
        };

        return practices[component.name] || [];
    }

    /**
     * Format pattern name for display
     */
    private formatPatternName(name: string): string {
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Get EIP detailed description
     */
    private getEIPDescription(pattern: EIPPattern): string {
        const descriptions: { [key: string]: string } = {
            'content-based-router': 'Routes messages to different destinations based on message content. Use the Choice EIP with When conditions to implement content-based routing.',
            'message-filter': 'Filters messages based on a predicate. Only messages that match the filter condition will continue through the route.',
            'splitter': 'Splits a message into multiple parts and processes each part independently. Commonly used for batch processing of arrays or collections.',
            'aggregator': 'Combines multiple messages into a single message. Requires a correlation expression and completion condition.',
            'enricher': 'Adds additional data to a message by calling an external resource and merging the response.',
            'wire-tap': 'Sends a copy of the message to another endpoint without affecting the main route. Useful for logging, auditing, or monitoring.',
            'multicast': 'Sends the same message to multiple endpoints in parallel or sequentially.',
            'recipient-list': 'Dynamically routes messages to a list of endpoints determined at runtime.',
            'retry': 'Automatically retries failed operations with configurable delays and maximum attempts.',
        };

        return descriptions[pattern.name] || pattern.description;
    }

    /**
     * Get EIP parameters documentation
     */
    private getEIPParameters(pattern: EIPPattern): ParameterDoc[] {
        const params: ParameterDoc[] = [];
        
        if (pattern.commonProperties) {
            for (const [name, desc] of Object.entries(pattern.commonProperties)) {
                params.push({
                    name,
                    type: 'string',
                    required: false,
                    description: desc,
                });
            }
        }

        return params;
    }

    /**
     * Get EIP documentation links
     */
    private getEIPLinks(pattern: EIPPattern): DocLink[] {
        const urlName = pattern.name.replace(/-/g, '');
        return [
            {
                title: `${this.formatPatternName(pattern.name)} EIP`,
                url: `${DocumentationAssistant.CAMEL_EIP_BASE}/${urlName}-eip.html`,
            },
        ];
    }

    /**
     * Get best practices for an EIP
     */
    private getEIPBestPractices(pattern: EIPPattern): string[] {
        const practices: { [key: string]: string[] } = {
            'content-based-router': [
                'Order when clauses from most specific to least specific',
                'Always include an otherwise clause for unexpected cases',
                'Keep routing logic simple and readable',
            ],
            'splitter': [
                'Consider using streaming for large datasets',
                'Use parallelProcessing with care (thread safety)',
                'Handle aggregation of results if needed',
            ],
            'aggregator': [
                'Define clear completion conditions',
                'Implement proper aggregation strategy',
                'Consider timeout for incomplete aggregations',
            ],
            'retry': [
                'Use exponential backoff for retries',
                'Set maximum retry limit to prevent infinite loops',
                'Log retry attempts for debugging',
            ],
        };

        return practices[pattern.name] || [];
    }

    /**
     * Explain an error message to the user
     */
    explainError(errorMessage: string): string {
        const explanations: { [key: RegExp | string]: string } = {
            'missing.*steps': 'Every route needs a "steps" section that defines the processing pipeline. Steps are executed in order.',
            'missing.*uri': 'The "from" section requires a "uri" property that specifies where messages come from (e.g., timer:tick, file:inbox).',
            'unknown.*step': 'This step type is not recognized. Common steps include: log, to, setHeader, setBody, choice, split, filter.',
            'tabs.*spaces': 'YAML requires consistent indentation. Use spaces (usually 2) instead of tabs for proper formatting.',
            'invalid.*yaml': 'The YAML syntax is invalid. Check for proper indentation, colons after keys, and quote strings with special characters.',
        };

        for (const [pattern, explanation] of Object.entries(explanations)) {
            if (typeof pattern === 'string') {
                const regex = new RegExp(pattern, 'i');
                if (regex.test(errorMessage)) {
                    return explanation;
                }
            }
        }

        return 'This error indicates an issue with your Camel route configuration. Check the YAML syntax and ensure all required properties are present.';
    }
}

// Singleton instance
let documentationAssistantInstance: DocumentationAssistant | undefined;

export function getDocumentationAssistant(): DocumentationAssistant {
    if (!documentationAssistantInstance) {
        documentationAssistantInstance = new DocumentationAssistant();
    }
    return documentationAssistantInstance;
}
