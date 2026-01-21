-- Migration: Add Global Search Support
-- Description: Enables pg_trgm extension, adds full-text search vector for candidates,
--              and creates trigram indexes for fast ILIKE searches.

-- 1. Enable pg_trgm extension for trigram-based similarity searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add generated tsvector column for candidate full-text search
-- This creates a searchable vector combining name, title, summary, and resume text
-- with different weights (A = highest, C = lowest)
-- Note: Prisma uses camelCase column names by default
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS resume_search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("fullName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce("summaryPublic", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("resumeExtractedText", '')), 'C')
) STORED;

-- 3. Create GIN index for fast full-text search on candidates
CREATE INDEX IF NOT EXISTS idx_candidates_resume_search ON candidates USING GIN (resume_search_vector);

-- 4. Create trigram indexes for fast ILIKE searches on other tables
-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_desc_trgm ON customers USING GIN (description gin_trgm_ops);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_title_trgm ON projects USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_desc_trgm ON projects USING GIN (description gin_trgm_ops);

-- Engineers
CREATE INDEX IF NOT EXISTS idx_engineers_name_trgm ON engineers USING GIN ("fullName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_engineers_title_trgm ON engineers USING GIN (title gin_trgm_ops);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING GIN ("fullName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING GIN (email gin_trgm_ops);

-- Candidates (for fallback ILIKE search when full-text doesn't match)
CREATE INDEX IF NOT EXISTS idx_candidates_name_trgm ON candidates USING GIN ("fullName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_candidates_title_trgm ON candidates USING GIN (title gin_trgm_ops);
