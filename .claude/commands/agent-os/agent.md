---
description: Streamlined Agent OS orchestrator for API contract-driven development with quality gates
version: 3.0
encoding: UTF-8
---

## Task Status Legend

⏳ Pending
🔄 In Progress
✅ Complete
⚠️ Blocked
❌ Failed

# Agent OS Orchestrator - Streamlined

Coordinates spec creation, task execution, and quality validation for API contract-driven development across distributed repositories.

## Inputs

### Option A: Feature Description

```yaml
feature_name: string
requirements: string
```

### Option B: External Brief (API Architect)

```yaml
api_contract: OpenAPI specification
backend_brief: Implementation instructions for backend repo
frontend_brief: Implementation instructions for frontend repo
integration_tests: Contract test definitions
```

## Core Instructions Used

- `@.agent-os/instructions/core/create-spec.md` - Creates spec with API contract
- `@.agent-os/instructions/core/create-tasks.md` - Generates task list
- `@.agent-os/instructions/core/execute-tasks.md` - Executes with quality gates
- `@.agent-os/instructions/core/complete-tasks.md` - Validates and completes

## Sub-Agents Used

Essential sub-agents:

- **test-runner** - Runs tests, lint, types, coverage
- **project-manager** - Tracks tasks and creates recaps
- **senior-code-reviewer** - Validates contract compliance and quality
- **git-workflow** - Handles branches, commits, and PRs with quality validation

## Configuration

```yaml
quality:
  coverage_min: 80
  lint_errors: 0
  type_errors: 0
  contract_tests: required
  black_formatting: 0 # Add Black formatting quality gate

api:
  contract_path: api-contracts/openapi.yaml
  contract_tests_in: spec.md

git:
  branch_prefix: feature/
  base_branch: main
  conventional_commits: true
```

## Workflow

```yaml
trigger: User provides API contract and briefs
output: Spec created from brief
```

0. **Process External Brief** (when provided)
   - Accept API contract (OpenAPI spec)
   - Store in api-contracts/openapi.yaml
   - Extract requirements for spec.md
   - Parse contract tests
   - Output: Spec folder with contract

### Phase 1: Specification

```yaml
trigger: User describes feature need
output: Spec with API contract
```

1. **Create Spec** (`create-spec.md`)
  Refer to the instructions located in this file:
@.agent-os/instructions/core/create-spec.md
   - Generate spec.md with requirements
   - Create api-contracts/openapi.yaml
   - Include contract tests in spec.md
   - Output: Complete specification

### Phase 2: Planning

```yaml
trigger: Spec approved
output: Task list with quality gates
```

2. **Create Tasks** (`create-tasks.md`)
Refer to the instructions located in this file:
@.agent-os/instructions/core/create-tasks.md
   - Load spec and API contract
   - Generate tasks.md
   - Include lint/type/test subtasks
   - Output: Executable task list

### Phase 3: Execution

```yaml
trigger: Ready to implement
output: Working code with quality validation
```

3. **Execute Tasks** (`execute-tasks.md`)
Refer to the instructions located in this file:
@.agent-os/instructions/core/execute-tasks.md
   - **Create feature branch** (`git-workflow`)
    **Use sub agent "git-workflow"**
     - Extract branch name from spec folder
     - Create and switch to feature branch
   - Load API contract
   - Execute each task
   - Run quality gates per task:
     - Contract tests from spec.md
     - Lint check (0 errors)
     - Type check (0 errors)
     - Test coverage (≥80%)
     - Black Formatting (0 errors) # Add Black formatting check
   - Update task status in tasks.md using the Task Status Legend
   - Output: Implemented features on feature branch

### Phase 4: Completion

```yaml
trigger: All tasks done
output: PR-ready code with quality validation
```

4. **Complete Tasks** (`complete-tasks.md`)
Refer to the instructions located in this file:
@.agent-os/instructions/core/complete-tasks.md
   - Run full quality validation (`test-runner`)
   **Use sub agent "test-runner"**
   - Verify contract compliance (`senior-code-reviewer`)
   - Use sub agent "senior-code-reviewer"
   - Generate coverage report
   - Create recap document (`project-manager`)
      - Use sub agent "project-manager"
   - Update @.agent-os/docs/api-contract as single source of api truth.
   - Update @.agent-os/product/roadmap.md in the workflow.
   - **Commit and create PR** (`git-workflow`)
      Use sub agent "git-workflow"
     - Commit with quality metrics
     - Push to remote
     - Create PR with contract reference
   - Output: PR ready for review

## Quality Gates

Each phase must pass before proceeding:

### Spec Quality Gate

- [ ] API contract defined (openapi.yaml)
- [ ] Contract tests included in spec.md
- [ ] Acceptance criteria clear

