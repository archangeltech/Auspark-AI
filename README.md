# Parking Sign Reader - Deployment Guide

## 🛠️ Environment Variables Setup (IMPORTANT)
The app requires several keys to function correctly. Create a file named `.env` in the root directory:

```env
API_KEY=your_gemini_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## 💾 Database Setup (Supabase)
Run this SQL in your Supabase Editor:

```sql
-- Table for user profiles
create table profiles (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  full_name text,
  has_disability_permit boolean default false,
  has_resident_permit boolean default false,
  has_loading_vehicle boolean default false,
  has_horse_carriage boolean default false,
  has_bus_permit boolean default false,
  has_taxi_permit boolean default false,
  resident_area text,
  last_synced timestamptz default now()
);

-- Table for issue reports
create table reports (
  id uuid default gen_random_uuid() primary key,
  user_email text,
  issue_category text,
  description text,
  ai_summary text,
  ai_explanation text,
  image_attached boolean,
  image_data text, -- base64
  source text,
  timestamp timestamptz default now()
);

-- Table for user feedback
create table feedback (
  id uuid default gen_random_uuid() primary key,
  user_email text,
  report_id text,
  rating text, -- 'up' or 'down'
  timestamp timestamptz default now()
);

-- Policies
alter table profiles enable row level security;
create policy "Public access" on profiles for all using (true);
alter table reports enable row level security;
create policy "Public access" on reports for all using (true);
alter table feedback enable row level security;
create policy "Public access" on feedback for all using (true);
```