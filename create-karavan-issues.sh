#!/bin/bash

# Script to create GitHub issues for Karavan AI Copilot and Data Mapper implementation
# Prerequisites: GitHub CLI (gh) must be installed and authenticated
# Usage: ./create-karavan-issues.sh

REPO="cetai-org/camel-karavan"

echo "Creating issues in ${REPO}..."

# Issue 1: Visual Data Mapper
echo "Creating Issue 1: Visual Data Mapper..."
gh issue create \
  --repo "${REPO}" \
  --title "Implement Visual Data Mapper in Karavan VSCode Extension" \
  --label "enhancement" \
  --assignee "bitsInnovate00" \
  --body "Design and implement a visual data mapping component in the Karavan VSCode extension. 

**Key Tasks:**
- Provide an intuitive drag-and-drop UI for mapping fields between source and target schemas (support JSON, Java POJOs, and XML).
- Type compatibility and validation, with error highlighting and quick fixes.
- Embedded Expression editor for custom transformations and use of Java/Camel expressions.
- Auto-generate Camel/Java transformation code. 
- Enable round-trip (visual ↔ code) editing. 
- Integrate mapping with Camel route designer. 
- Extensible for multiple data formats (initial focus on JSON).
- Comprehensive documentation and sample projects.

**Relevant Code Context:**
- \`karavan-core/model/CamelDefinition.ts\` and \`karavan-vscode/webview/core/model/CamelDefinition.ts\` define \`DataFormatTransformerDefinition\` for transformation steps.
- \`karavan-app/src/main/webui/src/karavan/features/integration/designer/property/property/DataFormatField.tsx\` and \`karavan-vscode/webview/integration-designer/property/property/DataFormatField.tsx\` implement data format field editor and handlers for type/schema configuration.
- Schema parsing and data mapping logic can be extended from these files. 
- Code generation and mapping storage logic would extend from the service layer and use type models already present. 

**Sample Reference:**
\`\`\`typescript
// Example: data format change trigger
function dataFormatChanged(dataFormat: string, value?:  CamelElement) {
    // Updates to mapping logic
}
\`\`\`

**Acceptance Criteria:**
- User can visually create mappings and generate corresponding Java/Camel code.
- Mapping errors are identified and can be fixed via UI. 
- Users can save/load mapping schemas within Karavan projects."

echo "✓ Issue 1 created successfully"
echo ""

# Issue 2: AI Copilot
echo "Creating Issue 2: AI Copilot..."
gh issue create \
  --repo "${REPO}" \
  --title "Implement AI Copilot for Karavan VSCode Extension" \
  --label "enhancement" \
  --assignee "bitsInnovate00" \
  --body "Design and develop an AI Copilot system within the Karavan VSCode extension to enhance developer productivity by providing context-aware code suggestions, intelligent completion, and automated route generation.

**Key Tasks:**
- Provide AI-driven code suggestions for Camel components, EIPs, and Kamelets.
- Route generator: allow natural language input to create draft Camel routes.
- Copilot assistance for expression and property editing. 
- Diagnostics and quick-fix recommendations.
- Documentation assistant for Camel elements.
- Easily extensible with various AI backends (OpenAI API, local LLM, etc).

**Relevant Code Context:**
- \`karavan-vscode/webview/integration-designer/utils/CamelUi.tsx\` manages route and step creation and is the logical place to hook in AI-powered suggestions. 
- Use and extend methods such as \`createNewRoute\`, \`createRouteFromComponent\` and handlers for converting user intent to Camel code.
- Existing project hooks like \`karavan-app/src/main/webui/src/karavan/features/integration/useProjectHook.tsx\` can be leveraged for generating new files or inserting code from AI Copilot.

**Sample Reference:**
\`\`\`typescript
// Example: Hook where AI Copilot can help complete a route from a description
static createNewRoute = (projectId: string, componentName:  string, parameters: any = {}, expression: string, after:(file: ProjectFile) => void): void => {
    // Inserted AI-generated route logic here
}
\`\`\`

**Acceptance Criteria:**
- AI Copilot can suggest relevant Camel code snippets and help auto-complete routes.
- User can generate routes from free-text descriptions.
- Inline documentation and explanations appear as needed.
- All features are tested and documented."

echo "✓ Issue 2 created successfully"
echo ""

# Issue 3: Implementation Roadmap
echo "Creating Issue 3: Implementation Roadmap..."
gh issue create \
  --repo "${REPO}" \
  --title "AI Copilot and Data Mapper Implementation Roadmap for Karavan VSCode" \
  --label "enhancement,documentation" \
  --assignee "bitsInnovate00" \
  --body "Plan, track, and coordinate the implementation of Visual Data Mapper and AI Copilot features in Karavan VSCode extension.

**Roadmap Breakdown:**
- Foundation: set up dev environment, analyze existing codebase
- Phase 1: Data Mapper core (schema parser, mapping canvas, code generator)
- Phase 2: Data Mapper advanced (collections, error diagnostics, extensibility)
- Phase 3: AI Copilot foundation (code suggestions, Copilot APIs, knowledge base)
- Phase 4: AI Copilot features (natural language to route, diagnostics, best practices)
- Phase 5: Integration and documentation

**Relevant Code Entry Points:**
- Transformer definitions and data format classes in \`karavan-core/model/CamelDefinition.ts\`, and the UI logic in \`karavan-vscode/webview\` directory for mapping and AI assist.
- Service logic and code generation patterns can be referenced from \`karavan-generator\` Java sources (e.g., \`CamelDefinitionYamlStepGenerator. java\`).

**Deliverables:**
- Issues for concrete implementation, timeline, and success metrics"

echo "✓ Issue 3 created successfully"
echo ""

echo "=========================================="
echo "All 3 issues created successfully!  🎉"
echo "View them at:  https://github.com/${REPO}/issues"
echo "=========================================="