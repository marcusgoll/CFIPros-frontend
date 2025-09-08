Reorganization Log

This log records structural moves and cleanups to keep history discoverable.

2025-09-08
- Moved internal docs from root to docs/: RELEASE_NOTES_v1.1.0.md, RELEASE_CHECKLIST_v1.1.0.md, PHASE2_COMPLETION_SUMMARY.md, PHASE_4_INTEGRATION_SUMMARY.md, INTEGRATION_STATUS.md, API_CONNECTION_GUIDE.md, ACS_DATABASE_PHASE2_IMPLEMENTATION.md. Rationale: consolidate internal documentation.
- Removed build/test artifacts and logs from root: .next/, coverage*/ directories, .jest-cache/, .swc/, assorted *results.log and *validation.log files. Rationale: non-source artifacts.
- Note: A local folder `test-data/` (ignored by git) was removed as part of cleanup. If this contained valuable local samples, please advise whether to restore/move into `review/`.

Pending (requires confirmation)
- Consolidate duplicate ErrorBoundary components under components/common/ and update imports across code and tests.
- Quarantine any uncertain files into `review/` for manual approval before deletion.

