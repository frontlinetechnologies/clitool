/**
 * Authentication configuration loader and validator.
 * Handles loading auth config from files and CLI options.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AuthConfig, RoleConfig, LoginConfig, AuthMethod, SuccessIndicator } from './types';
import { AuthConfigError } from './errors';

/**
 * Valid auth method types.
 */
const VALID_AUTH_METHODS = [
  'form-login',
  'cookie-injection',
  'token-injection',
  'storage-state',
  'custom-script',
] as const;

/**
 * Valid success indicator types.
 */
const VALID_SUCCESS_INDICATORS = [
  'url-pattern',
  'element-visible',
  'element-hidden',
  'cookie-present',
  'cookie-absent',
] as const;

/**
 * Role name validation regex.
 * Allows alphanumeric characters, hyphens, and underscores.
 */
const ROLE_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Loads auth configuration from a JSON file.
 * @param configPath - Path to the config file
 * @returns Parsed and validated AuthConfig
 * @throws AuthConfigError if file doesn't exist or is invalid
 */
export function loadAuthConfig(configPath: string): AuthConfig {
  const absolutePath = path.resolve(configPath);

  if (!fs.existsSync(absolutePath)) {
    throw new AuthConfigError(`Config file not found: ${absolutePath}`);
  }

  let content: string;
  try {
    content = fs.readFileSync(absolutePath, 'utf-8');
  } catch (error) {
    throw new AuthConfigError(
      `Cannot read config file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  let config: unknown;
  try {
    config = JSON.parse(content);
  } catch (error) {
    throw new AuthConfigError(
      `Invalid JSON in config file: ${error instanceof Error ? error.message : 'Parse error'}`,
    );
  }

  return validateAuthConfig(config);
}

/**
 * Validates and normalizes an auth configuration object.
 * @param config - Raw config object to validate
 * @returns Validated AuthConfig
 * @throws AuthConfigError if validation fails
 */
export function validateAuthConfig(config: unknown): AuthConfig {
  if (!config || typeof config !== 'object') {
    throw new AuthConfigError('Config must be an object');
  }

  const rawConfig = config as Record<string, unknown>;

  // Validate roles array
  if (!Array.isArray(rawConfig.roles)) {
    throw new AuthConfigError("'roles' must be an array");
  }

  const validatedRoles: RoleConfig[] = [];
  const roleNames = new Set<string>();

  for (let i = 0; i < rawConfig.roles.length; i++) {
    const role = rawConfig.roles[i] as unknown;
    const validatedRole = validateRoleConfig(role, i);

    // Check for duplicate role names
    if (roleNames.has(validatedRole.name)) {
      throw new AuthConfigError(`Duplicate role name: '${validatedRole.name}'`);
    }
    roleNames.add(validatedRole.name);

    validatedRoles.push(validatedRole);
  }

  // Validate login config if present
  let validatedLogin: LoginConfig | undefined;
  if (rawConfig.login !== undefined) {
    validatedLogin = validateLoginConfig(rawConfig.login);
  }

  // Validate custom login script path if present
  let customLoginScript: string | undefined;
  if (rawConfig.customLoginScript !== undefined) {
    if (typeof rawConfig.customLoginScript !== 'string') {
      throw new AuthConfigError("'customLoginScript' must be a string path");
    }
    customLoginScript = rawConfig.customLoginScript;
  }

  return {
    roles: validatedRoles,
    login: validatedLogin,
    customLoginScript,
  };
}

/**
 * Validates a single role configuration.
 */
function validateRoleConfig(role: unknown, index: number): RoleConfig {
  if (!role || typeof role !== 'object') {
    throw new AuthConfigError(`Role at index ${index} must be an object`);
  }

  const rawRole = role as Record<string, unknown>;

  // Validate name
  if (typeof rawRole.name !== 'string' || !rawRole.name.trim()) {
    throw new AuthConfigError(`Role at index ${index}: 'name' is required and must be non-empty`);
  }

  const name = rawRole.name.trim();
  if (!ROLE_NAME_REGEX.test(name)) {
    throw new AuthConfigError(
      `Role '${name}': name must be alphanumeric with hyphens/underscores only`,
    );
  }

  // Validate credentials
  if (!rawRole.credentials || typeof rawRole.credentials !== 'object') {
    throw new AuthConfigError(`Role '${name}': 'credentials' is required`);
  }

  const creds = rawRole.credentials as Record<string, unknown>;
  if (typeof creds.identifierEnvVar !== 'string' || !creds.identifierEnvVar.trim()) {
    throw new AuthConfigError(`Role '${name}': credentials.identifierEnvVar is required`);
  }
  if (typeof creds.passwordEnvVar !== 'string' || !creds.passwordEnvVar.trim()) {
    throw new AuthConfigError(`Role '${name}': credentials.passwordEnvVar is required`);
  }

  // Validate authMethod
  if (!rawRole.authMethod || typeof rawRole.authMethod !== 'object') {
    throw new AuthConfigError(`Role '${name}': 'authMethod' is required`);
  }

  const authMethod = validateAuthMethod(rawRole.authMethod, name);

  // Validate privilegeLevel if present
  let privilegeLevel: number | undefined;
  if (rawRole.privilegeLevel !== undefined) {
    if (typeof rawRole.privilegeLevel !== 'number' || rawRole.privilegeLevel < 1) {
      throw new AuthConfigError(`Role '${name}': privilegeLevel must be a positive integer`);
    }
    privilegeLevel = Math.floor(rawRole.privilegeLevel);
  }

  return {
    name,
    credentials: {
      identifierEnvVar: creds.identifierEnvVar.trim(),
      passwordEnvVar: creds.passwordEnvVar.trim(),
    },
    authMethod,
    privilegeLevel,
  };
}

/**
 * Validates an auth method configuration.
 */
function validateAuthMethod(method: unknown, roleName: string): AuthMethod {
  if (!method || typeof method !== 'object') {
    throw new AuthConfigError(`Role '${roleName}': authMethod must be an object`);
  }

  const rawMethod = method as Record<string, unknown>;

  if (typeof rawMethod.type !== 'string') {
    throw new AuthConfigError(`Role '${roleName}': authMethod.type is required`);
  }

  const type = rawMethod.type;

  if (!VALID_AUTH_METHODS.includes(type as (typeof VALID_AUTH_METHODS)[number])) {
    throw new AuthConfigError(
      `Role '${roleName}': invalid authMethod.type '${type}'. Valid types: ${VALID_AUTH_METHODS.join(', ')}`,
    );
  }

  switch (type) {
    case 'form-login':
      return { type: 'form-login' };

    case 'cookie-injection': {
      if (!rawMethod.cookies || typeof rawMethod.cookies !== 'object') {
        throw new AuthConfigError(`Role '${roleName}': cookie-injection requires 'cookies' config`);
      }
      const cookies = rawMethod.cookies as Record<string, unknown>;
      if (cookies.type === 'env-var') {
        if (typeof cookies.envVar !== 'string') {
          throw new AuthConfigError(`Role '${roleName}': cookies.envVar must be a string`);
        }
        return {
          type: 'cookie-injection',
          cookies: { type: 'env-var', envVar: cookies.envVar },
        };
      } else if (cookies.type === 'file') {
        if (typeof cookies.path !== 'string') {
          throw new AuthConfigError(`Role '${roleName}': cookies.path must be a string`);
        }
        return { type: 'cookie-injection', cookies: { type: 'file', path: cookies.path } };
      }
      throw new AuthConfigError(
        `Role '${roleName}': cookies.type must be 'env-var' or 'file'`,
      );
    }

    case 'token-injection':
      if (typeof rawMethod.header !== 'string') {
        throw new AuthConfigError(`Role '${roleName}': token-injection requires 'header'`);
      }
      if (typeof rawMethod.tokenEnvVar !== 'string') {
        throw new AuthConfigError(`Role '${roleName}': token-injection requires 'tokenEnvVar'`);
      }
      return {
        type: 'token-injection',
        header: rawMethod.header,
        tokenEnvVar: rawMethod.tokenEnvVar,
      };

    case 'storage-state':
      if (typeof rawMethod.path !== 'string') {
        throw new AuthConfigError(`Role '${roleName}': storage-state requires 'path'`);
      }
      return { type: 'storage-state', path: rawMethod.path };

    case 'custom-script':
      if (typeof rawMethod.scriptPath !== 'string') {
        throw new AuthConfigError(`Role '${roleName}': custom-script requires 'scriptPath'`);
      }
      return { type: 'custom-script', scriptPath: rawMethod.scriptPath };

    default:
      throw new AuthConfigError(`Role '${roleName}': unknown authMethod.type '${type}'`);
  }
}

/**
 * Validates login configuration.
 */
function validateLoginConfig(login: unknown): LoginConfig {
  if (!login || typeof login !== 'object') {
    throw new AuthConfigError("'login' must be an object");
  }

  const rawLogin = login as Record<string, unknown>;

  // Validate URL
  if (typeof rawLogin.url !== 'string' || !rawLogin.url.trim()) {
    throw new AuthConfigError("login.url is required");
  }

  // Validate URL format
  try {
    new URL(rawLogin.url);
  } catch {
    throw new AuthConfigError(`login.url is not a valid URL: ${rawLogin.url}`);
  }

  const result: LoginConfig = {
    url: rawLogin.url.trim(),
  };

  // Validate selectors if present
  if (rawLogin.selectors !== undefined) {
    if (typeof rawLogin.selectors !== 'object' || rawLogin.selectors === null) {
      throw new AuthConfigError("login.selectors must be an object");
    }

    const selectors = rawLogin.selectors as Record<string, unknown>;
    result.selectors = {};

    if (selectors.identifier !== undefined) {
      if (typeof selectors.identifier !== 'string') {
        throw new AuthConfigError("login.selectors.identifier must be a string");
      }
      result.selectors.identifier = selectors.identifier;
    }

    if (selectors.password !== undefined) {
      if (typeof selectors.password !== 'string') {
        throw new AuthConfigError("login.selectors.password must be a string");
      }
      result.selectors.password = selectors.password;
    }

    if (selectors.submit !== undefined) {
      if (typeof selectors.submit !== 'string') {
        throw new AuthConfigError("login.selectors.submit must be a string");
      }
      result.selectors.submit = selectors.submit;
    }

    if (selectors.form !== undefined) {
      if (typeof selectors.form !== 'string') {
        throw new AuthConfigError("login.selectors.form must be a string");
      }
      result.selectors.form = selectors.form;
    }
  }

  // Validate successIndicators if present
  if (rawLogin.successIndicators !== undefined) {
    if (!Array.isArray(rawLogin.successIndicators)) {
      throw new AuthConfigError("login.successIndicators must be an array");
    }

    result.successIndicators = rawLogin.successIndicators.map((indicator, i) =>
      validateSuccessIndicator(indicator, i),
    );
  }

  return result;
}

/**
 * Validates a success indicator.
 */
function validateSuccessIndicator(indicator: unknown, index: number): SuccessIndicator {
  if (!indicator || typeof indicator !== 'object') {
    throw new AuthConfigError(`successIndicator at index ${index} must be an object`);
  }

  const raw = indicator as Record<string, unknown>;

  if (typeof raw.type !== 'string') {
    throw new AuthConfigError(`successIndicator at index ${index}: 'type' is required`);
  }

  if (!VALID_SUCCESS_INDICATORS.includes(raw.type as (typeof VALID_SUCCESS_INDICATORS)[number])) {
    throw new AuthConfigError(
      `successIndicator at index ${index}: invalid type '${raw.type}'. Valid types: ${VALID_SUCCESS_INDICATORS.join(', ')}`,
    );
  }

  switch (raw.type) {
    case 'url-pattern':
      if (typeof raw.pattern !== 'string') {
        throw new AuthConfigError(`successIndicator at index ${index}: 'pattern' is required`);
      }
      return { type: 'url-pattern', pattern: raw.pattern };

    case 'element-visible':
    case 'element-hidden':
      if (typeof raw.selector !== 'string') {
        throw new AuthConfigError(`successIndicator at index ${index}: 'selector' is required`);
      }
      return { type: raw.type, selector: raw.selector };

    case 'cookie-present':
    case 'cookie-absent':
      if (typeof raw.name !== 'string') {
        throw new AuthConfigError(`successIndicator at index ${index}: 'name' is required`);
      }
      return { type: raw.type, name: raw.name };

    default:
      throw new AuthConfigError(`successIndicator at index ${index}: unknown type`);
  }
}

/**
 * Creates an AuthConfig from CLI options for single-role authentication.
 */
export function createAuthConfigFromCLI(options: {
  authRole: string;
  loginUrl?: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  authSuccessUrl?: string;
  authSuccessSelector?: string;
  authSuccessCookie?: string;
}): AuthConfig {
  const roleName = options.authRole.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  // Build env var names from role
  const identifierEnvVar = `${roleName.toUpperCase()}_EMAIL`;
  const passwordEnvVar = `${roleName.toUpperCase()}_PASSWORD`;

  const config: AuthConfig = {
    roles: [
      {
        name: roleName,
        credentials: {
          identifierEnvVar,
          passwordEnvVar,
        },
        authMethod: { type: 'form-login' },
      },
    ],
  };

  // Add login config if login URL provided
  if (options.loginUrl) {
    config.login = {
      url: options.loginUrl,
    };

    // Add selectors if provided
    if (options.usernameSelector || options.passwordSelector || options.submitSelector) {
      config.login.selectors = {};
      if (options.usernameSelector) {
        config.login.selectors.identifier = options.usernameSelector;
      }
      if (options.passwordSelector) {
        config.login.selectors.password = options.passwordSelector;
      }
      if (options.submitSelector) {
        config.login.selectors.submit = options.submitSelector;
      }
    }

    // Add success indicators if provided
    const indicators: SuccessIndicator[] = [];
    if (options.authSuccessUrl) {
      indicators.push({ type: 'url-pattern', pattern: options.authSuccessUrl });
    }
    if (options.authSuccessSelector) {
      indicators.push({ type: 'element-visible', selector: options.authSuccessSelector });
    }
    if (options.authSuccessCookie) {
      indicators.push({ type: 'cookie-present', name: options.authSuccessCookie });
    }
    if (indicators.length > 0) {
      config.login.successIndicators = indicators;
    }
  }

  return config;
}

/**
 * Checks if auth config contains credentials directly (security warning trigger).
 */
export function hasCredentialsInConfig(configPath: string): boolean {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as Record<string, unknown>;

    // Check if any role has direct credential values (not env var references)
    if (Array.isArray(config.roles)) {
      for (const role of config.roles) {
        if (role && typeof role === 'object' && 'credentials' in role) {
          const roleObj = role as Record<string, unknown>;
          const creds = roleObj.credentials;
          // If credentials contains actual values instead of env var names
          if (creds && typeof creds === 'object') {
            const credsRecord = creds as Record<string, unknown>;
            if (credsRecord.identifier || credsRecord.password || credsRecord.email || credsRecord.username) {
              return true;
            }
          }
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}
