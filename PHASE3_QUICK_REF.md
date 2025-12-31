# Phase 3 Quick Reference Guide

## 🎯 Quick Start

### Generate a Route from Natural Language
```typescript
import { getRouteGenerator } from './src/ai/agent/route-generator';

const generator = getRouteGenerator();

// Parse user intent
const intent = generator.parseIntent("Create a REST API that sends to Kafka");

// Generate YAML
const yaml = generator.generateFromIntent(intent);

// Or use AI backend
const aiPrompt = generator.buildPrompt({ 
    prompt: "Create a REST API that sends to Kafka",
    context: { runtime: 'quarkus', camelVersion: '4.0.0' }
});
```

### Get Component Suggestions
```typescript
import { getComponentSuggester } from './src/ai/suggestions/component-suggester';

const suggester = getComponentSuggester();

const suggestions = suggester.suggestComponents({
    selectedText: 'send message to kafka',
    routeType: 'producer'
});

// Results: [{ component: kafka, relevance: 95, reason: "..." }]
```

### Get EIP Pattern Suggestions
```typescript
import { getEIPSuggester } from './src/ai/suggestions/eip-suggester';

const suggester = getEIPSuggester();

const suggestions = suggester.suggestForProblem("Split batch and process each item");

// Results: [{ pattern: splitter, relevance: 95, yamlStructure: "..." }]
```

### Validate Expression
```typescript
import { getExpressionHelper } from './src/ai/assistance/expression-helper';

const helper = getExpressionHelper();

const validation = helper.validateExpression('${header.type} == "order"');
// { valid: true, errors: [] }

const invalid = helper.validateExpression('${header.type == "order"}');
// { valid: false, errors: ["Use == inside ${...}, not outside"] }
```

### Validate YAML Route
```typescript
import { validateCamelYAML } from './src/ai/utils/yaml-validator';

const yaml = `
- from:
    uri: timer:test
    steps:
      - to: log:info
`;

const result = validateCamelYAML(yaml);
// { valid: true, errors: [], warnings: [] }
```

---

## 📁 File Structure

```
karavan-vscode/
├── src/
│   ├── ai/
│   │   ├── agent/
│   │   │   └── route-generator.ts          # NLP route generation
│   │   ├── suggestions/
│   │   │   ├── component-suggester.ts       # Component recommendations
│   │   │   └── eip-suggester.ts             # EIP pattern suggestions
│   │   ├── assistance/
│   │   │   └── expression-helper.ts         # Simple language help
│   │   ├── knowledge/
│   │   │   └── camel-metadata.ts            # Components & patterns metadata
│   │   └── utils/
│   │       └── yaml-validator.ts            # YAML validation
│   └── views/
│       └── ai-panel/
│           └── webview.ts                   # Extended message handlers
└── webview/
    └── ai-panel/
        └── components/
            ├── RoutePreview.tsx             # Generated route preview
            ├── RoutePreview.css
            ├── ComponentSuggestions.tsx     # Component list UI
            ├── ComponentSuggestions.css
            ├── EIPSuggestions.tsx          # EIP pattern list UI
            └── EIPSuggestions.css
```

---

## 🔌 Webview Message API

### Send Messages from Webview to Extension

#### Generate Route
```javascript
vscode.postMessage({
    command: 'generateRoute',
    data: {
        prompt: 'Create a REST API that consumes JSON',
        useAI: true  // or false for template-based
    }
});
```

#### Suggest Components
```javascript
vscode.postMessage({
    command: 'suggestComponents',
    data: {
        context: {
            selectedText: 'kafka message',
            routeType: 'producer'
        }
    }
});
```

#### Suggest EIPs
```javascript
vscode.postMessage({
    command: 'suggestEIPs',
    data: {
        scenario: 'process batch of messages'
    }
});
```

#### Validate Expression
```javascript
vscode.postMessage({
    command: 'validateExpression',
    data: {
        expression: '${header.type} == "order"'
    }
});
```

#### Get Component Details
```javascript
vscode.postMessage({
    command: 'getComponentDetails',
    data: {
        componentName: 'kafka'
    }
});
```

