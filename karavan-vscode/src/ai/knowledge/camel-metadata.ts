/**
 * Camel metadata and knowledge base for AI assistance
 * Provides component definitions, EIP patterns, and common use cases
 */

export interface CamelComponent {
    name: string;
    syntax: string;
    description: string;
    category: 'endpoint' | 'dataformat' | 'language' | 'other';
    useCases: string[];
    commonProperties?: { [key: string]: string };
    examples?: string[];
}

export interface EIPPattern {
    name: string;
    description: string;
    useCases: string[];
    yamlStructure: string;
    commonProperties?: { [key: string]: string };
}

/**
 * Common Camel components with metadata
 */
export const COMMON_COMPONENTS: CamelComponent[] = [
    {
        name: 'rest',
        syntax: 'rest',
        description: 'REST API endpoint using REST DSL',
        category: 'endpoint',
        useCases: ['REST API', 'HTTP endpoint', 'web service', 'microservice'],
        commonProperties: {
            'path': 'URL path',
            'method': 'HTTP method (GET, POST, PUT, DELETE)',
            'consumes': 'Content-Type to consume',
            'produces': 'Content-Type to produce',
        },
        examples: [
            'path: /api/users\nget:\n  - to: direct:getUsers',
            'path: /api/data\npost:\n  - to: kafka:my-topic',
        ],
    },
    {
        name: 'kafka',
        syntax: 'kafka:topic',
        description: 'Apache Kafka messaging',
        category: 'endpoint',
        useCases: ['event streaming', 'message queue', 'async communication', 'event-driven'],
        commonProperties: {
            'topic': 'Kafka topic name',
            'brokers': 'Kafka broker addresses',
            'groupId': 'Consumer group ID',
            'autoOffsetReset': 'Offset reset strategy',
        },
    },
    {
        name: 'timer',
        syntax: 'timer:name',
        description: 'Timer-based event generator',
        category: 'endpoint',
        useCases: ['scheduled task', 'polling', 'periodic execution', 'cron job'],
        commonProperties: {
            'period': 'Delay between fires (ms)',
            'delay': 'Initial delay (ms)',
            'repeatCount': 'Number of times to fire',
        },
    },
    {
        name: 'file',
        syntax: 'file:directoryName',
        description: 'File system integration',
        category: 'endpoint',
        useCases: ['file processing', 'file watching', 'file transfer', 'batch processing'],
        commonProperties: {
            'directoryName': 'Directory to scan',
            'fileName': 'File name or pattern',
            'noop': 'Leave file in place after processing',
            'move': 'Move file after processing',
        },
    },
    {
        name: 'direct',
        syntax: 'direct:name',
        description: 'Synchronous in-JVM call',
        category: 'endpoint',
        useCases: ['route composition', 'internal routing', 'synchronous call'],
        commonProperties: {
            'name': 'Endpoint name',
        },
    },
    {
        name: 'seda',
        syntax: 'seda:name',
        description: 'Asynchronous in-JVM queue',
        category: 'endpoint',
        useCases: ['async processing', 'queuing', 'buffering', 'decoupling'],
        commonProperties: {
            'name': 'Queue name',
            'size': 'Queue size',
            'concurrentConsumers': 'Number of concurrent consumers',
        },
    },
    {
        name: 'http',
        syntax: 'http:url',
        description: 'HTTP/HTTPS client',
        category: 'endpoint',
        useCases: ['REST client', 'API call', 'webhook', 'external service'],
        commonProperties: {
            'httpMethod': 'HTTP method',
            'headerFilterStrategy': 'Header filtering',
        },
    },
    {
        name: 'sql',
        syntax: 'sql:query',
        description: 'SQL database operations',
        category: 'endpoint',
        useCases: ['database query', 'data persistence', 'SQL operations'],
        commonProperties: {
            'query': 'SQL query',
            'dataSource': 'DataSource reference',
        },
    },
    {
        name: 'jms',
        syntax: 'jms:destinationType:destinationName',
        description: 'JMS messaging',
        category: 'endpoint',
        useCases: ['message queue', 'async messaging', 'enterprise integration'],
        commonProperties: {
            'destinationType': 'queue or topic',
            'destinationName': 'JMS destination name',
        },
    },
];

/**
 * Enterprise Integration Patterns metadata
 */
