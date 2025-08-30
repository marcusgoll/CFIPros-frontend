/**
 * Tests for utility functions
 * Testing common utility functions across the application
 */

import { cn, formatFileSize, formatDate, generateId, slugify, truncate, capitalizeFirst, isValidEmail, debounce } from '@/lib/utils';

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
    expect(cn('class1', null, 'class2')).toBe('class1 class2');
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    
    expect(cn('base', isActive && 'active', isDisabled && 'disabled'))
      .toBe('base active');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('should deduplicate classes when using Tailwind merge', () => {
    // This tests the tailwind-merge functionality
    expect(cn('px-4 px-8')).toBe('px-8');
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(100)).toBe('100 B');
    expect(formatFileSize(999)).toBe('999 B');
  });

  it('should format kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('should format megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });

  it('should format gigabytes correctly', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    expect(formatFileSize(1024 * 1024 * 1024 * 1.5)).toBe('1.5 GB');
  });

  it('should handle negative numbers', () => {
    expect(formatFileSize(-100)).toBe('0 B');
  });
});

describe('formatDate', () => {
  const testDate = new Date('2024-01-15T10:30:00Z');

  it('should format date with default format', () => {
    const result = formatDate(testDate);
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('should format date with custom format', () => {
    const result = formatDate(testDate, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    expect(result).toMatch(/01\/15\/2024/);
  });

  it('should handle string dates', () => {
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('should handle invalid dates', () => {
    expect(formatDate('invalid-date')).toBe('Invalid Date');
    expect(formatDate('')).toBe('Invalid Date');
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });

  it('should generate IDs with default length', () => {
    const id = generateId();
    expect(id).toHaveLength(8);
  });

  it('should generate IDs with custom length', () => {
    const shortId = generateId(4);
    const longId = generateId(16);
    
    expect(shortId).toHaveLength(4);
    expect(longId).toHaveLength(16);
  });

  it('should only contain alphanumeric characters', () => {
    const id = generateId(20);
    expect(id).toMatch(/^[a-zA-Z0-9]+$/);
  });
});

describe('slugify', () => {
  it('should convert text to URL-friendly slugs', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('JavaScript & React')).toBe('javascript-react');
    expect(slugify('This is a TEST!')).toBe('this-is-a-test');
  });

  it('should handle special characters', () => {
    expect(slugify('café & résumé')).toBe('cafe-resume');
    expect(slugify('Node.js Development')).toBe('node-js-development');
    expect(slugify('API v2.0 Documentation')).toBe('api-v2-0-documentation');
  });

  it('should handle multiple spaces and dashes', () => {
    expect(slugify('multiple   spaces')).toBe('multiple-spaces');
    expect(slugify('already-has-dashes')).toBe('already-has-dashes');
    expect(slugify('  leading and trailing  ')).toBe('leading-and-trailing');
  });

  it('should handle empty strings', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });
});

describe('truncate', () => {
  const longText = 'This is a very long text that should be truncated';

  it('should truncate text to specified length', () => {
    expect(truncate(longText, 20)).toBe('This is a very long...');
    expect(truncate(longText, 10)).toBe('This is a...');
  });

  it('should not truncate short text', () => {
    const shortText = 'Short';
    expect(truncate(shortText, 20)).toBe('Short');
  });

  it('should use custom suffix', () => {
    expect(truncate(longText, 20, ' (more)')).toBe('This is a very long (more)');
  });

  it('should handle edge cases', () => {
    expect(truncate('', 10)).toBe('');
    expect(truncate('Test', 0)).toBe('...');
    expect(truncate('Test', -1)).toBe('...');
  });
});

describe('capitalizeFirst', () => {
  it('should capitalize first letter', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
    expect(capitalizeFirst('world')).toBe('World');
    expect(capitalizeFirst('javaScript')).toBe('JavaScript');
  });

  it('should handle empty strings', () => {
    expect(capitalizeFirst('')).toBe('');
  });

  it('should handle single characters', () => {
    expect(capitalizeFirst('a')).toBe('A');
    expect(capitalizeFirst('z')).toBe('Z');
  });

  it('should not affect already capitalized text', () => {
    expect(capitalizeFirst('Hello')).toBe('Hello');
    expect(capitalizeFirst('WORLD')).toBe('WORLD');
  });
});

describe('isValidEmail', () => {
  it('should validate correct email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      'user_name@example.com',
      'test123@example.com',
    ];

    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      '',
      'not-an-email',
      '@example.com',
      'test@',
      'test..test@example.com',
      'test@example',
      'test@.example.com',
      'test@example..com',
    ];

    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments correctly', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2', 123);
    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should preserve context', () => {
    const obj = {
      value: 'test',
      method: jest.fn(function(this: any) {
        return this.value;
      }),
    };

    const debouncedMethod = debounce(obj.method.bind(obj), 100);
    debouncedMethod();
    jest.advanceTimersByTime(100);

    expect(obj.method).toHaveBeenCalled();
  });
});