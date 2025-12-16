# Data Model: Site Documentation Generation

**Feature**: Generate Site Documentation  
**Date**: 2024-12-19

## Entities

### Documentation

Represents the generated Markdown documentation describing site structure, navigation paths, and user flows.

**Attributes**:
- `title` (string, required): Documentation title (e.g., "Site Documentation")
- `summary` (DocumentationSummary, required): Summary statistics
- `siteStructure` (SiteStructure, required): Hierarchical organization of pages
- `navigationPaths` (NavigationPath[], required): Array of navigation sequences
- `criticalFlows` (UserFlow[], required): Array of critical user flows
- `pageDetails` (PageDetail[], required): Detailed information about each page
- `generatedAt` (string, required): ISO 8601 timestamp when documentation was generated

**Validation Rules**:
- Title must be non-empty string
- Summary must contain valid counts (non-negative integers)
- Navigation paths must reference valid page URLs
- Critical flows must reference valid pages

**Relationships**:
- Contains one DocumentationSummary
- Contains one SiteStructure
- Contains multiple NavigationPaths
- Contains multiple UserFlows
- Contains multiple PageDetails

---

### DocumentationSummary

Represents summary statistics in the generated documentation.

**Attributes**:
- `totalPages` (number, required): Total number of pages documented
- `totalForms` (number, required): Total number of forms found
- `totalButtons` (number, required): Total number of buttons found
- `totalInputFields` (number, required): Total number of input fields found
- `criticalFlowsCount` (number, required): Number of critical user flows identified
- `navigationPathsCount` (number, required): Number of navigation paths documented

**Validation Rules**:
- All counts must be non-negative integers
- Counts must match aggregated data from crawl results

**Relationships**:
- Aggregates data from CrawlResults

---

### SiteStructure

Represents the hierarchical organization of pages in the site.

**Attributes**:
- `homePage` (string, required): URL of the home/entry page
- `sections` (Section[], required): Array of logical sections (grouped by URL prefix)
- `hierarchy` (PageNode, required): Tree structure representing page hierarchy

**Validation Rules**:
- Home page URL must be valid and present in crawl results
- Sections must contain valid page URLs
- Hierarchy must be a valid tree structure

**Relationships**:
- Contains multiple Sections
- Contains one PageNode (root of hierarchy)

---

### Section

Represents a logical section of the site (grouped by URL prefix).

**Attributes**:
- `name` (string, required): Section name (e.g., "Products", "About")
- `urlPrefix` (string, required): URL prefix for this section (e.g., "/products/")
- `pages` (string[], required): Array of page URLs in this section
- `depth` (number, required): URL depth level (0 = root, 1 = first level, etc.)

**Validation Rules**:
- Name must be non-empty string
- URL prefix must be valid path prefix
- Pages array must contain valid URLs from crawl results

**Relationships**:
- Contains multiple Pages (via URLs)

---

### PageNode

Represents a node in the page hierarchy tree.

**Attributes**:
- `url` (string, required): Page URL
- `title` (string, optional): Page title
- `children` (PageNode[], optional): Child pages in hierarchy

**Validation Rules**:
- URL must be valid and present in crawl results
- Children must form valid tree (no cycles)

**Relationships**:
- May have parent PageNode
- May have multiple child PageNodes

---

### NavigationPath

Represents a sequence of pages connected by links showing how users navigate through the site.

**Attributes**:
- `id` (string, required): Unique identifier for this path
- `pages` (string[], required): Ordered array of page URLs in navigation sequence
- `description` (string, optional): Human-readable description of the path
- `frequency` (number, optional): How often this path appears (based on link frequency)

**Validation Rules**:
- Pages array must contain at least 2 URLs
- All URLs must be valid and present in crawl results
- Pages must form valid navigation sequence (each page links to next)

**Relationships**:
- References multiple Pages (via URLs)

---

### UserFlow

Represents a critical user journey such as login, checkout, or form submission.

**Attributes**:
- `type` (string, required): Flow type ("login", "checkout", "form-submission")
- `name` (string, required): Flow name (e.g., "Login Flow", "Checkout Flow")
- `pages` (FlowPage[], required): Array of pages involved in the flow
- `description` (string, optional): Human-readable description of the flow
- `priority` (number, optional): Priority score (higher = more critical)

**Validation Rules**:
- Type must be valid flow type
- Name must be non-empty string
- Pages array must contain at least one page
- Priority must be non-negative number

**Relationships**:
- Contains multiple FlowPages

---

### FlowPage

Represents a page within a user flow.

**Attributes**:
- `url` (string, required): Page URL
- `step` (number, required): Step number in flow sequence (1, 2, 3, ...)
- `role` (string, optional): Role in flow (e.g., "entry", "form", "confirmation")
- `forms` (string[], optional): Array of form IDs on this page
- `description` (string, optional): Description of page's role in flow

