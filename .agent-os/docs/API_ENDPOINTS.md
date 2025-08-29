# CFIPros API Endpoints Reference

**Base URL:** `https://api.cfipros.com/v1`

A comprehensive REST API for aviation training analysis, providing ACS code extraction, batch processing, analytics, study plan generation, webhooks, and data exports for flight schools and aviation professionals.

## Authentication

Most endpoints require authentication via JWT bearer token in the `Authorization` header:
```
Authorization: Bearer your_jwt_token_here
```

---

## Core Extraction & Processing

### Single File Processing

#### `POST /extract`
Extract ACS codes from a single file (PDF, JPG, PNG)

**Request:**
```bash
curl -X POST "https://api.cfipros.com/v1/extract" \
  -H "Authorization: Bearer your_token" \
  -F "file=@exam_report.pdf"
```

**Example Response:**
```json
{
  "success": true,
  "report_id": "rpt_123456789",
  "processing_time_ms": 2500,
  "confidence": "high",
  "exam_name": "Private Pilot Written",
  "acs_codes": [
    {
      "code": "PA.I.A.K1",
      "description": "Principles of flight",
      "weak_area": true
    }
  ],
  "study_plan": {
    "plan_id": "sp_987654321",
    "estimated_study_hours": 12,
    "priority_areas": ["Navigation", "Weather"]
  }
}
```

### Batch Processing

#### `POST /batch/extract`
Process multiple files simultaneously (1-50 files)

**Request:**
```bash
curl -X POST "https://api.cfipros.com/v1/batch/extract" \
  -H "Authorization: Bearer your_token" \
  -F "files=@student1.pdf" \
  -F "files=@student2.pdf" \
  -F "files=@student3.pdf"
```

**Example Response:**
```json
{
  "batch_id": "batch_abc123",
  "total_files": 3,
  "successful_files": 3,
  "failed_files": 0,
  "processing_time_ms": 4800,
  "summary": {
    "average_score": 78.5,
    "most_common_weak_areas": [
      {"code": "PA.I.B.K2", "description": "Weather", "frequency": 2},
      {"code": "PA.II.A.K3", "description": "Navigation", "frequency": 2}
    ],
    "score_distribution": {
      "70-80": 2,
      "80-90": 1
    }
  },
  "individual_reports": [
    {
      "file_name": "student1.pdf",
      "success": true,
      "report_id": "rpt_111",
      "confidence": "high",
      "processing_time_ms": 1600
    },
    {
      "file_name": "student2.pdf", 
      "success": true,
      "report_id": "rpt_222",
      "confidence": "medium",
      "processing_time_ms": 1700
    }
  ]
}
```

#### `GET /batch/{batch_id}/summary`
Get detailed summary of batch processing results

**Example Response:**
```json
{
  "batch_id": "batch_abc123",
  "created_at": "2024-01-15T10:30:00Z",
  "total_files": 3,
  "successful_files": 3,
  "class_analytics": {
    "average_score": 78.5,
    "pass_rate": 100.0,
    "improvement_recommendations": [
      "Focus additional training on weather interpretation",
      "Review navigation procedures"
    ]
  }
}
```

---

## Analytics Dashboard

### Comprehensive Analytics

#### `GET /analytics/dashboard`
Get comprehensive analytics dashboard data

**Query Parameters:**
- `days` (integer, 1-365): Number of days to analyze (default: 30)
- `exam_types` (string): Comma-separated exam types filter
- `interval` (string): Time series interval (`daily`, `weekly`, `monthly`)
- `include_trends` (boolean): Include trend analysis (default: true)
- `include_comparative` (boolean): Include comparative analytics (default: true)

**Example Request:**
```bash
curl "https://api.cfipros.com/v1/analytics/dashboard?days=30&exam_types=private_pilot,commercial_pilot&interval=weekly" \
  -H "Authorization: Bearer your_token"
```

**Example Response:**
```json
{
  "success": true,
  "period": {
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z",
    "days": 30
  },
  "overview": {
    "total_reports": 156,
    "average_score": 78.5,
    "pass_rate": 85.3,
    "total_students": 98,
    "active_study_plans": 67
  },
  "weak_areas": [
    {
      "acs_code": "PA.I.B.K2",
      "description": "Weather services and sources",
      "frequency": 45,
      "percentage": 28.8,
      "trend": "improving"
    },
    {
      "acs_code": "PA.II.A.K3", 
      "description": "Navigation systems",
      "frequency": 38,
      "percentage": 24.4,
      "trend": "stable"
    }
  ],
  "score_distribution": {
    "0-60": 8,
    "60-70": 23,
    "70-80": 45,
    "80-90": 52,
    "90-100": 28
  },
  "time_series": [
    {
      "date": "2024-01-01",
      "reports_count": 12,
      "average_score": 76.2
    },
    {
      "date": "2024-01-08",
      "reports_count": 15,
      "average_score": 78.9
    }
  ],
  "exam_breakdown": [
    {
      "exam_type": "Private Pilot",
      "count": 89,
      "average_score": 79.2,
      "pass_rate": 87.6
    },
    {
      "exam_type": "Commercial Pilot",
      "count": 67,
      "average_score": 77.1,
      "pass_rate": 82.1
    }
  ]
}
```

