# Data Model: End-to-End Test Generation

**Feature**: Generate End-to-End Tests  
**Date**: 2025-12-16

## Entities

### GeneratedTestSuite

Represents the collection of generated Playwright test files organized by user flows.

**Attributes**:
- `outputDirectory` (string, required): Directory where test files are saved
- `testFiles` (TestFile[], required): Array of generated test files
- `summary` (TestGenerationSummary, required): Summary statistics
- `generatedAt` (string, required): ISO 8601 timestamp when tests were generated

**Validation Rules**:
- Output directory must be valid, writable path
- Test files array must contain at least one file (or empty-results file)
- Summary counts must match generated test files

**Relationships**:
- Contains multiple TestFiles
- Contains one TestGenerationSummary

---

### TestFile

Represents a single generated Playwright test file (one file per user flow).

**Attributes**:
- `filename` (string, required): Test file name (e.g., `login-flow.spec.ts`)
- `flow` (UserFlow, optional): Associated user flow (if file is flow-based)
- `testCases` (TestCase[], required): Array of test cases in this file
- `imports` (string[], required): Required Playwright imports
- `code` (string, required): Generated TypeScript test code

**Validation Rules**:
- Filename must end with `.spec.ts`
- Filename must be valid file name (no invalid characters)
- Code must be valid TypeScript/Playwright syntax
- Imports must include required Playwright imports

**Relationships**:
- Belongs to one GeneratedTestSuite
- May reference one UserFlow
- Contains multiple TestCases

---

### TestCase

Represents an individual test scenario within a test file.

**Attributes**:
- `name` (string, required): Test case name/description
- `type` (string, required): Test type ("navigation", "form-submission", "scenario", "basic")
- `steps` (TestStep[], required): Array of test steps
- `assertions` (Assertion[], required): Array of assertions
- `testData` (TestData, optional): Test data used in this test case

**Validation Rules**:
- Name must be non-empty, descriptive string
- Type must be valid test type
- Steps array must contain at least one step
- Assertions array must contain at least one assertion

**Relationships**:
- Belongs to one TestFile
- Contains multiple TestSteps
- Contains multiple Assertions
- May reference one TestData

---

### TestStep

Represents a single action step in a test case (e.g., navigate, fill form, click button).

**Attributes**:
- `action` (string, required): Action type ("goto", "fill", "click", "wait", "select")
- `target` (string, required): Target element or URL
- `value` (string, optional): Value for actions like "fill" or "select"
- `locator` (string, optional): Playwright locator string
- `order` (number, required): Step order in sequence

**Validation Rules**:
- Action must be valid Playwright action
- Target must be valid (URL for goto, selector for elements)
- Order must be positive integer, sequential

**Relationships**:
- Belongs to one TestCase

---

### Assertion

Represents a verification assertion in a test case.

**Attributes**:
- `type` (string, required): Assertion type ("url", "title", "visible", "value", "text")
- `target` (string, required): Target element or page
- `expected` (string, required): Expected value
- `locator` (string, optional): Playwright locator for element assertions

**Validation Rules**:
- Type must be valid Playwright assertion type
- Target must be valid
- Expected value must match assertion type

**Relationships**:
- Belongs to one TestCase

---

### TestData

Represents test data used in test cases (input values, test strings).

**Attributes**:
- `email` (string, optional): Test email address
- `password` (string, optional): Test password
- `text` (string, optional): Generic text value
- `phone` (string, optional): Test phone number
- `creditCard` (string, optional): Test credit card number
- `couponCode` (string, optional): Test coupon code
- `date` (string, optional): Test date value
- `custom` (Record<string, string>, optional): Custom field values

**Validation Rules**:
- Values must match expected formats (email format, phone format, etc.)
- Custom values must be string key-value pairs

**Relationships**:
- Used by multiple TestCases

---

### TestGenerationSummary

Represents summary statistics for test generation.

**Attributes**:
- `totalTestFiles` (number, required): Total number of generated test files
- `totalTestCases` (number, required): Total number of test cases generated
- `flowsCovered` (number, required): Number of user flows covered
- `scenariosDetected` (number, required): Number of specific scenarios detected
- `pagesTested` (number, required): Number of pages with tests
- `aiEnhanced` (boolean, required): Whether AI was used for enhancement

**Validation Rules**:
- All counts must be non-negative integers
- Counts must match actual generated content

**Relationships**:
- Summarizes one GeneratedTestSuite

---

### SpecificScenario

Represents a specific test scenario detected in crawl results (e.g., coupon code entry).

**Attributes**:
- `type` (string, required): Scenario type ("coupon-code", "promo-code", "discount", "custom")
- `detectionPattern` (string, required): Pattern that detected this scenario (field name, placeholder, etc.)
- `pageUrl` (string, required): URL of page where scenario was detected
- `inputField` (InputField, required): Input field associated with scenario
- `testData` (string, optional): Generated test data for this scenario

