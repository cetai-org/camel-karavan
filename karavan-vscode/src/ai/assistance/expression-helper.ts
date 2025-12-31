/**
 * Expression and property assistance utilities
 * Helps with Simple language expressions, transformations, and property suggestions
 */

import * as vscode from 'vscode';
import { DATA_FORMATS } from '../knowledge/camel-metadata';

export interface ExpressionSuggestion {
    expression: string;
    description: string;
    category: 'header' | 'body' | 'property' | 'function' | 'operator';
    example?: string;
}

export interface TransformationSuggestion {
    type: 'marshal' | 'unmarshal' | 'transform' | 'setBody' | 'setHeader';
    dataFormat?: string;
    example: string;
    description: string;
}

export interface PropertySuggestion {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object';
    required: boolean;
    description: string;
    defaultValue?: any;
    examples?: string[];
}

/**
 * Expression helper for Simple language
 */
export class ExpressionHelper {
    /**
     * Get Simple language expression suggestions
     */
    getExpressionSuggestions(context?: string): ExpressionSuggestion[] {
        const suggestions: ExpressionSuggestion[] = [
            // Header expressions
            {
                expression: '${header.name}',
                description: 'Access message header',
                category: 'header',
                example: '${header.contentType}',
            },
            {
                expression: '${headers.name}',
                description: 'Alternative header access',
                category: 'header',
                example: '${headers.userId}',
            },
            
            // Body expressions
            {
                expression: '${body}',
                description: 'Access message body',
                category: 'body',
                example: '${body}',
            },
            {
                expression: '${bodyAs(type)}',
                description: 'Convert body to specific type',
                category: 'body',
                example: '${bodyAs(String)}',
            },
            
            // Property expressions
            {
                expression: '${exchangeProperty.name}',
                description: 'Access exchange property',
                category: 'property',
                example: '${exchangeProperty.customerId}',
            },
            
            // Functions
            {
                expression: '${body.length()}',
                description: 'Get length of body',
                category: 'function',
                example: '${body.length()} > 100',
            },
            {
                expression: '${body.contains(text)}',
                description: 'Check if body contains text',
                category: 'function',
                example: "${body.contains('error')}",
            },
            {
                expression: '${body.startsWith(text)}',
                description: 'Check if body starts with text',
                category: 'function',
                example: "${body.startsWith('<?xml')}",
            },
            {
                expression: '${body.endsWith(text)}',
                description: 'Check if body ends with text',
                category: 'function',
                example: "${body.endsWith('.json')}",
            },
            {
                expression: '${body.replace(old, new)}',
                description: 'Replace text in body',
                category: 'function',
                example: "${body.replace('old', 'new')}",
            },
            {
                expression: '${body.trim()}',
                description: 'Trim whitespace from body',
                category: 'function',
                example: '${body.trim()}',
            },
            {
                expression: '${body.toLowerCase()}',
                description: 'Convert body to lowercase',
                category: 'function',
                example: '${body.toLowerCase()}',
            },
            {
                expression: '${body.toUpperCase()}',
                description: 'Convert body to uppercase',
                category: 'function',
                example: '${body.toUpperCase()}',
            },
            
            // Operators
            {
                expression: '${header.x} == value',
                description: 'Equality comparison',
                category: 'operator',
                example: "${header.type} == 'order'",
            },
            {
                expression: '${header.x} != value',
                description: 'Not equal comparison',
                category: 'operator',
                example: "${header.status} != 'completed'",
            },
            {
                expression: '${header.x} > value',
                description: 'Greater than comparison',
                category: 'operator',
                example: '${header.priority} > 5',
            },
            {
                expression: '${header.x} < value',
                description: 'Less than comparison',
                category: 'operator',
                example: '${header.count} < 100',
            },
            {
                expression: '${header.x} =~ regex',
                description: 'Regex match',
                category: 'operator',
                example: "${header.email} =~ '.+@.+\\..+'",
            },
            {
                expression: '${header.x} in value1,value2',
                description: 'In list check',
                category: 'operator',
                example: "${header.status} in 'pending','processing'",
            },
            {
                expression: '${header.x} && ${header.y}',
                description: 'Logical AND',
                category: 'operator',
                example: '${header.active} && ${header.verified}',
            },
            {
                expression: '${header.x} || ${header.y}',
                description: 'Logical OR',
                category: 'operator',
                example: '${header.premium} || ${header.trial}',
            },
        ];
        
        // Filter by context if provided
        if (context) {
            const contextLower = context.toLowerCase();
            return suggestions.filter(s => 
                s.description.toLowerCase().includes(contextLower) ||
                s.expression.toLowerCase().includes(contextLower) ||
                s.category === context
            );
        }
        
        return suggestions;
    }
    
