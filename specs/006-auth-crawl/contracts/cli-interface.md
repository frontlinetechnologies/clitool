# CLI Interface Contract: Authenticated Crawling

**Feature**: 006-auth-crawl
**Date**: 2025-12-17

## Command Extensions

### `testarion crawl` (Modified)

Extends existing crawl command with authentication options.

```bash
testarion crawl <url> [options]

# New authentication options:
  --auth-config <path>       Path to authentication config file (JSON/YAML)
  --auth-role <name>         Single role to crawl as (requires credentials in env)
  --login-url <url>          Login page URL for form-based auth
  --storage-state <path>     Playwright storage state file for session injection
  --skip-unauthenticated     Skip unauthenticated baseline crawl
```

**Examples**:

```bash
# Crawl with single role (credentials from env vars)
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret \
  testarion crawl https://example.com --auth-role admin --login-url https://example.com/login

# Crawl with config file
testarion crawl https://example.com --auth-config ./testarion.auth.json

# Crawl with pre-authenticated session
testarion crawl https://example.com --storage-state ./auth-state.json
```

**Exit Codes**:
- 0: Success
- 1: Crawl error (non-auth)
- 2: Authentication failure (all retries exhausted)
- 3: Configuration error (invalid auth config)

---

### `testarion generate-tests` (Modified)

Extends test generation with authentication fixtures.

```bash
testarion generate-tests <crawl-results> [options]

# New authentication options:
  --auth-fixtures            Generate authentication fixture files
  --denial-tests             Generate access denial tests (requires multi-role crawl)
  --logout-tests             Generate logout tests for each role
```

**Examples**:

```bash
# Generate tests with auth fixtures from multi-role crawl
testarion generate-tests ./crawl-results.json --auth-fixtures --denial-tests

# Generate all auth-related tests
testarion generate-tests ./crawl-results.json --auth-fixtures --denial-tests --logout-tests
```

---

### `testarion auth` (New Command)

Standalone authentication utilities.

```bash
testarion auth <subcommand>

Subcommands:
  login <url>      Perform interactive login and save storage state
  verify <url>     Verify authentication config works
  save-state       Save current session to storage state file
```

**`testarion auth login`**:

```bash
testarion auth login <login-url> [options]
  -o, --output <path>        Output path for storage state (default: ./auth-state.json)
  --identifier <selector>    CSS selector for username/email field
  --password <selector>      CSS selector for password field
  --submit <selector>        CSS selector for submit button
  --success-url <pattern>    URL pattern indicating successful login
  --timeout <ms>             Login timeout in milliseconds (default: 30000)
```

**Examples**:

```bash
# Interactive login (opens browser, user logs in manually)
testarion auth login https://example.com/login -o ./admin-state.json

# Automated login with credentials from env
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret \
  testarion auth login https://example.com/login -o ./admin-state.json --success-url "/dashboard"
```

**`testarion auth verify`**:

```bash
testarion auth verify <url> [options]
  --config <path>            Auth config file to verify
  --role <name>              Specific role to verify (default: all roles)
  --storage-state <path>     Storage state file to verify
```

**Examples**:

```bash
# Verify all roles in config can authenticate
testarion auth verify https://example.com --config ./testarion.auth.json

# Verify specific storage state is still valid
testarion auth verify https://example.com --storage-state ./admin-state.json
```

---

## Environment Variables

### Credential Environment Variables

Credentials are sourced from environment variables. Variable names are configured in auth config.

| Variable Pattern | Description |
|------------------|-------------|
| `{ROLE}_EMAIL` | Email/username for role |
| `{ROLE}_PASSWORD` | Password for role |
| `{ROLE}_TOKEN` | Token for token injection auth |
| `{ROLE}_COOKIES` | JSON-encoded cookies |

**Examples**:
```bash
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="secretpassword"
export USER_EMAIL="user@example.com"
export USER_PASSWORD="userpassword"
```

### Configuration Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TESTARION_AUTH_CONFIG` | Path to auth config file | None |
| `TESTARION_AUTH_STATE_DIR` | Directory for storage state files | `./.testarion/auth/` |
| `TESTARION_AUTH_TIMEOUT` | Authentication timeout (ms) | 30000 |

---

## Output Format Extensions

### Crawl Results JSON (Extended)

```json
{
  "summary": { /* existing fields */ },
  "pages": [
    {
      "url": "https://example.com/admin",
      "status": 200,
      "title": "Admin Dashboard",
      "authLevel": "admin",
      "accessibleByRoles": ["admin"],
      "minPrivilegeLevel": 100
    },
    {
      "url": "https://example.com/profile",
      "status": 200,
      "title": "User Profile",
      "authLevel": "authenticated",
      "accessibleByRoles": ["admin", "user"],
      "minPrivilegeLevel": 1
    },
    {
      "url": "https://example.com/about",
      "status": 200,
      "title": "About Us",
      "authLevel": "public",
      "accessibleByRoles": [],
      "minPrivilegeLevel": 0
    }
  ],
  "auth": {
    "roles": ["admin", "user"],
    "roleHierarchy": ["admin", "user"],
    "roleResults": {
      "admin": {
        "accessibleCount": 25,
        "exclusiveCount": 10,
        "durationMs": 15000
      },
      "user": {
        "accessibleCount": 15,
        "exclusiveCount": 5,
        "durationMs": 12000
      }
    },
    "events": [
      {
        "timestamp": "2025-12-17T10:00:00Z",
        "type": "login",
        "role": "admin",
        "success": true,
        "durationMs": 2500
      }
    ]
  }
}
```

---

## Error Messages

| Code | Message | Guidance |
|------|---------|----------|
| AUTH001 | `Authentication failed for role '{role}'` | Check credentials in environment variables |
| AUTH002 | `Login form not detected at {url}` | Provide manual selectors with --identifier/--password |
| AUTH003 | `Session expired, re-authentication failed` | Check if credentials are still valid |
| AUTH004 | `Credentials not found in environment` | Set {VAR_NAME} environment variable |
| AUTH005 | `Storage state file not found: {path}` | Run `testarion auth login` to create state file |
| AUTH006 | `Invalid auth config: {details}` | See config schema in documentation |
| AUTH007 | `Security warning: Credentials in config file` | Use environment variables instead |

---

## Security Warnings

The CLI displays warnings for security-sensitive configurations:

```
⚠️  Security Warning: Credentials detected in config file.
    For production use, set credentials via environment variables:
    - ADMIN_EMAIL, ADMIN_PASSWORD

    Add to .gitignore:
    testarion.auth.json
    .testarion/auth/
```