**Validation Rules**:
- Type must be valid scenario type
- Page URL must be valid and present in crawl results
- Input field must be valid

**Relationships**:
- Belongs to one Page (via URL)
- References one InputField
- Used in one TestCase

---

## Data Flow

1. **Input**: Read crawl results JSON from stdin
2. **Parse**: Validate and parse crawl results (reuse `parseCrawlResults()`)
3. **Flow Detection**: Detect user flows (reuse `detectCriticalFlows()`)
4. **Scenario Detection**: Detect specific scenarios (coupon codes, etc.)
5. **Test Generation**:
   - For each detected flow:
     - Create TestFile entity
     - Generate navigation TestCases
     - Generate form submission TestCases
     - Include specific scenarios in flow file
     - Use AI to enhance test scenarios (if available)
   - For pages without flows:
     - Create navigation TestFile
     - Generate basic navigation TestCases
6. **Code Generation**:
   - Convert TestFile entities to Playwright TypeScript code
   - Generate imports, test structure, test cases
   - Format code with proper indentation
7. **File Writing**:
   - Write each TestFile to output directory
   - Create directory if needed
   - Handle existing files (warning + overwrite)
8. **Summary**: Generate TestGenerationSummary

---

## State Transitions

### Test Generation States

```
Initialized → Parsing → Detecting → Generating → Writing → Complete
                ↓          ↓            ↓           ↓
              Error      Error        Error      Error
```

- **Initialized**: Command started, stdin ready
- **Parsing**: Reading and validating crawl results JSON
- **Detecting**: Detecting flows and scenarios
- **Generating**: Creating test files and test cases
- **Writing**: Writing test files to disk
- **Complete**: All test files written, summary displayed
- **Error**: Failed at any stage, error message displayed

### AI Enhancement States

```
Pending → Calling → Success → Merged
          ↓
        Error → Fallback
```

- **Pending**: Test scenario queued for AI enhancement
- **Calling**: API request in progress
- **Success**: Enhanced scenario received
- **Merged**: AI enhancements merged into test cases
- **Error**: API call failed, use pattern-based generation
- **Fallback**: Using pattern-based test generation

---

## Data Persistence

**In-Memory During Generation**: All test entities stored in memory during generation.

**File System Output**: Generated test files written to filesystem:
- Location: Configurable directory (default: `./tests/generated/`)
- Format: TypeScript files (`.spec.ts` extension)
- Structure: One file per user flow

**Input**: Crawl results JSON read from stdin (matching crawl output schema)

**Output**: Playwright test files written to filesystem

---

## Normalization Rules

### Test File Naming

- Convert flow name to kebab-case: `Login Flow` → `login-flow.spec.ts`
- Handle special characters: Remove or replace invalid filename characters
- Ensure uniqueness: If duplicate flow names, append number (e.g., `login-flow-2.spec.ts`)

### Test Case Naming

- Use descriptive names: `should navigate to login page`, `should fill login form and submit`
- Follow Playwright conventions: Use `test()` function with descriptive string
- Include flow context: Test names should indicate which flow they belong to

### Locator Generation

- **By role**: `page.getByRole('button', { name: 'Submit' })`
- **By label**: `page.getByLabel('Email')`
- **By placeholder**: `page.getByPlaceholder('Enter email')`
- **By ID**: `page.locator('#email')`
- **By name**: `page.locator('[name="email"]')`
- Prefer semantic locators (role, label) over technical locators (ID, class)

### Test Data Normalization

- **Email**: Always use `@example.com` domain for test emails
- **Password**: Use secure test passwords with mixed case, numbers, special chars
- **Phone**: Use standard format: `+1-555-123-4567` or `555-123-4567`
- **Credit Card**: Use test card numbers (Visa: `4111111111111111`)
- **Coupon Codes**: Use uppercase, descriptive codes: `TESTCOUPON`, `PROMO2024`

### Flow-to-File Mapping

- **One flow → One file**: Each detected user flow generates one test file
- **Multiple scenarios → One file**: Specific scenarios included in their flow file
- **No flow → Navigation file**: Pages without flows generate `navigation.spec.ts`
- **Empty results → Empty file**: Generate `empty-results.spec.ts` with explanation

---

## Relationships Summary

```
GeneratedTestSuite
├── contains → TestFile[] (one per flow)
│   ├── references → UserFlow (optional)
│   └── contains → TestCase[]
│       ├── contains → TestStep[]
│       ├── contains → Assertion[]
│       └── references → TestData (optional)
├── contains → TestGenerationSummary
└── references → CrawlResultsInput (input)

SpecificScenario
├── references → Page (via URL)
├── references → InputField
└── used in → TestCase

UserFlow (from documentation models)
└── generates → TestFile
```



