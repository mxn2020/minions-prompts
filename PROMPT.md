**MINIONS PROMPTS — IMPLEMENTATION SPEC**

You are tasked with creating the complete initial foundation for `minions-prompts` — a structured prompt design and engineering system that serves as "GitHub for prompts." This is part of the Minions ecosystem, a universal structured object system designed for building AI-native tools.

---

**PROJECT OVERVIEW**

`minions-prompts` provides version control, testing, A/B comparison, and export capabilities for prompt engineering. It allows developers and agents to treat prompts as first-class objects with full history tracking, variable interpolation, test suites, and quality scoring.

The core concept: prompts should be versioned, tested, and measurable — just like code. Agents can version their own system prompts, A/B test variations, and roll back to previous versions. This is self-improvement infrastructure for AI agents.

---

**CONCEPT OVERVIEW**

This project is built on the Minions SDK (`minions-sdk`), which provides the foundational primitives: Minion (structured object instance), Minion Type (schema), and Relation (typed link between minions).

A prompt template can evolve through multiple versions, each linked via `follows` relations. Variables can be defined and tracked separately. Test cases validate prompt behavior across different inputs. Results capture performance metrics for each test run.

The system supports both TypeScript and Python SDKs with cross-language interoperability (both serialize to the same JSON format). All documentation includes dual-language code examples with tabbed interfaces.

---

**MINIONS SDK REFERENCE — REQUIRED DEPENDENCY**

This project depends on `minions-sdk`, a published package that provides the foundational primitives. The GH Agent building this project MUST install it from the public registries and use the APIs documented below — do NOT reimplement minions primitives from scratch.

**Installation:**
```bash
# TypeScript (npm)
npm install minions-sdk
# or: pnpm add minions-sdk

# Python (PyPI)
pip install minions-sdk
```

**TypeScript SDK — Core Imports:**
```typescript
import {
  // Types
  type Minion, type MinionType, type Relation,
  type FieldDefinition, type FieldValidation, type FieldType,
  type CreateMinionInput, type UpdateMinionInput, type CreateRelationInput,
  type MinionStatus, type MinionPriority, type RelationType,
  type ExecutionResult, type Executable,
  type ValidationError, type ValidationResult,

  // Validation
  validateField, validateFields,

  // Built-in Schemas (10 types)
  noteType, linkType, fileType, contactType,
  agentType, teamType, thoughtType, promptTemplateType, testCaseType, taskType,
  builtinTypes,

  // Registry
  TypeRegistry,

  // Relations
  RelationGraph,

  // Lifecycle
  createMinion, updateMinion, softDelete, hardDelete, restoreMinion,

  // Evolution
  migrateMinion,

  // Utilities
  generateId, now, SPEC_VERSION,
} from 'minions-sdk';
```

**Python SDK — Core Imports:**
```python
from minions import (
    # Types
    Minion, MinionType, Relation, FieldDefinition, FieldValidation,
    CreateMinionInput, UpdateMinionInput, CreateRelationInput,
    ExecutionResult, Executable, ValidationError, ValidationResult,
    # Validation
    validate_field, validate_fields,
    # Built-in Schemas (10 types)
    note_type, link_type, file_type, contact_type,
    agent_type, team_type, thought_type, prompt_template_type,
    test_case_type, task_type, builtin_types,
    # Registry
    TypeRegistry,
    # Relations
    RelationGraph,
    # Lifecycle
    create_minion, update_minion, soft_delete, hard_delete, restore_minion,
    # Evolution
    migrate_minion,
    # Utilities
    generate_id, now, SPEC_VERSION,
)
```

**Key Concepts:**
- A `MinionType` defines a schema (list of `FieldDefinition`s) for a kind of minion
- A `Minion` is an instance of a `MinionType` with `id`, `title`, `minionTypeId`, `fields`, timestamps
- A `Relation` is a typed directional link between two minions (12 types: `parent_of`, `depends_on`, `implements`, `relates_to`, `inspired_by`, `triggers`, `references`, `blocks`, `alternative_to`, `part_of`, `follows`, `integration_link`)
- `TypeRegistry` stores and retrieves `MinionType`s by id or slug
- `RelationGraph` manages relations with traversal utilities (`getChildren`, `getParents`, `getTree`, `getNetwork`)
- `createMinion(input, type)` validates fields and returns `(minion, validation)`
- All field types: `string`, `number`, `boolean`, `date`, `select`, `multi-select`, `url`, `email`, `textarea`, `tags`, `json`, `array`
- The `_legacy` namespace preserves removed field data during schema evolution

