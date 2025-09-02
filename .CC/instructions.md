# Coding Project: API Architect

## Project Purpose

This Coding Project generates API contracts and implementation briefs for distributed frontend/backend development. It acts as the architect that designs the API and creates handoff packages for Claude Code agents in separate repositories.

## Project Knowledge

Add these files to your Claude Project:

### Core Instructions

1. **create-contract.md** - API contract generation
2. **create-briefs.md** - Brief generation for frontend/backend
3. **context-loader.md** - Efficient context management

### Optional Context (if available)

- `.agent-os/product/mission.md` - Product vision
- `.agent-os/product/tech-stack.md` - Technology choices
- `.agent-os/standards/` - Coding standards
- Previous API contracts for consistency

## How to Use

### Basic Commands

#### Generate Complete Package

```
Create API contract and briefs for [feature name]
```

This generates 4 artifacts:

1. API Contract (OpenAPI spec)
2. Backend Brief (FastAPI/Python)
3. Frontend Brief (Next.js/TypeScript)
4. Integration Tests

#### Quick Contract Only

```
Create API contract for [feature name]
```

Generates just the OpenAPI specification.

#### Update Existing Contract

```
Update the [feature] contract to [changes needed]
```

Modifies existing contract and regenerates briefs.

### Advanced Commands

#### Handle Breaking Changes

```
The [feature] API needs to change [description]. Create a migration plan.
```

Generates backwards-compatible migration strategy.

#### Generate Hotfix

```
Production bug: [description]. Create hotfix briefs for both repos.
```

Creates emergency fix briefs with minimal scope.

#### Bulk Feature Planning

```
Create contracts for these features:
1. User authentication
2. File upload
3. Payment processing
```

Generates multiple contracts with consistent patterns.

## Workflow Example

### 1. In This Project (Architect)

```
You: Create API contract and briefs for user authentication with JWT

Claude: [Generates 4 artifacts with complete specifications]
```

### 2. In Backend Repo (Claude Code)

```
You: /agent [paste backend brief]

Claude Code: [Implements FastAPI endpoints, models, tests]
```

### 3. In Frontend Repo (Claude Code)

```
You: /agent [paste frontend brief]

Claude Code: [Implements Next.js pages, forms, API integration]
```

### 4. Back Here for Integration

```
You: Both implementations complete. Create integration test plan.

Claude: [Generates E2E test scenarios and deployment sequence]
```

## Standard Configuration

### Backend Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Testing**: pytest

### Frontend Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Query
- **Forms**: React Hook Form
- **Validation**: Zod
- **Testing**: Jest + React Testing Library

### API Standards

- **Base Path**: `/api/v1`
- **Auth**: Bearer token (JWT)
- **Errors**: Standard format with code, message, details
- **Status Codes**: RESTful conventions
- **Pagination**: Cursor-based or limit/offset
- **Naming**: Plural resources, kebab-case

## Output Formats

### API Contract

- OpenAPI 3.0 specification
- Includes examples for all operations
- Defines all error responses
- Ready for mock server generation

### Backend Brief

- Claude Code `/agent` command
- Implementation checklist
- File structure
- Database migrations
- Test requirements

### Frontend Brief

- Claude Code `/agent` command
- Component structure
- API integration code
- Form validation
- Error handling

### Integration Tests

- Contract tests both sides must pass
- E2E test scenarios
- Deployment sequence
- Rollback plan

## Best Practices

### DO

- ✅ Define contracts before implementation
- ✅ Include all error scenarios
- ✅ Provide realistic examples
- ✅ Version your APIs
- ✅ Document breaking changes

### DON'T

- ❌ Skip contract tests
- ❌ Change contracts without updating briefs
- ❌ Deploy frontend before backend
- ❌ Forget error handling
- ❌ Ignore backwards compatibility

## Quick Reference

### Common Patterns

```yaml
# Pagination
GET /api/v1/resources?cursor=xxx&limit=20

# Filtering
GET /api/v1/resources?status=active&type=premium

# Sorting
GET /api/v1/resources?sort=-created_at,name

# Field selection
GET /api/v1/resources?fields=id,name,status

# Relationships
GET /api/v1/resources?include=author,tags
```

### Error Format

```json
{
  "error": "Human readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    "field": "Specific field error"
  },
  "timestamp": "2024-01-29T10:00:00Z",
  "path": "/api/v1/resource"
}
```

### Status Codes

- **200**: OK (GET, PUT)
- **201**: Created (POST)
- **204**: No Content (DELETE)
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Unprocessable Entity
- **429**: Too Many Requests
- **500**: Internal Server Error

## Troubleshooting

### Contract Mismatch

If frontend and backend don't align:

1. Check both are using latest contract
2. Verify contract tests are running
3. Compare actual vs expected payloads
4. Update contract and regenerate briefs

### Breaking Changes

When you must make breaking changes:

1. Version the API endpoint
2. Support both versions temporarily
3. Migrate frontend to new version
4. Deprecate old version with notice
5. Remove old version after grace period

### Integration Issues

If integration tests fail:

1. Verify backend is deployed
2. Check frontend is pointing to correct URL
3. Confirm authentication is configured
4. Review CORS settings
5. Check network/firewall rules
