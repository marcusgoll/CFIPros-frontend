# Create Implementation Briefs Instruction

## Purpose
Generate backend and frontend implementation briefs from API contract

## Backend Brief Generation

### Step 1: Analyze Contract
```yaml
extract:
  - All endpoints to implement
  - Request/response schemas
  - Validation rules
  - Error scenarios
  
derive:
  - Database schema needs
  - Business logic requirements
  - Authentication/authorization rules
  - Third-party integrations
```

### Step 2: Generate Backend Structure
```python
# FastAPI project structure
app/
├── api/
│   └── v1/
│       ├── endpoints/
│       │   └── [feature].py       # Route handlers
│       └── deps.py                 # Dependencies
├── core/
│   ├── config.py                   # Settings
│   └── security.py                 # Auth utilities
├── crud/
│   └── [feature].py                # Database operations
├── db/
│   └── models/
│       └── [feature].py            # SQLAlchemy models
├── schemas/
│   └── [feature].py                # Pydantic schemas
├── services/
│   └── [feature]_service.py        # Business logic
└── tests/
    ├── unit/
    │   └── test_[feature]_service.py
    └── integration/
        └── test_[feature]_api.py
```

### Step 3: Backend Brief Template
```markdown
# Backend Brief: [Feature Name]

## Claude Code Command
/agent Implement [feature] API endpoints according to the provided contract. Create FastAPI routes, Pydantic schemas, SQLAlchemy models, and service layer. Include comprehensive tests.

## Context
- **Repository**: [Backend repo name]
- **Framework**: FastAPI with PostgreSQL
- **Base URL**: http://localhost:8000

## Implementation Tasks

### 1. Database Schema
\```sql
-- Add to migrations
CREATE TABLE [table_name] (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    [fields based on contract],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\```

### 2. Pydantic Schemas
\```python
# schemas/[feature].py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class [Feature]Create(BaseModel):
    # From contract request schema
    
class [Feature]Response(BaseModel):
    # From contract response schema
\```

### 3. API Endpoints
\```python
# api/v1/endpoints/[feature].py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from schemas import [Feature]Create, [Feature]Response
from services import [Feature]Service

router = APIRouter(prefix="/api/v1/[feature]", tags=["[feature]"])

@router.post("/", response_model=[Feature]Response, status_code=201)
async def create_[feature](
    data: [Feature]Create,
    service: [Feature]Service = Depends()
):
    """Create new [feature]"""
    return await service.create(data)
\```

### 4. Service Layer
\```python
# services/[feature]_service.py
class [Feature]Service:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
    
    async def create(self, data: [Feature]Create) -> [Feature]Response:
        # Business logic here
        # Validation
        # Database operations
        # Return formatted response
\```

### 5. Testing Requirements
- Unit tests for service layer
- Integration tests for each endpoint
- Contract tests must pass
- Test error scenarios
- Test edge cases

## Success Criteria
- [ ] All endpoints return correct status codes
- [ ] Request validation matches contract exactly
- [ ] Response format matches contract exactly
- [ ] All tests passing (aim for >80% coverage)
- [ ] Error responses follow standard format
- [ ] Database migrations ready
- [ ] API documentation auto-generated
```

## Frontend Brief Generation

### Step 1: Analyze UI Needs
```yaml
from_contract:
  - API endpoints to call
  - Request payloads to construct
  - Response data to display
  - Error states to handle
  
derive:
  - Form fields needed
  - Validation rules
  - Loading states
  - Success feedback
  - Error display
```

### Step 2: Generate Frontend Structure
```typescript
// Next.js 14 project structure
app/
├── [feature]/
│   ├── page.tsx                    // Main page
│   ├── layout.tsx                  // Layout wrapper
│   └── components/
│       ├── [Feature]Form.tsx       // Form component
│       ├── [Feature]List.tsx       // List view
│       └── [Feature]Detail.tsx     // Detail view
├── components/
│   └── [feature]/
│       ├── [Feature]Card.tsx       // Reusable card
│       └── [Feature]Modal.tsx      // Modal dialogs
├── lib/
│   ├── api/
│   │   └── [feature].ts            // API client
│   └── validations/
│       └── [feature].ts            // Zod schemas
├── hooks/
│   ├── use[Feature].ts             // Data fetching
│   └── use[Feature]Form.ts         // Form logic
└── __tests__/
    └── [feature]/
        ├── [Feature]Form.test.tsx
        └── api.test.ts
```

### Step 3: Frontend Brief Template
```markdown
# Frontend Brief: [Feature Name]

## Claude Code Command
/agent Implement [feature] UI with forms, list views, and detail pages. Integrate with backend API per contract. Use React Query for data fetching, React Hook Form for forms, and Zod for validation. Include loading and error states.

## Context
- **Repository**: [Frontend repo name]
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui
- **API Base**: http://localhost:8000/api/v1

## Implementation Tasks

### 1. API Client
\```typescript
// lib/api/[feature].ts
import { z } from 'zod';

// Validation schemas from contract
const [Feature]Schema = z.object({
  // Match contract response
});

export async function create[Feature](data: Create[Feature]Data) {
  const response = await fetch('/api/v1/[feature]', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error);
  }
  
  return [Feature]Schema.parse(await response.json());
}
\```

### 2. React Query Hooks
\```typescript
// hooks/use[Feature].ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { create[Feature], get[Feature]s } from '@/lib/api/[feature]';

export function use[Feature]s() {
  return useQuery({
    queryKey: ['[feature]s'],
    queryFn: get[Feature]s,
  });
}

export function useCreate[Feature]() {
  return useMutation({
    mutationFn: create[Feature],
    onSuccess: () => {
      queryClient.invalidateQueries(['[feature]s']);
    },
  });
}
\```

### 3. Form Component
\```typescript
// components/[feature]/[Feature]Form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreate[Feature] } from '@/hooks/use[Feature]';

export function [Feature]Form() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver([Feature]CreateSchema),
  });
  
  const createMutation = useCreate[Feature]();
  
  const onSubmit = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('[Feature] created successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields based on contract */}
    </form>
  );
}
\```

### 4. Error Handling
\```typescript
// Handle specific error codes from contract
switch (error.code) {
  case 409:
    setError('email', { message: 'Email already exists' });
    break;
  case 422:
    setError('root', { message: error.details });
    break;
  default:
    toast.error('An unexpected error occurred');
}
\```

### 5. Testing Requirements
- Component tests with React Testing Library
- API mocking with MSW
- Form validation tests
- Error state tests
- Accessibility tests

## Success Criteria
- [ ] All API endpoints integrated
- [ ] Forms validate according to contract
- [ ] Error states handled gracefully
- [ ] Loading states on all async operations
- [ ] Responsive design (mobile-first)
- [ ] Accessibility standards met
- [ ] All tests passing
- [ ] TypeScript types match contract
```