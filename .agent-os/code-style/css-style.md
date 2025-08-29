# CSS Style Guide

CSS and TailwindCSS conventions for CFI Pros projects. We prioritize TailwindCSS for most styling needs.

## TailwindCSS Guidelines

### Basic Class Organization

For simple elements, keep classes on one line:
```html
<button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
  Click me
</button>
```

### Multi-line Class Organization

For complex elements with many classes, organize by category:

```html
<!-- Good: Organized by functionality -->
<div class="
  flex flex-col items-center justify-center
  bg-white dark:bg-gray-900 
  border border-gray-200 dark:border-gray-700
  rounded-lg shadow-md
  p-6 m-4
  w-full max-w-md
  hover:shadow-lg hover:scale-105
  focus:outline-none focus:ring-2 focus:ring-blue-500
  transition-all duration-200
  sm:p-8
  md:max-w-lg
  lg:max-w-xl
">
  Content here
</div>
```

### Class Ordering

1. **Layout**: `flex`, `grid`, `block`, `inline`, positioning
2. **Sizing**: `w-`, `h-`, `max-w-`, etc.
3. **Spacing**: `p-`, `m-`, `space-x-`, etc.
4. **Background/Borders**: `bg-`, `border-`, `rounded-`
5. **Typography**: `text-`, `font-`, `leading-`
6. **Effects**: `shadow-`, `opacity-`, `transform`
7. **Interactions**: `hover:`, `focus:`, `active:`
8. **Responsive**: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

### Responsive Design Patterns

```html
<!-- Good: Mobile-first responsive design -->
<div class="
  grid grid-cols-1 gap-4 p-4
  sm:grid-cols-2 sm:gap-6 sm:p-6
  md:grid-cols-3 md:gap-8 md:p-8
  lg:grid-cols-4 lg:gap-10
  xl:max-w-7xl xl:mx-auto
">
  <!-- Grid items -->
</div>

<!-- Navigation example -->
<nav class="
  flex flex-col space-y-2 p-4
  md:flex-row md:space-y-0 md:space-x-6 md:items-center
  lg:space-x-8
">
  <a href="/" class="text-gray-700 hover:text-blue-600 transition-colors">
    Home
  </a>
  <a href="/courses" class="text-gray-700 hover:text-blue-600 transition-colors">
    Courses
  </a>
</nav>
```

## Component Patterns

### Button Styles
```html
<!-- Primary button -->
<button class="
  inline-flex items-center justify-center
  px-4 py-2 rounded-md
  bg-blue-600 text-white font-medium
  hover:bg-blue-700 focus:bg-blue-700
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
">
  Submit
</button>

<!-- Secondary button -->
<button class="
  inline-flex items-center justify-center
  px-4 py-2 rounded-md
  border border-gray-300 bg-white text-gray-700 font-medium
  hover:bg-gray-50 focus:bg-gray-50
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  transition-colors duration-200
">
  Cancel
</button>
```

### Card Components
```html
<div class="
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  rounded-lg shadow-sm
  overflow-hidden
  hover:shadow-md transition-shadow duration-200
">
  <div class="p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Card Title
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-4">
      Card description text goes here.
    </p>
    <div class="flex justify-between items-center">
      <span class="text-sm text-gray-500">$99</span>
      <button class="btn-primary">Enroll</button>
    </div>
  </div>
</div>
```

### Form Elements
```html
<!-- Input field -->
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-1" for="email">
    Email Address
  </label>
  <input 
    type="email" 
    id="email" 
    name="email"
    class="
      w-full px-3 py-2
      border border-gray-300 rounded-md
      bg-white text-gray-900
      placeholder-gray-500
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-100 disabled:text-gray-500
    "
    placeholder="Enter your email"
  >
</div>

<!-- Select dropdown -->
<select class="
  w-full px-3 py-2
  border border-gray-300 rounded-md
  bg-white text-gray-900
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
">
  <option value="">Choose an option</option>
  <option value="beginner">Beginner</option>
  <option value="intermediate">Intermediate</option>
</select>
```

## Custom CSS (When Needed)

### Component-Specific Styles
```css
/* Use CSS custom properties for theming */
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --border-radius-base: 0.375rem;
  --spacing-unit: 0.25rem;
}

/* Component that needs custom behavior */
.course-progress {
  position: relative;
  background: linear-gradient(
    to right, 
    var(--color-primary) var(--progress-percent, 0%), 
    #e5e7eb var(--progress-percent, 0%)
  );
  transition: all 0.3s ease;
}

/* Animation that's hard to achieve with Tailwind */
@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-in-up {
  animation: slideInUp 0.3s ease-out;
}
```

### Utility Classes for Common Patterns
```css
/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus styles for accessibility */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

/* Consistent button base */
.btn-base {
  @apply inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed;
}
```

## Dark Mode Support

```html
<!-- Consistent dark mode classes -->
<div class="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
  border border-gray-200 dark:border-gray-700
">
  <h2 class="text-xl font-bold text-gray-900 dark:text-white">
    Title
  </h2>
  <p class="text-gray-600 dark:text-gray-300">
    Description text
  </p>
</div>
```

## Performance Considerations

### Purge Unused Classes
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
    './public/**/*.html'
  ],
  // ... other config
}
```

### Minimize Custom CSS
- Use Tailwind utilities whenever possible
- Create custom utilities for repeated patterns
- Avoid writing component-specific CSS unless necessary
- Use CSS custom properties for values that change

## Organization Guidelines

1. **Prefer Tailwind utilities** over custom CSS
2. **Group related classes** logically in multi-line format
3. **Use consistent spacing** and formatting
4. **Document complex class combinations** with comments
5. **Test dark mode** and responsive behavior
6. **Validate accessibility** with screen readers