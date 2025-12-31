/**
 * YAML validation utilities for Camel routes
 * Validates route structure, syntax, and best practices
 */

import * as yaml from 'js-yaml';
import * as vscode from 'vscode';

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    message: string;
    line?: number;
    severity: 'error';
}

export interface ValidationWarning {
    message: string;
    line?: number;
    severity: 'warning';
}

/**
 * Validate Camel YAML route
 */
export function validateCamelYAML(yamlContent: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
        // Parse YAML
        const parsed = yaml.load(yamlContent);

        if (!parsed) {
            errors.push({
                message: 'YAML content is empty',
                severity: 'error',
            });
            return { valid: false, errors, warnings };
        }

        // Check if it's an array (routes are typically arrays)
        if (!Array.isArray(parsed)) {
            errors.push({
                message: 'Camel routes should be defined as a YAML array',
                severity: 'error',
            });
        } else {
            // Validate each route
            parsed.forEach((route: any, index: number) => {
                validateRoute(route, index, errors, warnings);
            });
        }
    } catch (error) {
        if (error instanceof yaml.YAMLException) {
            errors.push({
                message: `YAML syntax error: ${error.message}`,
                line: error.mark?.line,
                severity: 'error',
            });
        } else {
            errors.push({
                message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'error',
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate individual route structure
 */
function validateRoute(route: any, index: number, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!route || typeof route !== 'object') {
        errors.push({
            message: `Route ${index} is not a valid object`,
            severity: 'error',
        });
        return;
    }

    // Check for required route fields
    const hasFrom = 'from' in route;
    const hasRest = 'rest' in route;

    if (!hasFrom && !hasRest) {
        errors.push({
            message: `Route ${index} must have either 'from' or 'rest' property`,
            severity: 'error',
        });
        return;
    }

    // Validate 'from' route
    if (hasFrom) {
        validateFromRoute(route.from, index, errors, warnings);
    }

    // Validate 'rest' route
    if (hasRest) {
        validateRestRoute(route.rest, index, errors, warnings);
    }

    // Check for other route properties
    if ('beans' in route) {
        validateBeans(route.beans, index, errors, warnings);
    }

    if ('onException' in route) {
        validateOnException(route.onException, index, errors, warnings);
    }
}

/**
 * Validate 'from' route
 */
function validateFromRoute(from: any, routeIndex: number, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!from || typeof from !== 'object') {
        errors.push({
            message: `Route ${routeIndex}: 'from' must be an object`,
            severity: 'error',
        });
        return;
    }

    if (!from.uri && !from.steps) {
        errors.push({
            message: `Route ${routeIndex}: 'from' must have 'uri' property`,
            severity: 'error',
        });
    }

    if (from.uri && typeof from.uri !== 'string') {
        errors.push({
            message: `Route ${routeIndex}: 'uri' must be a string`,
            severity: 'error',
        });
    }

    if (from.steps && !Array.isArray(from.steps)) {
        errors.push({
            message: `Route ${routeIndex}: 'steps' must be an array`,
            severity: 'error',
        });
    } else if (from.steps) {
        validateSteps(from.steps, routeIndex, errors, warnings);
    }

    // Warn if no steps
    if (!from.steps || from.steps.length === 0) {
        warnings.push({
            message: `Route ${routeIndex}: No processing steps defined`,
            severity: 'warning',
        });
    }
}

/**
 * Validate REST route
 */
function validateRestRoute(rest: any, routeIndex: number, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!rest || typeof rest !== 'object') {
        errors.push({
            message: `Route ${routeIndex}: 'rest' must be an object`,
            severity: 'error',
        });
        return;
    }

    if (!rest.path) {
        errors.push({
            message: `Route ${routeIndex}: REST route must have 'path' property`,
            severity: 'error',
        });
    }

    // Check for at least one HTTP method
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
    const hasMethod = httpMethods.some(method => method in rest);

    if (!hasMethod) {
        errors.push({
            message: `Route ${routeIndex}: REST route must define at least one HTTP method (get, post, put, delete, etc.)`,
            severity: 'error',
        });
    }

    // Validate each HTTP method
    httpMethods.forEach(method => {
        if (rest[method]) {
            if (Array.isArray(rest[method])) {
                validateSteps(rest[method], routeIndex, errors, warnings);
            } else {
                errors.push({
                    message: `Route ${routeIndex}: REST ${method} must be an array of steps`,
                    severity: 'error',
                });
            }
        }
    });
}

/**
 * Validate route steps
 */
function validateSteps(steps: any[], routeIndex: number, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!Array.isArray(steps)) {
        return;
    }

    steps.forEach((step, stepIndex) => {
        if (!step || typeof step !== 'object') {
            errors.push({
                message: `Route ${routeIndex}, step ${stepIndex}: Step must be an object`,
                severity: 'error',
            });
            return;
        }

        // Check if step has at least one known EIP or component
        const knownSteps = [
            'to', 'log', 'setBody', 'setHeader', 'removeHeader', 'transform',
            'marshal', 'unmarshal', 'choice', 'when', 'otherwise',
            'split', 'aggregate', 'filter', 'enrich', 'wireTap', 'multicast',
            'recipientList', 'loop', 'delay', 'throttle', 'process', 'bean',
            'onException', 'doTry', 'doCatch', 'doFinally', 'script',
        ];

        const stepKeys = Object.keys(step);
        const hasKnownStep = stepKeys.some(key => knownSteps.includes(key));

        if (!hasKnownStep && stepKeys.length > 0) {
            warnings.push({
                message: `Route ${routeIndex}, step ${stepIndex}: Unknown step type '${stepKeys[0]}'`,
                severity: 'warning',
            });
        }

        // Validate nested steps for EIPs
        if (step.choice) {
            validateChoice(step.choice, routeIndex, stepIndex, errors, warnings);
        }
        if (step.split && step.split.steps) {
            validateSteps(step.split.steps, routeIndex, errors, warnings);
        }
    });
}

