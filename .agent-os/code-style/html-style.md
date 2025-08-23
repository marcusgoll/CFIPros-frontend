# HTML Style Guide

HTML formatting conventions for CFI Pros projects. Focus on readability and maintainability.

## Basic Structure

### Indentation and Nesting
- Use 2 spaces for indentation
- Nest elements logically with proper indentation
- Close tags on the same level as opening tags

```html
<!-- Good: Clean, readable structure -->
<div class="container">
  <header class="site-header">
    <h1 class="title">CFI Pros</h1>
    <nav class="main-nav">
      <a href="/" class="nav-link">Home</a>
      <a href="/courses" class="nav-link">Courses</a>
      <a href="/about" class="nav-link">About</a>
    </nav>
  </header>
</div>
```

### Attribute Formatting

#### Simple Elements
For elements with few attributes, keep on one line:
```html
<input type="email" name="email" class="form-input" required>
<button type="submit" class="btn btn-primary">Submit</button>
```

#### Complex Elements
For elements with many attributes, break to new lines:
```html
<input
  type="email"
  name="email"
  class="form-input w-full px-3 py-2 border border-gray-300 rounded-md"
  placeholder="Enter your email"
  required
  aria-describedby="email-error">
```

## Semantic HTML

### Use Appropriate Elements
```html
<!-- Good: Semantic structure -->
<article class="blog-post">
  <header>
    <h1>Article Title</h1>
    <time datetime="2024-01-15">January 15, 2024</time>
  </header>
  
  <main>
    <p>Article content...</p>
  </main>
  
  <footer>
    <address>By <a href="/author/john">John Doe</a></address>
  </footer>
</article>

<!-- Avoid: Generic divs everywhere -->
<div class="blog-post">
  <div class="header">
    <div class="title">Article Title</div>
    <div class="date">January 15, 2024</div>
  </div>
</div>
```

### Form Structure
```html
<form class="user-form" method="post" action="/users">
  <fieldset>
    <legend>Personal Information</legend>
    
    <div class="field-group">
      <label for="first-name" class="field-label">First Name</label>
      <input 
        type="text" 
        id="first-name" 
        name="firstName" 
        class="field-input"
        required>
    </div>
    
    <div class="field-group">
      <label for="email" class="field-label">Email</label>
      <input 
        type="email" 
        id="email" 
        name="email" 
        class="field-input"
        required
        aria-describedby="email-help">
      <small id="email-help" class="field-help">
        We'll never share your email
      </small>
    </div>
  </fieldset>
  
  <div class="form-actions">
    <button type="submit" class="btn btn-primary">Create Account</button>
    <button type="button" class="btn btn-secondary">Cancel</button>
  </div>
</form>
```

## Accessibility

### Required Attributes
```html
<!-- Images with alt text -->
<img src="logo.png" alt="CFI Pros - Flight Training" class="logo">

<!-- Form labels -->
<label for="search" class="sr-only">Search courses</label>
<input type="search" id="search" name="search" class="search-input">

<!-- ARIA landmarks -->
<nav aria-label="Main navigation" class="main-nav">
  <ul>
    <li><a href="/" aria-current="page">Home</a></li>
    <li><a href="/courses">Courses</a></li>
  </ul>
</nav>
```

### Interactive Elements
```html
<!-- Buttons with clear purpose -->
<button 
  type="button" 
  class="menu-toggle"
  aria-expanded="false"
  aria-controls="main-menu"
  aria-label="Toggle main menu">
  <span class="hamburger-icon"></span>
</button>

<!-- Links with descriptive text -->
<a href="/course/123" class="course-link">
  Learn JavaScript Fundamentals
  <span class="sr-only">(opens course details)</span>
</a>
```

## Class Naming

### BEM-like Conventions
```html
<!-- Component structure -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Course Title</h3>
    <span class="card-badge card-badge--featured">Featured</span>
  </div>
  
  <div class="card-content">
    <p class="card-description">Course description...</p>
    <div class="card-meta">
      <span class="card-duration">4 hours</span>
      <span class="card-level">Beginner</span>
    </div>
  </div>
  
  <div class="card-actions">
    <button class="btn btn--primary card-action">Enroll Now</button>
  </div>
</div>
```

### Utility Classes with Tailwind
```html
<!-- Responsive utility classes -->
<div class="container mx-auto px-4">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold mb-2">Course Title</h3>
      <p class="text-gray-600 mb-4">Course description...</p>
      <button class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
        Enroll Now
      </button>
    </div>
  </div>
</div>
```

## Performance Considerations

### Optimize Loading
```html
<!-- Lazy load images -->
<img 
  src="course-thumbnail.jpg" 
  alt="JavaScript Course" 
  class="course-image"
  loading="lazy"
  width="300" 
  height="200">

<!-- Preload critical resources -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>

<!-- Efficient script loading -->
<script src="critical.js"></script>
<script src="non-critical.js" defer></script>
```

### Meta Tags
```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Course Name - CFI Pros</title>
  <meta name="description" content="Learn flight training fundamentals with certified instructors.">
  
  <!-- Open Graph for social sharing -->
  <meta property="og:title" content="Course Name - CFI Pros">
  <meta property="og:description" content="Learn flight training fundamentals.">
  <meta property="og:image" content="/images/course-preview.jpg">
</head>
```