-- Migration: Add Project Types, Updates, and Notifications
-- Description: Adds support for Pipeline/DevOps project types, project timeline updates,
--              and notification system for @mentions

-- 1. Create new enums
DO $$ BEGIN
  CREATE TYPE "ProjectType" AS ENUM ('PIPELINE', 'DEVOPS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DevOpsStatus" AS ENUM ('ACTIVE', 'AT_RISK', 'BLOCKED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectUpdateVisibility" AS ENUM ('INTERNAL', 'CUSTOMER_FACING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add UPDATE_ADDED to ActivityAction enum
ALTER TYPE "ActivityAction" ADD VALUE IF NOT EXISTS 'UPDATE_ADDED';

-- 3. Add new columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS "projectType" "ProjectType" NOT NULL DEFAULT 'PIPELINE';

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS "devOpsStatus" "DevOpsStatus";

-- 4. Create project_updates table
CREATE TABLE IF NOT EXISTS project_updates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility "ProjectUpdateVisibility" NOT NULL DEFAULT 'INTERNAL',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT project_updates_project_fkey FOREIGN KEY ("projectId") REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT project_updates_author_fkey FOREIGN KEY ("authorUserId") REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON project_updates("projectId");
CREATE INDEX IF NOT EXISTS idx_project_updates_created ON project_updates("createdAt");

-- 5. Create junction table for mentions (many-to-many: ProjectUpdate <-> User)
CREATE TABLE IF NOT EXISTS _ProjectUpdateMentions (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT _ProjectUpdateMentions_A_fkey FOREIGN KEY ("A") REFERENCES project_updates(id) ON DELETE CASCADE,
  CONSTRAINT _ProjectUpdateMentions_B_fkey FOREIGN KEY ("B") REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS _ProjectUpdateMentions_AB_unique ON _ProjectUpdateMentions("A", "B");
CREATE INDEX IF NOT EXISTS _ProjectUpdateMentions_B_index ON _ProjectUpdateMentions("B");

-- 6. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  "linkUrl" TEXT,
  "projectUpdateId" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_user_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_update_fkey FOREIGN KEY ("projectUpdateId") REFERENCES project_updates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications("userId", "isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications("createdAt");
