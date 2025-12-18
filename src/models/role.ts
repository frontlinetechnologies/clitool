/**
 * Role model representing a user role during authenticated crawling.
 * Runtime representation with crawl results.
 */

import type { RoleConfig } from '../auth/types';

/**
 * Playwright storage state structure.
 */
export interface StorageState {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

/**
 * Runtime representation of a role with crawl results.
 */
export interface Role {
  /** Configuration for this role */
  config: RoleConfig;

  /** Computed privilege level (from config or inferred) */
  privilegeLevel: number;

  /** URLs accessible by this role */
  accessibleUrls: Set<string>;

  /** URLs discovered only by this role (not lower-privilege roles) */
  exclusiveUrls: Set<string>;

  /** Playwright storage state for session reuse */
  storageState?: StorageState;
}

/**
 * Creates a Role from configuration.
 * Privilege level defaults to 1 if not specified.
 */
export function createRole(config: RoleConfig): Role {
  return {
    config,
    privilegeLevel: config.privilegeLevel ?? 1,
    accessibleUrls: new Set(),
    exclusiveUrls: new Set(),
  };
}

/**
 * Updates role with storage state.
 */
export function setRoleStorageState(role: Role, storageState: StorageState): Role {
  return {
    ...role,
    storageState,
  };
}

/**
 * Adds accessible URLs to a role.
 */
export function addAccessibleUrls(role: Role, urls: string[]): Role {
  const newAccessibleUrls = new Set(role.accessibleUrls);
  for (const url of urls) {
    newAccessibleUrls.add(url);
  }
  return {
    ...role,
    accessibleUrls: newAccessibleUrls,
  };
}

/**
 * Sets exclusive URLs for a role (URLs only this role can access).
 */
export function setExclusiveUrls(role: Role, urls: string[]): Role {
  return {
    ...role,
    exclusiveUrls: new Set(urls),
  };
}

/**
 * Updates role privilege level (for post-crawl inference).
 */
export function setRolePrivilegeLevel(role: Role, privilegeLevel: number): Role {
  return {
    ...role,
    privilegeLevel,
  };
}

/**
 * Compares roles by privilege level (descending - highest privilege first).
 */
export function compareRolesByPrivilege(a: Role, b: Role): number {
  return b.privilegeLevel - a.privilegeLevel;
}

/**
 * Sorts roles by privilege level (descending).
 */
export function sortRolesByPrivilege(roles: Role[]): Role[] {
  return [...roles].sort(compareRolesByPrivilege);
}

/**
 * Infers privilege levels from accessible page counts.
 * More accessible pages = higher privilege.
 */
export function inferPrivilegeLevels(roles: Role[]): Role[] {
  // Sort by accessible URL count (descending)
  const sorted = [...roles].sort((a, b) => b.accessibleUrls.size - a.accessibleUrls.size);

  // Assign privilege levels based on rank
  return sorted.map((role, index) => ({
    ...role,
    privilegeLevel: role.config.privilegeLevel ?? sorted.length - index,
  }));
}