export const EIP_PATTERNS: EIPPattern[] = [
    {
        name: 'content-based-router',
        description: 'Route messages based on content',
        useCases: ['conditional routing', 'message filtering', 'content inspection'],
        yamlStructure: `- choice:
    when:
      - simple: "\${header.type} == 'A'"
        steps:
          - to: direct:handleA
      - simple: "\${header.type} == 'B'"
        steps:
          - to: direct:handleB
    otherwise:
      steps:
        - to: direct:handleOther`,
        commonProperties: {
            'when': 'Conditional branches',
            'otherwise': 'Default branch',
        },
    },
    {
        name: 'message-filter',
        description: 'Filter messages based on criteria',
        useCases: ['message filtering', 'data validation', 'selective processing'],
        yamlStructure: `- filter:
    simple: "\${header.priority} > 5"
    steps:
      - to: direct:highPriority`,
    },
    {
        name: 'splitter',
        description: 'Split message into multiple parts',
        useCases: ['batch processing', 'list processing', 'message decomposition'],
        yamlStructure: `- split:
    simple: "\${body}"
    steps:
      - to: direct:processItem`,
        commonProperties: {
            'expression': 'Split expression',
            'parallelProcessing': 'Process in parallel',
            'streaming': 'Stream mode',
        },
    },
    {
        name: 'aggregator',
        description: 'Combine multiple messages into one',
        useCases: ['batch collection', 'message composition', 'response aggregation'],
        yamlStructure: `- aggregate:
    correlationExpression:
      simple: "\${header.groupId}"
    completionSize: 10
    steps:
      - to: direct:processAggregated`,
        commonProperties: {
            'correlationExpression': 'Group messages by expression',
            'completionSize': 'Number of messages to aggregate',
            'completionTimeout': 'Timeout for aggregation',
        },
    },
    {
        name: 'enricher',
        description: 'Enrich message with additional data',
        useCases: ['data enrichment', 'lookup', 'message augmentation'],
        yamlStructure: `- enrich:
    expression:
      simple: "direct:lookupData"
    aggregationStrategy: myStrategy`,
    },
    {
        name: 'wire-tap',
        description: 'Send copy of message to another endpoint',
        useCases: ['monitoring', 'logging', 'auditing', 'side-effect'],
        yamlStructure: `- wireTap:
    uri: "direct:audit"`,
    },
    {
        name: 'multicast',
        description: 'Send message to multiple endpoints',
        useCases: ['parallel execution', 'broadcast', 'fan-out'],
        yamlStructure: `- multicast:
    parallelProcessing: true
    steps:
      - to: direct:endpoint1
      - to: direct:endpoint2
      - to: direct:endpoint3`,
    },
    {
        name: 'recipient-list',
        description: 'Dynamic routing to multiple endpoints',
        useCases: ['dynamic routing', 'variable recipients', 'runtime routing'],
        yamlStructure: `- recipientList:
    simple: "\${header.recipients}"
    delimiter: ","`,
    },
    {
        name: 'retry',
        description: 'Retry failed operations',
        useCases: ['error recovery', 'transient failures', 'resilience'],
        yamlStructure: `- onException:
    exception:
      - java.io.IOException
    redeliveryPolicy:
      maximumRedeliveries: 3
      redeliveryDelay: 1000
    handled:
      constant: true`,
    },
];

/**
 * Common route patterns and templates
 */
export const ROUTE_TEMPLATES = {
    restToKafka: `- rest:
    path: /api/events
    post:
      - to: kafka:event-topic`,
    
    timerPoller: `- from:
    uri: timer:poll
    parameters:
      period: 60000
    steps:
      - to: http://api.example.com/data
      - to: direct:processData`,
    
    fileProcessor: `- from:
    uri: file:inbox
    parameters:
      move: processed
    steps:
      - log: Processing file \${header.CamelFileName}
      - to: direct:processFile`,
    
    contentBasedRouter: `- from:
    uri: direct:route
    steps:
      - choice:
          when:
            - simple: "\${header.type} == 'order'"
              steps:
                - to: direct:processOrder
            - simple: "\${header.type} == 'invoice'"
              steps:
                - to: direct:processInvoice
          otherwise:
            steps:
              - to: direct:processOther`,
    
    errorHandler: `- onException:
    exception:
      - java.lang.Exception
    handled:
      constant: true
    steps:
      - log: Error occurred: \${exception.message}
      - to: direct:errorHandler`,
};

/**
 * Intent keywords for natural language parsing
 */
export const INTENT_KEYWORDS = {
    rest: ['rest', 'api', 'http endpoint', 'web service', 'microservice', 'rest api'],
    kafka: ['kafka', 'event', 'stream', 'message queue', 'event streaming'],
    timer: ['schedule', 'timer', 'periodic', 'cron', 'polling', 'scheduled task'],
    file: ['file', 'directory', 'watch folder', 'file processing'],
    database: ['database', 'sql', 'jdbc', 'query', 'persist'],
    transformation: ['transform', 'map', 'convert', 'format', 'marshal', 'unmarshal'],
    routing: ['route', 'send', 'forward', 'direct', 'conditional'],
    errorHandling: ['error', 'exception', 'retry', 'handle error', 'error handling'],
};

/**
 * Data format components
 */
export const DATA_FORMATS = [
    { name: 'json', description: 'JSON marshalling/unmarshalling' },
    { name: 'xml', description: 'XML marshalling/unmarshalling' },
    { name: 'csv', description: 'CSV marshalling/unmarshalling' },
    { name: 'yaml', description: 'YAML marshalling/unmarshalling' },
    { name: 'avro', description: 'Apache Avro binary format' },
    { name: 'protobuf', description: 'Protocol Buffers binary format' },
];

/**
 * Get component suggestions based on keywords
 */
export function getComponentSuggestions(keywords: string[]): CamelComponent[] {
    const suggestions: CamelComponent[] = [];
    const keywordLower = keywords.map(k => k.toLowerCase());
    
    for (const component of COMMON_COMPONENTS) {
        for (const keyword of keywordLower) {
            if (component.useCases.some(uc => uc.toLowerCase().includes(keyword)) ||
                component.description.toLowerCase().includes(keyword) ||
                component.name.toLowerCase().includes(keyword)) {
                suggestions.push(component);
                break;
            }
        }
    }
    
    return suggestions;
}

/**
 * Get EIP pattern suggestions based on scenario
 */
export function getEIPSuggestions(scenario: string): EIPPattern[] {
    const scenarioLower = scenario.toLowerCase();
    const suggestions: EIPPattern[] = [];
    
    for (const pattern of EIP_PATTERNS) {
        if (pattern.useCases.some(uc => scenarioLower.includes(uc.toLowerCase())) ||
            pattern.description.toLowerCase().includes(scenarioLower)) {
            suggestions.push(pattern);
        }
    }
    
    return suggestions;
}
