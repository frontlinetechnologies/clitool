---
name: page-analysis
version: 1.0.0
description: Analyzes web pages to generate human-readable descriptions of their purpose and functionality
max_tokens: 500
variables:
  - name: url
    required: true
    description: The URL of the page being analyzed
  - name: title
    required: false
    description: The page title if available
  - name: content
    required: false
    description: Page content preview (truncated to 2000 chars)
---

Analyze this web page and provide a brief, human-readable description (2-3 sentences) of what this page is about and its primary purpose.

URL: {{url}}
{{#if title}}Title: {{title}}{{/if}}

{{#if content}}
Content preview:
{{content}}
{{/if}}

Provide a concise description focusing on the page's purpose and main functionality.
