/**
 * EIP (Enterprise Integration Pattern) suggestion engine
 * Provides context-aware EIP pattern recommendations
 */

import * as vscode from 'vscode';
import { EIP_PATTERNS, EIPPattern, getEIPSuggestions } from '../knowledge/camel-metadata';

export interface EIPSuggestion {
    pattern: EIPPattern;
    relevance: number;
    reason: string;
    exampleUsage?: string;
}

export interface EIPSuggestionContext {
    scenario?: string;
    messageType?: 'single' | 'batch' | 'stream';
    routingLogic?: 'conditional' | 'parallel' | 'sequential' | 'dynamic';
    errorHandling?: boolean;
    dataEnrichment?: boolean;
}

/**
 * EIP pattern suggester
 */
export class EIPSuggester {
    /**
     * Suggest EIP patterns based on scenario
     */
    suggestPatterns(context: EIPSuggestionContext): EIPSuggestion[] {
        const suggestions: EIPSuggestion[] = [];
        
        // Get scenario-based suggestions
        const scenario = context.scenario || '';
        const baseSuggestions = scenario 
            ? getEIPSuggestions(scenario)
            : EIP_PATTERNS;
        
        // Score and rank patterns
        for (const pattern of baseSuggestions) {
            const relevance = this.calculateRelevance(pattern, context);
            const reason = this.generateReason(pattern, context);
            const exampleUsage = this.generateExample(pattern, context);
            
            suggestions.push({
                pattern,
                relevance,
                reason,
                exampleUsage,
            });
        }
        
        // Sort by relevance
        suggestions.sort((a, b) => b.relevance - a.relevance);
        
        return suggestions.slice(0, 8);
    }
    
    /**
     * Calculate relevance score
     */
    private calculateRelevance(pattern: EIPPattern, context: EIPSuggestionContext): number {
        let score = 0;
        
        // Message type matching (0-30 points)
        if (context.messageType === 'batch' && pattern.name === 'splitter') {
            score += 30;
        }
        if (context.messageType === 'batch' && pattern.name === 'aggregator') {
            score += 25;
        }
        
        // Routing logic matching (0-30 points)
        if (context.routingLogic === 'conditional' && pattern.name === 'content-based-router') {
            score += 30;
        }
        if (context.routingLogic === 'parallel' && pattern.name === 'multicast') {
            score += 30;
        }
        if (context.routingLogic === 'dynamic' && pattern.name === 'recipient-list') {
            score += 30;
        }
        
        // Error handling matching (0-25 points)
        if (context.errorHandling && pattern.name === 'retry') {
            score += 25;
        }
        
        // Data enrichment matching (0-25 points)
        if (context.dataEnrichment && pattern.name === 'enricher') {
            score += 25;
        }
        
        // Scenario keyword matching (0-20 points)
        if (context.scenario) {
            const scenarioLower = context.scenario.toLowerCase();
            for (const useCase of pattern.useCases) {
                if (scenarioLower.includes(useCase.toLowerCase())) {
                    score += 10;
                    break;
                }
            }
        }
        
        // Popularity boost for common patterns (0-15 points)
        const popularPatterns = ['content-based-router', 'splitter', 'aggregator', 'enricher'];
        if (popularPatterns.includes(pattern.name)) {
            score += 15;
        }
        
        return Math.max(0, score);
    }
    
    /**
     * Generate reason for suggestion
     */
    private generateReason(pattern: EIPPattern, context: EIPSuggestionContext): string {
        if (context.messageType === 'batch' && pattern.name === 'splitter') {
            return 'Process batch messages one by one';
        }
        if (context.messageType === 'batch' && pattern.name === 'aggregator') {
            return 'Collect individual messages into batches';
        }
        if (context.routingLogic === 'conditional') {
            return 'Route based on message content or headers';
        }
        if (context.routingLogic === 'parallel') {
            return 'Send message to multiple destinations simultaneously';
        }
        if (context.errorHandling) {
            return 'Handle errors with retry logic';
        }
        if (context.dataEnrichment) {
            return 'Add additional data to messages';
        }
        
        // Return primary use case
        if (pattern.useCases.length > 0) {
            return `Useful for ${pattern.useCases[0]}`;
        }
        
        return pattern.description;
    }
    
    /**
     * Generate usage example
     */
    private generateExample(pattern: EIPPattern, context: EIPSuggestionContext): string {
        return pattern.yamlStructure;
    }
    
    /**
     * Suggest pattern based on problem description
     */
    suggestForProblem(problem: string): EIPSuggestion[] {
        const problemLower = problem.toLowerCase();
        const context: EIPSuggestionContext = {
            scenario: problem,
        };
        
        // Detect specific needs
        if (problemLower.includes('split') || problemLower.includes('separate') || problemLower.includes('batch')) {
            context.messageType = 'batch';
        }
        if (problemLower.includes('combine') || problemLower.includes('collect') || problemLower.includes('aggregate')) {
            context.messageType = 'batch';
            context.scenario = 'aggregate';
        }
        if (problemLower.includes('condition') || problemLower.includes('if') || problemLower.includes('choose')) {
            context.routingLogic = 'conditional';
        }
        if (problemLower.includes('parallel') || problemLower.includes('concurrent')) {
            context.routingLogic = 'parallel';
        }
        if (problemLower.includes('error') || problemLower.includes('retry') || problemLower.includes('fail')) {
            context.errorHandling = true;
        }
        if (problemLower.includes('enrich') || problemLower.includes('lookup') || problemLower.includes('add data')) {
            context.dataEnrichment = true;
        }
        
        return this.suggestPatterns(context);
    }
    
    /**
     * Get pattern details
     */
    getPatternDetails(patternName: string): EIPPattern | undefined {
        return EIP_PATTERNS.find(p => p.name === patternName);
    }
    
    /**
     * Generate complete route with pattern
     */
    generateRouteWithPattern(patternName: string, fromUri: string = 'direct:start'): string {
        const pattern = this.getPatternDetails(patternName);
        if (!pattern) {
            return '';
        }
        
        return `- from:
    uri: ${fromUri}
    steps:
      ${pattern.yamlStructure.split('\n').join('\n      ')}`;
    }
    
    /**
     * Suggest patterns for common scenarios
     */
    suggestForCommonScenarios(): { [scenario: string]: EIPSuggestion[] } {
        return {
            'Process batch/list of items': this.suggestPatterns({
                messageType: 'batch',
                scenario: 'split batch',
            }),
            'Route based on conditions': this.suggestPatterns({
                routingLogic: 'conditional',
                scenario: 'conditional routing',
            }),
            'Send to multiple destinations': this.suggestPatterns({
                routingLogic: 'parallel',
                scenario: 'parallel processing',
            }),
            'Handle errors and retries': this.suggestPatterns({
                errorHandling: true,
                scenario: 'error handling',
            }),
            'Add data to messages': this.suggestPatterns({
                dataEnrichment: true,
                scenario: 'data enrichment',
            }),
            'Combine multiple messages': this.suggestPatterns({
                messageType: 'batch',
                scenario: 'aggregate messages',
            }),
        };
    }
}

/**
 * Get singleton instance
 */
let eipSuggesterInstance: EIPSuggester | undefined;

export function getEIPSuggester(): EIPSuggester {
    if (!eipSuggesterInstance) {
        eipSuggesterInstance = new EIPSuggester();
    }
    return eipSuggesterInstance;
}
