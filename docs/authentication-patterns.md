# Authentication Patterns Guide

## Simplified Clerk-First Authentication Flow

This guide outlines the recommended authentication patterns that prioritize Clerk's built-in functionality while maintaining necessary backend integration.

## Core Principles

1. **Clerk First**: Use Clerk's client-side methods for primary authentication flows
2. **Backend Integration**: Use custom API routes only when backend-specific logic is required
3. **Security First**: Always use Clerk's secure token validation methods
4. **Performance Optimized**: Minimize authentication requests through proper caching

## Primary Authentication Patterns

### 1. User Authentication State

**✅ Recommended Pattern:**
```typescript
import { useAuth } from '@/lib/hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, isLoading, userId } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <SignInPrompt />;
  
  return <AuthenticatedContent userId={userId} />;
}
```

**❌ Avoid:**
```typescript
// Don't fetch auth status repeatedly
const [authStatus, setAuthStatus] = useState(null);
useEffect(() => {
  fetch('/api/auth/status').then(setAuthStatus);
}, []);
```

### 2. User Sign-In

**✅ Recommended Pattern:**
```typescript
import { useSignIn } from '@clerk/nextjs';

function SignInForm() {
  const { signIn, isLoaded } = useSignIn();
  
  const handleSignIn = async (email: string, password: string) => {
    if (!isLoaded) return;
    
    try {
      await signIn.create({
        identifier: email,
        password,
      });
      
      // Clerk handles navigation and session management
    } catch (error) {
      // Handle authentication errors
    }
  };
}
```

**❌ Avoid:**
```typescript
// Don't use custom login API unless backend requires it
const handleLogin = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};
```

### 3. User Registration

**✅ Recommended Pattern:**
```typescript
import { useSignUp } from '@clerk/nextjs';

function SignUpForm() {
  const { signUp, isLoaded } = useSignUp();
  
  const handleSignUp = async (email: string, password: string, name: string) => {
    if (!isLoaded) return;
    
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
      });
      
      // Clerk handles email verification and onboarding
    } catch (error) {
      // Handle registration errors
    }
  };
}
```

### 4. User Profile Data

**✅ Recommended Pattern:**
```typescript
import { useAuthData } from '@/lib/hooks/useAuth';

function ProfileComponent() {
  const { user, isLoading } = useAuthData();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <NotAuthenticated />;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}
```

### 5. User Permissions Check

**✅ Recommended Pattern:**
```typescript
import { useUserRoles } from '@/lib/hooks/useAuth';

function AdminPanel() {
  const { hasRole, isSchoolAdmin } = useUserRoles();
  
  if (!hasRole('school_admin')) {
    return <AccessDenied />;
  }
  
  return <AdminContent />;
}
```

### 6. Token Validation for API Calls

**✅ Recommended Pattern:**
```typescript
import { useAuth } from '@clerk/nextjs';

function useSecureAPI() {
  const { getToken } = useAuth();
  
  const secureRequest = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };
  
  return { secureRequest };
}
```

**❌ Avoid:**
```typescript
// Don't manually refresh tokens
const refreshToken = async () => {
  const response = await fetch('/api/auth/token/refresh');
  return response.json();
};
```

## Backend Integration Patterns

### When to Use Custom API Routes

Use custom authentication API routes **ONLY** when:

1. **Backend-specific business logic** is required
2. **Data synchronization** between Clerk and backend is needed
3. **Legacy system integration** cannot be handled client-side
4. **Custom permission mapping** is required

### Custom Route Usage

**✅ Backend Integration Pattern:**
```typescript
import { useAuthAPI } from '@/lib/api/clerk-client';

function useBackendSync() {
  const authAPI = useAuthAPI();
  
  // Only use custom routes when backend integration is needed
  const syncUserData = () => authAPI.post('/api/auth/sync');
  const getUserPermissions = () => authAPI.get('/api/auth/permissions');
  
  return { syncUserData, getUserPermissions };
}
```

## Security Best Practices

### 1. Token Handling

**✅ Secure Token Usage:**
```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId, getToken } = await auth();
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Use Clerk's secure token validation
  const token = await getToken();
  // Token is automatically valid and refreshed
}
```

### 2. Route Protection

**✅ Middleware Protection:**
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});
```

### 3. API Route Security

**✅ Secure API Routes:**
```typescript
import { validateJWTSecurely } from '@/lib/utils/jwt-validation';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  const validation = await validateJWTSecurely(authHeader);
  if (!validation.isValid) {
    return new Response('Invalid token', { status: 401 });
  }
  
  // Proceed with authenticated request
}
```

## Performance Optimization

### 1. Query Optimization

**✅ Optimized Auth Queries:**
```typescript
import { useAuthData } from '@/lib/hooks/useAuth';

function OptimizedComponent() {
  // Single query for all auth data instead of multiple requests
  const { user, permissions, session, isLoading } = useAuthData();
  
  // Data is cached and shared across components
}
```

### 2. Background Refresh

**✅ Background Token Refresh:**
```typescript
// Clerk handles this automatically - no manual implementation needed
import { useAuth } from '@clerk/nextjs';

function MyComponent() {
  const { getToken } = useAuth();
  
  // getToken() automatically refreshes if needed
  const makeAuthenticatedRequest = async () => {
    const token = await getToken(); // Always fresh
    // Use token for API request
  };
}
```

## Migration Guidelines

### From Custom Auth to Clerk Patterns

1. **Replace manual auth checks** with Clerk hooks
2. **Replace custom token refresh** with Clerk's automatic refresh
3. **Replace manual login/signup** with Clerk's client-side methods
4. **Keep backend integration routes** only where necessary
5. **Update error handling** to use Clerk's error patterns

### Breaking Changes

- **Removed**: `/api/auth/token/refresh` (replaced by Clerk's automatic refresh)
- **Deprecated**: Direct API calls for login/signup (use Clerk client-side methods)
- **Updated**: All custom routes now require clear documentation of necessity

## Examples

### Complete Authentication Component

```typescript
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useAuth, useUserRoles } from '@/lib/hooks/useAuth';

function AuthExample() {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasRole } = useUserRoles();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return (
      <div>
        <button onClick={() => signIn.create({ /* ... */ })}>
          Sign In with Clerk
        </button>
        <button onClick={() => signUp.create({ /* ... */ })}>
          Sign Up with Clerk
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Welcome! You are authenticated.</h1>
      {hasRole('school_admin') && (
        <AdminPanel />
      )}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Token refresh errors**: Use Clerk's `getToken()` instead of manual refresh
2. **Permission check failures**: Ensure permissions are loaded before checking
3. **Authentication loops**: Check for proper error handling in auth hooks
4. **Performance issues**: Use optimized auth hooks instead of multiple API calls

### Debug Patterns

```typescript
import { useAuth } from '@clerk/nextjs';

function DebugAuth() {
  const { isLoaded, isSignedIn, user } = useAuth();
  
  console.log({
    isLoaded,
    isSignedIn,
    userId: user?.id,
    sessionExists: !!user,
  });
  
  // Use this for debugging authentication state
}
```

## Conclusion

Following these patterns ensures:

1. **Security**: Using Clerk's proven authentication methods
2. **Performance**: Optimized caching and minimal API requests  
3. **Maintainability**: Clear separation between Clerk and custom logic
4. **Scalability**: Patterns that work as the application grows

Always prioritize Clerk's built-in functionality and only add custom authentication logic when specific backend integration is required.