/**
 * Hover Provider for Camel YAML files
 * Shows documentation on hover for components, EIPs, and expressions
 */

import * as vscode from 'vscode';
import { getDocumentationAssistant } from '../assistance/documentation-assistant';
import { COMMON_COMPONENTS, EIP_PATTERNS } from '../knowledge/camel-metadata';

export class CamelHoverProvider implements vscode.HoverProvider {
    private documentationAssistant = getDocumentationAssistant();

    /**
     * Provide hover information
     */
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const line = document.lineAt(position.line).text;
        const wordRange = document.getWordRangeAtPosition(position, /[\w-]+/);
        const word = wordRange ? document.getText(wordRange) : '';

        // Check for component URI
        const componentHover = this.getComponentHover(line, word, position);
        if (componentHover) {
            return componentHover;
        }

        // Check for EIP/step
        const eipHover = this.getEIPHover(line, word);
        if (eipHover) {
            return eipHover;
        }

        // Check for Simple expression
        const expressionHover = this.getExpressionHover(line, position);
        if (expressionHover) {
            return expressionHover;
        }

        // Check for property
        const propertyHover = this.getPropertyHover(line, word);
        if (propertyHover) {
            return propertyHover;
        }

        return undefined;
    }

    /**
     * Get hover for Camel component
     */
    private getComponentHover(line: string, word: string, position: vscode.Position): vscode.Hover | undefined {
        // Match component in uri: or to:
        const uriMatch = line.match(/(?:uri:|to:)\s*([a-z-]+):/i);
        if (uriMatch) {
            const componentName = uriMatch[1];
            const component = COMMON_COMPONENTS.find(c => c.name.toLowerCase() === componentName.toLowerCase());
            
            if (component) {
                const md = new vscode.MarkdownString();
                md.isTrusted = true;

                md.appendMarkdown(`## ${component.name} Component\n\n`);
                md.appendMarkdown(`${component.description}\n\n`);
                md.appendMarkdown(`**Syntax:** \`${component.syntax}\`\n\n`);

                if (component.useCases.length > 0) {
                    md.appendMarkdown(`**Use Cases:** ${component.useCases.join(', ')}\n\n`);
                }

                if (component.commonProperties) {
                    md.appendMarkdown(`**Common Properties:**\n`);
                    for (const [key, desc] of Object.entries(component.commonProperties)) {
                        md.appendMarkdown(`- \`${key}\`: ${desc}\n`);
                    }
                    md.appendMarkdown('\n');
                }

                md.appendMarkdown(`[📖 Documentation](https://camel.apache.org/components/latest/${component.name}-component.html)`);

                return new vscode.Hover(md);
            }
        }

        return undefined;
    }

    /**
     * Get hover for EIP/step
     */
    private getEIPHover(line: string, word: string): vscode.Hover | undefined {
        // Match step names like "- choice:", "- split:", etc.
        const stepMatch = line.match(/^\s*-\s*(\w+):/);
        if (stepMatch && stepMatch[1].toLowerCase() === word.toLowerCase()) {
            const eipName = stepMatch[1].toLowerCase();
            const eip = EIP_PATTERNS.find(p => {
                const pName = p.name.toLowerCase().replace(/-/g, '');
                return pName === eipName || p.name.toLowerCase() === eipName;
            });

            if (eip) {
                const md = new vscode.MarkdownString();
                md.isTrusted = true;

                const formattedName = eip.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                md.appendMarkdown(`## ${formattedName} Pattern\n\n`);
                md.appendMarkdown(`${eip.description}\n\n`);

                if (eip.useCases.length > 0) {
                    md.appendMarkdown(`**Use Cases:** ${eip.useCases.join(', ')}\n\n`);
                }

                md.appendMarkdown(`**Example:**\n\`\`\`yaml\n${eip.yamlStructure}\n\`\`\`\n\n`);

                if (eip.commonProperties) {
                    md.appendMarkdown(`**Properties:**\n`);
                    for (const [key, desc] of Object.entries(eip.commonProperties)) {
                        md.appendMarkdown(`- \`${key}\`: ${desc}\n`);
                    }
                }

                return new vscode.Hover(md);
            }

            // Handle common steps that aren't EIPs
            const stepDocs = this.getStepDocumentation(eipName);
            if (stepDocs) {
                return new vscode.Hover(stepDocs);
            }
        }

        return undefined;
    }

    /**
     * Get hover for Simple expression
     */
    private getExpressionHover(line: string, position: vscode.Position): vscode.Hover | undefined {
        // Match ${...} expressions
        const exprRegex = /\$\{([^}]+)\}/g;
        let match;

        while ((match = exprRegex.exec(line)) !== null) {
            const start = match.index;
            const end = match.index + match[0].length;
            
            if (position.character >= start && position.character <= end) {
                const expression = match[1];
                const md = this.getExpressionDocumentation(expression);
                return new vscode.Hover(md);
            }
        }

        return undefined;
    }

    /**
     * Get documentation for a Simple expression
     */
    private getExpressionDocumentation(expression: string): vscode.MarkdownString {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;

        if (expression.startsWith('header.') || expression.startsWith('headers.')) {
            const headerName = expression.replace(/headers?\./, '');
            md.appendMarkdown(`## Header Access\n\n`);
            md.appendMarkdown(`Accesses the message header \`${headerName}\`.\n\n`);
            md.appendMarkdown(`**Returns:** The value of the header, or null if not present.\n\n`);
            md.appendMarkdown(`**Example:**\n\`\`\`yaml\nsimple: "\${header.${headerName}} == 'value'"\n\`\`\`\n`);
        } else if (expression === 'body' || expression.startsWith('body.')) {
            md.appendMarkdown(`## Body Access\n\n`);
            md.appendMarkdown(`Accesses the message body.\n\n`);
            
            if (expression.includes('.')) {
                const method = expression.split('.')[1];
                md.appendMarkdown(`**Method:** \`${method}\`\n\n`);
                md.appendMarkdown(this.getBodyMethodDescription(method));
            } else {
                md.appendMarkdown(`**Returns:** The full message body.\n`);
            }
        } else if (expression.startsWith('exchangeProperty.')) {
            const propName = expression.replace('exchangeProperty.', '');
            md.appendMarkdown(`## Exchange Property\n\n`);
            md.appendMarkdown(`Accesses the exchange property \`${propName}\`.\n\n`);
            md.appendMarkdown(`**Note:** Exchange properties persist across route invocations.\n`);
        } else if (expression.startsWith('exception')) {
            md.appendMarkdown(`## Exception Access\n\n`);
            md.appendMarkdown(`Accesses exception information in error handlers.\n\n`);
            md.appendMarkdown(`**Common:**\n`);
            md.appendMarkdown(`- \`\${exception.message}\` - Error message\n`);
            md.appendMarkdown(`- \`\${exception.stacktrace}\` - Full stack trace\n`);
        } else {
            md.appendMarkdown(`## Simple Expression\n\n`);
            md.appendMarkdown(`Expression: \`\${${expression}}\`\n\n`);
            md.appendMarkdown(`[📖 Simple Language Reference](https://camel.apache.org/components/latest/languages/simple-language.html)\n`);
        }

        return md;
    }

    /**
     * Get description for body methods
     */
    private getBodyMethodDescription(method: string): string {
        const methods: { [key: string]: string } = {
            'length()': 'Returns the length of the body (for strings or collections).',
            'contains(text)': 'Returns true if body contains the specified text.',
            'startsWith(text)': 'Returns true if body starts with the specified text.',
            'endsWith(text)': 'Returns true if body ends with the specified text.',
            'trim()': 'Returns the body with leading/trailing whitespace removed.',
            'toLowerCase()': 'Returns the body converted to lowercase.',
            'toUpperCase()': 'Returns the body converted to uppercase.',
            'replace(old, new)': 'Replaces occurrences of old text with new text.',
        };

        return methods[method] || `Calls the \`${method}\` method on the body.`;
    }

    /**
     * Get hover for property
     */
    private getPropertyHover(line: string, word: string): vscode.Hover | undefined {
        // Common YAML properties
        const properties: { [key: string]: string } = {
            'uri': 'The endpoint URI specifying the source (from) or destination (to) of messages.',
            'parameters': 'Component-specific configuration parameters.',
            'steps': 'The processing steps to execute on each message.',
            'simple': 'Simple language expression for dynamic evaluation.',
            'constant': 'A fixed constant value.',
            'expression': 'Expression used for evaluation (correlation, split, etc.).',
            'parallelProcessing': 'Enable parallel execution of steps.',
            'streaming': 'Process items one at a time instead of loading all into memory.',
            'timeout': 'Maximum time to wait for an operation.',
        };

        // Check if word matches a property key
        if (line.includes(word + ':')) {
            const description = properties[word];
            if (description) {
                const md = new vscode.MarkdownString();
                md.appendMarkdown(`## \`${word}\` Property\n\n`);
                md.appendMarkdown(`${description}\n`);
                return new vscode.Hover(md);
            }
        }

        return undefined;
    }

    /**
     * Get documentation for common steps
     */
    private getStepDocumentation(stepName: string): vscode.MarkdownString | undefined {
        const steps: { [key: string]: { title: string; description: string; example: string } } = {
            'log': {
                title: 'Log Step',
                description: 'Logs a message at the specified level.',
                example: '- log:\n    message: "Processing ${body}"\n    loggingLevel: INFO',
            },
            'to': {
                title: 'To Step',
                description: 'Sends the message to the specified endpoint.',
                example: '- to: kafka:my-topic',
            },
            'tod': {
                title: 'ToD (Dynamic To) Step',
                description: 'Sends the message to a dynamically computed endpoint.',
                example: '- toD: "${header.targetEndpoint}"',
            },
            'setbody': {
                title: 'Set Body Step',
                description: 'Sets the message body to a new value.',
                example: '- setBody:\n    simple: "${body.toUpperCase()}"',
            },
            'setheader': {
                title: 'Set Header Step',
                description: 'Sets a message header to a new value.',
                example: '- setHeader:\n    name: myHeader\n    constant: "value"',
            },
            'setproperty': {
                title: 'Set Property Step',
                description: 'Sets an exchange property.',
                example: '- setProperty:\n    name: myProp\n    simple: "${body}"',
            },
            'removeheader': {
                title: 'Remove Header Step',
                description: 'Removes a header from the message.',
                example: '- removeHeader:\n    name: Authorization',
            },
            'marshal': {
                title: 'Marshal Step',
                description: 'Converts the message body to a specific format (e.g., JSON, XML).',
                example: '- marshal:\n    json: {}',
            },
            'unmarshal': {
                title: 'Unmarshal Step',
                description: 'Parses the message body from a specific format.',
                example: '- unmarshal:\n    json:\n      unmarshalType: com.example.MyClass',
            },
            'transform': {
                title: 'Transform Step',
                description: 'Transforms the message body using an expression.',
                example: '- transform:\n    simple: "Processed: ${body}"',
            },
            'delay': {
                title: 'Delay Step',
                description: 'Delays message processing by a specified duration.',
                example: '- delay:\n    constant: 1000',
            },
            'throttle': {
                title: 'Throttle Step',
                description: 'Limits the rate of message processing.',
                example: '- throttle:\n    constant: 100\n    timePeriodMillis: 1000',
            },
        };

        const step = steps[stepName];
        if (step) {
            const md = new vscode.MarkdownString();
            md.isTrusted = true;
            md.appendMarkdown(`## ${step.title}\n\n`);
            md.appendMarkdown(`${step.description}\n\n`);
            md.appendMarkdown(`**Example:**\n\`\`\`yaml\n${step.example}\n\`\`\`\n`);
            return md;
        }

        return undefined;
    }
}

// Singleton instance
let hoverProviderInstance: CamelHoverProvider | undefined;

export function getHoverProvider(): CamelHoverProvider {
    if (!hoverProviderInstance) {
        hoverProviderInstance = new CamelHoverProvider();
    }
    return hoverProviderInstance;
}
