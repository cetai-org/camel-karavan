/**
 * Component suggestion engine
 * Provides context-aware Camel component recommendations
 */

import * as vscode from 'vscode';
import { COMMON_COMPONENTS, CamelComponent, getComponentSuggestions } from '../knowledge/camel-metadata';

export interface ComponentSuggestion {
    component: CamelComponent;
    relevance: number;
    reason: string;
}

export interface SuggestionContext {
    currentFile?: string;
    selectedText?: string;
    existingComponents?: string[];
    routeType?: 'consumer' | 'producer' | 'processor';
    dataFormat?: string;
}

/**
 * Component suggester with context awareness
 */
export class ComponentSuggester {
    /**
     * Suggest components based on context
     */
    suggestComponents(context: SuggestionContext): ComponentSuggestion[] {
        const suggestions: ComponentSuggestion[] = [];
        
        // Get user input or selected text
        const userInput = context.selectedText || '';
        
        // Extract keywords from input
        const keywords = this.extractKeywords(userInput);
        
        // Get base suggestions from metadata
        const baseSuggestions = keywords.length > 0 
            ? getComponentSuggestions(keywords)
            : COMMON_COMPONENTS;
        
        // Score and rank suggestions
        for (const component of baseSuggestions) {
            const relevance = this.calculateRelevance(component, context, keywords);
            const reason = this.generateReason(component, context);
            
            suggestions.push({
                component,
                relevance,
                reason,
            });
        }
        
        // Sort by relevance (highest first)
        suggestions.sort((a, b) => b.relevance - a.relevance);
        
        // Return top 10 suggestions
        return suggestions.slice(0, 10);
    }
    
    /**
     * Extract keywords from text
     */
    private extractKeywords(text: string): string[] {
        const keywords: string[] = [];
        const textLower = text.toLowerCase();
        
        // Common integration keywords
        const integrationKeywords = [
            'rest', 'api', 'http', 'kafka', 'jms', 'file', 'database', 'sql',
            'timer', 'schedule', 'message', 'queue', 'topic', 'event', 'stream',
            'transform', 'convert', 'json', 'xml', 'csv', 'route', 'send',
        ];
        
        for (const keyword of integrationKeywords) {
            if (textLower.includes(keyword)) {
                keywords.push(keyword);
            }
        }
        
        return keywords;
    }
    
    /**
     * Calculate relevance score for a component
     */
    private calculateRelevance(
        component: CamelComponent,
        context: SuggestionContext,
        keywords: string[]
    ): number {
        let score = 0;
        
        // Keyword matching (0-50 points)
        for (const keyword of keywords) {
            if (component.name.toLowerCase().includes(keyword)) {
                score += 10;
            }
            if (component.description.toLowerCase().includes(keyword)) {
                score += 5;
            }
            if (component.useCases.some(uc => uc.toLowerCase().includes(keyword))) {
                score += 8;
            }
        }
        
        // Route type matching (0-20 points)
        if (context.routeType === 'consumer') {
            // Favor components that can start a route
            if (['timer', 'file', 'kafka', 'jms', 'rest'].includes(component.name)) {
                score += 20;
            }
        } else if (context.routeType === 'producer') {
            // Favor components that can end a route
            if (['kafka', 'jms', 'file', 'http', 'sql', 'log'].includes(component.name)) {
                score += 20;
            }
        }
        
        // Data format matching (0-15 points)
        if (context.dataFormat) {
            if (component.description.toLowerCase().includes(context.dataFormat.toLowerCase())) {
                score += 15;
            }
        }
        
        // Avoid duplicates (penalty)
        if (context.existingComponents?.includes(component.name)) {
            score -= 10;
        }
        
        // Popularity boost for common components (0-15 points)
        const popularComponents = ['rest', 'kafka', 'direct', 'timer', 'log', 'http'];
        if (popularComponents.includes(component.name)) {
            score += 15;
        }
        
        return Math.max(0, score);
    }
    
    /**
     * Generate explanation for why component is suggested
     */
    private generateReason(component: CamelComponent, context: SuggestionContext): string {
        if (context.routeType === 'consumer') {
            return `Can be used as a route consumer (from:)`;
        }
        if (context.routeType === 'producer') {
            return `Can be used as a route producer (to:)`;
        }
        
        // Return primary use case
        if (component.useCases.length > 0) {
            return `Good for ${component.useCases[0]}`;
        }
        
        return component.description;
    }
    
    /**
     * Suggest next component based on current route
     */
    suggestNextComponent(routeYaml: string): ComponentSuggestion[] {
        const context: SuggestionContext = {
            existingComponents: this.extractExistingComponents(routeYaml),
            routeType: 'producer', // Next component is typically a producer
        };
        
        // Analyze route to determine what makes sense next
        if (routeYaml.includes('rest:') || routeYaml.includes('http:')) {
            // REST/HTTP route might send to messaging or database
            context.selectedText = 'send to kafka or database';
        } else if (routeYaml.includes('kafka:') || routeYaml.includes('jms:')) {
            // Messaging route might process and send elsewhere
            context.selectedText = 'process and route';
        }
        
        return this.suggestComponents(context);
    }
    
    /**
     * Extract components already used in route
     */
    private extractExistingComponents(yaml: string): string[] {
        const components = new Set<string>();
        const componentRegex = /(?:uri:|to:)\s+([a-z-]+):/g;
        
        let match;
        while ((match = componentRegex.exec(yaml)) !== null) {
            components.add(match[1]);
        }
        
        return Array.from(components);
    }
    
    /**
     * Get component details and examples
     */
    getComponentDetails(componentName: string): CamelComponent | undefined {
        return COMMON_COMPONENTS.find(c => c.name === componentName);
    }
    
    /**
     * Generate component usage example
     */
    generateComponentExample(componentName: string, usage: 'from' | 'to'): string {
        const component = this.getComponentDetails(componentName);
        if (!component) {
            return `${usage}:\n  uri: ${componentName}:name`;
        }
        
        // Use predefined examples if available
        if (component.examples && component.examples.length > 0) {
            return `${usage}:\n  ${component.examples[0]}`;
        }
        
        // Generate basic example
        let example = `${usage}:\n  uri: ${component.syntax}`;
        
        if (component.commonProperties && Object.keys(component.commonProperties).length > 0) {
            example += '\n  parameters:';
            const props = Object.entries(component.commonProperties).slice(0, 2);
            for (const [key, desc] of props) {
                example += `\n    ${key}: # ${desc}`;
            }
        }
        
        return example;
    }
}

/**
 * Get singleton instance
 */
let componentSuggesterInstance: ComponentSuggester | undefined;

export function getComponentSuggester(): ComponentSuggester {
    if (!componentSuggesterInstance) {
        componentSuggesterInstance = new ComponentSuggester();
    }
    return componentSuggesterInstance;
}
