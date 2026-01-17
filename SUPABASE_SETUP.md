# BuildPulse Supabase Backend Setup Guide

## Quick Setup Checklist

- [ ] Create Supabase account and project
- [ ] Run SQL script
- [ ] Create storage buckets
- [ ] Add environment variables
- [ ] Test the app

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** (sign up if needed)
3. Click **"New Project"**
4. Fill in:
   - **Name**: BuildPulse
   - **Database Password**: (create a strong password - save it somewhere safe)
   - **Region**: Choose closest to you
5. Click **"Create new project"** and wait ~2 minutes for setup

---

## Step 2: Run SQL Script

1. In your Supabase Dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the **ENTIRE** SQL script below and paste it into the editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned" - this is good!

```sql
-- ============================================
-- BuildPulse Database Schema
-- Copy this ENTIRE script into Supabase SQL Editor and run it
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Drop existing tables (if re-running)
-- ============================================
DROP TABLE IF EXISTS progress_entries CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- ============================================
-- Create tables
-- ============================================

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('images', '3d_model')),
    model_url TEXT,
    target_completion_date DATE,
    overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    reference_image_url TEXT,
    model_camera_position JSONB,
    current_percent INTEGER DEFAULT 0 CHECK (current_percent >= 0 AND current_percent <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress entries table
CREATE TABLE progress_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    ai_estimated_percent INTEGER CHECK (ai_estimated_percent >= 0 AND ai_estimated_percent <= 100),
    ai_confidence TEXT CHECK (ai_confidence IN ('high', 'medium', 'low')),
    visible_completed TEXT[],
    still_missing TEXT[],
    notes TEXT,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create indexes for performance
-- ============================================

-- Index for looking up rooms by project
CREATE INDEX idx_rooms_project_id ON rooms(project_id);

-- Index for looking up progress entries by room
CREATE INDEX idx_progress_entries_room_id ON progress_entries(room_id);

-- Index for sorting projects by creation date
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Index for sorting progress entries by capture date
CREATE INDEX idx_progress_entries_captured_at ON progress_entries(captured_at DESC);

-- ============================================
-- Insert sample data for testing (optional - remove if you want clean DB)
-- ============================================

-- Sample project
INSERT INTO projects (name, reference_type, target_completion_date, overall_progress)
VALUES ('Sample Construction Project', 'images', '2026-06-01', 35);

-- Get the project ID for rooms
DO $$
DECLARE
    project_id UUID;
BEGIN
    SELECT id INTO project_id FROM projects WHERE name = 'Sample Construction Project' LIMIT 1;

    -- Sample rooms
    INSERT INTO rooms (project_id, name, current_percent)
    VALUES
        (project_id, 'Kitchen', 45),
        (project_id, 'Living Room', 30),
        (project_id, 'Bedroom', 25);
END $$;
```

---

## Step 3: Create Storage Buckets

**IMPORTANT**: Storage buckets must be created manually.

1. In Supabase Dashboard, click **"Storage"** in the left sidebar
2. Click **"New bucket"**
3. Create **first bucket**:
   - Name: `models`
   - Public bucket: ✅ **Toggle ON**
   - Click **"Create bucket"**
4. Create **second bucket**:
   - Name: `reference-images`
   - Public bucket: ✅ **Toggle ON**
   - Click **"Create bucket"**
5. Create **third bucket**:
   - Name: `progress-photos`
   - Public bucket: ✅ **Toggle ON**
   - Click **"Create bucket"**

**Verify buckets are public:**
- Click on each bucket
- Go to **"Policies"** tab
- You should see policies allowing public access automatically

---

## Step 4: Get Your Environment Variables

1. In Supabase Dashboard, click **"Project Settings"** (gear icon in left sidebar)
2. Click **"API"** in the settings menu
3. You'll see two important values:

   - **Project URL** (looks like: `https://abcdefg.supabase.co`)
   - **anon/public key** (looks like: `eyJhbGc...` - long string)

4. Copy both values

---

## Step 5: Add Environment Variables to Your App

1. In your project root (`buildpulse/`), create a file named `.env.local`
2. Add these two lines (replace with YOUR values from Step 4):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
```

3. Save the file

**IMPORTANT**: Never commit `.env.local` to git (it's already in `.gitignore`)

---

## Step 6: Restart Your Dev Server

1. Stop your Next.js dev server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

---

## Step 7: Test It Out!

1. Go to http://localhost:3000
2. Click **"New Project"**
3. Fill out the form and upload a 3D model or images
4. Click **"Create Project"**
5. You should be redirected to the dashboard
6. Your project should appear!

**Verify in Supabase:**
1. Go to Supabase Dashboard → **"Table Editor"**
2. Click **"projects"** table
3. You should see your new project!
4. Check **"Storage"** → **"models"** bucket to see your uploaded 3D model

---

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the project root
- Make sure you restarted the dev server after creating `.env.local`
- Check that the variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### "Failed to upload file"
- Make sure you created the storage buckets
- Make sure the buckets are **public** (toggle was ON when creating)
- Check the bucket names are exactly: `models`, `reference-images`, `progress-photos`

### "Failed to create project"
- Make sure you ran the SQL script successfully
- Check the SQL Editor for any errors
- Go to Table Editor and verify the `projects` table exists

### Sample data showing up
- If you don't want the sample project, remove this section from the SQL script before running:
  ```sql
  -- Insert sample data for testing (optional - remove if you want clean DB)
  ...
  END $$;
  ```

---

## What's Been Set Up

### Database Tables ✅
- `projects` - Stores construction projects
- `rooms` - Stores rooms/zones within projects
- `progress_entries` - Stores daily progress photos and AI analysis

### Storage Buckets ✅
- `models` - For 3D model files (.glb, .gltf)
- `reference-images` - For room reference photos
- `progress-photos` - For daily check-in photos

### API Routes ✅
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project with rooms
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/[id]` - Get room with progress entries
- `PUT /api/rooms/[id]` - Update room
- `DELETE /api/rooms/[id]` - Delete room
- `GET /api/progress` - List progress entries
- `POST /api/progress` - Create progress entry
- `POST /api/upload` - Upload files to storage

### Frontend Integration ✅
- Dashboard loads projects from Supabase
- New project form uploads files and creates database records
- Project cards display real data

---

## Next Steps (After Hackathon)

- [ ] Add authentication (Auth0)
- [ ] Add Row Level Security (RLS) policies
- [ ] Implement AI progress analysis (Google Gemini)
- [ ] Add project detail pages
- [ ] Add progress tracking functionality
- [ ] Make storage buckets private (requires RLS)

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check your Supabase Dashboard logs for errors
