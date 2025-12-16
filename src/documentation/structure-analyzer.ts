/**
 * Structure analyzer for site organization and navigation.
 * Analyzes URL patterns, builds hierarchy trees, groups pages into sections, and extracts navigation paths.
 */

import { Page } from '../models/page';
import { SiteStructure, Section, PageNode, NavigationPath } from './models';

/**
 * Analyzes site structure from pages: identifies home page, groups into sections, builds hierarchy.
 * Per FR-010: organizes pages into logical sections based on URL patterns.
 *
 * @param pages - Array of pages to analyze
 * @returns SiteStructure with home page, sections, and hierarchy
 */
export function analyzeSiteStructure(pages: Page[]): SiteStructure {
  if (pages.length === 0) {
    return {
      homePage: '',
      sections: [],
      hierarchy: { url: '' },
    };
  }

  // Find home page (root URL or first page)
  const homePage = detectHomePage(pages);

  // Group pages into sections by URL prefix
  const sections = groupPagesIntoSections(pages);

  // Build hierarchy tree
  const hierarchy = buildHierarchyTree(pages, homePage);

  return {
    homePage,
    sections,
    hierarchy,
  };
}

/**
 * Detects the home page (entry point).
 * Identifies root URL or uses first page if no root found.
 */
function detectHomePage(pages: Page[]): string {
  // Look for root URL
  const rootPage = pages.find((p) => {
    try {
      const url = new URL(p.url);
      return url.pathname === '/' || url.pathname === '';
    } catch {
      return false;
    }
  });

  if (rootPage) {
    return rootPage.url;
  }

  // Fallback to first page
  return pages[0]?.url || '';
}

/**
 * Groups pages into logical sections based on URL prefix.
 * Creates sections for common URL patterns (e.g., /products/, /about/).
 */
function groupPagesIntoSections(pages: Page[]): Section[] {
  const sectionMap = new Map<string, Section>();

  for (const page of pages) {
    try {
      const url = new URL(page.url);
      const pathname = url.pathname;

      // Skip root/home page
      if (pathname === '/' || pathname === '') {
        continue;
      }

      // Extract first path segment as section
      const segments = pathname.split('/').filter((s) => s.length > 0);
      if (segments.length === 0) {
        continue;
      }

      const firstSegment = segments[0];
      const sectionPrefix = `/${firstSegment}/`;
      const depth = segments.length - 1; // Depth is number of segments beyond the first

      // Get or create section
      if (!sectionMap.has(sectionPrefix)) {
        // Capitalize first letter for section name
        const sectionName = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
        sectionMap.set(sectionPrefix, {
          name: sectionName,
          urlPrefix: sectionPrefix,
          pages: [],
          depth: 0, // Will be updated with max depth
        });
      }

      const section = sectionMap.get(sectionPrefix)!;
      section.pages.push(page.url);
      // Update depth to maximum depth in section
      section.depth = Math.max(section.depth, depth);
    } catch {
      // Skip invalid URLs
      continue;
    }
  }

  return Array.from(sectionMap.values());
}

/**
 * Builds a hierarchy tree from pages based on URL structure.
 */
