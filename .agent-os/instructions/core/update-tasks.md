---

description: Update an existing Agent OS tasks list from a user change request (preserve status, renumber safely, and log changes)
globs:

* "specs/\*\*/tasks.md"
* "specs/\*\*/feature\*.md"
  alwaysApply: false
  version: 1.0
  encoding: UTF-8

---

# Tasks Update Rules

## Overview

With the user's approval, collect the change request, compute a safe diff against the current `tasks.md`, renumber where needed without breaking references, preserve completion checkboxes, and write an auditable changelog entry.

\<pre\_flight\_check>
EXECUTE: @.agent-os/instructions/meta/pre-flight.md
\</pre\_flight\_check>

\<process\_flow>

<step number="0" subagent="context-fetcher" name="collect_change_request">

### Step 0: Collect change request

* Sources (pick all that exist, in this order):

  1. latest user message, 2) `changes.md` or `*_changes.md` beside the spec, 3) issue/PR body referenced in the spec folder.
* Create or overwrite `tasks_changeplan.md` with:

  * **Summary of requested changes**
  * **Change types**: Add, Modify, Remove, Defer
  * **Assumptions & open questions**
  * **Risk notes** (logic, legal, security, perf)

</step>

<step number="1" subagent="context-fetcher" name="snapshot_current_state">

### Step 1: Snapshot current tasks

* Locate `tasks.md` in the current feature’s spec folder; if missing, STOP and prompt the user to run the create-tasks command first.
* Save a timestamped backup `tasks.backup.YYYY-MM-DD_HHMM.md` in the same folder.

</step>

<step number="2" subagent="file-creator" name="propose_updates">

### Step 2: Compute proposed updates

* Parse **major tasks** and **subtasks** from `tasks.md`:

  * Major tasks: numbered checklist `- [ ] 1. ...`
  * Subtasks: decimal children `- [ ] 1.1 ...`
* Match incoming changes to existing tasks by semantic similarity (title + component keywords).
* Draft `proposed_tasks.md` applying updates:

\<update\_rules>

* **Preserve status**: keep `[x]` vs `[ ]` as-is; if a completed task is modified, append `(changed)` and add new subtasks rather than unchecking.
* **Ordering**: maintain technical dependencies; tests-first; “verify all tests pass” remains last subtask.
* **Additions**: insert new major tasks at the nearest dependent point; include at least:

  * `[ ] X.1 Write tests for [COMPONENT]`
  * `[ ] X.n Verify all tests pass`
* **Modifications**: adjust titles/wording; update relevant subtasks; keep numbers stable if possible.
* **Removals**: move removed items to a **Deprecated** block at bottom with reason and link to changeplan.
* **Renumbering**: only if unavoidable; produce a renumber map (e.g., `1→2`, `2.3→3.1`) in `tasks_changeplan.md`.
* **Cross-refs**: scan repo for patterns like `Task 2`, `2.1` in `.md/.mdx/.ts/.tsx/.py` and list likely references to update in `tasks_changeplan.md` (do not auto-edit code here).
  \</update\_rules>

</step>

<step number="3" name="present_update_preview">

### Step 3: Present update preview to user

* Render a concise **diff summary** in `tasks_changeplan.md`:

  * Added majors, modified majors, removed/deprecated majors
  * Notable subtask changes
  * Renumber map (if any)
  * Impact notes (scope/complexity delta)
* Show the first 40 lines of `proposed_tasks.md` inline plus file path.

\<approval\_prompt>
PROMPT: "I prepared a proposed update for tasks.md based on your change request. Review the summary and preview in tasks\_changeplan.md. Type 'approve' to apply the update, or specify edits."
\</approval\_prompt>

</step>

<step number="4" subagent="file-creator" name="apply_updates_if_approved">

### Step 4: Apply updates (on approval)

* If user types **approve**:

  * Replace `tasks.md` with `proposed_tasks.md`.
  * Append a **Changelog** section at the bottom of `tasks.md` (create if missing):

\<changelog\_block>

## Changelog

* YYYY-MM-DD HH\:MM — Updated by change request: \[short summary]; Renumber map: \[if any]; Preserved N completed tasks; Deprecated M tasks.
  \</changelog\_block>

* If the user suggests edits, loop back to Step 2 with adjustments.

</step>

<step number="5" subagent="senior-code-reviewer" name="execution_readiness">

### Step 5: Execution readiness check

* Present:

  * Spec name + short description
  * **First impacted major task** (new or modified) and its subtasks
  * Estimated complexity delta (+/−)
  * Key deliverables
* Ask for permission to proceed with only this impacted task.

\<execution\_prompt>
PROMPT: "Updates applied. First impacted task to execute is:

**Task \[N]:** \[TITLE]
\[BRIEF\_DESCRIPTION\_OF\_TASK\_AND\_SUBTASKS]

Proceed with this task now? I will focus only on it and its subtasks unless you instruct otherwise."
\</execution\_prompt>

\<execution\_flow>
IF user\_confirms\_yes:
REFERENCE: @.agent-os/instructions/core/execute-tasks.md
FOCUS: Only the selected impacted task and its subtasks
CONSTRAINT: Do not continue to other tasks without explicit request
ELSE:
WAIT: For user clarification or modifications
\</execution\_flow>

</step>

\</process\_flow>

\<post\_flight\_check>
EXECUTE: @.agent-os/instructions/meta/post-flight.md
\</post\_flight\_check>

\<quality\_bar>

### Safety & Consistency Gates

* **No loss of status**: Never flip `[x]` to `[ ]`.
* **Stable references**: Prefer to avoid renumbering; if required, include a renumber map and reference scan.
* **TDD discipline**: Every new major task must start with tests and end with verification.
* **Auditability**: Backup, changeplan, preview, changelog are mandatory artifacts.

\</quality\_bar>

---

