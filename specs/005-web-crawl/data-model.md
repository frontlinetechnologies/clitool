# Data Model: Web Crawler

**Feature**: Crawl a Web Application  
**Date**: 2024-12-16

## Entities

### Page

Represents a discovered web page during crawl.

**Attributes**:
- `url` (string, required): Normalized URL of the page
- `status` (number, required): HTTP status code (200, 404, 500, etc.)
- `title` (string, optional): Page title from `<title>` tag
- `discoveredAt` (string, required): ISO 8601 timestamp when page was discovered
- `processedAt` (string, optional): ISO 8601 timestamp when page was processed
- `links` (string[], optional): Array of normalized URLs discovered on this page (same domain only)
- `error` (string, optional): Error message if page could not be accessed

**Validation Rules**:
- URL must be valid and normalized (trailing slash normalized, fragment removed)
- Status code must be valid HTTP status (100-599)
- Links array contains only same-domain URLs

**Relationships**:
- Contains zero or more Forms
- Contains zero or more Buttons
- Contains zero or more InputFields
- Links to other Pages (via links array)

---

### Form

Represents an HTML form element discovered on a page.

**Attributes**:
- `id` (string, optional): Form `id` attribute
- `action` (string, required): Form action URL (absolute or relative)
- `method` (string, required): HTTP method (GET, POST, etc., defaults to "GET")
- `pageUrl` (string, required): URL of the page containing this form
- `inputFields` (InputField[], optional): Array of input fields within this form

**Validation Rules**:
- Method must be valid HTTP method (GET, POST, PUT, DELETE, PATCH)
- Action URL must be valid (can be relative or absolute)

**Relationships**:
- Belongs to one Page (via pageUrl)
- Contains zero or more InputFields

---

### Button

Represents an interactive button element discovered on a page.

**Attributes**:
- `type` (string, required): Button type (button, submit, reset)
- `text` (string, optional): Button text/label content
- `id` (string, optional): Button `id` attribute
- `className` (string, optional): Button CSS class names
- `pageUrl` (string, required): URL of the page containing this button
- `formId` (string, optional): Associated form `id` if button is within a form

**Validation Rules**:
- Type must be valid button type (button, submit, reset)
- Text may be empty (for icon buttons)

**Relationships**:
- Belongs to one Page (via pageUrl)
- May belong to one Form (via formId)

---

### InputField

Represents an HTML input element discovered on a page.

**Attributes**:
- `type` (string, required): Input type (text, email, password, checkbox, radio, etc.)
- `name` (string, optional): Input `name` attribute
- `id` (string, optional): Input `id` attribute
- `required` (boolean, optional): Whether input has `required` attribute
- `placeholder` (string, optional): Placeholder text
- `pageUrl` (string, required): URL of the page containing this input
- `formId` (string, optional): Associated form `id` if input is within a form

**Validation Rules**:
- Type must be valid HTML input type
- Name should be present for form inputs (may be missing for standalone inputs)

**Relationships**:
- Belongs to one Page (via pageUrl)
- May belong to one Form (via formId)

---

### CrawlSummary

Represents the aggregated results of a crawl session.

**Attributes**:
- `totalPages` (number, required): Total number of pages discovered
- `totalForms` (number, required): Total number of forms found
- `totalButtons` (number, required): Total number of buttons found
- `totalInputFields` (number, required): Total number of input fields found
- `errors` (number, required): Number of pages that could not be accessed
- `skipped` (number, required): Number of pages skipped (robots.txt, auth, etc.)
- `interrupted` (boolean, required): Whether crawl was interrupted before completion
- `startTime` (string, required): ISO 8601 timestamp when crawl started
- `endTime` (string, optional): ISO 8601 timestamp when crawl completed (null if interrupted)
- `duration` (number, optional): Crawl duration in seconds (null if interrupted)

**Validation Rules**:
- All counts must be non-negative integers
- endTime must be after startTime if both present
- duration must match endTime - startTime if both present

**Relationships**:
- Aggregates data from multiple Pages, Forms, Buttons, InputFields

---

## Data Flow

1. **Crawl Start**: Initialize CrawlSummary with startTime
2. **Page Discovery**: Create Page entity for each discovered URL
3. **Page Processing**: Extract Forms, Buttons, InputFields from Page HTML
4. **Link Discovery**: Extract links from Page, normalize, add to links array
5. **Deduplication**: Check normalized URL against discovered pages set
6. **Aggregation**: Update CrawlSummary counts as pages/elements discovered
7. **Crawl End/Interrupt**: Set endTime, duration, generate final summary

---

## State Transitions

### Page States

```
Discovered → Processing → Processed
                ↓
              Error
```

- **Discovered**: URL found, added to queue
- **Processing**: Currently being fetched/parsed
- **Processed**: Successfully processed, elements extracted
- **Error**: Failed to access or parse (status 4xx/5xx, network error)

### Crawl States

```
Initialized → Crawling → Completed
                ↓
            Interrupted
```

- **Initialized**: Crawl started, robots.txt fetched
- **Crawling**: Actively discovering and processing pages
- **Completed**: All accessible pages processed
- **Interrupted**: User interrupted (Ctrl+C), partial results saved

---

## Data Persistence

**In-Memory Only**: All data stored in memory during crawl. No database or file storage required.

**Output**: Data serialized to JSON or text format at crawl completion or interruption.

---

## Normalization Rules

### URL Normalization (FR-021)

1. Parse URL using Node.js `url` module
2. Remove fragment (#section) from URL
3. Normalize trailing slash:
   - `/page` → `/page/` (if directory-like)
   - `/page.html` → `/page.html` (no trailing slash for files)
4. Preserve query strings as-is
5. Use normalized URL as unique identifier

**Example**:
- `/page`, `/page/`, `/page#section` → all normalize to `/page/`
- `/page?param=value` → `/page?param=value` (query preserved)

### Deduplication Strategy

- Use Set/Map with normalized URL as key
- Before crawling URL, check if normalized version exists
- Skip if already discovered
- Count each unique normalized URL once in summary

