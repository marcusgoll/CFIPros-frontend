# Create API Contract Instruction

## Purpose
Generate OpenAPI specification and contract tests for a feature

## Process

### Step 1: Analyze Requirements
```yaml
inputs:
  - feature_name
  - user_stories
  - data_requirements
  - business_rules
  
analysis:
  - Identify entities involved
  - Determine CRUD operations needed
  - Map user actions to API calls
  - Define authorization requirements
```

### Step 2: Design Endpoints
```yaml
for_each_entity:
  consider:
    - GET /api/v1/{entity} (list)
    - GET /api/v1/{entity}/{id} (detail)
    - POST /api/v1/{entity} (create)
    - PUT /api/v1/{entity}/{id} (update)
    - DELETE /api/v1/{entity}/{id} (delete)
    - POST /api/v1/{entity}/{id}/{action} (custom actions)
  
naming_conventions:
    - Use plural nouns for collections
    - Use kebab-case for multi-word resources
    - Version all APIs (/v1/)
    - Use standard HTTP methods
```

### Step 3: Define Schemas
```yaml
request_schema:
  - Required fields
  - Optional fields
  - Field types and formats
  - Validation rules
  - Example values

response_schema:
  - Success response structure
  - Pagination envelope (if applicable)
  - Metadata fields
  - HATEOAS links (optional)

error_schema:
  standard_format:
    error: string (human readable)
    code: string (machine readable)
    details: object (field-specific errors)
    timestamp: datetime
    path: string (endpoint that errored)
```

### Step 4: Standard Error Codes
```yaml
client_errors:
  400: Bad Request - Invalid input
  401: Unauthorized - Missing/invalid auth
  403: Forbidden - Lack permission
  404: Not Found - Resource doesn't exist
  409: Conflict - Duplicate/constraint violation
  422: Unprocessable - Failed business rules
  429: Too Many Requests - Rate limited

server_errors:
  500: Internal Server Error
  502: Bad Gateway
  503: Service Unavailable
```

### Step 5: Generate Contract Tests
```python
# Template for contract tests

def test_[endpoint]_success():
    """Test successful [operation]"""
    request = {valid_data}
    response = api_call(request)
    assert response.status == [expected_status]
    assert response.body matches schema
    
def test_[endpoint]_missing_required_field():
    """Test validation for required fields"""
    request = {missing_required_field}
    response = api_call(request)
    assert response.status == 400
    assert "required" in response.body.error

def test_[endpoint]_unauthorized():
    """Test authentication requirement"""
    request = {valid_data, no_auth}
    response = api_call(request)
    assert response.status == 401
```

## Output Template

```yaml
openapi: 3.0.0
info:
  title: Feature API Contract
  version: 1.0.0
  description: Contract for [feature_name]

paths:
  /api/v1/resource:
    post:
      summary: Create resource
      operationId: createResource
      tags: [Resource]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateResourceRequest'
            examples:
              valid:
                value:
                  field1: "example"
                  field2: 123
      responses:
        201:
          description: Resource created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ResourceResponse'
        400:
          $ref: '#/components/responses/BadRequest'
        401:
          $ref: '#/components/responses/Unauthorized'

components:
  schemas:
    CreateResourceRequest:
      type: object
      required: [field1, field2]
      properties:
        field1:
          type: string
          minLength: 1
          maxLength: 255
        field2:
          type: integer
          minimum: 0
    
    ResourceResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        field1:
          type: string
        field2:
          type: integer
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
  
  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
  schemas:
    Error:
      type: object
      properties:
        error:
          type: string
        code:
          type: string
        details:
          type: object
        timestamp:
          type: string
          format: date-time
```