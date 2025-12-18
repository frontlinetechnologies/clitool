/**
 * Authentication module public exports.
 * Provides types, classes, and utilities for authenticated crawling.
 */

// Types
export type {
  AuthConfig,
  RoleConfig,
  CredentialSource,
  LoginConfig,
  LoginSelectors,
  SuccessIndicator,
  SessionTimeoutConfig,
  ExpiryIndicator,
  AuthMethod,
  CookieSource,
  AuthEvent,
  AuthenticatedPage,
  MultiRoleCrawlResult,
  RoleCrawlResult,
} from './types';

export { createDefaultSessionTimeoutConfig, createEmptyAuthConfig } from './types';

// Error types
export {
  AuthenticationError,
  CredentialLeakError,
  LoginFormNotFoundError,
  SessionExpiredError,
  CredentialsNotFoundError,
  StorageStateNotFoundError,
  AuthConfigError,
  AuthErrorCode,
} from './errors';

// Re-export Role model from models (for convenience)
export type { Role, StorageState } from '../models/role';
export {
  createRole,
  setRoleStorageState,
  addAccessibleUrls,
  setExclusiveUrls,
  setRolePrivilegeLevel,
  compareRolesByPrivilege,
  sortRolesByPrivilege,
  inferPrivilegeLevels,
} from '../models/role';

// Config loader
export {
  loadAuthConfig,
  validateAuthConfig,
  createAuthConfigFromCLI,
  hasCredentialsInConfig,
} from './config';

// Credential guard
export { CredentialGuard, createCredentialGuard } from './credential-guard';
export type { Logger } from './credential-guard';

// Main classes
export { Authenticator, createAuthenticator } from './authenticator';
export { LoginDetector, createLoginDetector } from './login-detector';

// Auth methods
export { FormLoginMethod, createFormLoginMethod, LoginUrlUnreachableError } from './methods/form-login';
export type { FormCredentials } from './methods/form-login';
export { StorageStateMethod, createStorageStateMethod } from './methods/storage-state';
export type { StorageStateConfig } from './methods/storage-state';

// Session management
export { SessionManager, createSessionManager } from './session-manager';
