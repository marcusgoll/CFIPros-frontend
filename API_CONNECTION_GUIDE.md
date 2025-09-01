# API Connection Guide - AKTR to ACS Extractor v1.2

This guide explains how to connect the frontend to your actual v1.2 API backend.

## Environment Configuration

### 1. Set Backend API URL

Create or update your `.env.local` file:

```bash
# Required: Your API backend URL
BACKEND_API_URL=https://your-api-domain.com
# Alternative (backward compatibility):
# API_BASE_URL=https://your-api-domain.com

# Optional: For development
NODE_ENV=development

# Optional: Custom allowed origins for CORS
ALLOWED_ORIGINS=http://localhost:3000,https://cfipros.com,https://www.cfipros.com
```

### 2. Test API Connection

Run the connection test script to verify your backend is accessible:

```bash
npm run test:api
```

This will test:

- Basic connectivity to your backend
- Health check endpoints (if available)
- File upload endpoint (`POST /v1/aktr`)
- Batch status endpoint (`GET /v1/batches/{batchId}`)

## API Endpoints Implemented

### Core Batch Processing

- `POST /v1/aktr` - Upload AKTR files for batch processing
- `GET /v1/batches/{batchId}` - Get batch status and progress
- `GET /v1/batches/{batchId}/export?format={pdf|csv|json}` - Export results

### Sharing & Cohort Management

- `GET /v1/batches/{batchId}/sharing` - List sharing settings
- `POST /v1/batches/{batchId}/sharing` - Create cohorts, invite users
- `DELETE /v1/batches/{batchId}/sharing?cohortId={id}` - Remove sharing

### Consent & Audit

- `GET /v1/batches/{batchId}/consent` - List consent records
- `POST /v1/batches/{batchId}/consent` - Grant consent
- `DELETE /v1/batches/{batchId}/consent` - Revoke consent
- `GET /v1/batches/{batchId}/audit` - List audit entries
- `GET /v1/batches/{batchId}/audit/export` - Export audit logs

## Expected API Response Formats

### Batch Upload Response (`POST /v1/aktr`)

```json
{
  "batchId": "batch_abc123xyz789",
  "status": "accepted",
  "message": "Files accepted for processing",
  "filesCount": 3,
  "estimatedProcessingTime": "2-5 minutes"
}
```

### Batch Status Response (`GET /v1/batches/{batchId}`)

```json
{
  "batchId": "batch_abc123xyz789",
  "status": "processing", // pending | processing | complete | failed
  "progress": 60,
  "filesProcessed": 2,
  "totalFiles": 3,
  "createdAt": "2024-01-15T10:00:00Z",
  "completedAt": null,
  "error": null
}
```

### Export Response Headers

For file downloads, ensure your backend sets proper headers:

```
Content-Type: application/pdf | text/csv | application/json
Content-Disposition: attachment; filename="batch-{batchId}-results.{ext}"
```

## Authentication & Headers

The frontend sends these headers with requests:

```
Content-Type: application/json | multipart/form-data
User-Agent: CFIPros-BFF/1.0
X-Correlation-ID: {generated-id}
X-Client-IP: {client-ip}
X-Service: acs-extractor-v1.2
```

For authenticated requests (if needed):

```
Authorization: Bearer {jwt-token}
```

## Error Handling

Your backend should return RFC7807-compliant errors:

```json
{
  "type": "validation_error",
  "title": "File validation failed",
  "detail": "File size exceeds 15MB limit",
  "status": 400,
  "instance": "/v1/aktr"
}
```

## CORS Configuration

Ensure your backend allows requests from:

- `http://localhost:3000` (development)
- `https://cfipros.com` (production)
- `https://www.cfipros.com` (production)

Required CORS headers:

```
Access-Control-Allow-Origin: {origin}
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Correlation-ID, X-Client-IP, X-Service
```

## File Upload Specifications

### Supported File Types

- PDF: `application/pdf`
- JPEG: `image/jpeg`
- PNG: `image/png`

### File Size Limits

- Maximum: 15MB per file (updated from 10MB for v1.2)
- Maximum: 5 files per batch

### Form Data Format

Files are sent as `multipart/form-data` with field name `files`:

```
Content-Type: multipart/form-data; boundary=...

--boundary
Content-Disposition: form-data; name="files"; filename="aktr-report.pdf"
Content-Type: application/pdf

{binary file content}
--boundary
```

## Development Testing

### Start Development Server

```bash
npm run dev
```

### Test Upload Flow

1. Navigate to `http://localhost:3000/tools/aktr-to-acs`
2. Upload test AKTR files
3. Verify navigation to `/batches/{batchId}`
4. Test export functionality
5. Check sharing and audit features

### Monitor Network Traffic

Use browser DevTools Network tab to inspect:

- Request/response headers
- Payload formats
- Response times
- Error messages

## Troubleshooting

### Common Issues

**Connection Refused / Network Error**

- Verify BACKEND_API_URL is correct
- Check backend server is running
- Confirm network connectivity
- Review firewall/security groups

**CORS Errors**

- Add your frontend domain to backend CORS config
- Verify preflight OPTIONS requests are handled
- Check allowed headers configuration

**File Upload Failures**

- Confirm multipart/form-data is supported
- Check file size limits on backend
- Verify file type validation
- Review temporary storage configuration

**Batch Processing Issues**

- Ensure batchId format is consistent
- Check batch status polling frequency
- Verify database persistence
- Monitor background job processing

### Debug Mode

Enable verbose logging in development:

```bash
DEBUG=cfipros:* npm run dev
```

### Health Checks

Create these endpoints on your backend for monitoring:

- `GET /health` - Basic health check
- `GET /v1/health` - API-specific health check
- `GET /v1/status` - Detailed system status

## Production Deployment

### Environment Variables

```bash
BACKEND_API_URL=https://api.cfipros.com
NODE_ENV=production
ALLOWED_ORIGINS=https://cfipros.com,https://www.cfipros.com
```

### Performance Considerations

- Enable gzip compression
- Set appropriate cache headers
- Implement rate limiting
- Use CDN for static assets
- Monitor response times

### Security Checklist

- HTTPS only in production
- Validate all file uploads
- Implement proper authentication
- Log security events
- Regular security updates
- Input sanitization
- SQL injection protection

## Support

For issues with the frontend integration:

1. Check browser console for errors
2. Review network requests in DevTools
3. Run `npm run test:api` to verify connectivity
4. Check server logs for detailed error messages

The frontend includes comprehensive error handling and user feedback for all API interactions.