**Validation Rules**:
- URL must be valid and present in crawl results
- Step must be positive integer
- Step numbers must be sequential (1, 2, 3, ...)

**Relationships**:
- Belongs to one UserFlow
- References one Page (via URL)

---

### PageDetail

Represents detailed information about a page in the documentation.

**Attributes**:
- `url` (string, required): Page URL
- `title` (string, optional): Page title
- `description` (string, optional): AI-generated or structural description
- `forms` (FormSummary[], optional): Array of forms on this page
- `buttons` (ButtonSummary[], optional): Array of buttons on this page
- `inputFields` (InputFieldSummary[], optional): Array of input fields on this page
- `links` (string[], optional): Array of links to other pages
- `section` (string, optional): Section name this page belongs to

**Validation Rules**:
- URL must be valid and present in crawl results
- Links must reference valid page URLs

**Relationships**:
- Belongs to one Section (optional)
- References multiple Pages (via links)

---

### FormSummary

Represents a summary of a form for documentation.

**Attributes**:
- `id` (string, optional): Form ID
- `action` (string, required): Form action URL
- `method` (string, required): HTTP method
- `inputCount` (number, required): Number of input fields in form

**Relationships**:
- Belongs to one PageDetail

---

### ButtonSummary

Represents a summary of a button for documentation.

**Attributes**:
- `id` (string, optional): Button ID
- `type` (string, required): Button type
- `text` (string, optional): Button text

**Relationships**:
- Belongs to one PageDetail

---

### InputFieldSummary

Represents a summary of an input field for documentation.

**Attributes**:
- `id` (string, optional): Input ID
- `type` (string, required): Input type
- `name` (string, optional): Input name
- `required` (boolean, optional): Whether field is required

**Relationships**:
- Belongs to one PageDetail

---

## Data Flow

1. **Input**: Read crawl results JSON from stdin
2. **Parse**: Validate and parse crawl results (Pages, Forms, Buttons, InputFields, CrawlSummary)
3. **Structure Analysis**: 
   - Analyze URL patterns to create SiteStructure
   - Build page hierarchy tree (PageNode)
   - Group pages into Sections
4. **Navigation Analysis**: 
   - Extract link relationships from Pages
   - Build NavigationPath sequences
5. **Flow Detection**:
   - Detect login flows (password fields + email/username)
   - Detect checkout flows (payment fields, checkout URLs)
   - Detect form submission flows (form action URLs, navigation)
   - Create UserFlow entities
6. **Page Analysis**:
   - For each page, call Anthropic API (if available) for description
   - Fall back to structural description if API unavailable
   - Create PageDetail entities
7. **Aggregation**: 
   - Create DocumentationSummary from crawl results
   - Assemble Documentation entity
8. **Formatting**: 
   - Convert Documentation to Markdown format
   - Write to stdout or file

---

## State Transitions

### Documentation Generation States

```
Initialized → Parsing → Analyzing → Generating → Formatting → Complete
                ↓          ↓           ↓
              Error      Error      Error
```

- **Initialized**: Command started, stdin ready
- **Parsing**: Reading and validating crawl results JSON
- **Analyzing**: Processing structure, navigation, flows
- **Generating**: Calling AI API, creating descriptions
- **Formatting**: Converting to Markdown
- **Complete**: Documentation written to output
- **Error**: Failed at any stage, error message displayed

### AI API Call States

```
Pending → Calling → Success
          ↓
        Error → Fallback
```

- **Pending**: Page queued for AI analysis
- **Calling**: API request in progress
- **Success**: Description received
- **Error**: API call failed, fall back to structural description
- **Fallback**: Using structural description instead of AI-generated

---

## Data Persistence

**In-Memory Only**: All data stored in memory during generation. No database or file storage required.

**Input**: Crawl results JSON read from stdin (matching crawl output schema)

**Output**: Markdown documentation written to stdout or file

---

## Normalization Rules

### URL Handling

- Use normalized URLs from crawl results (already normalized by crawl command)
- Preserve URL structure for hierarchy analysis
- Group by URL prefix for sections

### Flow Detection Patterns

- **Login Flow**: 
  - Page contains input field with `type="password"`
  - Same page contains input field with `type="email"` or `name` containing "username"/"email"
  
- **Checkout Flow**:
  - Page contains input fields with types: "tel" (phone), or names containing "card", "cvv", "billing", "payment"
  - OR page URL contains "checkout", "cart", "payment", "billing"
  
- **Form Submission Flow**:
  - Multiple pages with forms sharing action URL
  - Navigation path between form pages detected

### Section Grouping

- Group pages by URL prefix (e.g., `/products/`, `/about/`)
- Determine depth from URL path segments
- Root level: `/` or empty prefix
- First level: `/section/`
- Second level: `/section/subsection/`