### Receive Messages in Webview

#### Route Generated
```javascript
window.addEventListener('message', event => {
    if (event.data.command === 'routeGenerated') {
        const { yaml, components, patterns, validation } = event.data.data;
        // Display in RoutePreview component
    }
});
```

#### Component Suggestions
```javascript
window.addEventListener('message', event => {
    if (event.data.command === 'componentSuggestions') {
        const { suggestions } = event.data.data;
        // Display in ComponentSuggestions component
    }
});
```

#### EIP Suggestions
```javascript
window.addEventListener('message', event => {
    if (event.data.command === 'eipSuggestions') {
        const { suggestions } = event.data.data;
        // Display in EIPSuggestions component
    }
});
```

---

## 🎨 UI Components

### RoutePreview
```tsx
import { RoutePreview } from './components/RoutePreview';

<RoutePreview
    yaml={generatedYaml}
    components={['kafka', 'rest']}
    patterns={['content-based-router']}
    validation={{ valid: true, errors: [] }}
    onApply={(yaml) => applyCode(yaml)}
    onCopy={(yaml) => copyToClipboard(yaml)}
    onRegenerate={() => regenerateRoute()}
/>
```

### ComponentSuggestions
```tsx
import { ComponentSuggestions } from './components/ComponentSuggestions';

<ComponentSuggestions
    suggestions={componentSuggestions}
    onSelect={(suggestion) => insertComponent(suggestion)}
    onGetDetails={(name) => showComponentDetails(name)}
    loading={false}
/>
```

### EIPSuggestions
```tsx
import { EIPSuggestions } from './components/EIPSuggestions';

<EIPSuggestions
    suggestions={eipSuggestions}
    onSelect={(pattern) => selectPattern(pattern)}
    onApply={(yaml) => applyPattern(yaml)}
    loading={false}
/>
```

---

## 📚 Common Patterns

### Pattern 1: Intent-Based Route Generation
```typescript
// User says: "Create a timer that polls an API every minute"

const generator = getRouteGenerator();
const intent = generator.parseIntent("Create a timer that polls an API every minute");
// Intent: { type: 'scheduled', source: 'timer', destination: 'http' }

const yaml = generator.generateFromIntent(intent);
```

**Generated YAML**:
```yaml
- from:
    uri: timer:scheduler
    parameters:
      period: 60000
    steps:
      - setBody:
          constant: "Scheduled task executed"
      - to: http://api.example.com/data
```

### Pattern 2: Context-Aware Component Suggestion
```typescript
// User is writing a route and types "send to"

const suggester = getComponentSuggester();
const suggestions = suggester.suggestComponents({
    selectedText: 'send to',
    routeType: 'producer',
    existingComponents: ['rest']
});

// Top suggestions: kafka, jms, file, http, sql
```

### Pattern 3: Problem-to-EIP Mapping
```typescript
// User asks: "How do I handle errors with retry?"

const suggester = getEIPSuggester();
const suggestions = suggester.suggestForProblem("How do I handle errors with retry?");

// Top suggestion: retry pattern with onException YAML
```

---

## 🧪 Testing Examples

### Test Route Generation
```typescript
import { getRouteGenerator } from '../src/ai/agent/route-generator';

describe('RouteGenerator', () => {
    it('should parse REST API intent', () => {
        const generator = getRouteGenerator();
        const intent = generator.parseIntent('Create a REST API');
        
        expect(intent.type).toBe('rest-api');
        expect(intent.source).toBe('rest');
    });
    
    it('should generate valid YAML', () => {
        const generator = getRouteGenerator();
        const yaml = generator.generateFromIntent({
            type: 'rest-api',
            source: 'rest',
            destination: 'kafka'
        });
        
        const validation = generator.validateYAML(yaml);
        expect(validation.valid).toBe(true);
    });
});
```

