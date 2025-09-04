---
description: Streamlined Agent OS orchestrator for API contract-driven development with quality gates
version: 3.0
encoding: UTF-8
---

# Agent OS Orchestrator - Streamlined

Coordinates spec creation, task execution, and quality validation for API contract-driven development across distributed repositories. Supports both internal spec creation and external brief processing.

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

api:
  contract_path: api-contracts/openapi.yaml
  contract_tests_in: spec.md
  
git:
  branch_prefix: feature/
  base_branch: main
  conventional_commits: true
```

## Workflow

### Phase 0: Brief Processing (Optional)

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
trigger: User describes feature need OR brief provided
output: Spec with API contract
```

1. **Create Spec** (`create-spec.md`)
   - If brief provided: Use contract from Phase 0
   - Otherwise: Generate spec.md with requirements
   - Create api-contracts/openapi.yaml
   - Include contract tests in spec.md
   - Output: Complete specification

### Phase 2: Planning

```yaml
trigger: Spec approved
output: Task list with quality gates
```

2. **Create Tasks** (`create-tasks.md`)
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
   - **Create feature branch** (`git-workflow`)
     - Extract branch name from spec folder
     - Create and switch to feature branch
   - Load API contract
   - Execute each task
   - Run quality gates per task:
     - Contract tests from spec.md
     - Lint check (0 errors)
     - Type check (0 errors)
     - Test coverage (≥80%)
   - Update task status
   - Output: Implemented features on feature branch

### Phase 4: Completion

```yaml
trigger: All tasks done
output: PR-ready code with quality validation
```

4. **Complete Tasks** (`complete-tasks.md`)
   - Run full quality validation (`test-runner`)
   - Verify contract compliance (`senior-code-reviewer`)
   - Generate coverage report
   - Create recap document (`project-manager`)
   - **Commit and create PR** (`git-workflow`)
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

### Completion Quality Gate
- [ ] All tasks marked complete
- [ ] Full test suite passing
- [ ] API contract validated
- [ ] Recap document created

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

User: Complete feature
Claude: [Validates and commits]
→ Commit: "feat: implement user login per API contract"
→ PR #45 created: https://github.com/org/repo/pull/45
→ Feature ready for review
```

### Example 2: External Brief (API Architect)
```
User: Process this brief for ACS Code Directory:
[Provides API contract + backend/frontend briefs]

Claude: [Creates spec from brief]
→ Stores contract in api-contracts/openapi.yaml
→ Extracts requirements to spec.md
→ Includes contract tests

User: Create tasks  
Claude: [Generates tasks from contract]
→ Backend tasks: 5 endpoints, DB queries
→ Frontend tasks: 2 pages, SEO, SSG/ISR
→ Integration tasks: Contract validation

User: Execute tasks
Claude: [Implements per brief instructions]
→ Note: Backend and Frontend repos work in parallel
→ Backend: FastAPI endpoints with Supabase
→ Frontend: Next.js pages with SEO

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
→ Task 1 complete

User: Complete feature
Claude: [Quality validation]
→ All checks pass ✅
Claude: [Git workflow]
→ Commit with metrics
→ Push to origin
→ PR created with quality report
```

## Key Improvements from v2.3

### Removed (Unnecessary Complexity)
- ❌ 4 review stages (R1, R2, R3, R4)
- ❌ 11+ sub-agents (most undefined)
- ❌ Post-merge documentation updates
- ❌ Release management
- ❌ Standards layer management
- ❌ PRD slimming
- ❌ Multiple parallel steps

### Added (Essential Focus)
- ✅ API contract as first-class citizen
- ✅ Quality gates at every step
- ✅ Contract test validation
- ✅ Clear phase progression
- ✅ Simple error handling

### Simplified
- 4 clear phases instead of complex flow
- 3 essential sub-agents instead of 11+
- Direct commands instead of orchestration
- Quality gates instead of reviews
- Contract-driven instead of document-driven

## Result

A focused orchestrator that:
1. Creates specs with API contracts
2. Generates quality-aware tasks
3. Executes with validation gates
4. Completes with full verification

No unnecessary complexity. Just what's needed to build quality features that match the API contract.