---
description: Orchestrate official Agent OS core commands with the official Claude Code sub‑agents wired in (parallelizable where safe). Includes Layer 1–3 alignment, multi‑stage reviews, branch→PR lifecycle, post‑merge CLAUDE.md link updates, repo hygiene, and semantic releases.
globs:
alwaysApply: false
version: 2.3
encoding: UTF-8
---------------

# Agent‑OS Orchestrator — Fully Wired

> Chains the official core instructions while delegating to the official sub‑agents: **context-fetcher, date-checker, file-creator, git-workflow, git-repo-manager, prd-version-strategist, project-file-organizer, project-manager, senior-code-reviewer, test-runner, claude-md-link-updater**.
>
> Core instructions used verbatim:
>
> * `@.agent-os/instructions/core/plan-product.md`
> * `@.agent-os/instructions/core/analyze-product.md`
> * `@.agent-os/instructions/core/create-spec.md`
> * `@.agent-os/instructions/core/create-tasks.md`
> * `@.agent-os/instructions/core/execute-tasks.md` (which loops via `execute-task.md`)
> * `@.agent-os/instructions/core/complete-tasks.md`

## Inputs

* **feature\_title**
* **feature\_summary**
* **acceptance\_criteria** (numbered Given/When/Then)
* **priority** (P0/P1/P2)
* **risk\_notes**
* **implementation\_hints** (optional)
* **release\_intent** (auto|minor|patch|none) *(default: auto via Conventional Commits)*

---

## Config (override as needed)

```yaml
branching:
  base: main
  feature_prefix: feature/
  hotfix_prefix: hotfix/
  naming: "{prefix}{yyyy-mm-dd}-{slug}"
reviews:
  coverage_min: 0.80
  required_reviewers: 1
  protected_branches: ["main"]
  enforce_conventional_commits: true
ci_checks:
  required: ["lint", "test", "build", "typecheck", "audit"]
releases:
  conventional_commits: true
  changelog_style: keep-a-changelog
  tag_prefix: v
post_merge:
  run_claude_md_link_updater: true
  update_decisions: true
standards:
  global_root: ~/.agent-os/standards
  project_root: .agent-os/standards
  files: [best-practices.md, code-style.md, tech-stack.md]
planning:
  enforce_task_size: true
  min_tasks: 3
  max_task_span_hours: 8
  require_specificity_examples: true
```

---

## Claude Code Hooks

<hooks>
  <on event="pr_opened">VERIFY: ci_checks.required; PREPARE: review checklist from Standards via @context-fetcher</on>
  <on event="pr_merged">IF post_merge.run_claude_md_link_updater THEN EXECUTE: @claude-md-link-updater</on>
</hooks>

---

## Pre‑Flight

\<pre\_flight\_check>
EXECUTE: @.agent-os/instructions/meta/pre-flight.md
\</pre\_flight\_check>

**Definition of Done**

* Standards/Product/Specs aligned and referenced.
* Spec + tasks pass planning gates (specificity, task sizing, acceptance clarity).
* Local TDD loop complete; coverage ≥ configured threshold.
* Reviews passed: **R1 spec, R2 design, R3 pre‑PR, R4 PR**.
* Merged to **main**; CLAUDE.md links updated; repo hygiene + (optional) release complete.
* Recap written; roadmap/decisions updated; standards proposals captured.

---

## Process Flow

\<process\_flow>

### L0) Layer Sync & Precedence (Standards → Product → Specs)

<step number="L0A" subagent="context-fetcher" name="load-standards" parallelizable="true">
- Fetch **~/.agent-os/standards/** and project overrides **.agent-os/standards/** (best-practices.md, code-style.md, tech-stack.md).
- Extract only relevant sections; return a merged view (project overrides have precedence).
</step>
<step number="L0B" subagent="project-manager" name="standards-specificity-check">
- Flag vague rules (e.g., "Write tests"); propose concrete replacements (e.g., "Unit tests first, ≥80% coverage").
- If helpful, delegate to **file-creator** to persist `.agent-os/.cache/standards-merged.md` (non‑destructive snapshot).
</step>
<step number="L0C" subagent="context-fetcher" name="check-product-layer">
- If `.agent-os/product/` missing → EXECUTE `@.agent-os/instructions/core/plan-product.md`.
- Else → EXECUTE `@.agent-os/instructions/core/analyze-product.md` (will refine product docs).
</step>
<step number="L0D" subagent="prd-version-strategist" name="optional-prd-slimming" parallelizable="true">
- IF `PRD.md` exists in repo, analyze and emit `MVP-PRD.md` to focus scope before spec work.
</step>

### 1) Create/Update Spec (Spec Review R1)

<step number="1A" subagent="date-checker" name="determine-date">Output current date for spec folder naming.</step> <step number="1B" subagent="context-fetcher" name="prime-context" parallelizable="true">

* Ensure `@.agent-os/product/mission-lite.md` and `@.agent-os/product/tech-stack.md` are in context (selective read if missing).

  </step>

<step number="1C" subagent="file-creator" name="run-create-spec">
- EXECUTE: `@.agent-os/instructions/core/create-spec.md` with inputs; create `.agent-os/specs/YYYY-MM-DD-<slug>/` + spec docs.
</step>
<step number="1R" subagent="project-manager" name="spec-quality-gate">
- Enforce planning tips: **Start Small** (≤ `planning.max_task_span_hours`, ≥ `planning.min_tasks` unless trivial), **Be Specific** (examples, versions, coverage), **Review Plans Carefully**.
- If failed: write comments to `spec_folder/review.md`; return to Step 1C.
</step>

### 2) Create Tasks (Design Review R2)

<step number="2A" subagent="file-creator" name="run-create-tasks">
- EXECUTE: `@.agent-os/instructions/core/create-tasks.md` → emit `tasks.md` with TDD‑oriented breakdown.
</step>
<step number="2R" subagent="senior-code-reviewer" name="design-review">
- Review API/data/UX boundaries for **DRY**/**KISS**; validate error contracts & security; call out migrations & mark **REQUIRES_BACKUP**.
</step>