### Test Component Suggestions
```typescript
import { getComponentSuggester } from '../src/ai/suggestions/component-suggester';

describe('ComponentSuggester', () => {
    it('should suggest kafka for messaging context', () => {
        const suggester = getComponentSuggester();
        const suggestions = suggester.suggestComponents({
            selectedText: 'send message to kafka',
            routeType: 'producer'
        });
        
        const kafkaSuggestion = suggestions.find(s => s.component.name === 'kafka');
        expect(kafkaSuggestion).toBeDefined();
        expect(kafkaSuggestion!.relevance).toBeGreaterThan(50);
    });
});
```

### Test Expression Validation
```typescript
import { getExpressionHelper } from '../src/ai/assistance/expression-helper';

describe('ExpressionHelper', () => {
    it('should validate correct expression', () => {
        const helper = getExpressionHelper();
        const result = helper.validateExpression('${header.type} == "order"');
        
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    
    it('should detect unbalanced brackets', () => {
        const helper = getExpressionHelper();
        const result = helper.validateExpression('${header.type');
        
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Unbalanced');
    });
});
```

---

## 🐛 Debugging Tips

### Enable Debug Logging
```typescript
// In webview.ts
console.log('AI Panel received message:', message.command);
console.log('Route generation request:', data);
console.log('Generated YAML:', yaml);
```

### Check Message Flow
1. Open DevTools: `Ctrl+Shift+I` (on webview)
2. Check Console for posted messages
3. Verify message handler is called
4. Check response message

### Validate AI Backend
```typescript
import { getAIBackend } from './src/ai/utils/backend';

const backend = await getAIBackend();
console.log('Backend name:', backend.name);
console.log('Is available:', await backend.isAvailable());
```

### Test YAML Validation
```typescript
import { validateCamelYAML } from './src/ai/utils/yaml-validator';

const yaml = `your-yaml-here`;
const result = validateCamelYAML(yaml);

if (!result.valid) {
    console.error('Validation errors:', result.errors);
}
```

---

## 📖 Metadata Reference

### Available Components
- **rest**: REST API endpoints
- **kafka**: Apache Kafka messaging
- **timer**: Scheduled tasks
- **file**: File system integration
- **direct**: Synchronous in-JVM call
- **seda**: Asynchronous in-JVM queue
- **http**: HTTP/HTTPS client
- **sql**: SQL database operations
- **jms**: JMS messaging

### Available EIP Patterns
- **content-based-router**: Route based on content
- **message-filter**: Filter messages
- **splitter**: Split into multiple parts
- **aggregator**: Combine multiple messages
- **enricher**: Add additional data
- **wire-tap**: Send copy to another endpoint
- **multicast**: Send to multiple endpoints
- **recipient-list**: Dynamic routing
- **retry**: Error handling with retry

### Expression Functions
- String: `contains()`, `startsWith()`, `endsWith()`, `replace()`, `trim()`, `toLowerCase()`, `toUpperCase()`
- Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Logical: `&&`, `||`, `!`
- Regex: `=~`
- Collection: `in`

---

## 🎯 Next Steps

### Test Your Implementation
1. Compile: `npm run compile`
2. Launch Extension: Press `F5`
3. Open AI Copilot: `Ctrl+Shift+P` → "Karavan: Open AI Copilot"
4. Test route generation with natural language
5. Test component suggestions
6. Test EIP pattern suggestions

### Example Test Prompts
- "Create a REST API that accepts JSON and sends to Kafka"
- "Generate a timer that polls a database every 30 seconds"
- "Build a file processor that reads CSV files and transforms to XML"
- "Create a route with content-based routing using choice"
- "How do I split a batch of messages?"

### Verify Features
- ✅ Route preview shows generated YAML
- ✅ Validation errors displayed correctly
- ✅ Component suggestions ranked by relevance
- ✅ EIP patterns expandable with examples
- ✅ Apply button inserts code
- ✅ Copy button works

---

## 📞 Support

For issues or questions about Phase 3 implementation:
1. Check `PHASE3_SUMMARY.md` for detailed architecture
2. Review source code comments in implementation files
3. Test with example scenarios above
4. Verify message flow in browser DevTools

**Phase 3 Status**: ✅ Complete and ready for testing!
