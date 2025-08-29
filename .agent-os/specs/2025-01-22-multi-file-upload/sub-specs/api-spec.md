# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-01-22-multi-file-upload/spec.md

## Endpoints

### POST /v1/extractor/batch/extract

**Purpose:** Upload and process multiple FAA test report files in a single request

**Parameters:**
- **Body (multipart/form-data):**
  - `files[]`: Array of files (PDF/JPG/PNG), minimum 1, maximum 30 files
  - `options` (optional JSON string):
    - `processing_mode`: "auto" | "sequential" | "parallel" (default: "auto")
    - `generate_summary`: boolean (default: true)
    - `include_individual_reports`: boolean (default: true)

**Response:**
```json
{
  "batch_id": "uuid-v4",
  "status": "completed" | "partial" | "failed",
  "processing_time_ms": 5234,
  "total_files": 30,
  "successful_files": 28,
  "failed_files": 2,
  "reports": [
    {
      "report_id": "uuid-v4",
      "file_name": "student1.pdf",
      "status": "success",
      "confidence": 0.95,
      "processing_time_ms": 145,
      "url": "/v1/extractor/results/{report_id}",
      "metadata": {
      "name": "Test Student",
      "ftn": "A5534615",
      "exam_id": "900509202230155584",
      "exam": "Commercial Pilot Airplane (CAX)",
      "exam_date": "2023-05-09",
      "score": 95,
      "grade": "Pass",
      "take": 1
      },
      "codes": [
      {
        "code": "CA.I.A.K2",
        "description": "Privileges and limitations.",
        "area_of_operation": "Area of Operation I. Preflight Preparation",
        "task": "Task C. One Engine Inoperative (Simulated) (solely by Reference to Instruments) During Straight-",
        "type": "knowledge",
        "source_pdf": "Commercial Pilot for Airplane Category (FAA-S-ACS-7B)",
        "page_number": 9
      }
      ]
    },
    {
      "report_id": null,
      "file_name": "corrupt_file.pdf",
      "status": "failed",
      "error": {
        "type": "INVALID_PDF",
        "message": "Unable to parse PDF structure"
      }
    }
  ],
  "summary": {
    "url": "/v1/extractor/batch/{batch_id}/summary",
    "common_weak_areas": [
      {
        "code": "CA.I.A.K1",
        "frequency": 15,
        "percentage": 53.6,
        "description": "Airworthiness requirements"
      }
    ],
    "score_distribution": {
      "min": 72,
      "max": 98,
      "mean": 85.3,
      "median": 86,
      "std_dev": 7.3
    },
    "study_plan": [
      "Focus on Preflight Preparation, particularly airworthiness requirements",
      "Review Navigation and Flight Planning procedures",
      "Study Weather Information and Decision Making"
    ]
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid file format, exceeds file limit, or malformed request
- `413 Payload Too Large`: Total upload size exceeds 100MB
- `422 Unprocessable Entity`: No valid files found in request
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server processing error

### GET /v1/extractor/batch/{batch_id}/summary

**Purpose:** Retrieve the combined summary analysis for a batch of uploaded files

**Parameters:**
- **Path:**
  - `batch_id`: UUID of the batch processing job

**Response:**
```json
{
  "batch_id": "uuid-v4",
  "created_at": "2025-01-22T10:30:00Z",
  "total_files": 30,
  "successful_files": 28,
  "common_weak_areas": [
    {
      "code": "PA.I.A.K1",
      "area": "Preflight Preparation",
      "task": "Airworthiness Requirements",
      "frequency": 15,
      "percentage": 53.6,
    }
  ],
  "score_analysis": {
    "distribution": {
      "70-79": 3,
      "80-89": 15,
      "90-100": 10
    },
    "statistics": {
      "min": 72,
      "max": 98,
      "mean": 85.3,
      "median": 86,
      "std_dev": 7.2
    },
    "pass_rate": 93.3
  },
  "aggregated_codes": [
    {
      "code": "PA.I.A.K1",
      "count": 15,
      "reports": ["report_id_1", "report_id_2"]
    }
  ],
  "study_recommendations": {
    "priority_areas": [
      "Preflight Preparation",
      "Navigation",
      "Weather"
    ],
    "suggested_resources": []
  }
}
```

**Errors:**
- `404 Not Found`: Batch ID does not exist
- `410 Gone`: Batch results have expired (after 24 hours for anonymous uploads)

### GET /v1/extractor/batch/{batch_id}/reports

**Purpose:** List all individual reports from a batch upload with pagination support

**Parameters:**
- **Path:**
  - `batch_id`: UUID of the batch processing job
- **Query:**
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 10, max: 50)
  - `status`: Filter by status ("success" | "failed")

**Response:**
```json
{
  "batch_id": "uuid-v4",
  "page": 1,
  "limit": 10,
  "total": 30,
  "reports": [
    {
      "report_id": "uuid-v4",
      "file_name": "test1.pdf",
      "status": "success",
      "url": "/v1/extractor/results/{report_id}",
      "created_at": "2025-01-22T10:30:00Z"
    }
  ],
  "next": "/v1/extractor/batch/{batch_id}/reports?page=2",
  "previous": null
}
```

**Errors:**
- `404 Not Found`: Batch ID does not exist
- `400 Bad Request`: Invalid pagination parameters

## Controller Actions

### BatchExtractController
- `create_batch()`: Initialize batch processing job
- `validate_files()`: Check file formats and sizes
- `route_processing()`: Determine processing method per file type
- `aggregate_results()`: Combine individual results into summary
- `handle_partial_failure()`: Manage failed files without blocking batch

### BatchReportController
- `get_summary()`: Retrieve batch summary analysis
- `list_reports()`: Get paginated list of individual reports
- `export_batch()`: (Future) Generate PDF export of all results

## Error Handling

All batch endpoints implement graceful error handling:
- Individual file failures are isolated and don't fail the entire batch
- Clear error messages indicate which files failed and why
- Partial results are always returned when possible
- Rate limiting is applied at the batch level, not per file