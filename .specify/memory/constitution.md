<!--
Sync Impact Report:
Version change: 1.0.0 → 2.0.0 (MAJOR - complete restructuring of principles)
Modified principles:
  - I. CLI-First Interface → Article I: Simplicity First (redefined focus)
  - II. Local Execution & User Control → Article II: Zero Configuration Start (redefined focus)
  - III. Web Application Focus → Article III: Transparent Operations (redefined focus)
  - IV. AI-Powered Analysis & Generation → Removed (concepts integrated into other articles)
  - V. Playwright Compatibility → Article IV: Playwright Compatibility (retained, refined)
  - VI. Open Source & Modular Architecture → Article V: Modular Architecture (refined)
  - VII. Documentation Generation → Article IX: Documentation as Code (redefined focus)
Added sections:
  - Article VI: Dependency Minimalism (new)
  - Article VII: Cross-Platform Consistency (new)
  - Article VIII: Test Coverage (new)
  - Article X: Community-Friendly Development (new)
  - Technology Boundaries section (replaces Technology Constraints)
  - Quality Gates section (new)
  - Amendment Process section (expanded from Governance)
Removed sections:
  - Development Standards (concepts integrated into articles)
Templates requiring updates:
  ✅ plan-template.md - Constitution Check section needs update to reflect new 10 articles
  ✅ spec-template.md - No direct constitution references, aligns with principles
  ✅ tasks-template.md - No direct constitution references, aligns with principles
  ✅ agent-file-template.md - No direct constitution references
Follow-up TODOs: None
-->

# Project Constitution: E2E Testing CLI Tool

**Project**: e2e-cli  
**Type**: Open-Source npm Package  
**Created**: 2025-01-01

## Preamble

This constitution establishes the foundational principles governing the development of the E2E Testing CLI Tool. All specifications, plans, and implementations must adhere to these principles. The constitution ensures consistency, quality, and alignment with the project's mission to empower indie developers with accessible testing tools.

## Article I: Simplicity First

Every feature must prioritize simplicity over comprehensiveness.

- The CLI must be usable without reading documentation
- Commands should follow intuitive patterns: verb noun --options
- Default behavior should work for 80% of use cases
- Complex features must not complicate simple workflows
- When in doubt, leave it out

## Article II: Zero Configuration Start

Users must be able to run the tool with minimal setup.

- Installation via single npm command: npm install -g <package>
- First crawl requires only a URL argument
- Sensible defaults for all optional parameters
- Configuration files are optional, never required
- API key is the only mandatory external dependency

## Article III: Transparent Operations

The tool must clearly communicate what it is doing.

- Progress indicators for all long-running operations
- Clear error messages with actionable guidance
- No silent failures; all errors must surface
- Verbose mode available for debugging
- Output explains what was generated and why

## Article IV: Playwright Compatibility

All generated tests must be valid, runnable Playwright scripts.

- Generated code follows Playwright best practices
- Tests are self-contained and independently runnable
- No proprietary test format; standard Playwright only
- Generated tests should pass linting without modification
- Users can extend generated tests with standard Playwright APIs

## Article V: Modular Architecture

The codebase must be organized into clear, independent modules.

- Crawling logic separate from test generation
- AI integration isolated behind clear interfaces
- Output formatting decoupled from core logic
- Each module testable in isolation
- New output formats addable without modifying core

## Article VI: Dependency Minimalism

External dependencies must be justified and minimal.

- Core functionality requires only Playwright and AI SDK
- No unnecessary utility libraries; prefer native solutions
- Each dependency must serve a clear, irreplaceable purpose
- Security vulnerabilities in dependencies must be addressed promptly
- Peer dependencies over bundled dependencies when possible

## Article VII: Cross-Platform Consistency

The tool must work identically across operating systems.

- Tested on macOS, Linux, and Windows
- File paths handled with platform-agnostic methods
- No shell-specific commands in core logic
- CI pipeline validates all platforms
- Documentation notes any platform-specific considerations

## Article VIII: Test Coverage

All code must be tested before merge.

- Unit tests for utility functions and parsers
- Integration tests for crawling and generation flows
- Contract tests for AI API interactions
- Minimum 80% code coverage for new features
- Tests run automatically on pull requests

## Article IX: Documentation as Code

Documentation must evolve with the codebase.

- README updated with every user-facing change
- CLI help text is the primary documentation
- Code comments explain "why" not "what"
- Examples provided for all major features
- CHANGELOG maintained for all releases

## Article X: Community-Friendly Development

The project must welcome and enable contributors.

- Clear contribution guidelines in CONTRIBUTING.md
- Issues labeled for difficulty and type
- Pull request template guides contributors
- Code style enforced via automated linting
- Responsive to issues and pull requests within one week

## Technology Boundaries

### Required Stack

- Runtime: Node.js (LTS versions)
- Language: TypeScript with strict mode
- Browser Automation: Playwright
- AI Integration: Anthropic Claude API via MCP
- Package Manager: npm

### Prohibited

- Browser-specific APIs in core logic
- Synchronous file operations in main thread
- Hard-coded API endpoints
- Console.log for production output (use proper logging)
- Any dependency with known security vulnerabilities

## Quality Gates

No code shall be merged without passing:

- All existing tests pass
- New code has corresponding tests
- TypeScript compiles without errors
- Linting passes without warnings
- Documentation updated if user-facing changes

## Amendment Process

This constitution may be amended when:

- A limitation prevents serving users effectively
- Technology changes require adaptation
- Community feedback indicates improvement opportunity

Amendments require:

1. Documentation of the proposed change and rationale
2. Impact analysis on existing features and templates
3. Update to version number following semantic versioning:
   - MAJOR: Backward incompatible governance/principle removals or redefinitions
   - MINOR: New principle/section added or materially expanded guidance
   - PATCH: Clarifications, wording, typo fixes, non-semantic refinements
4. Update of dependent templates and documentation

All pull requests and code reviews MUST verify compliance with constitution principles. Complexity beyond these principles MUST be justified in the implementation plan's Complexity Tracking section.

**Version**: 2.0.0 | **Ratified**: 2025-01-01 | **Last Amended**: 2025-01-01