**Creating Custom MinionTypes for this project:**
```typescript
// TypeScript
const myType = new MinionType({
  id: 'custom-prompt-template',
  name: 'Prompt Template',
  slug: 'prompt-template',
  schema: [
    { name: 'content', type: 'textarea', label: 'Content', required: true },
    { name: 'variables', type: 'tags', label: 'Variables' },
  ],
  isSystem: false,
});
const registry = new TypeRegistry();
registry.register(myType);
const { minion, validation } = createMinion(
  { title: 'My Prompt', fields: { content: 'Hello {{name}}', variables: ['name'] } },
  myType,
);
```
```python
# Python
from minions import MinionType, FieldDefinition, TypeRegistry, create_minion

my_type = MinionType(
    id="custom-prompt-template",
    name="Prompt Template",
    slug="prompt-template",
    schema=[
        FieldDefinition(name="content", type="textarea", label="Content", required=True),
        FieldDefinition(name="variables", type="tags", label="Variables"),
    ],
)
registry = TypeRegistry()
registry.register(my_type)
minion, validation = create_minion(
    {"title": "My Prompt", "fields": {"content": "Hello {{name}}", "variables": ["name"]}},
    my_type,
)
```

**Cross-SDK JSON Interop:**
Both SDKs serialize to identical camelCase JSON. TypeScript uses `camelCase` natively; Python provides `to_dict()` / `from_dict()` methods that handle `snake_case ↔ camelCase` conversion automatically.

**IMPORTANT:** Do NOT recreate these primitives. Import them from `minions-sdk` (npm) / `minions` (PyPI). Build your domain-specific types and utilities ON TOP of the SDK.

---

**CORE PRIMITIVES**

This project defines the following Minion Types:

- `prompt-template` — A prompt template with optional variable placeholders (e.g., `{{variable}}`, `{{#if condition}}`)
- `prompt-version` — A specific version of a prompt template, linked via `follows` relations to form version chains
- `prompt-variable` — A variable definition with name, type, description, and optional default value
- `prompt-test` — A test case with input variables and expected output criteria
- `prompt-result` — The result of running a test against a prompt version, including scores and metadata

---

**WHAT YOU NEED TO CREATE**

**1. THE SPECIFICATION** (`/spec`)

Write a complete markdown specification document covering:

- Motivation and goals — why version-controlled prompts matter for agent development
- Glossary of terms specific to prompt engineering
- Core type definitions for all five minion types with full field schemas
- Variable interpolation syntax — `{{variable}}` and `{{#if condition}}` block support
- Version chain semantics — how `follows` relations form linear version history
- Test case structure — input variables, expected outputs, scoring criteria
- Export format specifications — LangChain, LlamaIndex, and raw string formats
- Diff algorithm — how to compare two prompt versions field by field
- Best practices for prompt testing and A/B comparison
- Conformance checklist for implementations

**2. THE CORE LIBRARY** (`/packages/core`)

A framework-agnostic TypeScript library built on `minions-sdk`. Must include:

- Full TypeScript type definitions for all prompt-specific types
- `PromptChain` class — traverse `follows` relations to reconstruct full version history
  - `getVersionChain(promptId)` — returns ordered array of all versions
  - `getLatestVersion(promptId)` — returns most recent version
  - `getVersionAtDate(promptId, date)` — returns version active at specific date
- `PromptRenderer` class — variable interpolation engine
  - `render(template, variables)` — replace `{{variable}}` placeholders
  - Support for `{{#if condition}}` conditional blocks
  - Support for `{{#each collection}}` iteration blocks
  - Validation that all required variables are provided
- `PromptDiff` utility — compare two prompt versions
  - `diff(v1, v2)` — returns structured diff object with added/removed/changed fields
  - Optional colored console output for CLI integration
- `PromptScorer` class — execute tests and generate scores
  - `runTest(promptId, testId)` — execute a single test case
  - `runTestSuite(promptId, testIds[])` — batch test execution
  - `compareVersions(v1Id, v2Id, testIds[])` — A/B comparison runner
