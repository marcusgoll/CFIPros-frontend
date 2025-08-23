# JavaScript Style Guide

Specific formatting and coding conventions for JavaScript and TypeScript in CFI Pros projects.

## Code Formatting

### Basic Structure
```javascript
// Good: Clean, readable structure
const userService = {
  async createUser(userData) {
    const validatedData = this.validateUserData(userData);
    const user = await database.users.create(validatedData);
    return this.formatUserResponse(user);
  },

  validateUserData(data) {
    // Validation logic
  },

  formatUserResponse(user) {
    // Formatting logic
  }
};
```

### Variable Declarations
```javascript
// Good: Use const by default
const API_BASE_URL = 'https://api.cfipros.com';
const userPreferences = { theme: 'dark', language: 'en' };

// Good: Use let when reassignment is needed
let currentUser = null;
let retryCount = 0;

// Avoid: var declarations
var userName = 'John'; // Don't use
```

### Function Definitions
```javascript
// Good: Arrow functions for short operations
const users = rawUsers.map(user => ({ 
  id: user.id, 
  name: user.fullName,
  email: user.email 
}));

// Good: Function declarations for main operations
function calculateTotalCost(items, taxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * taxRate;
  return subtotal + tax;
}

// Good: Async/await over Promises
async function fetchUserProfile(userId) {
  try {
    const user = await api.getUser(userId);
    const preferences = await api.getUserPreferences(userId);
    return { ...user, preferences };
  } catch (error) {
    logger.error('Failed to fetch user profile', { userId, error });
    throw new UserNotFoundError(`User ${userId} not found`);
  }
}
```

## Object and Array Handling

### Destructuring
```javascript
// Good: Use destructuring for cleaner code
const { name, email, preferences } = user;
const [first, second, ...rest] = items;

// Good: Default values in destructuring
const { theme = 'light', language = 'en' } = userPreferences;

// Good: Nested destructuring when needed
const { 
  user: { profile: { displayName } },
  settings: { notifications = true } 
} = responseData;
```

### Spread Operator
```javascript
// Good: Use spread for object composition
const updatedUser = {
  ...existingUser,
  lastLoginAt: new Date(),
  preferences: {
    ...existingUser.preferences,
    theme: 'dark'
  }
};

// Good: Use spread for array operations
const allItems = [...existingItems, ...newItems];
const usersCopy = [...users];
```

## Error Handling

### Try-Catch Blocks
```javascript
// Good: Specific error handling
async function processPayment(paymentData) {
  try {
    const payment = await paymentGateway.charge(paymentData);
    await database.payments.create(payment);
    await emailService.sendReceipt(payment);
    return payment;
  } catch (error) {
    if (error instanceof PaymentDeclinedError) {
      throw new UserError('Payment was declined. Please try a different card.');
    }
    if (error instanceof NetworkError) {
      throw new SystemError('Payment system temporarily unavailable.');
    }
    // Log unexpected errors
    logger.error('Unexpected payment error', { paymentData, error });
    throw new SystemError('Payment processing failed.');
  }
}
```

### Custom Error Classes
```javascript
// Good: Define specific error types
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class NotFoundError extends Error {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}
```

## Async Programming

### Promise Handling
```javascript
// Good: Async/await for sequential operations
async function setupUser(userData) {
  const user = await createUser(userData);
  const profile = await createProfile(user.id);
  const preferences = await setDefaultPreferences(user.id);
  return { user, profile, preferences };
}

// Good: Promise.all for parallel operations
async function getUserDashboardData(userId) {
  const [user, orders, preferences, notifications] = await Promise.all([
    getUser(userId),
    getUserOrders(userId),
    getUserPreferences(userId),
    getUserNotifications(userId)
  ]);
  
  return { user, orders, preferences, notifications };
}

// Good: Handle Promise.all errors appropriately
async function fetchMultipleUsers(userIds) {
  const results = await Promise.allSettled(
    userIds.map(id => getUser(id))
  );
  
  const users = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
  
  const errors = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);
  
  if (errors.length > 0) {
    logger.warn('Some users failed to load', { errors });
  }
  
  return users;
}
```

## Module Organization

### Export Patterns
```javascript
// Good: Named exports for utilities
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Good: Class exports
export class UserService {
  constructor(database, logger) {
    this.database = database;
    this.logger = logger;
  }
  
  async createUser(userData) {
    // Implementation
  }
}

// Good: Default export for main module
export default class ApiClient {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }
}
```

### Import Patterns
```javascript
// Good: Organized imports
// Third-party libraries
import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Internal modules
import { database } from '@/lib/database.js';
import { logger } from '@/lib/logger.js';
import { config } from '@/config/index.js';

// Local modules
import { UserService } from './user-service.js';
import { validateUserInput } from './validation.js';
```

## Performance Considerations

### Efficient Operations
```javascript
// Good: Use appropriate array methods
const activeUsers = users.filter(user => user.isActive);
const userNames = users.map(user => user.name);
const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

// Good: Early returns to avoid unnecessary processing
function processUser(user) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission) return null;
  
  // Main processing logic here
  return processActiveUser(user);
}

// Good: Use Set for uniqueness checks
const uniqueUserIds = [...new Set(userIds)];
const hasPermission = userPermissions.has(requiredPermission);
```

### Memory Management
```javascript
// Good: Clean up event listeners
class DataProcessor {
  constructor() {
    this.abortController = new AbortController();
  }
  
  async processData() {
    try {
      const response = await fetch('/api/data', {
        signal: this.abortController.signal
      });
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return null;
      }
      throw error;
    }
  }
  
  cleanup() {
    this.abortController.abort();
  }
}
```

## Code Documentation

### JSDoc Comments
```javascript
/**
 * Calculates the total cost including tax and discounts
 * @param {Object[]} items - Array of items to calculate
 * @param {number} items[].price - Price of individual item
 * @param {number} items[].quantity - Quantity of item
 * @param {number} taxRate - Tax rate as decimal (0.08 for 8%)
 * @param {number} [discount=0] - Discount amount
 * @returns {Promise<Object>} Calculation result
 * @returns {number} returns.subtotal - Subtotal before tax
 * @returns {number} returns.tax - Tax amount
 * @returns {number} returns.total - Final total
 * @throws {ValidationError} When items array is empty
 * @example
 * const result = await calculateTotal(
 *   [{ price: 10, quantity: 2 }], 
 *   0.08, 
 *   5
 * );
 * console.log(result.total); // 16.6
 */
async function calculateTotal(items, taxRate, discount = 0) {
  if (!items.length) {
    throw new ValidationError('Items array cannot be empty');
  }
  
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  const discountedSubtotal = subtotal - discount;
  const tax = discountedSubtotal * taxRate;
  const total = discountedSubtotal + tax;
  
  return { subtotal, tax, total };
}
```