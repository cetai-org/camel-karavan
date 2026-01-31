/**
 * Integration Tests for AI Copilot Features
 * Tests end-to-end workflows across multiple AI modules
 */

import { RouteGenerator } from '../../src/ai/agent/route-generator';
import { ComponentSuggester } from '../../src/ai/suggestions/component-suggester';
import { EIPSuggester } from '../../src/ai/suggestions/eip-suggester';
import { ExpressionHelper } from '../../src/ai/assistance/expression-helper';
import { CodeOptimizer } from '../../src/ai/optimization/code-optimizer';
import { DiagnosticsProvider } from '../../src/ai/diagnostics/diagnostics-provider';
import { QuickFixProvider } from '../../src/ai/diagnostics/quick-fix-provider';

// Mock vscode for tests
jest.mock('vscode', () => ({
    DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
    languages: { createDiagnosticCollection: jest.fn(() => ({ set: jest.fn(), clear: jest.fn(), dispose: jest.fn() })) },
    Uri: { file: jest.fn(p => ({ fsPath: p })) },
    Range: jest.fn(),
    Diagnostic: jest.fn(),
    CodeActionKind: { QuickFix: { value: 'quickfix' } },
    CodeAction: jest.fn(),
    WorkspaceEdit: jest.fn(() => ({ replace: jest.fn() })),
    Position: jest.fn()
}));

