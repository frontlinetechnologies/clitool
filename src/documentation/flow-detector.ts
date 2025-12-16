/**
 * Flow detector for identifying critical user flows.
 * Detects login flows, checkout flows, and form submission flows per FR-011, FR-012, FR-013.
 */

import { Page } from '../models/page';
import { Form } from '../models/form';
import { UserFlow, FlowPage } from './models';

/**
 * Detects critical user flows from pages and forms.
 * Per FR-005: identifies login, checkout, and form submission flows.
 * Per FR-014: prioritizes flows by form complexity and page importance.
 *
 * @param pages - Array of pages to analyze
 * @param forms - Array of forms to analyze
 * @returns Array of detected user flows, sorted by priority
 */
export function detectCriticalFlows(pages: Page[], forms: Form[]): UserFlow[] {
  const flows: UserFlow[] = [];

  // Detect login flows (FR-011)
  const loginFlows = detectLoginFlows(pages, forms);
  flows.push(...loginFlows);

  // Detect checkout flows (FR-012)
  const checkoutFlows = detectCheckoutFlows(pages, forms);
  flows.push(...checkoutFlows);

  // Detect form submission flows (FR-013)
  const formFlows = detectFormSubmissionFlows(pages, forms);
  flows.push(...formFlows);

  // Prioritize flows (FR-014)
  return prioritizeFlows(flows);
}

/**
 * Detects login flows: pages with password fields + email/username fields.
 * Per FR-011: identifies authentication flows.
 */
function detectLoginFlows(pages: Page[], forms: Form[]): UserFlow[] {
  const flows: UserFlow[] = [];

  for (const page of pages) {
    const pageForms = forms.filter((f) => f.pageUrl === page.url);
    
    for (const form of pageForms) {
      const inputFields = form.inputFields || [];
      
      // Check for password field
      const hasPassword = inputFields.some((f) => f.type === 'password');
      
      // Check for email or username field
      const hasEmail = inputFields.some((f) => 
        f.type === 'email' || 
        f.name?.toLowerCase().includes('email') ||
        f.name?.toLowerCase().includes('username')
      );

      if (hasPassword && hasEmail) {
        // Find redirect page (dashboard, home, etc.)
        const redirectPage = findRedirectPage(page, pages);
        
        const flowPages: FlowPage[] = [
          {
            url: page.url,
            step: 1,
            role: 'entry',
            forms: form.id ? [form.id] : undefined,
            description: 'Login form with email and password',
          },
        ];

        if (redirectPage) {
          flowPages.push({
            url: redirectPage.url,
            step: 2,
            role: 'confirmation',
            description: 'Post-login redirect',
          });
        }

        flows.push({
          type: 'login',
          name: 'Login Flow',
          pages: flowPages,
          description: 'User authentication flow',
          priority: calculateFlowPriority(form, page, forms),
        });
      }
    }
  }

  return flows;
}

/**
 * Detects checkout flows: pages with payment fields or checkout URLs.
 * Per FR-012: identifies purchase completion flows.
 */
function detectCheckoutFlows(pages: Page[], forms: Form[]): UserFlow[] {
  const flows: UserFlow[] = [];

  for (const page of pages) {
    // Check URL for checkout keywords
    const urlLower = page.url.toLowerCase();
    const isCheckoutUrl = urlLower.includes('checkout') || 
                         urlLower.includes('cart') || 
                         urlLower.includes('payment') ||
                         urlLower.includes('billing');

    const pageForms = forms.filter((f) => f.pageUrl === page.url);
    
    // Check forms for payment fields
    let hasPaymentFields = false;
    for (const form of pageForms) {
      const inputFields = form.inputFields || [];
      const paymentFieldNames = ['card', 'cvv', 'cvc', 'billing', 'payment', 'credit'];
      const paymentFieldTypes = ['tel']; // Phone numbers often used for billing
      
      hasPaymentFields = inputFields.some((f) =>
        paymentFieldNames.some((name) => f.name?.toLowerCase().includes(name)) ||
        paymentFieldTypes.includes(f.type)
      );

      if (hasPaymentFields || isCheckoutUrl) {
        // Find related pages (cart, confirmation)
        const cartPage = pages.find((p) => p.url.toLowerCase().includes('cart'));
        const confirmationPage = pages.find((p) => 
          p.url.toLowerCase().includes('confirmation') ||
          p.url.toLowerCase().includes('success') ||
          p.url.toLowerCase().includes('thank')
        );

        const flowPages: FlowPage[] = [];

        if (cartPage && cartPage.url !== page.url) {
          flowPages.push({
            url: cartPage.url,
            step: 1,
            role: 'entry',
            description: 'Shopping cart',
          });
        }

        flowPages.push({
          url: page.url,
          step: flowPages.length + 1,
          role: 'form',
          forms: form.id ? [form.id] : undefined,
          description: 'Checkout/payment form',
        });

        if (confirmationPage && confirmationPage.url !== page.url) {
          flowPages.push({
            url: confirmationPage.url,
            step: flowPages.length + 1,
            role: 'confirmation',
            description: 'Order confirmation',
          });
        }

        flows.push({
          type: 'checkout',
          name: 'Checkout Flow',
          pages: flowPages,
          description: 'Purchase completion flow',
          priority: calculateFlowPriority(form, page, forms),
        });

        break; // Only create one checkout flow per page
      }
    }

    // If no forms but checkout URL, still create flow
    if (!hasPaymentFields && isCheckoutUrl && pageForms.length === 0) {
      flows.push({
        type: 'checkout',
        name: 'Checkout Flow',
        pages: [
          {
            url: page.url,
            step: 1,
            role: 'entry',
            description: 'Checkout page',
          },
        ],
        description: 'Checkout flow detected from URL',
        priority: 5, // Lower priority without forms
      });
    }
  }

  return flows;
}