/**
 * Validate choice EIP
 */
function validateChoice(choice: any, routeIndex: number, stepIndex: number, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!choice.when && !choice.otherwise) {
        errors.push({
            message: `Route ${routeIndex}, step ${stepIndex}: Choice must have 'when' or 'otherwise'`,
            severity: 'error',
        });
    }

    if (choice.when && !Array.isArray(choice.when)) {
        errors.push({
            message: `Route ${routeIndex}, step ${stepIndex}: 'when' must be an array`,
            severity: 'error',
        });
    } else if (choice.when) {
        choice.when.forEach((when: any, whenIndex: number) => {
            if (!when.simple && !when.xpath && !when.jsonpath) {
                warnings.push({
                    message: `Route ${routeIndex}, step ${stepIndex}, when ${whenIndex}: Missing predicate expression`,
                    severity: 'warning',
                });
            }
            if (when.steps) {
                validateSteps(when.steps, routeIndex, errors, warnings);
            }
        });
    }

    if (choice.otherwise && choice.otherwise.steps) {
        validateSteps(choice.otherwise.steps, routeIndex, errors, warnings);
    }
}

/**
 * Validate beans definition
 */
function validateBeans(beans: any, routeIndex: number, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!Array.isArray(beans)) {
        errors.push({
            message: `Route ${routeIndex}: 'beans' must be an array`,
            severity: 'error',
        });
    }
}

/**
 * Validate onException
 */
function validateOnException(onException: any, routeIndex: number, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!onException || typeof onException !== 'object') {
        errors.push({
            message: `Route ${routeIndex}: 'onException' must be an object`,
            severity: 'error',
        });
        return;
    }

    if (!onException.exception) {
        errors.push({
            message: `Route ${routeIndex}: 'onException' must specify 'exception' types`,
            severity: 'error',
        });
    }

    if (onException.steps) {
        validateSteps(onException.steps, routeIndex, errors, warnings);
    }
}

/**
 * Get diagnostics for current editor
 */
export function getCamelDiagnostics(document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    try {
        const content = document.getText();
        const validation = validateCamelYAML(content);

        validation.errors.forEach(error => {
            const range = error.line !== undefined
                ? new vscode.Range(error.line - 1, 0, error.line - 1, Number.MAX_VALUE)
                : new vscode.Range(0, 0, 0, Number.MAX_VALUE);

            diagnostics.push(new vscode.Diagnostic(
                range,
                error.message,
                vscode.DiagnosticSeverity.Error
            ));
        });

        validation.warnings.forEach(warning => {
            const range = warning.line !== undefined
                ? new vscode.Range(warning.line - 1, 0, warning.line - 1, Number.MAX_VALUE)
                : new vscode.Range(0, 0, 0, Number.MAX_VALUE);

            diagnostics.push(new vscode.Diagnostic(
                range,
                warning.message,
                vscode.DiagnosticSeverity.Warning
            ));
        });
    } catch (error) {
        // Silent error - diagnostics will be empty
    }

    return diagnostics;
}
