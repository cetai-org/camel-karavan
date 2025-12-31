/**
 * EIP Pattern Suggestions Panel
 * Displays Enterprise Integration Pattern recommendations
 */

import * as React from 'react';
import './EIPSuggestions.css';

export interface EIPSuggestion {
    pattern: {
        name: string;
        description: string;
        useCases: string[];
        yamlStructure: string;
        commonProperties?: { [key: string]: string };
    };
    relevance: number;
    reason: string;
    exampleUsage?: string;
}

export interface EIPSuggestionsProps {
    suggestions: EIPSuggestion[];
    onSelect?: (pattern: EIPSuggestion) => void;
    onApply?: (yaml: string) => void;
    loading?: boolean;
}

export const EIPSuggestions: React.FC<EIPSuggestionsProps> = ({
    suggestions,
    onSelect,
    onApply,
    loading = false,
}) => {
    const [expandedPattern, setExpandedPattern] = React.useState<string | null>(null);

    const handleToggleExpand = (patternName: string) => {
        setExpandedPattern(expandedPattern === patternName ? null : patternName);
    };

    const handleSelect = (suggestion: EIPSuggestion) => {
        if (onSelect) {
            onSelect(suggestion);
        }
    };

    const handleApply = (yaml: string) => {
        if (onApply) {
            onApply(yaml);
        }
    };

    if (loading) {
        return (
            <div className="eip-suggestions loading">
                <div className="loading-spinner"></div>
                <p>Finding relevant EIP patterns...</p>
            </div>
        );
    }

    if (suggestions.length === 0) {
        return (
            <div className="eip-suggestions empty">
                <span className="codicon codicon-search"></span>
                <p>No EIP pattern suggestions available</p>
            </div>
        );
    }

    return (
        <div className="eip-suggestions">
            <div className="suggestions-header">
                <h3>EIP Pattern Suggestions</h3>
                <span className="suggestion-count">{suggestions.length} patterns</span>
            </div>

            <div className="suggestions-list">
                {suggestions.map((suggestion, index) => {
                    const isExpanded = expandedPattern === suggestion.pattern.name;

                    return (
                        <div key={index} className={`eip-item ${isExpanded ? 'expanded' : ''}`}>
                            <div
                                className="eip-header"
                                onClick={() => handleToggleExpand(suggestion.pattern.name)}
                            >
                                <div className="pattern-name">
                                    <span className={`codicon ${isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right'}`}></span>
                                    <strong>{suggestion.pattern.name.replace(/-/g, ' ')}</strong>
                                </div>
                                <div className="relevance-indicator">
                                    <span className="relevance-badge" style={{
                                        opacity: Math.min(1, suggestion.relevance / 100)
                                    }}>
                                        {Math.round(suggestion.relevance)}%
                                    </span>
                                </div>
                            </div>

                            <div className="pattern-description">
                                {suggestion.pattern.description}
                            </div>

                            <div className="suggestion-reason">
                                <span className="codicon codicon-lightbulb"></span>
                                {suggestion.reason}
                            </div>

                            {suggestion.pattern.useCases && suggestion.pattern.useCases.length > 0 && (
                                <div className="use-cases">
                                    <strong>Use cases:</strong>
                                    {suggestion.pattern.useCases.map((useCase, i) => (
                                        <span key={i} className="use-case-tag">
                                            {useCase}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {isExpanded && (
                                <div className="pattern-details">
                                    <div className="yaml-example">
                                        <div className="example-header">
                                            <strong>YAML Structure</strong>
                                            <button
                                                className="apply-button"
                                                onClick={() => handleApply(suggestion.pattern.yamlStructure)}
                                            >
                                                <span className="codicon codicon-check"></span>
                                                Apply
                                            </button>
                                        </div>
                                        <pre className="yaml-code">
                                            <code>{suggestion.pattern.yamlStructure}</code>
                                        </pre>
                                    </div>

                                    {suggestion.pattern.commonProperties && Object.keys(suggestion.pattern.commonProperties).length > 0 && (
                                        <div className="properties">
                                            <strong>Common Properties</strong>
                                            <div className="properties-list">
                                                {Object.entries(suggestion.pattern.commonProperties).map(([key, value]) => (
                                                    <div key={key} className="property-item">
                                                        <code className="property-name">{key}</code>
                                                        <span className="property-desc">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="eip-actions">
                                <button
                                    className="action-button"
                                    onClick={() => handleSelect(suggestion)}
                                >
                                    <span className="codicon codicon-selection"></span>
                                    Select
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
