# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-20

### Added
- **TypeScript SDK** (`@minions-prompts/sdk`): Core prompt engineering library
  - `PromptRenderer` — template engine with `{{variable}}`, `{{#if}}`, `{{#each}}` support
  - `PromptChain` — version history traversal with `follows` relations
  - `PromptDiff` — field-level and line-level diff between prompt versions
  - `PromptScorer` — test execution and A/B version comparison
  - `PromptExporter` — multi-format export (raw, LangChain, LlamaIndex, JSON)
  - `InMemoryStorage` — in-memory storage implementation for development/testing
  - 5 prompt type schemas: template, version, variable, test, result
- **Python SDK** (`minions-prompts`): Complete Python port mirroring the TypeScript core
  - Identical API surface with Pythonic naming conventions (snake_case)
  - All 5 type schemas registered via `register_prompt_types()`
  - pytest-compatible test suite
- **CLI** (`@minions-prompts/cli`): Command-line interface for prompt management
  - `create` — scaffold a new prompt template
  - `version` — create a new version from an existing prompt
  - `test` — run prompt tests
  - `export` — export prompts to various formats
- **Documentation site**: Starlight-based docs with guides and API reference
- **Web playground**: Interactive browser-based prompt editor and tester
- **Examples**: TypeScript and Python usage examples

### Fixed
- `RendererError` surfaces missing variable names in `missingVariables` field
- Chain traversal handles cycles gracefully (no infinite loops)

### Changed
- Python `requires-python` set to `>=3.11` to align with CI matrix