/**
 * Detects form submission flows: forms grouped by action URL.
 * Per FR-013: identifies multi-step form processes.
 */
function detectFormSubmissionFlows(pages: Page[], forms: Form[]): UserFlow[] {
  const flows: UserFlow[] = [];
  
  // Group forms by action URL
  const formsByAction = new Map<string, Form[]>();
  for (const form of forms) {
    const action = form.action.toLowerCase();
    if (!formsByAction.has(action)) {
      formsByAction.set(action, []);
    }
    formsByAction.get(action)!.push(form);
  }

  // Find flows with multiple forms sharing action URL
  for (const [action, actionForms] of formsByAction.entries()) {
    if (actionForms.length >= 2) {
      // Multiple forms with same action - likely multi-step flow
      const formPages = actionForms.map((f) => {
        const page = pages.find((p) => p.url === f.pageUrl);
        return page;
      }).filter((p): p is Page => p !== undefined);

      if (formPages.length >= 2) {
        // Trace navigation path between form pages
        const flowPages: FlowPage[] = formPages.map((page, index) => {
          const form = actionForms.find((f) => f.pageUrl === page.url);
          return {
            url: page.url,
            step: index + 1,
            role: index === 0 ? 'entry' : index === formPages.length - 1 ? 'confirmation' : 'form',
            forms: form?.id ? [form.id] : undefined,
            description: `Step ${index + 1} of form submission`,
          };
        });

        flows.push({
          type: 'form-submission',
          name: `Form Submission Flow (${action})`,
          pages: flowPages,
          description: `Multi-step form flow with ${formPages.length} steps`,
          priority: calculateFormSubmissionPriority(actionForms, formPages),
        });
      }
    }
  }

  return flows;
}

/**
 * Finds redirect page from current page's links.
 */
function findRedirectPage(currentPage: Page, allPages: Page[]): Page | undefined {
  if (!currentPage.links || currentPage.links.length === 0) {
    return undefined;
  }

  // Look for common redirect destinations
  const redirectKeywords = ['dashboard', 'home', 'profile', 'account', 'main'];
  
  for (const linkUrl of currentPage.links) {
    const linkedPage = allPages.find((p) => p.url === linkUrl);
    if (linkedPage) {
      const urlLower = linkedPage.url.toLowerCase();
      if (redirectKeywords.some((keyword) => urlLower.includes(keyword))) {
        return linkedPage;
      }
    }
  }

  // Fallback to first linked page
  const firstLink = currentPage.links[0];
  return allPages.find((p) => p.url === firstLink);
}

/**
 * Calculates flow priority based on form complexity and page importance.
 * Per FR-014: higher priority for more complex forms and important pages.
 */
function calculateFlowPriority(form: Form, page: Page, allForms: Form[]): number {
  let priority = 0;

  // Base priority from form complexity
  const inputCount = form.inputFields?.length || 0;
  priority += inputCount * 2; // More fields = higher priority

  // Boost for required fields
  const requiredCount = form.inputFields?.filter((f) => f.required).length || 0;
  priority += requiredCount * 3;

  // Boost for important page types
  const urlLower = page.url.toLowerCase();
  if (urlLower.includes('login') || urlLower.includes('checkout')) {
    priority += 10;
  }

  // Boost if form has many fields compared to average
  const avgFields = allForms.reduce((sum, f) => sum + (f.inputFields?.length || 0), 0) / Math.max(allForms.length, 1);
  if (inputCount > avgFields * 1.5) {
    priority += 5;
  }

  return priority;
}

/**
 * Calculates priority for form submission flows.
 */
function calculateFormSubmissionPriority(forms: Form[], pages: Page[]): number {
  let priority = 0;

  // More steps = higher priority
  priority += pages.length * 3;

  // More total fields = higher priority
  const totalFields = forms.reduce((sum, f) => sum + (f.inputFields?.length || 0), 0);
  priority += totalFields;

  return priority;
}

/**
 * Prioritizes flows by priority score (higher = more critical).
 * Per FR-014: sorts flows by calculated priority.
 */
function prioritizeFlows(flows: UserFlow[]): UserFlow[] {
  // Sort by priority (descending)
  return flows.sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    return priorityB - priorityA;
  });
}

