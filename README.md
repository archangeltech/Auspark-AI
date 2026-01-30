
# Parking Sign Reader - Deployment Guide

## Database Setup (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the left sidebar and run this command:
   ```sql
   create table profiles (
     id uuid default gen_random_uuid() primary key,
     email text unique not null,
     full_name text,
     vehicle_number text,
     has_disability_permit boolean default false,
     has_resident_permit boolean default false,
     has_loading_zone_permit boolean default false,
     has_business_permit boolean default false,
     resident_area text,
     last_synced timestamptz default now()
   );

   -- Enable public access for demo
   alter table profiles enable row level security;
   create policy "Public access" on profiles for all using (true);
   ```
3. **Get your API credentials:**
   - Click **Settings** (gear icon ⚙️) -> **API**.
   - **Project URL:** Found under "Project Configuration".
   - **Anon Key:** Found under "Project API keys" (labeled `anon` / `public`).

## Deployment to Google Play (Android)
To fix "API Key missing" errors, you **must** provide the keys during build.

### Use a .env file
1. Create a `.env` in the root:
   ```env
   API_KEY=your_gemini_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```
2. Run:
   ```bash
   npm run build
   npx cap sync android
   ```

## Mobile Testing (Local)
1. Run your server: `npm start`
2. Install localtunnel: `npm install -g localtunnel`
3. Run: `lt --port 8080`
4. Open the generated URL on your iPhone/Android.
