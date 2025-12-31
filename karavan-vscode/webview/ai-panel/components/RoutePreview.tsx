/**
 * Route Preview Component
 * Displays generated Camel routes with syntax highlighting and validation
 */

import * as React from 'react';
import './RoutePreview.css';

export interface RoutePreviewProps {
    yaml: string;
    components?: string[];
    patterns?: string[];
    validation?: {
        valid: boolean;
        errors: string[];
    };
    onApply?: (yaml: string) => void;
    onCopy?: (yaml: string) => void;
    onRegenerate?: () => void;
}

export const RoutePreview: React.FC<RoutePreviewProps> = ({
    yaml,
    components = [],
    patterns = [],
    validation,
    onApply,
    onCopy,
    onRegenerate,
}) => {
    const [showDetails, setShowDetails] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(yaml);
        if (onCopy) {
            onCopy(yaml);
        }
    };

    const handleApply = () => {
        if (onApply) {
            onApply(yaml);
        }
    };

    const isValid = validation?.valid !== false;

    return (
        <div className="route-preview">
            <div className="preview-header">
                <h3>Generated Route</h3>
                <div className="preview-actions">
                    <button
                        className="preview-button"
                        onClick={() => setShowDetails(!showDetails)}
                        title="Toggle details"
                    >
                        <span className="codicon codicon-info"></span>
                        {showDetails ? 'Hide' : 'Show'} Details
                    </button>
                    {onRegenerate && (
                        <button
                            className="preview-button"
                            onClick={onRegenerate}
                            title="Regenerate route"
                        >
                            <span className="codicon codicon-refresh"></span>
                            Regenerate
                        </button>
                    )}
                    <button
                        className="preview-button"
                        onClick={handleCopy}
                        title="Copy to clipboard"
                    >
                        <span className="codicon codicon-copy"></span>
                        Copy
                    </button>
                    {onApply && (
                        <button
                            className="preview-button primary"
                            onClick={handleApply}
                            disabled={!isValid}
                            title={isValid ? 'Apply route to file' : 'Fix validation errors first'}
                        >
                            <span className="codicon codicon-check"></span>
                            Apply
                        </button>
                    )}
                </div>
            </div>

            {validation && !isValid && (
                <div className="validation-errors">
                    <div className="error-header">
                        <span className="codicon codicon-error"></span>
                        Validation Errors
                    </div>
                    <ul className="error-list">
                        {validation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {showDetails && (components.length > 0 || patterns.length > 0) && (
                <div className="route-details">
                    {components.length > 0 && (
                        <div className="detail-section">
                            <h4>Components Used</h4>
                            <div className="tag-list">
                                {components.map((comp, index) => (
                                    <span key={index} className="tag component-tag">
                                        {comp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {patterns.length > 0 && (
                        <div className="detail-section">
                            <h4>EIP Patterns</h4>
                            <div className="tag-list">
                                {patterns.map((pattern, index) => (
                                    <span key={index} className="tag pattern-tag">
                                        {pattern}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="yaml-container">
                <pre className="yaml-code">
                    <code>{yaml}</code>
                </pre>
            </div>

            {isValid && (
                <div className="validation-success">
                    <span className="codicon codicon-pass"></span>
                    Route is valid
                </div>
            )}
        </div>
    );
};