function buildHierarchyTree(pages: Page[], rootUrl: string): PageNode {
  // Build a map of URL to page for quick lookup
  const pageMap = new Map<string, Page>();
  pages.forEach((p) => pageMap.set(p.url, p));

  // Group pages by parent URL
  const childrenMap = new Map<string, Page[]>();
  
  for (const page of pages) {
    if (page.url === rootUrl) {
      continue; // Skip root
    }

    try {
      const url = new URL(page.url);
      const pathname = url.pathname;
      const segments = pathname.split('/').filter((s) => s.length > 0);
      
      if (segments.length === 0) {
        continue;
      }

      // Find parent URL (one level up)
      if (segments.length === 1) {
        // Direct child of root
        if (!childrenMap.has(rootUrl)) {
          childrenMap.set(rootUrl, []);
        }
        childrenMap.get(rootUrl)!.push(page);
      } else {
        // Child of another page
        const parentPath = '/' + segments.slice(0, -1).join('/');
        
        // Find actual parent URL from pages
        const parentPage = pages.find((p) => {
          try {
            const pUrl = new URL(p.url);
            return pUrl.pathname === parentPath || pUrl.pathname === parentPath + '/';
          } catch {
            return false;
          }
        });

        if (parentPage) {
          if (!childrenMap.has(parentPage.url)) {
            childrenMap.set(parentPage.url, []);
          }
          childrenMap.get(parentPage.url)!.push(page);
        } else {
          // Fallback: treat as direct child of root
          if (!childrenMap.has(rootUrl)) {
            childrenMap.set(rootUrl, []);
          }
          childrenMap.get(rootUrl)!.push(page);
        }
      }
    } catch {
      // Skip invalid URLs
      continue;
    }
  }

  // Build tree recursively
  function buildNode(url: string): PageNode {
    const page = pageMap.get(url);
    const node: PageNode = {
      url,
      title: page?.title,
      children: [],
    };

    const children = childrenMap.get(url) || [];
    node.children = children.map((child) => buildNode(child.url));

    return node;
  }

  return buildNode(rootUrl);
}

/**
 * Extracts navigation paths from page links.
 * Builds sequences of pages connected by links per FR-004.
 *
 * @param pages - Array of pages with links
 * @returns Array of navigation paths
 */
export function extractNavigationPaths(pages: Page[]): NavigationPath[] {
  const paths: NavigationPath[] = [];
  const visited = new Set<string>();

  // Build page map for quick lookup
  const pageMap = new Map<string, Page>();
  pages.forEach((p) => pageMap.set(p.url, p));

  // Extract paths starting from each page
  for (const page of pages) {
    if (!page.links || page.links.length === 0) {
      continue;
    }

    // For each link, build a path
    for (const linkUrl of page.links) {
      const linkedPage = pageMap.get(linkUrl);
      if (!linkedPage) {
        continue; // Skip links to pages not in crawl results
      }

      // Build path: current page -> linked page -> follow links
      const path = buildPathFromLink(page, linkedPage, pageMap, visited);
      if (path.pages.length >= 2) {
        paths.push(path);
      }
    }
  }

  // Remove duplicate paths
  return deduplicatePaths(paths);
}

/**
 * Builds a navigation path starting from a link.
 * Prevents infinite loops by tracking visited pages.
 */
function buildPathFromLink(
  startPage: Page,
  targetPage: Page,
  pageMap: Map<string, Page>,
  _visited: Set<string>,
  maxDepth: number = 5,
): NavigationPath {
  const pathPages: string[] = [startPage.url];
  let currentPage = targetPage;
  let depth = 0;
  const pathVisited = new Set<string>([startPage.url]);

  while (currentPage && depth < maxDepth) {
    if (pathVisited.has(currentPage.url)) {
      break; // Prevent cycles
    }

    pathPages.push(currentPage.url);
    pathVisited.add(currentPage.url);

    // Follow first link to another page
    if (currentPage.links && currentPage.links.length > 0) {
      const nextUrl = currentPage.links[0];
      const nextPage = pageMap.get(nextUrl);
      if (nextPage && !pathVisited.has(nextUrl)) {
        currentPage = nextPage;
        depth++;
        continue;
      }
    }

    break;
  }

  const pathId = `path-${pathPages.join('-').replace(/[^a-zA-Z0-9-]/g, '-')}`;
  
  return {
    id: pathId,
    pages: pathPages,
    description: pathPages.length > 2 ? `Navigation from ${pathPages[0]} to ${pathPages[pathPages.length - 1]}` : undefined,
  };
}

/**
 * Removes duplicate navigation paths.
 */
function deduplicatePaths(paths: NavigationPath[]): NavigationPath[] {
  const seen = new Set<string>();
  const unique: NavigationPath[] = [];

  for (const path of paths) {
    const key = path.pages.join('->');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(path);
    }
  }

  return unique;
}

