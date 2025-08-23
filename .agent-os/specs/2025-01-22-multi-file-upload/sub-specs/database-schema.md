# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-01-22-multi-file-upload/spec.md

## New Tables

### batch_reports
```sql
CREATE TABLE batch_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_files INTEGER NOT NULL,
    successful_files INTEGER NOT NULL DEFAULT 0,
    failed_files INTEGER NOT NULL DEFAULT 0,
    processing_time_ms INTEGER,
    summary_data JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    
    CONSTRAINT check_file_counts 
        CHECK (successful_files + failed_files <= total_files),
    CONSTRAINT check_status 
        CHECK (status IN ('processing', 'completed', 'partial', 'failed'))
);

CREATE INDEX idx_batch_reports_created_at ON batch_reports(created_at DESC);
CREATE INDEX idx_batch_reports_status ON batch_reports(status);
CREATE INDEX idx_batch_summary_data ON batch_reports USING GIN (summary_data);
```

### batch_report_files
```sql
CREATE TABLE batch_report_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL,
    report_id UUID,  -- NULL if file failed processing
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(10),
    processing_status VARCHAR(20) NOT NULL,
    error_message TEXT,
    processing_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_batch 
        FOREIGN KEY (batch_id) REFERENCES batch_reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_report 
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    CONSTRAINT check_processing_status 
        CHECK (processing_status IN ('pending', 'processing', 'success', 'failed'))
);

CREATE INDEX idx_batch_files_batch_id ON batch_report_files(batch_id);
CREATE INDEX idx_batch_files_report_id ON batch_report_files(report_id);
CREATE INDEX idx_batch_files_status ON batch_report_files(processing_status);
```

## Modifications to Existing Tables

### reports table
```sql
-- Add batch relationship
ALTER TABLE reports 
ADD COLUMN batch_id UUID,
ADD CONSTRAINT fk_reports_batch 
    FOREIGN KEY (batch_id) REFERENCES batch_reports(id) ON DELETE SET NULL;

CREATE INDEX idx_reports_batch_id ON reports(batch_id);
```

## Migration Script

```sql
-- Migration: 2025_01_22_add_batch_processing.sql

BEGIN;

-- Create batch_reports table
CREATE TABLE IF NOT EXISTS batch_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_files INTEGER NOT NULL,
    successful_files INTEGER NOT NULL DEFAULT 0,
    failed_files INTEGER NOT NULL DEFAULT 0,
    processing_time_ms INTEGER,
    summary_data JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    
    CONSTRAINT check_file_counts 
        CHECK (successful_files + failed_files <= total_files),
    CONSTRAINT check_status 
        CHECK (status IN ('processing', 'completed', 'partial', 'failed'))
);

-- Create batch_report_files junction table
CREATE TABLE IF NOT EXISTS batch_report_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL,
    report_id UUID,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(10),
    processing_status VARCHAR(20) NOT NULL,
    error_message TEXT,
    processing_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_batch 
        FOREIGN KEY (batch_id) REFERENCES batch_reports(id) ON DELETE CASCADE,
    CONSTRAINT fk_report 
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    CONSTRAINT check_processing_status 
        CHECK (processing_status IN ('pending', 'processing', 'success', 'failed'))
);

-- Add batch_id to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD CONSTRAINT fk_reports_batch 
    FOREIGN KEY (batch_id) REFERENCES batch_reports(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_batch_reports_created_at ON batch_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batch_reports_status ON batch_reports(status);
CREATE INDEX IF NOT EXISTS idx_batch_summary_data ON batch_reports USING GIN (summary_data);
CREATE INDEX IF NOT EXISTS idx_batch_files_batch_id ON batch_report_files(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_files_report_id ON batch_report_files(report_id);
CREATE INDEX IF NOT EXISTS idx_batch_files_status ON batch_report_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_reports_batch_id ON reports(batch_id);

COMMIT;
```

## Rollback Script

```sql
-- Rollback: 2025_01_22_add_batch_processing_rollback.sql

BEGIN;

-- Remove foreign key and column from reports table
ALTER TABLE reports DROP CONSTRAINT IF EXISTS fk_reports_batch;
ALTER TABLE reports DROP COLUMN IF EXISTS batch_id;

-- Drop tables in correct order
DROP TABLE IF EXISTS batch_report_files;
DROP TABLE IF EXISTS batch_reports;

COMMIT;
```

## Schema Rationale

### Design Decisions

1. **Separate batch_reports table**: Maintains batch-level metadata and summary without duplicating in each report
2. **JSONB for summary_data**: Flexible storage for complex aggregated analytics that may evolve
3. **Junction table (batch_report_files)**: Tracks all files including failures, maintaining upload history
4. **Nullable report_id**: Allows tracking failed files that couldn't generate reports
5. **Processing order**: Maintains sequence for reproducibility and debugging

### Performance Considerations

1. **GIN index on JSONB**: Enables efficient queries on summary_data fields
2. **Composite indexes**: Optimized for common query patterns (batch lookups, status filtering)
3. **Cascading deletes**: Automatic cleanup when batch expires
4. **Separate expires_at**: Allows different retention policies for batches vs individual reports

### Data Integrity

1. **Check constraints**: Ensure valid status values and consistent file counts
2. **Foreign key constraints**: Maintain referential integrity with soft delete option
3. **Transaction support**: All batch operations wrapped in transactions for atomicity