### Task Quality Gate

- [ ] All tasks reference API contract
- [ ] Quality subtasks included (lint, type, test)
- [ ] Tasks properly scoped

### Execution Quality Gate

- [ ] Contract tests passing
- [ ] Lint: 0 errors
- [ ] Types: 0 errors
- [ ] Coverage: ≥80%
- [ ] Black Formatting: 0 errors # Added missing Black formatting to quality gates

### Completion Quality Gate

- [ ] All tasks marked complete
- [ ] Full test suite passing
- [ ] API contract validated
- [ ] Recap document created
- [ ] Update @.agent-os/docs/api-contract as single source of api truth.
- [ ] Update @.agent-os/product/roadmap.md in the workflow.

## Simple Commands

### Start New Feature

```
Create spec for [feature name]
```

→ Runs Phase 1: create-spec.md

### Plan Implementation

```
Create tasks for current spec
```

→ Runs Phase 2: create-tasks.md

### Begin Development

```
Execute tasks
```

→ Runs Phase 3: execute-tasks.md with quality gates

### Finalize Feature

```
Complete feature
```

→ Runs Phase 4: complete-tasks.md with validation

## Error Handling

### Quality Gate Failures

```yaml
on_lint_error:
  - Fix issues
  - Re-run validation
  - Cannot proceed until clean

on_test_failure:
  - Fix failing tests
  - Re-run suite
  - Must pass before continuing

on_contract_violation:
  - STOP immediately
  - Fix to match OpenAPI spec
  - Re-validate contract
```

### Blocking Issues

```yaml
on_blocker:
  - Document in tasks.md with ⚠️
  - Continue with other tasks if possible
  - Include in recap as known issue
```

## Outputs

### Per Feature

```
.agent-os/
├── specs/
│   └── YYYY-MM-DD-feature/
│       ├── spec.md              # Requirements with contract tests
│       ├── spec-lite.md          # Summary
│       ├── tasks.md              # Task tracking
│       ├── api-contracts/
│       │   └── openapi.yaml      # API specification
│       └── coverage-report.html  # Test coverage
└── recaps/
    └── YYYY-MM-DD-feature.md     # Completion summary
```

## What This DOESN'T Do

The following are handled elsewhere, not in this orchestrator:

### Handled by CI/CD

- Build and deployment
- Environment promotion
- Release tagging
- Changelog generation

### Handled by Git Platform

- PR creation and review
- Branch protection
- Merge policies
- Code review assignments

### Handled by Separate Processes

- Roadmap updates (manual)
- Standards updates (as needed)
- Cross-repo coordination (manual)

## Usage Examples

### Example 1: Simple Feature (Internal)

```
User: Create spec for user login
Claude: [Creates spec with API contract]

User: Create tasks
Claude: [Generates tasks.md]

User: Execute tasks
Claude: [Creates branch: feature/user-login]
Claude: [Implements with quality gates]
→ Contract tests ✅
→ Lint ✅
→ Types ✅
→ Coverage 85% ✅
→ Black Formatting ✅ # Example of Black formatting check

User: Complete feature
Claude: [Validates and commits]
→ Commit: "feat: implement user login per API contract"
→ PR #45 created: https://github.com/org/repo/pull/45
→ Feature ready for review
```

### Example 2: External Brief (API Architect)

```
User: Process this backend brief for ACS Code Directory:
[Provides API contract + backend/frontend briefs]

Claude: [Creates spec from brief]
→ Stores contract in api-contracts/openapi.yaml
→ Extracts requirements to spec.md
→ Includes contract tests

User: Create tasks
Claude: [Generates tasks from contract]
→ Backend tasks: 5 endpoints, DB queries
→ Integration tasks: Contract validation

User: Execute tasks
Claude: [Implements per brief instructions]
→ Note: Backend and Frontend repos work in parallel
→ Backend: FastAPI endpoints with Supabase

User: Complete feature
Claude: [Full validation and PR]
→ Contract compliance verified
→ Quality gates passed
→ PRs created in both repos
```

### Example 3: With Quality Issues

```
User: Execute tasks
Claude: [Creates branch: feature/user-auth]
Claude: [Implements task 1]
→ Contract tests ✅
→ Lint ❌ 3 errors
[Fixes lint errors]
→ Lint ✅
→ Types ❌ 1 error
[Fixes type error]
→ Types ✅
→ Coverage 75% ❌
[Adds more tests]
→ Coverage 82% ✅
→ Black Formatting ✅ # Example of Black formatting check
→ Task 1 complete

User: Complete feature
Claude: [Quality validation]
→ All checks pass ✅
Claude: [Git workflow]
→ Commit with metrics
→ Push to origin
→ PR created with quality report
```
