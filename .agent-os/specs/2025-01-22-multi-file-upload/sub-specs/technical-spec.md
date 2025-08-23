# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-01-22-multi-file-upload/spec.md

## Technical Requirements

### File Upload Handling
- Modify multipart form parser to accept array of files with key `files[]`
- Implement file count validation (minimum 1, maximum 30 files)
- Maintain existing per-file size limit (10MB) with total request size limit of 100MB
- Add request timeout extension to 60 seconds for large batches
- Implement early validation to reject batch if total size exceeds limits before processing

### Hybrid Processing Pipeline
- Create `BatchProcessor` class extending existing `ProcessingCoordinator`
- Implement file type detection and routing:
  - PDF files: Queue for sequential processing using existing `PDFProcessor`
  - Image files (JPG/PNG): Queue for parallel processing using `VisionProcessor`
- Use `asyncio.gather()` for parallel image processing with concurrency limit of 5
- Implement progress tracking with internal state management (not exposed in MVP)

### Error Handling and Resilience
- Wrap each file processing in try-catch to isolate failures
- Create `ProcessingResult` model with status enum: SUCCESS, FAILED, PARTIAL
- Track failed files with error details (type, message, file identifier)
- Implement retry logic for transient failures (network, rate limits) with exponential backoff
- Continue processing remaining files when individual files fail

### Data Models and Storage
- Extend `Report` model with `batch_id` foreign key (UUID)
- Create new `BatchReport` model:
  - `id` (UUID primary key)
  - `total_files` (Integer)
  - `successful_files` (Integer)
  - `failed_files` (Integer)
  - `processing_time_ms` (Integer)
  - `summary_data` (JSONB for combined analysis)
  - `created_at` (DateTime)
- Create `BatchReportFile` junction table for many-to-many relationship
- Implement transaction management for atomic batch operations

### Combined Summary Generation
- Create `SummaryAnalyzer` class to aggregate individual results
- Calculate statistics across all successful files:
  - Common ACS codes (frequency analysis)
  - Average scores and score distribution
  - Consistent weak areas (codes appearing in >30% of reports)
  - Trend analysis for multiple attempts by same person (name matching)
- Generate consolidated study plan prioritizing most common weak areas
- Store summary in `BatchReport.summary_data` as structured JSON

### Performance Optimizations
- Implement connection pooling for database with increased pool size (20 connections)
- Add Redis caching for ACS code lookups (if Redis available, graceful fallback)
- Use bulk insert for database operations where possible
- Implement lazy loading for individual reports in batch response

### Response Structure
- Return batch summary with embedded individual report references
- Include processing metadata (time, success rate, processing method per file)
- Implement pagination-ready structure for future large batch handling
- Generate shareable URLs for both batch and individual reports

## External Dependencies

**asyncio** - Built into Python 3.11, no additional installation needed
- **Justification:** Required for parallel processing of image files to improve performance

**concurrent.futures** - Built into Python standard library
- **Justification:** ThreadPoolExecutor for CPU-bound PDF processing tasks

**python-multipart** (already installed: 0.0.6)
- **Justification:** Enhanced multipart parsing for large file arrays (existing dependency)

**Note:** No new external dependencies required. Feature can be implemented with existing libraries and Python standard library components.