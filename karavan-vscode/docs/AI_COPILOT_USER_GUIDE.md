# Karavan AI Copilot - User Guide

Welcome to the Karavan AI Copilot! This guide will help you get started with AI-powered Apache Camel route development.

## Table of Contents

1. [Getting Started](#getting-started)
2. [AI Backend Setup](#ai-backend-setup)
3. [Features Overview](#features-overview)
4. [Chat Interface](#chat-interface)
5. [Route Generation](#route-generation)
6. [Component Suggestions](#component-suggestions)
7. [EIP Pattern Suggestions](#eip-pattern-suggestions)
8. [Expression Help](#expression-help)
9. [Diagnostics & Quick Fixes](#diagnostics--quick-fixes)
10. [Route Optimization](#route-optimization)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Visual Studio Code 1.75.0 or higher
- Karavan extension installed
- One of the following AI backends:
  - GitHub Copilot subscription (recommended)
  - OpenAI API key
  - Local LLM (Ollama)

### Quick Start

1. Open VS Code with a Camel project
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run "Karavan: Open AI Chat Panel"
4. Start asking questions or describing routes!

---

## AI Backend Setup

### Option 1: GitHub Copilot (Recommended)

GitHub Copilot provides the best experience with no additional configuration needed.

1. Install the GitHub Copilot extension
2. Sign in with your GitHub account
3. Karavan AI will automatically use Copilot when available

### Option 2: OpenAI API

1. Get an API key from [OpenAI Platform](https://platform.openai.com)
2. Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
3. Search for "Karavan AI"
4. Set your API key in `Karavan > AI > OpenAI: Api Key`
5. Select "openai" as your preferred backend

**Settings:**
```json
{
  "karavan.ai.backend": "openai",
  "karavan.ai.openai.apiKey": "sk-...",
  "karavan.ai.openai.model": "gpt-4"
}
```

### Option 3: Local LLM (Ollama)

For privacy-focused or offline development:

1. Install [Ollama](https://ollama.ai)
2. Pull a model: `ollama pull codellama`
3. Start Ollama: `ollama serve`
4. Configure Karavan:

**Settings:**
```json
{
  "karavan.ai.backend": "local",
  "karavan.ai.local.endpoint": "http://localhost:11434",
  "karavan.ai.local.model": "codellama"
}
```

---

## Features Overview

| Feature | Description | How to Access |
|---------|-------------|---------------|
| AI Chat | Conversational assistance for Camel development | Command Palette → "Open AI Chat Panel" |
| Route Generation | Create routes from natural language | Chat: "Create a route that..." |
| Component Suggestions | Get recommendations for Camel components | Chat: "What component should I use for..." |
| EIP Suggestions | Get pattern recommendations | Chat: "What pattern should I use for..." |
| Expression Help | Build and validate expressions | Chat: "Help me write an expression..." |
| Diagnostics | Real-time YAML validation | Automatic in .yaml files |
| Quick Fixes | Automatic error correction | Click lightbulb icon on errors |
| Optimization | Route performance analysis | Command: "Analyze Route" |

---

## Chat Interface

### Opening the Chat Panel

**Methods:**
- Command Palette: `Karavan: Open AI Chat Panel`
- Keyboard shortcut: `Ctrl+Shift+K` (customizable)
- Activity Bar: Click the Karavan AI icon

### Chat Commands

Use these prefixes for specific actions:

| Command | Description | Example |
|---------|-------------|---------|
| `/generate` | Generate a new route | `/generate file to kafka route` |
| `/explain` | Explain existing code | `/explain what does this split do` |
| `/optimize` | Analyze and improve route | `/optimize current route` |
| `/component` | Get component help | `/component kafka consumer options` |
| `/eip` | Get EIP pattern help | `/eip content-based router` |
| `/expression` | Get expression help | `/expression jsonpath to extract order id` |

### Example Conversations

**Route Generation:**
```
You: Create a route that reads CSV files, transforms them to JSON, 
     and sends to a REST API

AI: I'll create that route for you:
    
    - from:
        uri: "file:input?include=.*\\.csv"
        steps:
          - unmarshal:
              csv: {}
          - marshal:
              json: {}
          - to:
              uri: "http://api.example.com/data"
              
    Would you like me to add error handling or explain any part?
```

**Component Help:**
```
You: What's the difference between direct and seda components?

AI: Great question! Here's the comparison:

    **Direct Component:**
    - Synchronous, in-memory messaging
    - Blocks caller until processing completes
    - Same thread execution
    - Use for: Simple, fast in-memory routing
    
    **SEDA Component:**
    - Asynchronous, staged processing
    - Non-blocking with internal queue
    - Uses thread pool
    - Use for: Decoupling, load balancing, async processing
    
    Would you like examples of when to use each?
```

---

## Route Generation

### Natural Language to YAML

Describe what you want to accomplish, and the AI will generate the route:

**Input:**
```
"Create a route that polls a database every 5 minutes, 
 filters orders over $1000, and sends notifications to Slack"
```

**Generated Route:**
```yaml
- from:
    uri: "sql:SELECT * FROM orders WHERE status = 'new'?delay=300000"
    steps:
      - filter:
          simple: "${body[amount]} > 1000"
          steps:
            - setBody:
                simple: "New high-value order: ${body[id]} - $${body[amount]}"
            - to:
                uri: "slack:#orders?webhookUrl={{slack.webhook}}"
```

### Tips for Better Results

1. **Be specific about sources and targets:**
   - ✅ "Read from Kafka topic 'orders'"
   - ❌ "Read some data"

2. **Mention required transformations:**
   - ✅ "Convert XML to JSON"
   - ❌ "Process the data"

3. **Specify error handling needs:**
   - ✅ "Retry failed HTTP calls 3 times"
   - ❌ "Handle errors"

4. **Include business logic:**
   - ✅ "Route premium orders to fast lane, others to standard"
   - ❌ "Route based on type"

---

## Component Suggestions

### Getting Recommendations

**Ask by Category:**
```
You: What components can I use for messaging?

AI: Here are the messaging components in Apache Camel:

    **Message Queues:**
    - `jms` - JMS queues and topics
    - `activemq` - Apache ActiveMQ
    - `kafka` - Apache Kafka
    - `rabbitmq` - RabbitMQ
    
    **Cloud Messaging:**
    - `aws-sqs` - Amazon SQS
    - `azure-servicebus` - Azure Service Bus
    - `google-pubsub` - Google Pub/Sub
```

**Ask by Use Case:**
```
You: I need to call a REST API and handle JSON

AI: For REST API calls with JSON, I recommend:

    **http component** - Simple HTTP client
    uri: "http://api.example.com/endpoint"
    
    **rest component** - REST DSL
    uri: "rest:get:/users/{id}"
    
    For JSON handling, combine with:
    - marshal/unmarshal with json dataformat
    - jsonpath for extraction
```

### Component Details

Get detailed information about any component:

```
You: Tell me about the kafka component options

AI: **Kafka Component Options:**

    **Required:**
    - `brokers` - Kafka broker addresses
    - Topic is specified in URI path
    
    **Common Consumer Options:**
    - `groupId` - Consumer group ID
    - `autoOffsetReset` - earliest/latest
    - `maxPollRecords` - Max records per poll
    
    **Common Producer Options:**
    - `key` - Message key
    - `partitionKey` - Partition selection
    
    **Example:**
    uri: "kafka:orders?brokers=localhost:9092&groupId=order-processor"
```

---

## EIP Pattern Suggestions

### Pattern Recommendations

**Describe Your Problem:**
```
You: I need to split a batch of orders and process each one

AI: I recommend the **Splitter** pattern:

    - from:
        uri: "direct:orders"
        steps:
          - split:
              jsonpath: "$.orders"
              steps:
                - to:
                    uri: "direct:processOrder"
    
    **Options to consider:**
    - `parallelProcessing` - Process in parallel
    - `streaming` - For large batches
    - `aggregationStrategy` - Combine results
```

### Common Patterns

| Pattern | Use When | Example Trigger |
|---------|----------|-----------------|
| Splitter | Break message into parts | "process each item" |
| Aggregator | Combine multiple messages | "collect and combine" |
| Content-Based Router | Route by content | "different paths based on type" |
| Recipient List | Dynamic multi-destination | "send to multiple endpoints" |
| Multicast | Parallel multi-destination | "send to all in parallel" |
| Enricher | Add external data | "lookup additional info" |
| Filter | Conditional processing | "only process if" |

---

## Expression Help

### Building Expressions

**Simple Language:**
```
You: How do I access a header value in Simple?

AI: Use the `${header.name}` syntax:
    
    ${header.orderId}           - Get orderId header
    ${header.CamelFileName}     - Get file name
    ${header[Content-Type]}     - Headers with special chars
    
    **In a route:**
    - filter:
        simple: "${header.priority} == 'high'"
```

**JSONPath:**
```
You: Extract nested value from JSON body

AI: Use JSONPath expressions:
    
    $.order.id              - Direct path
    $.items[0].name         - First array item
    $.items[*].price        - All prices
    $.items[?(@.qty > 5)]   - Filtered items
    
    **In a route:**
    - setBody:
        jsonpath: "$.order.items[*].total"
```

### Expression Validation

The AI validates expressions as you write:

```
You: Is this expression correct? ${header.type == 'order'}

AI: ⚠️ That expression has a syntax issue.

    **Problem:** Comparison should be inside the braces
    
    **Correct syntax:**
    ${header.type} == 'order'
    
    Or use the `simple` predicate:
    simple: "${header.type} == 'order'"
```

---

## Diagnostics & Quick Fixes

### Real-Time Validation

Karavan AI automatically validates your YAML files and shows:

- 🔴 **Errors** - Invalid syntax or missing required fields
- 🟡 **Warnings** - Potential issues or best practice violations
- 🔵 **Information** - Suggestions for improvement

### Quick Fixes

Click the 💡 lightbulb to see available fixes:

**Example Fixes:**
- "Add missing uri field"
- "Fix component name typo: fiel → file"
- "Add error handler for HTTP call"
- "Close unclosed quote"

### AI-Powered Fixes

For complex errors, use "Ask AI for fix":

```
Error: Route structure appears incorrect

[Ask AI for Fix]

AI: I see several issues with this route. Here's the corrected version:

    Original (broken):
    - from
        uri: direct:start
        step:
          - too:
    
    Fixed:
    - from:
        uri: "direct:start"
        steps:
          - to:
              uri: "log:output"
```

---

## Route Optimization

### Analyzing Routes

**Command:** `Karavan: Analyze Route for Optimization`

**Or in chat:**
```
You: Optimize my current route

AI: **Route Analysis Results:**

    📊 **Optimization Score:** 72/100
    
    **Suggestions:**
    
    1. 🟡 **Add Error Handler** (High Priority)
       HTTP calls should have error handling
       → Add doTry/doCatch or onException
    
    2. 🟡 **Enable Parallel Processing** (Medium Priority)
       Split without parallel flag is sequential
       → Add parallelProcessing="true"
    
    3. 🔵 **Use Connection Pooling** (Low Priority)
       Multiple HTTP calls to same endpoint
       → Configure HTTP connection pool
    
    Would you like me to apply any of these optimizations?
```

### Optimization Categories

| Category | Checks |
|----------|--------|
| Performance | Parallel processing, streaming, pooling |
| Reliability | Error handlers, retries, idempotency |
| Security | Credential handling, TLS configuration |
| Maintainability | Magic numbers, code organization |
| Best Practices | Logging, timeout configuration |

---

## Troubleshooting

### Common Issues

**AI Not Responding:**
1. Check backend configuration in settings
2. Verify API key is valid (OpenAI)
3. Check if Ollama is running (Local LLM)
4. Ensure GitHub Copilot is signed in

**Poor Quality Suggestions:**
1. Be more specific in your requests
2. Provide context about your project
3. Try different phrasings
4. Use explicit commands (/generate, /explain)

**Quick Fix Not Working:**
1. Save the file first
2. Ensure YAML is parseable
3. Check for multiple errors (fix in order)
4. Try "Ask AI for fix" for complex issues

### Getting Help

**In-Extension:**
- Chat: "Help me with..." or "/help"
- Hover over components for documentation
- Click 💡 for context-aware suggestions

**Resources:**
- [Apache Camel Documentation](https://camel.apache.org/docs/)
- [Karavan GitHub Issues](https://github.com/apache/camel-karavan/issues)
- [Camel Examples](https://github.com/apache/camel-examples)

### Feedback

Help us improve! Use the feedback button in the chat panel to:
- Report issues
- Suggest features
- Share successful use cases

---

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Open AI Chat | `Ctrl+Shift+K` | `Cmd+Shift+K` |
| Generate Route | `Ctrl+Shift+G` | `Cmd+Shift+G` |
| Optimize Route | `Ctrl+Shift+O` | `Cmd+Shift+O` |
| Quick Fix | `Ctrl+.` | `Cmd+.` |
| Show Hover | `Ctrl+K Ctrl+I` | `Cmd+K Cmd+I` |

*Shortcuts are customizable in VS Code Keyboard Shortcuts settings.*

---

## Tips & Best Practices

1. **Start with natural language** - Describe what you want to achieve
2. **Iterate** - Start simple, then add complexity
3. **Ask for explanations** - Understand before copying
4. **Use component suggestions** - Discover new Camel features
5. **Check optimizations regularly** - Keep routes efficient
6. **Validate expressions** - Catch errors early
7. **Enable diagnostics** - Get real-time feedback

Happy Camel route building! 🐫✨
