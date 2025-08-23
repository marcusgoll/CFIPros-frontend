# Technical Stack

## Backend Framework
- **Application Framework:** FastAPI
- **Python Version:** 3.11
- **API Design:** RESTful API with automatic OpenAPI documentation

## Database
- **Database System:** PostgreSQL
- **ORM:** SQLAlchemy
- **Database Hosting:** Railway (production)

## AI and Processing
- **AI Provider:** OpenAI
- **Vision Processing:** OpenAI Vision API (GPT-4 Vision)
- **Document Processing:** PyMuPDF (version 1.23.8)
- **Image Processing:** Pillow (version 10.1.0)
- **OCR Capability:** Integrated through OpenAI Vision API

## Frontend/Client
- **JavaScript Framework:** n/a (API-only service)
- **Import Strategy:** n/a
- **CSS Framework:** n/a
- **UI Component Library:** n/a

## Assets and Hosting
- **Application Hosting:** Railway
- **Database Hosting:** Railway
- **Asset Hosting:** Railway (file uploads)
- **Deployment Solution:** Railway with nixpacks.toml configuration

## Development and Deployment
- **Package Management:** Poetry (pyproject.toml)
- **Testing Framework:** pytest
- **Code Repository:** Git
- **Deployment Config:** nixpacks.toml, railway.json
- **Environment Management:** Railway environment variables

## External Services
- **Document Processing:** OpenAI API
- **File Storage:** Local storage with Railway hosting
- **Email Services:** Not yet implemented (planned)

## Security and Performance
- **Rate Limiting:** Custom rate limiter implementation
- **File Validation:** Custom file validator for security
- **Error Handling:** Comprehensive API error handling
- **Cleanup Services:** Automated temporary file cleanup

## Key Dependencies
- **FastAPI:** 0.104.1 - Web framework
- **Uvicorn:** 0.24.0 - ASGI server
- **SQLAlchemy:** 2.0.23 - Database ORM
- **Pydantic:** 2.5.0 - Data validation
- **PyMuPDF:** 1.23.8 - PDF processing
- **Pillow:** 10.1.0 - Image processing
- **OpenAI:** 1.3.0 - AI vision processing
- **psycopg2-binary:** 2.9.7 - PostgreSQL adapter
- **python-multipart:** 0.0.6 - File upload support
- **httpx:** 0.25.2 - HTTP client
- **python-dotenv:** 1.0.0 - Environment variable management
- **email-validator:** 2.1.0 - Email validation
- **alembic:** 1.12.1 - Database migrations