    /**
     * Get transformation suggestions
     */
    getTransformationSuggestions(sourceFormat?: string, targetFormat?: string): TransformationSuggestion[] {
        const suggestions: TransformationSuggestion[] = [];
        
        // Marshal suggestions
        for (const format of DATA_FORMATS) {
            suggestions.push({
                type: 'marshal',
                dataFormat: format.name,
                description: `Convert to ${format.name.toUpperCase()} format`,
                example: `- marshal:\n    ${format.name}: {}`,
            });
            
            suggestions.push({
                type: 'unmarshal',
                dataFormat: format.name,
                description: `Parse from ${format.name.toUpperCase()} format`,
                example: `- unmarshal:\n    ${format.name}: {}`,
            });
        }
        
        // Common transformations
        suggestions.push({
            type: 'setBody',
            description: 'Set message body to constant value',
            example: `- setBody:\n    constant: "Hello World"`,
        });
        
        suggestions.push({
            type: 'setBody',
            description: 'Set message body using Simple expression',
            example: `- setBody:\n    simple: "\${header.myValue}"`,
        });
        
        suggestions.push({
            type: 'setHeader',
            description: 'Set message header',
            example: `- setHeader:\n    name: myHeader\n    constant: "value"`,
        });
        
        suggestions.push({
            type: 'transform',
            description: 'Transform message using template',
            example: `- transform:\n    simple: "Processed: \${body}"`,
        });
        
        // Filter by format if specified
        if (sourceFormat || targetFormat) {
            return suggestions.filter(s => {
                if (s.dataFormat) {
                    return s.dataFormat === sourceFormat || s.dataFormat === targetFormat;
                }
                return true;
            });
        }
        
        return suggestions;
    }
    
    /**
     * Build Simple expression from description
     */
    buildExpression(description: string): string {
        const desc = description.toLowerCase();
        
        // Header access
        if (desc.includes('header')) {
            const match = desc.match(/header[s]?\s+(\w+)/);
            if (match) {
                return `\${header.${match[1]}}`;
            }
            return '${header.name}';
        }
        
        // Body access
        if (desc.includes('body')) {
            return '${body}';
        }
        
        // Comparison
        if (desc.includes('equal') || desc.includes('==')) {
            return '${header.name} == "value"';
        }
        if (desc.includes('greater') || desc.includes('>')) {
            return '${header.name} > 0';
        }
        if (desc.includes('less') || desc.includes('<')) {
            return '${header.name} < 100';
        }
        if (desc.includes('contains')) {
            return '${body.contains("text")}';
        }
        
        return '${body}';
    }
    
