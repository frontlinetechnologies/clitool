# Quickstart: Authenticated Crawling & Testing

**Feature**: 006-auth-crawl
**Date**: 2025-12-17

## Prerequisites

- Node.js 18+
- `@testarion/cli` installed (`npm install -g @testarion/cli`)
- Anthropic API key configured
- Test credentials for your application

## Quick Examples

### 1. Single Role Authentication (Simplest)

Crawl as a single user with credentials from environment variables:

```bash
# Set credentials
export USER_EMAIL="test@example.com"
export USER_PASSWORD="testpassword123"

# Crawl with authentication
testarion crawl https://myapp.com \
  --auth-role user \
  --login-url https://myapp.com/login

# Output includes authenticated pages
```

### 2. Multi-Role Crawl with Config File

Create `testarion.auth.json`:

```json
{
  "roles": [
    {
      "name": "admin",
      "credentials": {
        "identifierEnvVar": "ADMIN_EMAIL",
        "passwordEnvVar": "ADMIN_PASSWORD"
      },
      "authMethod": { "type": "form-login" }
    },
    {
      "name": "user",
      "credentials": {
        "identifierEnvVar": "USER_EMAIL",
        "passwordEnvVar": "USER_PASSWORD"
      },
      "authMethod": { "type": "form-login" }
    }
  ],
  "login": {
    "url": "https://myapp.com/login",
    "successIndicators": [
      { "type": "url-pattern", "pattern": "/dashboard" }
    ]
  }
}
```

Run the crawl:

```bash
# Set all credentials
export ADMIN_EMAIL="admin@myapp.com"
export ADMIN_PASSWORD="adminpass"
export USER_EMAIL="user@myapp.com"
export USER_PASSWORD="userpass"

# Crawl with all roles
testarion crawl https://myapp.com --auth-config ./testarion.auth.json
```

### 3. Using Pre-Authenticated Session

For SSO or complex auth flows, capture session manually:

```bash
# Open browser and log in manually
testarion auth login https://myapp.com/login -o ./admin-state.json

# Use saved session for crawling
testarion crawl https://myapp.com --storage-state ./admin-state.json
```

### 4. Generate Tests with Authentication

After crawling, generate tests including auth fixtures:

```bash
testarion generate-tests ./crawl-results.json \
  --auth-fixtures \
  --denial-tests \
  --logout-tests \
  --output ./tests
```

This creates:
- `tests/fixtures/auth.ts` - Authentication fixtures
- `tests/auth/access-control/denial.spec.ts` - Access denial tests
- `tests/auth/logout.spec.ts` - Logout flow tests

### 5. Run Generated Tests

```bash
# Set auth state paths
export ADMIN_AUTH_STATE=./auth-states/admin.json
export USER_AUTH_STATE=./auth-states/user.json

# Run tests
npx playwright test
```

## Common Configurations

### Custom Login Form Selectors

When auto-detection fails:

```json
{
  "login": {
    "url": "https://myapp.com/login",
    "selectors": {
      "identifier": "#email-input",
      "password": "#password-input",
      "submit": "button.login-submit"
    }
  }
}
```

### Cookie Injection

For APIs or when you have session cookies:

```json
{
  "roles": [
    {
      "name": "api-user",
      "authMethod": {
        "type": "cookie-injection",
        "cookies": { "type": "env-var", "envVar": "SESSION_COOKIES" }
      }
    }
  ]
}
```

```bash
export SESSION_COOKIES='[{"name":"session","value":"abc123","domain":"myapp.com"}]'
```

### Bearer Token Auth

```json
{
  "roles": [
    {
      "name": "api-user",
      "authMethod": {
        "type": "token-injection",
        "header": "Authorization",
        "tokenEnvVar": "API_TOKEN"
      }
    }
  ]
}
```

```bash
export API_TOKEN="Bearer eyJhbGc..."
```

### Custom Login Script

For MFA, CAPTCHA, or complex flows:

```typescript
// custom-login.ts
export async function login(page, credentials) {
  await page.goto('https://myapp.com/login');
  await page.fill('#email', credentials.identifier);
  await page.fill('#password', credentials.password);
  await page.click('#submit');

  // Handle MFA
  const mfaCode = await getMfaCode(); // Your MFA logic
  await page.fill('#mfa-code', mfaCode);
  await page.click('#verify');

  return page.url().includes('/dashboard');
}
```

```json
{
  "roles": [
    {
      "name": "admin",
      "authMethod": {
        "type": "custom-script",
        "scriptPath": "./custom-login.ts"
      }
    }
  ]
}
```

## Security Best Practices

1. **Never commit credentials**:
   ```bash
   echo "testarion.auth.json" >> .gitignore
   echo ".testarion/auth/" >> .gitignore
   ```

2. **Use environment variables**:
   ```bash
   # Use a .env file (gitignored)
   source .env.local
   ```

3. **Rotate test credentials** regularly

4. **Use dedicated test accounts**, never production accounts

## Troubleshooting

### Login form not detected

```bash
# Enable verbose logging
testarion crawl https://myapp.com --auth-role user --login-url https://myapp.com/login --verbose

# Or provide selectors manually in config
```

### Session expires during crawl

The tool automatically re-authenticates. Check logs for `re-auth` events:

```bash
testarion crawl ... --verbose | grep "re-auth"
```

### Access denial tests failing

Verify your role hierarchy:

```bash
# Check crawl results for role access
cat crawl-results.json | jq '.auth.roleResults'
```

## Next Steps

- See [CLI Reference](./contracts/cli-interface.md) for all options
- See [Data Model](./data-model.md) for configuration schema
- See [Test Generation API](./contracts/test-generation-api.md) for test customization
