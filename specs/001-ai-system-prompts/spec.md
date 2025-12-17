# Feature Specification: AI System Prompts

**Feature Branch**: `001-ai-system-prompts`
**Created**: 2025-12-17
**Status**: Draft
**Input**: User description: "AI system prompts. When the CLI tool prompts the AI API, we should give a comprehensive system prompt to get the best results. Place these system prompts in an easily findable place and a readable format so it's easily editable when a user uses this open source CLI tool."

## Clarifications

### Session 2025-12-17

- Q: Where should the prompts directory be located within the CLI tool structure? → A: `prompts/` directory at CLI tool project root
- Q: How should the system handle upgrades when the user has customized prompts and the CLI tool ships with updated defaults? → A: Preserve user prompts; store new defaults in separate `prompts/defaults/` subdirectory
- Q: What should happen when a prompt file is missing or corrupted at runtime? → A: Fall back to default prompt from `prompts/defaults/`; warn user
- Q: Should the system log prompt loading events for debugging purposes? → A: Log only when verbose/debug mode is enabled

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Understand System Prompts (Priority: P1)

As a developer using the CLI tool, I want to easily find and read the AI system prompts so that I can understand what instructions the AI receives when generating tests and documentation.

**Why this priority**: Understanding what the AI is instructed to do is fundamental to using the tool effectively and trusting its outputs. Users cannot customize or debug issues without first being able to see the prompts.

**Independent Test**: Can be fully tested by navigating to the prompts directory and opening any prompt file to verify it's readable and well-documented.

**Acceptance Scenarios**:

1. **Given** a user has installed the CLI tool, **When** they navigate to the prompts directory, **Then** they find all system prompts organized in clearly named files
2. **Given** a user opens a prompt file, **When** they read the content, **Then** they can understand the prompt's purpose, context, and expected behavior without additional documentation

---

### User Story 2 - Customize System Prompts (Priority: P2)

As a developer with specific testing requirements, I want to edit the system prompts so that I can customize how the AI generates tests for my particular use case (e.g., industry-specific terminology, testing conventions, output format preferences).

**Why this priority**: Customization is the key value proposition for an open-source tool—users expect to tailor behavior to their needs. This depends on prompts being findable first (P1).

**Independent Test**: Can be fully tested by modifying a prompt file, running the CLI tool, and verifying the AI's output reflects the changes made.

**Acceptance Scenarios**:

1. **Given** a user edits a system prompt file, **When** they run the CLI tool's AI features, **Then** the AI uses the modified prompt in its API calls
2. **Given** a user makes an invalid edit to a prompt (e.g., removes required placeholders), **When** they run the CLI tool, **Then** they receive a clear error message indicating what's wrong with the prompt

---

### User Story 3 - Reset Prompts to Defaults (Priority: P3)

As a developer who has customized prompts, I want to restore the default prompts so that I can recover from problematic customizations or compare my changes against the original.

**Why this priority**: This is a safety net feature that becomes important after users start customizing (P2). Less critical for initial adoption.

**Independent Test**: Can be fully tested by modifying a prompt, running the reset command, and verifying the prompt returns to its original state.

**Acceptance Scenarios**:

1. **Given** a user has modified system prompts, **When** they run a reset/restore command, **Then** all prompts return to their default state
2. **Given** a user wants to reset only one specific prompt, **When** they run the reset command with that prompt's identifier, **Then** only that prompt is restored while others remain unchanged

---

### Edge Cases

- What happens when a prompt file is missing or corrupted at runtime? → System falls back to default prompt from `prompts/defaults/` and displays a warning to the user
- How does the system handle prompts with encoding issues (e.g., special characters)? → System assumes UTF-8 encoding; invalid encoding triggers fallback to default with warning
- What happens if a user deletes the entire prompts directory? → System recreates directory from `prompts/defaults/` on next run; warns user
- How are prompts handled when upgrading the CLI tool to a new version with updated default prompts? → User customizations are preserved; new defaults stored in `prompts/defaults/` for reference and reset operations

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store AI system prompts in a `prompts/` directory at the CLI tool project root
- **FR-002**: System MUST use a human-readable file format for prompts (plain text or Markdown)
- **FR-003**: Each prompt file MUST include clear documentation explaining its purpose, when it's used, and any required placeholders/variables
- **FR-004**: System MUST load prompts from the designated directory when making AI API calls
- **FR-005**: System MUST validate prompt files on load and provide clear error messages for malformed prompts
- **FR-006**: System MUST provide a command or mechanism to reset prompts to their default values
- **FR-007**: System MUST include default prompts for all AI-powered features (crawling, test generation, documentation generation)
- **FR-008**: Prompt files MUST use consistent naming conventions that indicate their purpose (e.g., `test-generation.md`, `crawl-analysis.md`)
- **FR-009**: System MUST support variable substitution in prompts (e.g., `{{url}}`, `{{page_title}}`) for dynamic context injection
- **FR-010**: System MUST store default/reference prompts in `prompts/defaults/` subdirectory, preserving user customizations in the parent `prompts/` directory during upgrades
- **FR-011**: System MUST fall back to default prompts from `prompts/defaults/` when user prompts are missing or corrupted, displaying a warning to inform the user
- **FR-012**: System MUST log prompt loading events (which prompt loaded, source location, variable substitutions) only when verbose/debug mode is enabled

### Key Entities

- **SystemPrompt**: A text template containing instructions for the AI, with optional placeholders for runtime context. Key attributes: name, purpose description, prompt content, required variables, version
- **PromptDirectory**: The file system location where all prompts are stored. Relationship: contains multiple SystemPrompt files
- **PromptContext**: Runtime data injected into prompts during API calls (e.g., current URL, page content, user preferences)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can locate and open any system prompt within 30 seconds of looking for it
- **SC-002**: Users can successfully modify a prompt and see the change reflected in AI behavior without requiring documentation
- **SC-003**: 100% of prompt files include a header explaining purpose and usage
- **SC-004**: All AI-powered CLI features use prompts from the centralized prompts directory (no hardcoded prompts in source code)
- **SC-005**: Prompt validation catches 100% of malformed prompts before API calls are made
- **SC-006**: Default prompts can be restored in a single command execution

## Assumptions

- Users have basic familiarity with text editors and file system navigation
- The CLI tool already has AI API integration in place (this feature focuses on prompt management, not API connectivity)
- Markdown is an acceptable format given its readability and widespread familiarity among developers
- Variable substitution uses a simple templating syntax (double curly braces) that doesn't require additional dependencies
