-- Rename ProjectType enum to ProjectCategory and add DEVELOPERS
ALTER TYPE "ProjectType" RENAME TO "ProjectCategory";
ALTER TYPE "ProjectCategory" ADD VALUE IF NOT EXISTS 'DEVELOPERS';

-- Rename projectType column to projectCategory
ALTER TABLE "projects" RENAME COLUMN "projectType" TO "projectCategory";

-- Add sourcePipelineProjectId for project transitions
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "sourcePipelineProjectId" TEXT;

-- Add foreign key constraint for project transitions
ALTER TABLE "projects" ADD CONSTRAINT "projects_sourcePipelineProjectId_fkey"
  FOREIGN KEY ("sourcePipelineProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
