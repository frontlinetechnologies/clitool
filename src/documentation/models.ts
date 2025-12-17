/**
 * Documentation models representing the structure of generated documentation.
 * These models define the data structures used throughout the documentation generation process.
 */

/**
 * Summary statistics for the generated documentation.
 */
export interface DocumentationSummary {
  totalPages: number;
  totalForms: number;
  totalButtons: number;
  totalInputFields: number;
  criticalFlowsCount: number;
  navigationPathsCount: number;
}

/**
 * Represents a logical section of the site (grouped by URL prefix).
 */
export interface Section {
  name: string;
  urlPrefix: string;
  pages: string[]; // Array of page URLs
  depth: number; // URL depth level (0 = root, 1 = first level, etc.)
}

/**
 * Represents a node in the page hierarchy tree.
 */
export interface PageNode {
  url: string;
  title?: string;
  children?: PageNode[];
}

/**
 * Represents the hierarchical organization of pages in the site.
 */
export interface SiteStructure {
  homePage: string; // URL of the home/entry page
  sections: Section[];
  hierarchy: PageNode; // Root node of hierarchy tree
}

/**
 * Represents a sequence of pages connected by links showing navigation paths.
 */
export interface NavigationPath {
  id: string; // Unique identifier for this path
  pages: string[]; // Ordered array of page URLs
  description?: string; // Human-readable description
  frequency?: number; // How often this path appears
}

/**
 * Represents a page within a user flow.
 */
export interface FlowPage {
  url: string;
  step: number; // Step number in flow sequence (1, 2, 3, ...)
  role?: string; // Role in flow (e.g., "entry", "form", "confirmation")
  forms?: string[]; // Array of form IDs on this page
  description?: string; // Description of page's role in flow
}

/**
 * Represents a critical user journey such as login, checkout, or form submission.
 */
export interface UserFlow {
  type: 'login' | 'checkout' | 'form-submission';
  name: string; // Flow name (e.g., "Login Flow", "Checkout Flow")
  pages: FlowPage[];
  description?: string; // Human-readable description
  priority?: number; // Priority score (higher = more critical)
}

/**
 * Summary of a form for documentation.
 */
export interface FormSummary {
  id?: string;
  action: string;
  method: string;
  inputCount: number;
}

/**
 * Summary of a button for documentation.
 */
export interface ButtonSummary {
  id?: string;
  type: string;
  text?: string;
}

/**
 * Summary of an input field for documentation.
 */
export interface InputFieldSummary {
  id?: string;
  type: string;
  name?: string;
  required?: boolean;
}

/**
 * Detailed information about a page in the documentation.
 */
export interface PageDetail {
  url: string;
  title?: string;
  description?: string; // AI-generated or structural description
  forms?: FormSummary[];
  buttons?: ButtonSummary[];
  inputFields?: InputFieldSummary[];
  links?: string[]; // Array of links to other pages
  section?: string; // Section name this page belongs to
}

/**
 * Complete documentation structure representing generated Markdown documentation.
 */
export interface Documentation {
  title: string;
  summary: DocumentationSummary;
  siteStructure: SiteStructure;
  navigationPaths: NavigationPath[];
  criticalFlows: UserFlow[];
  pageDetails: PageDetail[];
  generatedAt: string; // ISO 8601 timestamp
}

/**
 * Re-export CrawlResultsInput from shared module for backwards compatibility.
 */
export { CrawlResultsInput } from '../shared/models';