#### `GET /analytics/weak-areas`
Get detailed weak areas analysis

#### `GET /analytics/exam-comparison`
Compare performance across different exam types

#### `GET /analytics/national-comparison`  
Compare performance against national averages

---

## Study Plan Management

### Generate Study Plans

#### `POST /study-plans/generate`
Generate AI-powered personalized study plan

**Request Body:**
```json
{
  "report_ids": ["rpt_123", "rpt_456"],
  "target_score": 85,
  "study_hours_per_week": 10,
  "learning_preferences": {
    "learning_style": "visual",
    "difficulty_preference": "progressive"
  },
  "deadline": "2024-03-01T00:00:00Z"
}
```

**Example Response:**
```json
{
  "success": true,
  "study_plan": {
    "plan_id": "sp_789xyz",
    "created_at": "2024-01-15T10:30:00Z",
    "status": "active",
    "target_score": 85,
    "current_score_estimate": 72.3,
    "estimated_completion_weeks": 8,
    "total_study_hours": 80,
    "sections": [
      {
        "section_id": "sect_001",
        "title": "Weather Interpretation & Analysis",
        "description": "Focus on weather services, forecasts, and hazards",
        "priority": 1,
        "estimated_hours": 20,
        "acs_codes": ["PA.I.B.K1", "PA.I.B.K2", "PA.I.B.K3"],
        "resources": [
          "FAA-AC-00-6B Weather Services",
          "Interactive Weather Charts"
        ],
        "milestones": [
          {
            "title": "Complete weather theory review",
            "target_date": "2024-01-22T00:00:00Z"
          }
        ]
      },
      {
        "section_id": "sect_002", 
        "title": "Navigation Systems & Procedures",
        "priority": 2,
        "estimated_hours": 18,
        "acs_codes": ["PA.II.A.K1", "PA.II.A.K2"]
      }
    ],
    "effectiveness_score": 0.0,
    "completion_percentage": 0.0
  }
}
```

#### `GET /study-plans/{study_plan_id}`
Get detailed study plan information

#### `PUT /study-plans/{study_plan_id}/progress`
Update study progress and completion status

**Request Body:**
```json
{
  "completed_sections": ["sect_001"],
  "time_spent_hours": {
    "sect_001": 18.5,
    "sect_002": 5.2
  },
  "quiz_scores": {
    "weather_quiz_1": 85,
    "navigation_quiz_1": 78
  },
  "notes": "Completed weather section with good understanding"
}
```

#### `GET /study-plans/analytics/overview`
Get study plan effectiveness analytics

---

## Export System

### Data Exports

#### `POST /exports`
Create export job for data download

**Request Body:**
```json
{
  "export_type": "reports",
  "format": "csv",
  "date_range": {
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z"
  },
  "filters": {
    "exam_types": ["private_pilot", "commercial_pilot"],
    "min_score": 70
  },
  "include_analytics": true,
  "include_study_plans": false,
  "columns": [
    "report_id", "exam_date", "score", "exam_type", 
    "weak_areas", "student_id", "processing_date"
  ]
}
```

**Example Response:**
```json
{
  "success": true,
  "export_job": {
    "job_id": "exp_abc123",
    "status": "queued", 
    "format": "csv",
    "estimated_completion": "2024-01-15T10:35:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "file_size_estimate": "2.4 MB",
    "record_count_estimate": 1500
  }
}
```

#### `GET /exports/{job_id}`
Check export job status

**Example Response:**
```json
{
  "success": true,
  "export_job": {
    "job_id": "exp_abc123",
    "status": "completed",
    "format": "csv",
    "file_size": 2456789,
    "record_count": 1487,
    "download_url": "/v1/exports/exp_abc123/download",
    "expires_at": "2024-01-22T10:30:00Z"
  }
}
```

#### `GET /exports/{job_id}/download`
Download completed export file

Returns file with appropriate content-type headers.

#### `GET /exports`
List all export jobs for the current user

---

## Webhook Management

### Webhook Configuration

