/**
 * Component Suggestions Panel
 * Displays context-aware Camel component recommendations
 */

import * as React from 'react';
import './ComponentSuggestions.css';

export interface ComponentSuggestion {
    component: {
        name: string;
        syntax: string;
        description: string;
        category: string;
        useCases: string[];
        commonProperties?: { [key: string]: string };
        examples?: string[];
    };
    relevance: number;
    reason: string;
}

export interface ComponentSuggestionsProps {
    suggestions: ComponentSuggestion[];
    onSelect?: (component: ComponentSuggestion) => void;
    onGetDetails?: (componentName: string) => void;
    loading?: boolean;
}

export const ComponentSuggestions: React.FC<ComponentSuggestionsProps> = ({
    suggestions,
    onSelect,
    onGetDetails,
    loading = false,
}) => {
    const [selectedComponent, setSelectedComponent] = React.useState<string | null>(null);

    const handleSelect = (suggestion: ComponentSuggestion) => {
        setSelectedComponent(suggestion.component.name);
        if (onSelect) {
            onSelect(suggestion);
        }
    };

    const handleGetDetails = (componentName: string) => {
        if (onGetDetails) {
            onGetDetails(componentName);
        }
    };

    if (loading) {
        return (
            <div className="component-suggestions loading">
                <div className="loading-spinner"></div>
                <p>Finding relevant components...</p>
            </div>
        );
    }

    if (suggestions.length === 0) {
        return (
            <div className="component-suggestions empty">
                <span className="codicon codicon-search"></span>
                <p>No component suggestions available</p>
            </div>
        );
    }

    return (
        <div className="component-suggestions">
            <div className="suggestions-header">
                <h3>Suggested Components</h3>
                <span className="suggestion-count">{suggestions.length} suggestions</span>
            </div>

            <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                    <div
                        key={index}
                        className={`suggestion-item ${selectedComponent === suggestion.component.name ? 'selected' : ''}`}
                        onClick={() => handleSelect(suggestion)}
                    >
                        <div className="suggestion-header">
                            <div className="component-name">
                                <span className="codicon codicon-symbol-misc"></span>
                                <strong>{suggestion.component.name}</strong>
                            </div>
                            <div className="relevance-score">
                                <div className="relevance-bar">
                                    <div
                                        className="relevance-fill"
                                        style={{ width: `${Math.min(100, suggestion.relevance)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="component-syntax">
                            <code>{suggestion.component.syntax}</code>
                        </div>

                        <div className="suggestion-reason">
                            {suggestion.reason}
                        </div>

                        <div className="component-category">
                            <span className={`category-badge category-${suggestion.component.category}`}>
                                {suggestion.component.category}
                            </span>
                        </div>

                        {suggestion.component.useCases && suggestion.component.useCases.length > 0 && (
                            <div className="use-cases">
                                {suggestion.component.useCases.slice(0, 3).map((useCase, i) => (
                                    <span key={i} className="use-case-tag">
                                        {useCase}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="suggestion-actions">
                            <button
                                className="action-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleGetDetails(suggestion.component.name);
                                }}
                            >
                                <span className="codicon codicon-info"></span>
                                Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