- `PromptExporter` class — export to various formats
  - `toRaw(promptId)` — plain string with variables replaced
  - `toLangChain(promptId)` — LangChain PromptTemplate format
  - `toLlamaIndex(promptId)` — LlamaIndex prompt format
  - `toJSON(promptId)` — full structured JSON export
- Clean public API with comprehensive JSDoc documentation
- Zero storage opinions — works with any backend

**3. THE PYTHON SDK** (`/packages/python`)

A complete Python port of the core library with identical functionality:

- Python type hints for all classes and methods
- `PromptChain`, `PromptRenderer`, `PromptDiff`, `PromptScorer`, `PromptExporter` classes
- Same method signatures as TypeScript version (following Python naming conventions)
- Serializes to identical JSON format as TypeScript SDK (cross-language interoperability)
- Full docstrings compatible with Sphinx documentation generation
- Published to PyPI as `minions-prompts`

**4. THE CLI** (`/packages/cli`)

A command-line tool called `prompts` that provides:

```bash
prompts new "Summarizer v1"
# Interactively create a new prompt template

prompts version bump <id>
# Create a new version of an existing prompt (links via 'follows' relation)

prompts diff <v1-id> <v2-id>
# Show colored diff between two versions

prompts render <id> --vars topic=AI audience=devs
# Render a prompt with variable substitution

prompts test <id> --against <test-case-id>
# Run a specific test case against a prompt

prompts history <id>
# Show full version history chain

prompts export <id> --format langchain
# Export to LangChain, LlamaIndex, or raw format
```

Additional features:
- Interactive mode for creating prompts with variable definitions
- Colored output for diffs and test results
- JSON output mode for programmatic usage
- Config file support (`.promptsrc.json`) for default settings

**5. THE DOCUMENTATION SITE** (`/apps/docs`)

Built with Astro Starlight. Must include:

- Landing page — "GitHub for prompts" positioning, emphasize agent self-improvement
- Getting started guide with both TypeScript and Python examples
- Core concepts:
  - What is a prompt template vs. prompt version
  - Variable interpolation syntax
  - Version chains and the `follows` relation
  - Test-driven prompt development
- API reference for both TypeScript and Python
  - Dual-language code tabs for all examples
  - Auto-generated from JSDoc/docstrings where possible
- Guides:
  - Writing effective prompt tests
  - A/B testing prompts in production
  - Migrating prompts between versions
  - Exporting to LangChain and LlamaIndex
  - Building agents that version their own prompts
- CLI reference with example commands
- Integration examples:
  - Using with OpenAI API
  - Using with Anthropic Claude
  - Using with local models
  - Agent self-improvement workflow
- Best practices for prompt engineering with version control
- Contributing guide

**6. OPTIONAL: THE WEB APP** (`/apps/web`)

A visual prompt playground (optional but recommended):

- Prompt editor with syntax highlighting for `{{variables}}`
- Live preview with variable substitution
- Version history visualization (timeline view)
- Side-by-side version comparison
- Test case editor and runner
- Export interface for multiple formats
- Built with Next.js or SvelteKit (your choice based on ecosystem consistency)

---

**PROJECT STRUCTURE**

Standard Minions ecosystem monorepo structure:

```
minions-prompts/
  packages/
    core/                 # TypeScript core library
      src/
        types.ts          # Type definitions
        PromptChain.ts
        PromptRenderer.ts
        PromptDiff.ts
        PromptScorer.ts
        PromptExporter.ts
        index.ts          # Public API surface
      test/
      package.json
    python/               # Python SDK
      minions_prompts/
        __init__.py
        types.py
        prompt_chain.py
        prompt_renderer.py
        prompt_diff.py
        prompt_scorer.py
        prompt_exporter.py
      tests/
      pyproject.toml
    cli/                  # CLI tool
      src/
        commands/
          new.ts
          version.ts
          diff.ts
          render.ts
          test.ts
          history.ts
          export.ts
        index.ts
      package.json
  apps/
    docs/                 # Astro Starlight documentation
      src/
        content/
          docs/
            index.md
            getting-started.md
            concepts/
            guides/
            api/
              typescript/
              python/
            cli/
      astro.config.mjs
      package.json
    web/                  # Optional playground
      src/
      package.json
  spec/
    v0.1.md              # Full specification
  examples/
    typescript/
      simple-prompt.ts
      version-chain.ts
      a-b-testing.ts
    python/
      simple_prompt.py
      version_chain.py
      a_b_testing.py
  .github/
    workflows/
      ci.yml             # Lint, test, build for both TS and Python
      publish.yml        # Publish to npm and PyPI
  README.md
  LICENSE                # AGPL-3.0
  package.json           # Workspace root
```