    /**
     * Validate Simple expression
     */
    validateExpression(expression: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        if (!expression || expression.trim().length === 0) {
            errors.push('Expression is empty');
            return { valid: false, errors };
        }
        
        // Check for balanced ${...}
        const openCount = (expression.match(/\${/g) || []).length;
        const closeCount = (expression.match(/}/g) || []).length;
        
        if (openCount !== closeCount) {
            errors.push('Unbalanced ${...} brackets');
        }
        
        // Check for common mistakes
        if (expression.includes('$header.') && !expression.includes('${header.')) {
            errors.push('Use ${header.name} instead of $header.name');
        }
        
        if (expression.includes('== null') || expression.includes('!= null')) {
            errors.push('Use "is null" or "is not null" instead of == null');
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    /**
     * Get property suggestions for a component
     */
    getPropertySuggestions(componentName: string): PropertySuggestion[] {
        const suggestions: PropertySuggestion[] = [];
        
        // Common properties based on component
        switch (componentName) {
            case 'kafka':
                suggestions.push(
                    {
                        name: 'topic',
                        type: 'string',
                        required: true,
                        description: 'Kafka topic name',
                        examples: ['my-topic', 'events', 'orders'],
                    },
                    {
                        name: 'brokers',
                        type: 'string',
                        required: false,
                        description: 'Kafka broker addresses',
                        defaultValue: 'localhost:9092',
                        examples: ['localhost:9092', 'kafka1:9092,kafka2:9092'],
                    },
                    {
                        name: 'groupId',
                        type: 'string',
                        required: false,
                        description: 'Consumer group ID',
                        examples: ['my-group', 'consumer-1'],
                    },
                    {
                        name: 'autoOffsetReset',
                        type: 'string',
                        required: false,
                        description: 'Offset reset strategy',
                        defaultValue: 'latest',
                        examples: ['earliest', 'latest'],
                    }
                );
                break;
                
            case 'timer':
                suggestions.push(
                    {
                        name: 'period',
                        type: 'number',
                        required: false,
                        description: 'Delay between fires in milliseconds',
                        defaultValue: 1000,
                        examples: ['1000', '60000'],
                    },
                    {
                        name: 'delay',
                        type: 'number',
                        required: false,
                        description: 'Initial delay in milliseconds',
                        defaultValue: 0,
                        examples: ['0', '5000'],
                    },
                    {
                        name: 'repeatCount',
                        type: 'number',
                        required: false,
                        description: 'Number of times to fire (0 = infinite)',
                        defaultValue: 0,
                        examples: ['0', '10'],
                    }
                );
                break;
                
            case 'file':
                suggestions.push(
                    {
                        name: 'directoryName',
                        type: 'string',
                        required: true,
                        description: 'Directory to scan for files',
                        examples: ['inbox', '/data/input'],
                    },
                    {
                        name: 'fileName',
                        type: 'string',
                        required: false,
                        description: 'File name or pattern',
                        examples: ['data.txt', '*.csv'],
                    },
                    {
                        name: 'move',
                        type: 'string',
                        required: false,
                        description: 'Move file after processing',
                        examples: ['processed', '.done'],
                    },
                    {
                        name: 'noop',
                        type: 'boolean',
                        required: false,
                        description: 'Leave file in place after processing',
                        defaultValue: false,
                    }
                );
                break;
                
            case 'http':
                suggestions.push(
                    {
                        name: 'httpMethod',
                        type: 'string',
                        required: false,
                        description: 'HTTP method to use',
                        defaultValue: 'GET',
                        examples: ['GET', 'POST', 'PUT', 'DELETE'],
                    },
                    {
                        name: 'headerFilterStrategy',
                        type: 'string',
                        required: false,
                        description: 'Header filtering strategy',
                    }
                );
                break;
        }
        
        return suggestions;
    }
    
    /**
     * Generate property YAML
     */
    generatePropertyYAML(property: PropertySuggestion, value?: any): string {
        const val = value !== undefined ? value : (property.defaultValue || property.examples?.[0] || '');
        
        if (property.type === 'boolean') {
            return `${property.name}: ${val}`;
        }
        if (property.type === 'number') {
            return `${property.name}: ${val}`;
        }
        
        // String type
        return `${property.name}: ${val}`;
    }
}

/**
 * Get singleton instance
 */
let expressionHelperInstance: ExpressionHelper | undefined;

export function getExpressionHelper(): ExpressionHelper {
    if (!expressionHelperInstance) {
        expressionHelperInstance = new ExpressionHelper();
    }
    return expressionHelperInstance;
}
