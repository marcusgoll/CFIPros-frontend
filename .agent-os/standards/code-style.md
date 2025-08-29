# Code Style Guide

Code formatting and style rules for CFI Pros API projects. Consistent style improves readability and reduces cognitive load.

## General Formatting

### Indentation and Spacing
- Use 2 spaces for indentation (never tabs)
- Add blank lines to separate logical sections
- Align related elements for readability
- Remove trailing whitespace

### Line Length
- Aim for 80-100 characters per line
- Break long lines at logical points
- Use consistent indentation for wrapped lines

## Naming Conventions

### JavaScript/TypeScript
- **Variables and Functions**: camelCase (`userId`, `calculateTotal`)
- **Classes and Interfaces**: PascalCase (`UserService`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_BASE_URL`)
- **Files**: kebab-case (`user-service.js`, `api-client.js`)

### Database
- **Tables**: snake_case (`user_profiles`, `order_items`)
- **Columns**: snake_case (`created_at`, `user_id`)
- **Indexes**: descriptive names (`idx_users_email`, `idx_orders_created_at`)

## String Formatting

### JavaScript/TypeScript
- Use single quotes for simple strings: `'Hello World'`
- Use template literals for interpolation: `` `Hello ${name}` ``
- Use double quotes only when single quotes appear in the string

```javascript
// Good
const message = 'Welcome to CFI Pros';
const greeting = `Hello, ${userName}!`;
const quote = "He said 'Hello' to me";

// Avoid
const message = "Welcome to CFI Pros";
const greeting = 'Hello, ' + userName + '!';
```

## Comments and Documentation

### When to Comment
- Explain complex business logic
- Document non-obvious implementation decisions
- Clarify the "why" behind code choices
- Add JSDoc for public APIs

### Comment Style
```javascript
// Good: Explains why
// Use exponential backoff to avoid overwhelming the API
const delay = Math.pow(2, attempt) * 1000;

// Avoid: States the obvious
// Increment the counter by 1
counter++;
```

### JSDoc for APIs
```javascript
/**
 * Retrieves user profile information
 * @param {string} userId - The unique user identifier
 * @param {Object} options - Configuration options
 * @param {boolean} options.includePreferences - Include user preferences
 * @returns {Promise<Object>} User profile data
 * @throws {NotFoundError} When user doesn't exist
 */
async function getUserProfile(userId, options = {}) {
  // Implementation
}
```

## File Organization

### Import Order
1. Third-party libraries
2. Internal modules (absolute paths)
3. Relative imports
4. Type-only imports (if using TypeScript)

```javascript
// Third-party
import express from 'express';
import { z } from 'zod';

// Internal
import { database } from '@/lib/database';
import { logger } from '@/lib/logger';

// Relative
import { validateUser } from './validation';
import { UserService } from './user-service';
```

### Export Patterns
- Use named exports for utilities and classes
- Use default exports sparingly, mainly for components
- Group related exports

```javascript
// Good: Named exports
export { UserService } from './user-service';
export { validateUser, validateEmail } from './validation';

// Good: Default export for main component
export default class ApiClient {
  // Implementation
}
```

## Language-Specific Guidelines

For detailed language-specific formatting rules, see:
- [JavaScript Style Guide](../code-style/javascript-style.md)
- [Python Style Guide](./python-style.md)
- [HTML Style Guide](../code-style/html-style.md)
- [CSS/Tailwind Style Guide](../code-style/css-style.md)