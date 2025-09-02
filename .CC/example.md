# Example Workflow: User Registration Feature

## Step 1: Request to Architect Claude
```
User: Create API contract and briefs for user registration with email/password
```

## Step 2: Architect Claude Generates Package

### API Contract (artifact 1)
```yaml
openapi: 3.0.0
info:
  title: User Registration API
  version: 1.0.0

paths:
  /api/v1/auth/register:
    post:
      summary: Register new user
      operationId: registerUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, name]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                name:
                  type: string
                  minLength: 2
            examples:
              valid:
                value:
                  email: "user@example.com"
                  password: "SecurePass123!"
                  name: "John Doe"
      responses:
        201:
          description: User created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                    format: uuid
                  email:
                    type: string
                  name:
                    type: string
                  createdAt:
                    type: string
                    format: date-time
        400:
          description: Invalid input
        409:
          description: Email already exists
```

### Backend Brief (artifact 2)
```markdown
# Backend Brief: User Registration

## Claude Code Command
/agent Implement user registration endpoint POST /api/v1/auth/register with email/password. Hash passwords with bcrypt, check for duplicate emails, return 409 on conflict. Create User model, registration schema, and tests.

## Quick Start
1. Create SQLAlchemy User model
2. Add Pydantic schemas for request/response  
3. Implement registration endpoint
4. Add password hashing
5. Handle duplicate email (409)
6. Write tests

## Database Migration
\```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
\```

## Expected Files
- db/models/user.py
- schemas/auth.py
- api/v1/endpoints/auth.py
- services/auth_service.py
- tests/test_auth.py
```

### Frontend Brief (artifact 3)
```markdown
# Frontend Brief: User Registration

## Claude Code Command
/agent Create registration form with email, password, name fields. Post to /api/v1/auth/register. Show loading state, handle 409 duplicate email error inline, redirect to dashboard on success. Use React Hook Form and Zod validation.

## Quick Start
1. Create registration page
2. Build form with React Hook Form
3. Add Zod validation matching API requirements
4. Implement API call with error handling
5. Handle 409 error specifically
6. Add success redirect

## Component Structure
\```typescript
// app/register/page.tsx
export default function RegisterPage() {
  return <RegisterForm />;
}

// components/auth/RegisterForm.tsx
- Email field (email validation)
- Password field (min 8 chars, show/hide toggle)
- Name field (min 2 chars)
- Submit button with loading state
- Error display (especially for duplicate email)
\```

## API Integration
\```typescript
async function registerUser(data: RegisterData) {
  const res = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (res.status === 409) {
    throw new Error('Email already registered');
  }
  
  if (!res.ok) {
    throw new Error('Registration failed');
  }
  
  return res.json();
}
\```
```

### Integration Tests (artifact 4)
```markdown
# Integration Test Plan

## Contract Tests (Both repos must pass)
\```python
# Backend must implement
def test_successful_registration():
    response = client.post("/api/v1/auth/register", json={
        "email": "new@example.com",
        "password": "SecurePass123!",
        "name": "Test User"
    })
    assert response.status_code == 201
    assert "id" in response.json()
    assert response.json()["email"] == "new@example.com"

def test_duplicate_email_returns_409():
    # Create user first
    client.post("/api/v1/auth/register", json={...})
    # Try to create again
    response = client.post("/api/v1/auth/register", json={
        "email": "existing@example.com",  # Same email
        "password": "DifferentPass123!",
        "name": "Another User"
    })
    assert response.status_code == 409
\```

\```typescript
// Frontend must handle
test('shows error on duplicate email', async () => {
  // Mock 409 response
  server.use(
    rest.post('/api/v1/auth/register', (req, res, ctx) => {
      return res(ctx.status(409), ctx.json({
        error: 'Email already exists'
      }));
    })
  );
  
  // Submit form
  // Assert error message displayed
  expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
});
\```

## Deployment Sequence
1. Backend: Deploy registration endpoint
2. Backend: Run migration
3. Backend: Verify endpoint accessible
4. Frontend: Deploy registration form
5. Both: Run E2E test
6. Enable feature flag
```

## Step 3: Copy to Claude Code Agents

### In Backend Repo:
```bash
# Open Claude Code in backend repo
# Paste Backend Brief
# Claude Code implements everything
```

### In Frontend Repo:
```bash
# Open Claude Code in frontend repo  
# Paste Frontend Brief
# Claude Code implements everything
```

## Step 4: Integration Testing
Both repos reference the same contract tests to ensure compatibility.

## Benefits of This Approach

1. **Single Source of Truth**: API contract defines the interface
2. **Parallel Development**: Both teams work simultaneously  
3. **No Integration Surprises**: Contract tests catch mismatches
4. **Clear Handoff**: Copy-paste ready briefs
5. **Consistent Implementation**: Both sides follow same spec

## Common Commands

```markdown
# For Architect Claude (this project):

"Create API contract and briefs for [feature]"
"Update contract to add [new endpoint]"
"Generate migration plan for breaking change"
"Create hotfix briefs for [bug description]"

# For Claude Code (in repos):

/agent [paste the generated brief]
```