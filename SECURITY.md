# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅         |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, email **security@minions.dev** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigations

You will receive a response within **72 hours**. If the issue is confirmed, we aim to release a patch within **14 days** and will credit you in the release notes (unless you prefer to remain anonymous).

## Scope

This security policy covers:

- `@minions-prompts/sdk` (npm package)
- `minions-prompts` (PyPI package)
- `@minions-prompts/cli` (npm package)
- The minions-prompts web playground
- The minions-prompts documentation site

## Out of Scope

- Vulnerabilities in third-party dependencies (please report those upstream)
- Issues without a realistic exploit path
- Prompt injection in user-provided templates (by design — templates execute user content)