---

**BEYOND STANDARD PATTERN**

These utilities and classes are specific to `minions-prompts`:

**PromptChain**
- Traverses `follows` relations to reconstruct complete version lineage
- Methods: `getVersionChain()`, `getLatestVersion()`, `getVersionAtDate()`
- Handles branching (if multiple versions follow the same parent)

**PromptRenderer**
- Interpolation engine supporting `{{variable}}` syntax
- Conditional blocks: `{{#if condition}}...{{/if}}`
- Iteration blocks: `{{#each items}}...{{/each}}`
- Validates all required variables are provided before rendering
- Returns clear error messages for missing or invalid variables

**PromptDiff**
- Field-by-field comparison of two prompt versions
- Returns structured diff object: `{ added: [], removed: [], changed: [] }`
- Optional colored console output with `+` for additions, `-` for removals, `~` for changes
- Diff algorithm handles nested variable definitions

**PromptScorer**
- Executes test cases against prompt versions
- Supports multiple scoring dimensions (relevance, coherence, accuracy, etc.)
- Returns structured `prompt-result` minions with scores and metadata
- Can run tests in parallel for batch operations

**PromptExporter**
- Converts prompt templates to external formats
- `toRaw()` — plain string with variable placeholders for manual use
- `toLangChain()` — LangChain `PromptTemplate` constructor format
- `toLlamaIndex()` — LlamaIndex prompt format
- `toJSON()` — full structured export including version history and test results

**A/B Comparison Runner**
- Built into `PromptScorer.compareVersions()`
- Runs two versions against identical test inputs
- Returns side-by-side comparison with score deltas
- Highlights statistically significant differences

---

**CLI COMMANDS**

All commands with detailed specifications:

**`prompts new <title>`**
- Interactive prompt creation wizard
- Asks for: template content, description, variables (name, type, default)
- Creates `prompt-template` minion
- Optionally creates related `prompt-variable` minions
- Returns created minion ID

**`prompts version bump <id>`**
- Creates new `prompt-version` minion
- Links to previous version via `follows` relation
- Copies fields from previous version for editing
- Interactive editor mode or accepts `--content` flag

**`prompts diff <v1-id> <v2-id>`**
- Shows colored diff between two versions
- Format: `- removed line`, `+ added line`, `~ changed line`
- Can output JSON with `--json` flag
- Highlights variable changes separately

**`prompts render <id> --vars key=value [key2=value2]`**
- Renders prompt with variable substitution
- Accepts variables as CLI args or from JSON file via `--vars-file`
- Validates all required variables provided
- Outputs rendered string to stdout

**`prompts test <id> --against <test-id>`**
- Runs single test case against prompt
- Displays test inputs, rendered prompt, and results
- Creates `prompt-result` minion
- Returns pass/fail status code

**`prompts history <id>`**
- Shows full version chain via `follows` relations
- Display format: timeline with dates, authors, version numbers
- Can output as JSON graph with `--json`

**`prompts export <id> --format <langchain|llamaindex|raw|json>`**
- Exports to specified format
- Outputs to stdout or file via `--output` flag
- Includes variables and metadata in structured formats

---

**DUAL SDK REQUIREMENTS**

Critical cross-language compatibility requirements:

**Serialization Parity**
- Both TypeScript and Python SDKs must serialize minions to identical JSON format
- Field names, types, and structure must match exactly
- Relation types and metadata must be interchangeable

**API Consistency**
- Same method names (adjusted for language conventions: TypeScript camelCase, Python snake_case)
- Same parameters and return types
- Same class hierarchies and interfaces

**Documentation Parity**
- Every code example in docs must have both TypeScript and Python versions
- Use Astro Starlight's code tabs: `<Tabs><TabItem label="TypeScript">...</TabItem><TabItem label="Python">...</TabItem></Tabs>`
- API reference must document both languages side by side

**Testing Parity**
- Shared test fixtures (JSON files) that both SDKs can consume
- Identical test case coverage
- Cross-language integration tests (TypeScript SDK creates minion, Python SDK reads it)

---

**FIELD SCHEMAS**

Define these Minion Types with full JSON Schema definitions:

