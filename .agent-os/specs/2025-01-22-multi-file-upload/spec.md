# Spec Requirements Document

> Spec: Multi-file Upload Support
> Created: 2025-01-22

## Overview

Implement bulk file upload capability to process up to 30 FAA test reports simultaneously, enabling flight schools to analyze entire class results at once. This feature will generate individual reports for each file plus a comprehensive summary analysis, supporting both individual pilots and educational institutions.

## User Stories

### Individual Pilot with Multiple Tests

As a pilot with multiple test attempts, I want to upload all my FAA test reports at once, so that I can see my progress over time and identify consistent weak areas.

The user selects multiple PDF or image files from their computer, uploads them in a single request, and receives individual analysis for each test plus a combined summary showing trends, consistent weak areas, and overall improvement suggestions. This eliminates the need to upload files one by one and manually compare results.

### Flight School Instructor Analyzing Class Performance

As a flight school instructor, I want to upload test results for my entire ground school class (up to 30 students), so that I can identify common knowledge gaps and adjust my curriculum accordingly.

The instructor collects digital or scanned test reports from all students, uploads them in bulk, and receives both individual student reports (shareable with each student) and a class-wide analysis showing common weak areas, score distribution, and recommended focus areas for future instruction. The system processes files efficiently using a hybrid approach - PDFs sequentially for speed, images in parallel to manage API latency.

### School Administrator Tracking Program Performance

As a flight school administrator, I want to upload and analyze test results from multiple classes or time periods, so that I can track program effectiveness and report to stakeholders.

The administrator uploads batches of test reports, potentially mixing different test types (PPL, CPL, IFR), and receives comprehensive analytics including pass rates, common problem areas across different tests, and anonymized aggregate data for program improvement. Failed file processing doesn't block the entire batch, ensuring partial results are always available.

## Spec Scope

1. **Batch Upload Endpoint** - Accept up to 30 files (PDF/JPG/PNG) in a single multipart request with file validation
2. **Hybrid Processing Pipeline** - Process PDFs sequentially and images in parallel for optimal performance
3. **Individual Report Generation** - Create separate extraction reports for each uploaded file with unique IDs
4. **Combined Summary Analysis** - Generate comprehensive summary identifying trends and common weak areas across all files
5. **Partial Success Handling** - Continue processing remaining files when individual files fail, with clear error reporting

## Out of Scope

- Real-time progress updates (WebSocket/SSE) - planned for Phase 2
- File preprocessing or conversion on client side
- Deduplication of previously uploaded files
- User authentication and file ownership (anonymous uploads for MVP)
- Batch download of all results as ZIP

## Expected Deliverable

1. API endpoint accepting 30 files returning both individual report IDs and a batch summary ID within 30 seconds for mixed PDF/image uploads
2. Individual report pages accessible via unique URLs showing extraction results for each file
3. Combined summary page showing aggregate analysis, trends, and common weak areas across all uploaded files with visual indicators for failed files