#### `POST /webhooks`
Create webhook for real-time notifications

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/cfipros",
  "events": ["batch_complete", "file_processed", "export_ready"],
  "active": true,
  "secret": "your_webhook_secret_key",
  "description": "Production webhook for batch notifications"
}
```

**Example Response:**
```json
{
  "success": true,
  "webhook": {
    "webhook_id": "wh_xyz789",
    "url": "https://your-app.com/webhooks/cfipros",
    "events": ["batch_complete", "file_processed", "export_ready"],
    "active": true,
    "secret": "wh_sec_generated_secret_key",
    "created_at": "2024-01-15T10:30:00Z",
    "last_delivery": null,
    "delivery_stats": {
      "total_deliveries": 0,
      "successful_deliveries": 0,
      "failed_deliveries": 0
    }
  }
}
```

#### `GET /webhooks`
List all webhooks

#### `GET /webhooks/{webhook_id}`
Get webhook details

#### `PUT /webhooks/{webhook_id}`
Update webhook configuration  

#### `DELETE /webhooks/{webhook_id}`
Delete webhook

#### `POST /webhooks/{webhook_id}/test`
Test webhook delivery

**Example Webhook Payload:**
```json
{
  "event_type": "batch_complete",
  "timestamp": "2024-01-15T10:45:00Z",
  "data": {
    "batch_id": "batch_abc123",
    "total_files": 5,
    "successful_files": 5,
    "processing_time_ms": 12500,
    "summary": {
      "average_score": 81.2,
      "most_common_weak_areas": [
        {"code": "PA.I.B.K2", "description": "Weather"}
      ]
    }
  },
  "signature": "sha256=calculated_hmac_signature"
}
```

---

## Authentication

### User Management

#### `POST /auth/register`
Register new user account

**Request Body:**
```json
{
  "email": "instructor@flightschool.com",
  "password": "secure_password_123",
  "full_name": "Jane Smith",
  "organization": "ABC Flight School"
}
```

#### `POST /auth/login`  
Authenticate and get JWT token

**Request Body:**
```json
{
  "email": "instructor@flightschool.com", 
  "password": "secure_password_123"
}
```

**Example Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### `GET /auth/me`
Get current user information

---

## Public Results

### Report Sharing

#### `GET /results/{report_id}`
Get public report results (no authentication required)

**Example Response:**
```json
{
  "success": true,
  "report": {
    "report_id": "rpt_123456",
    "exam_date": "2024-01-10",
    "exam_type": "Private Pilot Written",
    "score": 85,
    "pass_status": "passed",
    "weak_areas": [
      {
        "code": "PA.I.B.K2",
        "description": "Weather services and sources",
        "improvement_suggestion": "Review weather interpretation techniques"
      }
    ],
    "study_recommendations": [
      "Focus on weather pattern recognition",
      "Practice with weather chart interpretation"
    ]
  }
}
```

#### `POST /results/{report_id}/email`
Capture email for report access

---

## Rate Limits & Error Handling

### Rate Limits
- **File Processing**: 100 requests/hour per user
- **Analytics**: 1000 requests/hour per user  
- **Webhooks**: 10000 requests/hour per user
- **Exports**: 50 requests/hour per user

### Common Error Responses

**Authentication Error (401):**
```json
{
  "error": "unauthorized",
  "message": "Invalid or expired token",
  "details": "Please login again to get a new token"
}
```

**Validation Error (422):**
```json
{
  "error": "validation_failed", 
  "message": "Request validation failed",
  "validation_errors": {
    "file": "File size exceeds 25MB limit",
    "exam_type": "Invalid exam type specified"
  }
}
```

**Rate Limit Error (429):**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests", 
  "retry_after": 3600,
  "limit": 100,
  "remaining": 0
}
```

**Server Error (500):**
```json
{
  "error": "internal_server_error",
  "message": "An unexpected error occurred",
  "request_id": "req_123456789"
}
```

---

## SDK Usage Examples

### Python SDK
```python
from cfipros_client import CFIProsClient

client = CFIProsClient(api_key="your_api_key")

# Upload and process file
result = await client.upload_file("exam_report.pdf")
print(f"Report ID: {result['report_id']}")

# Get analytics dashboard
analytics = await client.get_analytics_dashboard(days=30)
print(f"Total reports: {analytics['overview']['total_reports']}")
```

### JavaScript/TypeScript SDK
```javascript
import { CFIProsClient } from 'cfipros-client';

const client = new CFIProsClient({ apiKey: 'your_api_key' });

// Upload and process file
const result = await client.uploadFile('exam_report.pdf');
console.log(`Report ID: ${result.data.report_id}`);

// Get analytics dashboard  
const analytics = await client.getAnalyticsDashboard({ days: 30 });
console.log(`Total reports: ${analytics.data.overview.total_reports}`);
```

---

## Support & Resources

- **API Status**: https://status.cfipros.com
- **Documentation**: https://docs.cfipros.com
- **Support**: support@cfipros.com
- **GitHub SDKs**: https://github.com/cfipros/

All timestamps are in ISO 8601 format (UTC). File uploads support PDF, JPG, PNG formats up to 25MB per file.