import { analyzeSiteStructure, extractNavigationPaths } from '../../../src/documentation/structure-analyzer';
import { Page } from '../../../src/models/page';

describe('Structure Analyzer', () => {
  describe('analyzeSiteStructure', () => {
    it('should identify home page from root URL', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com',
          status: 200,
          title: 'Home',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
        {
          url: 'https://example.com/about',
          status: 200,
          title: 'About',
          discoveredAt: '2024-01-01T00:00:01Z',
        },
      ];

      const structure = analyzeSiteStructure(pages);

      expect(structure.homePage).toBe('https://example.com');
      expect(structure.hierarchy.url).toBe('https://example.com');
    });

    it('should group pages into sections by URL prefix', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com',
          status: 200,
          title: 'Home',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
        {
          url: 'https://example.com/products',
          status: 200,
          title: 'Products',
          discoveredAt: '2024-01-01T00:00:01Z',
        },
        {
          url: 'https://example.com/products/item1',
          status: 200,
          title: 'Item 1',
          discoveredAt: '2024-01-01T00:00:02Z',
        },
        {
          url: 'https://example.com/about',
          status: 200,
          title: 'About',
          discoveredAt: '2024-01-01T00:00:03Z',
        },
      ];

      const structure = analyzeSiteStructure(pages);

      expect(structure.sections).toHaveLength(2);
      
      const productsSection = structure.sections.find((s) => s.name === 'Products');
      expect(productsSection).toBeDefined();
      expect(productsSection?.urlPrefix).toBe('/products/');
      expect(productsSection?.pages).toContain('https://example.com/products');
      expect(productsSection?.pages).toContain('https://example.com/products/item1');
      expect(productsSection?.depth).toBe(1);

      const aboutSection = structure.sections.find((s) => s.name === 'About');
      expect(aboutSection).toBeDefined();
      expect(aboutSection?.urlPrefix).toBe('/about/');
      expect(aboutSection?.depth).toBe(0); // /about has depth 0 (only one segment)
    });

    it('should build hierarchy tree from URL structure', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com',
          status: 200,
          title: 'Home',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
        {
          url: 'https://example.com/products',
          status: 200,
          title: 'Products',
          discoveredAt: '2024-01-01T00:00:01Z',
        },
        {
          url: 'https://example.com/products/item1',
          status: 200,
          title: 'Item 1',
          discoveredAt: '2024-01-01T00:00:02Z',
        },
      ];

      const structure = analyzeSiteStructure(pages);

      expect(structure.hierarchy.url).toBe('https://example.com');
      expect(structure.hierarchy.children).toBeDefined();
      expect(structure.hierarchy.children?.length).toBeGreaterThan(0);
    });

    it('should handle pages with no clear home page', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/page1',
          status: 200,
          title: 'Page 1',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
        {
          url: 'https://example.com/page2',
          status: 200,
          title: 'Page 2',
          discoveredAt: '2024-01-01T00:00:01Z',
        },
      ];

      const structure = analyzeSiteStructure(pages);

      // Should use first page as home if no root URL found
      expect(structure.homePage).toBe('https://example.com/page1');
    });
  });

  describe('extractNavigationPaths', () => {
    it('should extract navigation paths from page links', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com',
          status: 200,
          title: 'Home',
          discoveredAt: '2024-01-01T00:00:00Z',
          links: ['https://example.com/about', 'https://example.com/contact'],
        },
        {
          url: 'https://example.com/about',
          status: 200,
          title: 'About',
          discoveredAt: '2024-01-01T00:00:01Z',
          links: ['https://example.com/contact'],
        },
        {
          url: 'https://example.com/contact',
          status: 200,
          title: 'Contact',
          discoveredAt: '2024-01-01T00:00:02Z',
          links: [],
        },
      ];

      const paths = extractNavigationPaths(pages);

      expect(paths.length).toBeGreaterThan(0);
      
      // Should find path: home -> about -> contact
      const homeToContactPath = paths.find((p) => 
        p.pages.includes('https://example.com') && 
        p.pages.includes('https://example.com/about') &&
        p.pages.includes('https://example.com/contact')
      );
      expect(homeToContactPath).toBeDefined();
    });

    it('should handle pages with no links', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com',
          status: 200,
          title: 'Home',
          discoveredAt: '2024-01-01T00:00:00Z',
        },
      ];

      const paths = extractNavigationPaths(pages);

      expect(paths).toHaveLength(0);
    });

    it('should create unique path IDs', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com',
          status: 200,
          title: 'Home',
          discoveredAt: '2024-01-01T00:00:00Z',
          links: ['https://example.com/page1'],
        },
        {
          url: 'https://example.com/page1',
          status: 200,
          title: 'Page 1',
          discoveredAt: '2024-01-01T00:00:01Z',
          links: ['https://example.com/page2'],
        },
        {
          url: 'https://example.com/page2',
          status: 200,
          title: 'Page 2',
          discoveredAt: '2024-01-01T00:00:02Z',
          links: [],
        },
      ];

      const paths = extractNavigationPaths(pages);

      const ids = paths.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should handle circular navigation paths', () => {
      const pages: Page[] = [
        {
          url: 'https://example.com/page1',
          status: 200,
          title: 'Page 1',
          discoveredAt: '2024-01-01T00:00:00Z',
          links: ['https://example.com/page2'],
        },
        {
          url: 'https://example.com/page2',
          status: 200,
          title: 'Page 2',
          discoveredAt: '2024-01-01T00:00:01Z',
          links: ['https://example.com/page1'],
        },
      ];

      const paths = extractNavigationPaths(pages);

      // Should not create infinite loops
      expect(paths.length).toBeGreaterThanOrEqual(0);
      paths.forEach((path) => {
        expect(path.pages.length).toBeLessThanOrEqual(10); // Reasonable limit
      });
    });
  });
});