**`prompt-template`**
```typescript
{
  id: string;
  title: string;
  content: string;              // The prompt template with {{variables}}
  description?: string;
  variables: PromptVariable[];  // Array of variable definitions
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

**`prompt-version`**
```typescript
{
  id: string;
  title: string;
  content: string;              // The versioned prompt content
  description?: string;
  versionNumber?: number;       // Optional semantic version
  changelog?: string;           // What changed in this version
  variables: PromptVariable[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```
Relations: `follows` → previous `prompt-version` or `prompt-template`

**`prompt-variable`**
```typescript
{
  id: string;
  title: string;                // Variable name (e.g., "topic")
  description?: string;
  variableType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue?: any;
  required: boolean;
  example?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**`prompt-test`**
```typescript
{
  id: string;
  title: string;
  description?: string;
  inputVariables: Record<string, any>;  // Variable values for this test
  expectedCriteria?: string;            // Human-readable expected behavior
  scoringDimensions?: string[];         // e.g., ['relevance', 'coherence']
  createdAt: Date;
  updatedAt: Date;
}
```

**`prompt-result`**
```typescript
{
  id: string;
  title: string;
  renderedPrompt: string;       // The prompt after variable substitution
  output?: string;              // Actual LLM output (if captured)
  scores: Record<string, number>;  // Dimension → score (0-100)
  metadata?: Record<string, any>;  // Model, temperature, tokens, etc.
  passed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
Relations: `references` → `prompt-test` (which test was run)
Relations: `references` → `prompt-version` or `prompt-template` (which prompt was tested)

---

**TONE AND POSITIONING**

This is a serious tool for prompt engineering at scale. Position it as:

- **Version control for prompts** — not just storage, but full history and lineage tracking
- **Test-driven prompt development** — systematize what's usually ad hoc
- **Agent self-improvement infrastructure** — agents version their own prompts
- **Production-ready** — not a toy, built for teams and automation

Avoid:
- Marketing speak and hype
- Over-promising on AI capabilities
- Complexity for complexity's sake

The README should open with a concrete example: a prompt template, a version bump, a test case, and an A/B comparison. Make it immediately tangible.

---

**INTEGRATION EXAMPLES**

Include working examples for:

**OpenAI Integration** (TypeScript)
```typescript
import OpenAI from 'openai';
import { PromptChain, PromptRenderer } from 'minions-prompts';

const chain = new PromptChain();
const latest = await chain.getLatestVersion(promptId);
const renderer = new PromptRenderer();
const rendered = renderer.render(latest.content, { topic: 'AI agents' });

const openai = new OpenAI();
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: rendered }]
});
```

**Agent Self-Improvement** (Python)
```python
from minions_prompts import PromptChain, PromptScorer
from minions_sdk import Relation

# Agent runs tests on current prompt version
scorer = PromptScorer()
results = scorer.run_test_suite(current_prompt_id, test_ids)

# If score drops below threshold, rollback
avg_score = sum(r.scores['relevance'] for r in results) / len(results)
if avg_score < 75:
    chain = PromptChain()
    previous = chain.get_version_chain(current_prompt_id)[-2]
    # Agent uses previous version
```

---

**DELIVERABLES**

Produce all files necessary to bootstrap this project completely:

1. **Full specification** (`/spec/v0.1.md`) — complete enough to implement from
2. **TypeScript core library** (`/packages/core`) — fully functional, well-tested
3. **Python SDK** (`/packages/python`) — feature parity with TypeScript
4. **CLI tool** (`/packages/cli`) — all commands working with helpful output
5. **Documentation site** (`/apps/docs`) — complete with dual-language examples
6. **README** — compelling, clear, with concrete examples
7. **Examples** — working code in both TypeScript and Python
8. **CI/CD setup** — lint, test, and publish workflows for both languages

Every file should be production quality — not stubs, not placeholders. The spec should be complete. The core libraries should be fully functional. The docs should be ready to publish. The CLI should be ready to install and use.

---

**START SYSTEMATICALLY**

1. Write the specification first — nail down the field schemas and interpolation syntax
2. Implement TypeScript core library with full type definitions
3. Port to Python maintaining exact serialization compatibility
4. Build CLI using the core library
5. Write documentation with dual-language examples throughout
6. Create working examples demonstrating key workflows
7. Write the README with concrete use cases

This is a foundational tool for the entire Minions ecosystem. Agents themselves will use this to version their prompts. Get it right.