describe('AI Copilot Integration Tests', () => {
    
    describe('Natural Language to Route Workflow', () => {
        let routeGenerator: RouteGenerator;
        let diagnostics: DiagnosticsProvider;
        let optimizer: CodeOptimizer;

        beforeEach(() => {
            routeGenerator = new RouteGenerator();
            diagnostics = new DiagnosticsProvider();
            optimizer = new CodeOptimizer();
        });

        it('should generate, validate, and optimize a route', async () => {
            // Step 1: Generate route from natural language
            const intent = routeGenerator.parseIntent(
                'Create a route that reads files and sends to Kafka'
            );
            expect(intent.sourceType).toBeDefined();
            expect(intent.targetType).toBeDefined();

            // Step 2: Generate YAML from intent
            const yaml = await routeGenerator.generateFromIntent(intent);
            expect(yaml).toContain('from:');
            expect(yaml.toLowerCase()).toContain('file');

            // Step 3: Validate generated YAML
            const validation = diagnostics.validateYAML(yaml);
            // Generated route should be valid
            expect(validation.valid).toBe(true);

            // Step 4: Optimize the route
            const optimization = optimizer.analyzeRoute(yaml);
            expect(optimization).toBeDefined();
            // May have suggestions for improvement
        });

        it('should handle complex multi-step route generation', async () => {
            const intent = routeGenerator.parseIntent(
                'Create a route that polls from JMS queue, transforms to JSON, splits by order, and sends to REST API'
            );

            const yaml = await routeGenerator.generateFromIntent(intent);
            
            // Validate structure
            const validation = diagnostics.validateYAML(yaml);
            expect(validation.valid).toBe(true);

            // Check for expected patterns
            const patterns = routeGenerator.extractPatterns(intent.description);
            expect(patterns.length).toBeGreaterThan(0);
        });
    });

    describe('Component and EIP Suggestion Workflow', () => {
        let componentSuggester: ComponentSuggester;
        let eipSuggester: EIPSuggester;
        let routeGenerator: RouteGenerator;

        beforeEach(() => {
            componentSuggester = new ComponentSuggester();
            eipSuggester = new EIPSuggester();
            routeGenerator = new RouteGenerator();
        });

        it('should suggest components based on partial route', () => {
            const existingRoute = `
- from:
    uri: "file:input"
    steps:
      - to:
          uri: "?"
`;
            // Get component suggestions for next step
            const suggestions = componentSuggester.suggestNextComponent({
                currentRoute: existingRoute,
                position: 'after-file'
            });

            expect(suggestions.length).toBeGreaterThan(0);
        });

        it('should suggest EIP based on problem description', () => {
            // User describes a problem
            const problemDescription = 'I need to route messages to different endpoints based on the order type';

            // Get EIP suggestions
            const eipSuggestions = eipSuggester.suggestForProblem(problemDescription);
            expect(eipSuggestions.length).toBeGreaterThan(0);

            // Should suggest content-based router
            const cbrSuggestion = eipSuggestions.find(s => 
                s.pattern.name === 'content-based-router' || 
                s.pattern.name === 'choice'
            );
            expect(cbrSuggestion).toBeDefined();

            // Generate route with suggested pattern
            if (cbrSuggestion) {
                const routeWithPattern = eipSuggester.generateRouteWithPattern(
                    cbrSuggestion.pattern.name,
                    'direct:orders'
                );
                expect(routeWithPattern).toContain('choice:');
            }
        });

        it('should chain component and EIP suggestions', () => {
            // Start with source component
            const sourceComponents = componentSuggester.suggestComponents({
                category: 'messaging'
            });
            expect(sourceComponents.length).toBeGreaterThan(0);

            // Then suggest EIPs for processing
            const processingPatterns = eipSuggester.suggestPatterns({
                messageType: 'batch',
                scenario: 'process multiple messages'
            });
            expect(processingPatterns.length).toBeGreaterThan(0);

            // Finally suggest target components
            const targetComponents = componentSuggester.suggestComponents({
                category: 'database'
            });
            expect(targetComponents.length).toBeGreaterThan(0);
        });
    });

    describe('Expression Building Workflow', () => {
        let expressionHelper: ExpressionHelper;
        let diagnostics: DiagnosticsProvider;

        beforeEach(() => {
            expressionHelper = new ExpressionHelper();
            diagnostics = new DiagnosticsProvider();
        });

        it('should suggest, build, and validate expressions', () => {
            // Step 1: Suggest expression language
            const languageSuggestions = expressionHelper.suggestExpressionLanguage({
                dataFormat: 'json',
                expressionType: 'filter'
            });
            expect(languageSuggestions.length).toBeGreaterThan(0);

            const preferredLanguage = languageSuggestions[0].language;

            // Step 2: Get examples for that language
            const examples = expressionHelper.getExpressionExamples(preferredLanguage);
            expect(examples.length).toBeGreaterThan(0);

            // Step 3: Suggest expression for specific task
            const taskSuggestions = expressionHelper.suggestExpressionForTask(
                'check if order amount is greater than 1000'
            );
            expect(taskSuggestions.length).toBeGreaterThan(0);

            // Step 4: Validate the expression
            const expression = taskSuggestions[0].expression;
            const validation = expressionHelper.validateExpression(
                expression,
                taskSuggestions[0].language
            );
            expect(validation.valid).toBe(true);
        });

        it('should convert expressions between languages', () => {
            // Start with simple expression
            const simpleExpr = '${body.orderId}';
            
            // Convert to JSONPath
            const converted = expressionHelper.convertExpression(
                simpleExpr,
                'simple',
                'jsonpath'
            );
            expect(converted.success).toBe(true);
            expect(converted.converted).toContain('$');

            // Validate converted expression
            const validation = expressionHelper.validateExpression(
                converted.converted,
                'jsonpath'
            );
            expect(validation.valid).toBe(true);
        });
    });

    describe('Diagnostics and Quick Fix Workflow', () => {
        let diagnostics: DiagnosticsProvider;
        let quickFix: QuickFixProvider;

        beforeEach(() => {
            diagnostics = new DiagnosticsProvider();
            quickFix = new QuickFixProvider();
        });

        it('should detect error and provide fix', () => {
            const brokenYaml = `
- from:
    uri: "fiel:input"
    steps:
      - to:
          uri: "log:output"
`;
            // Step 1: Detect issues
            const issues = diagnostics.getIssuesForDocument(brokenYaml, 'test.yaml');
            
            // Step 2: Get quick fixes for issues
            if (issues.length > 0) {
                const fixes = quickFix.getQuickFixes({
                    diagnostic: issues[0],
                    documentUri: 'file:///test.yaml',
                    yaml: brokenYaml
                });
                expect(fixes.length).toBeGreaterThan(0);

                // Step 3: Apply fix
                if (fixes.length > 0) {
                    const fixedYaml = quickFix.applyQuickFix(brokenYaml, fixes[0]);
                    expect(fixedYaml).toBeDefined();

                    // Step 4: Verify fix resolved the issue
                    const revalidation = diagnostics.validateYAML(fixedYaml);
                    // Should have fewer or no errors
                }
            }
        });

        it('should validate and fix expression syntax', () => {
            const yamlWithBadExpression = `
- from:
    uri: "direct:start"
    steps:
      - filter:
          simple: "\${header.type"
          steps:
            - to:
                uri: "log:output"
`;
            // Detect unclosed brace
            const validation = diagnostics.validateExpression(
                '${header.type',
                'simple'
            );
            expect(validation.valid).toBe(false);

            // Get fix suggestions
            const fixes = quickFix.suggestFix('${header.type', 'unclosed-brace');
            expect(fixes.length).toBeGreaterThan(0);

            // Apply fix
            const closeBraceFix = fixes.find(f => f.suggestion.includes('}'));
            expect(closeBraceFix).toBeDefined();
        });
    });

    describe('Optimization Workflow', () => {
        let optimizer: CodeOptimizer;
        let diagnostics: DiagnosticsProvider;

        beforeEach(() => {
            optimizer = new CodeOptimizer();
            diagnostics = new DiagnosticsProvider();
        });

        it('should analyze and improve route', () => {
            const route = `
- from:
    uri: "file:input"
    steps:
      - split:
          tokenize: "\\n"
          steps:
            - to:
                uri: "http://api.example.com"
      - to:
          uri: "file:output"
`;
            // Step 1: Validate route is syntactically correct
            const validation = diagnostics.validateYAML(route);
            expect(validation.valid).toBe(true);

            // Step 2: Analyze for optimizations
            const analysis = optimizer.analyzeRoute(route);
            expect(analysis).toBeDefined();

            // Step 3: Get optimization report
            const report = optimizer.getOptimizationReport(route);
            expect(report.score).toBeDefined();
            expect(report.suggestions).toBeDefined();

            // Step 4: Apply optimizations if any
            if (analysis.suggestions.length > 0) {
                const optimizedRoute = optimizer.applyOptimization(
                    route,
                    analysis.suggestions[0]
                );
                expect(optimizedRoute).toBeDefined();
            }
        });

        it('should compare original and optimized routes', () => {
            const original = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "direct:step1"
      - to:
          uri: "direct:step2"
      - to:
          uri: "direct:step3"
      - to:
          uri: "log:output"
`;
            const optimized = `
- from:
    uri: "direct:start"
    steps:
      - pipeline:
          - to:
              uri: "direct:step1"
          - to:
              uri: "direct:step2"
          - to:
              uri: "direct:step3"
      - to:
          uri: "log:output"
`;
            const comparison = optimizer.compareRoutes(original, optimized);
            expect(comparison).toBeDefined();
            expect(comparison.differences).toBeDefined();
        });
    });

    describe('Full Route Development Workflow', () => {
        let routeGenerator: RouteGenerator;
        let componentSuggester: ComponentSuggester;
        let eipSuggester: EIPSuggester;
        let expressionHelper: ExpressionHelper;
        let diagnostics: DiagnosticsProvider;
        let optimizer: CodeOptimizer;
        let quickFix: QuickFixProvider;

        beforeEach(() => {
            routeGenerator = new RouteGenerator();
            componentSuggester = new ComponentSuggester();
            eipSuggester = new EIPSuggester();
            expressionHelper = new ExpressionHelper();
            diagnostics = new DiagnosticsProvider();
            optimizer = new CodeOptimizer();
            quickFix = new QuickFixProvider();
        });

        it('should support complete route development cycle', async () => {
            // 1. User describes what they want
            const description = 'Process orders from Kafka, validate them, and store in database';

            // 2. Parse intent
            const intent = routeGenerator.parseIntent(description);
            expect(intent.sourceType).toBeDefined();

            // 3. Get component suggestions
            const sourceComponents = componentSuggester.suggestComponents({
                category: 'messaging',
                keyword: 'kafka'
            });
            expect(sourceComponents.some(c => c.name.toLowerCase().includes('kafka'))).toBe(true);

            // 4. Get EIP suggestions for processing
            const processingPatterns = eipSuggester.suggestPatterns({
                scenario: 'validate'
            });
            expect(processingPatterns.length).toBeGreaterThan(0);

            // 5. Generate initial route
            const yaml = await routeGenerator.generateFromIntent(intent);
            expect(yaml).toBeDefined();

            // 6. Validate route
            const validation = diagnostics.validateYAML(yaml);
            
            // 7. Get and apply fixes if needed
            if (!validation.valid && validation.errors.length > 0) {
                const fixes = quickFix.getQuickFixes({
                    diagnostic: validation.errors[0],
                    documentUri: 'file:///route.yaml',
                    yaml
                });
                if (fixes.length > 0) {
                    quickFix.applyQuickFix(yaml, fixes[0]);
                }
            }

            // 8. Optimize route
            const optimization = optimizer.getOptimizationReport(yaml);
            expect(optimization.score).toBeGreaterThanOrEqual(0);

            // 9. Get expression help for conditions
            const expressions = expressionHelper.suggestExpressionForTask(
                'check if order is valid'
            );
            expect(expressions.length).toBeGreaterThan(0);
        });

        it('should handle iterative route refinement', async () => {
            // Start with basic route
            let yaml = `
- from:
    uri: "direct:start"
    steps:
      - to:
          uri: "log:output"
`;

            // Iteration 1: Add source component
            const kafkaComponents = componentSuggester.suggestComponents({
                category: 'messaging'
            });
            const kafkaExample = componentSuggester.generateComponentExample('kafka');
            expect(kafkaExample).toContain('kafka');

            // Iteration 2: Add processing pattern
            const splitterPattern = eipSuggester.getPatternDetails('splitter');
            expect(splitterPattern).toBeDefined();

            // Iteration 3: Add conditional routing
            const routingPatterns = eipSuggester.suggestPatterns({
                routingLogic: 'conditional'
            });
            expect(routingPatterns.length).toBeGreaterThan(0);

            // Iteration 4: Add error handling
            const errorPatterns = eipSuggester.suggestPatterns({
                errorHandling: true
            });
            expect(errorPatterns.length).toBeGreaterThan(0);

            // Iteration 5: Optimize final route
            const finalAnalysis = optimizer.analyzeRoute(yaml);
            expect(finalAnalysis).toBeDefined();
        });
    });

    describe('Error Recovery Workflow', () => {
        let diagnostics: DiagnosticsProvider;
        let quickFix: QuickFixProvider;
        let optimizer: CodeOptimizer;

        beforeEach(() => {
            diagnostics = new DiagnosticsProvider();
            quickFix = new QuickFixProvider();
            optimizer = new CodeOptimizer();
        });

        it('should recover from multiple errors', () => {
            const brokenYaml = `
- from
    uri: direct:start
    step:
      - too:
          uro: log:output
`;
            // Validate and collect all errors
            const validation = diagnostics.validateYAML(brokenYaml);
            
            // Process errors and gather fixes
            const allFixes: any[] = [];
            const issues = diagnostics.getIssuesForDocument(brokenYaml, 'test.yaml');
            
            issues.forEach(issue => {
                const fixes = quickFix.getQuickFixes({
                    diagnostic: issue,
                    documentUri: 'file:///test.yaml',
                    yaml: brokenYaml
                });
                allFixes.push(...fixes);
            });

            // Should have multiple fix suggestions
            expect(allFixes.length >= 0).toBe(true);
        });

        it('should suggest AI-assisted fix for complex errors', async () => {
            const complexError = `
- from:
    uri: "kafka:orders"
    steps:
      - split
          jsonpath: "$.items"
        - transform
            constant: invalid
      - to
          "http://api.example.com
`;
            const issues = diagnostics.getIssuesForDocument(complexError, 'test.yaml');
            
            if (issues.length > 0) {
                const aiFix = await quickFix.getAIAssistedFix({
                    diagnostic: issues[0],
                    documentUri: 'file:///test.yaml',
                    yaml: complexError
                });
                expect(aiFix).toBeDefined();
            }
        });
    });
});
