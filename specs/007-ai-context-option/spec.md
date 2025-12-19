# Feature Specification: AI Context Option

**Feature Branch**: `007-ai-context-option`
**Created**: 2025-12-19
**Status**: Draft
**Input**: Users of this CLI tool should optionally be able to add extra context to the AI prompts. This could give more context about the site it is testing against. The user can provide user flows that are important, important parts that need to be tested, and things the tests should avoid. This spec is about adding an optional option that can be added to the CLI tool for this, supporting large texts in plain text or markdown format.

## Clarifications

### Session 2025-12-19

- Q: How should multiple context sources be separated when merged? → A: Add a header label before each source (e.g., "### From File:", "### Inline:")
- Q: What threshold triggers a size warning and what happens at the limit? → A: Warn at 50KB, allow up to 100KB (soft limit with warning only)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Provide Context via File (Priority: P1)

A user wants to supply a file containing testing context (e.g., important user flows, areas to focus on, things to avoid) so that the AI-generated tests are more relevant and targeted to their application.

**Why this priority**: This is the primary use case. Files naturally handle large text content and are easy to version control alongside the project. Most users will have documentation or notes they want to reference.

**Independent Test**: Can be fully tested by running a CLI command with a context file path and verifying the AI receives the context content. Delivers immediate value by improving test relevance.

**Acceptance Scenarios**:

1. **Given** a user has a markdown file `testing-context.md` with their site-specific testing notes, **When** they run the CLI with `--context testing-context.md`, **Then** the AI prompt includes the file contents as additional context.

2. **Given** a user specifies a context file that does not exist, **When** they run the CLI with `--context nonexistent.md`, **Then** the CLI displays a clear error message indicating the file was not found and exits with a non-zero status code.

3. **Given** a user provides a very large context file (up to 100KB), **When** they run the CLI with `--context large-file.md`, **Then** the file content is successfully passed to the AI without truncation.

---

### User Story 2 - Provide Context via Inline Text (Priority: P2)

A user wants to quickly provide a short piece of context directly on the command line without creating a file, for simple use cases or quick adjustments.

**Why this priority**: Provides convenience for quick one-off context additions without file overhead. Useful for CI/CD pipelines or scripting scenarios.

**Independent Test**: Can be tested by running a CLI command with inline context text and verifying the AI receives the context.

**Acceptance Scenarios**:

1. **Given** a user wants to add a quick note, **When** they run the CLI with `--context-text "Focus on the checkout flow, avoid testing admin pages"`, **Then** the AI prompt includes this text as additional context.

2. **Given** a user provides both `--context` (file) and `--context-text` (inline), **When** they run the CLI, **Then** both sources of context are combined (file content first, then inline text).

---

### User Story 3 - Environment Variable Context (Priority: P3)

A user wants to set testing context via an environment variable so that the same context applies to all CLI invocations in a session or CI environment without specifying it repeatedly.

**Why this priority**: Convenience feature for power users and CI/CD environments. Reduces repetition when running multiple commands with the same context.

**Independent Test**: Can be tested by setting the environment variable and verifying the context is used without command-line flags.

**Acceptance Scenarios**:

1. **Given** a user has set `TESTARION_CONTEXT="Always test with logged-in user state"`, **When** they run the CLI without any context flags, **Then** the AI prompt includes this environment variable content as context.

2. **Given** a user has set the environment variable and also provides `--context` or `--context-text`, **When** they run the CLI, **Then** the command-line options take precedence and are combined with the environment variable context (env var content comes last).

---

### Edge Cases

- What happens when the context file is empty? (Accept it, treat as no additional context)
- What happens when the context file is binary or not valid text? (Display error, suggest using plain text or markdown)
- What happens when the total context exceeds reasonable limits? (Display warning at 50KB threshold, reject with error at 100KB limit)
- How does system handle invalid UTF-8 encoding in the context file? (Display error with helpful message about encoding)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept an optional `--context` flag that takes a file path as argument
- **FR-002**: System MUST accept an optional `--context-text` flag that takes inline text as argument
- **FR-003**: System MUST support reading context from `TESTARION_CONTEXT` environment variable
- **FR-004**: System MUST read context files as UTF-8 encoded text
- **FR-005**: System MUST support both plain text (.txt) and markdown (.md) context files
- **FR-006**: System MUST validate that the specified context file exists and is readable before proceeding
- **FR-007**: System MUST display clear error messages when context files cannot be read
- **FR-008**: System MUST combine multiple context sources in this order: file content, inline text, environment variable. Each source MUST be prefixed with a header label (e.g., "### From File:", "### Inline:", "### From Environment:") for clarity and traceability
- **FR-009**: System MUST pass the combined context to the AI prompt generation system
- **FR-010**: System MUST support context files up to 100KB in size. System MUST display a warning when combined context exceeds 50KB but continue processing. System MUST reject content exceeding 100KB with a clear error message

### Key Entities

- **Context**: The additional testing guidance provided by the user. Contains text content that describes user flows, focus areas, or items to avoid. Can originate from file, inline text, or environment variable.
- **Context Source**: The origin of context data (file path, inline text, or environment variable name).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can provide context via file and see it reflected in AI-generated test suggestions
- **SC-002**: Users can provide inline context text for quick adjustments without creating files
- **SC-003**: Users can set environment variable context for session-wide defaults
- **SC-004**: Context from all sources (file, inline, environment) is properly combined when multiple are specified
- **SC-005**: Error messages for missing or unreadable files are actionable and help users resolve the issue

## Assumptions

- Users are expected to provide context in English or the same language as their target application
- The AI model being used has sufficient context window to accommodate typical context file sizes (up to 100KB)
- Context files are stored on the local filesystem accessible to the CLI tool
- The CLI tool already has a mechanism for constructing AI prompts that can be extended to include additional context