### 3) Execute Work (Local TDD Loop → Pre‑PR Review R3)

<step number="3A" subagent="git-workflow" name="branch-setup">
- Create/switch to branch from spec folder (`2025-01-29-password-reset` → `password-reset`).
</step>
<step number="3B" subagent="test-runner" name="focused-tests" parallelizable="true">
- As tasks are implemented, run only task‑specific tests to keep loop fast; report failures succinctly.
</step>
<step number="3C" subagent="project-manager" name="execute-tasks">
- EXECUTE: `@.agent-os/instructions/core/execute-tasks.md` (drives `execute-task.md` loops; maintains `tasks.md`).
</step>
<step number="3R" subagent="senior-code-reviewer" name="pre-pr-review">
- Local review before PR: coverage ≥ threshold, naming, cohesion, DRY/KISS; suggest minimal refactors.
</step>

### 3P) PR & Suite (PR Review R4)

<step number="3P1" subagent="project-manager" name="complete-tasks">
- EXECUTE: `@.agent-os/instructions/core/complete-tasks.md` (full suite via **test-runner**, PR via **git-workflow**, recap draft, roadmap verification).
</step>
<step number="3P2" subagent="senior-code-reviewer" name="pr-review">
- Enforce standards, security, reliability, readability, and DRY/KISS; attach actionable comments.
</step>
<step number="3P3" subagent="git-workflow" name="merge-to-main">
- Ensure protected branch checks (CI + approvals) and merge per policy (squash/rebase).
</step>

### 3U) Post‑Merge Documentation Upkeep

<step number="3U" subagent="claude-md-link-updater" name="update-claude-md-links">
- Scan `.claude/**/*.md` and `.agent-os/**/*.md`; update moved/renamed links and endpoint references; emit `link-report.md` under the active spec folder.
</step>

### 4) Hygiene & Release

<step number="4H1" subagent="project-file-organizer" name="repo-tidy">
- Clean temp files/build artifacts, remove/relocate experimental files, ensure structure matches standards; update root CLAUDE.md with organization rules.
</step>
<step number="4H2" subagent="git-repo-manager" name="release-and-docs">
- Create/verify `CHANGELOG.md`; infer SemVer bump from commits (or **release_intent**); create tag `{tag_prefix}X.Y.Z`; publish release notes; ensure README/CONTRIBUTING/CODE_OF_CONDUCT present & current; enforce branch protections and required checks.
</step>

### 4S) Standards & Decisions Maintenance

<step number="4S1" subagent="project-manager" name="decisions-roadmap-maintenance">
- Append notable choices to `.agent-os/product/decisions.md` (if `post_merge.update_decisions`), update roadmap for shipped items.
</step>
<step number="4S2" subagent="project-manager" name="standards-proposals">
- From recurring review patterns, create `standards-proposals.md` in the spec folder with suggested updates to `~/.agent-os/standards/*.md` or project overrides.
</step>

### 5) Final Recap

<step number="5" subagent="project-manager" name="recap">
- Ensure recap exists from `complete-tasks.md`; append summary of link updates, hygiene outcomes, and release/tag.
</step>

\</process\_flow>

---

## Parallelization Notes

* **L0A/L0D/1B/3B** may run in parallel to reduce latency (they’re read‑only or non‑conflicting).
* Always serialize steps that mutate repo state: branching, file writes, PR creation, merge, release.

---

## Error & Incident Handling

* **No changes/empty diff** during link update → report "no updates needed" and exit that step.
* **Task blocking** → mark in `tasks.md` with ⚠️ and open `.agent-os/issues/YYYY-MM-DD-<slug>.md`.
* **Flaky tests** → retry ×3; quarantine with label; open issue; link in recap.
* **Migration failure** → rollback; restore; attach logs; mark **BLOCKED**.
* **Production incident** → branch `hotfix/{date}-{slug}`; patch + tests; bump patch; tag & release; back‑merge.

---

## Outputs

* Updated Product docs (as needed), Spec folder with `spec.md`, `spec-lite.md`, `tasks.md` (+ sub‑specs), recap under `.agent-os/recaps/`.
* PR merged to `main`; `link-report.md` with fixed/unresolved links.
* Repo tidy; `CHANGELOG.md` updated; tag `{tag_prefix}X.Y.Z` (if released).
* `standards-proposals.md`; roadmap and decisions updated.

---

## Placement & Invocation

* Save as: `.claude/commands/agent-os-orchestrator-fully-wired.md`
* Run to coordinate the official commands with fully wired sub‑agents and governance gates.
