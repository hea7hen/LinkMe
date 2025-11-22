-- LinkMe Database Schema
-- Run this in your Supabase SQL Editor
-- This script handles existing tables and migrates them

-- 1. Create users table (separate from auth.users for app data)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,  -- Firebase UID or custom ID
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop existing profiles table and recreate with correct structure
-- WARNING: This will delete all existing profile data!
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table (matches the code expectations)
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('professional', 'personal')),
  name TEXT,  -- Display name for this profile
  headline TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'nearby' CHECK (visibility IN ('public', 'nearby', 'private')),
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills TEXT[] DEFAULT '{}',
  hobbies TEXT[] DEFAULT '{}',
  prompts JSONB DEFAULT '[]'::jsonb,
  linkedin_url TEXT,
  github_url TEXT,
  instagram_handle TEXT,
  open_to_work BOOLEAN DEFAULT false,
  relationship_goal TEXT CHECK (relationship_goal IN ('friends', 'networking', 'dating', 'chat')),
  zodiac TEXT,
  UNIQUE(user_id, profile_type)
);

-- 3. Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create connections table
CREATE TABLE IF NOT EXISTS public.connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  from_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('professional', 'personal')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  proposed_meetup JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  connection_id TEXT NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_lat_lng ON locations(lat, lng);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON profiles(visibility);
CREATE INDEX IF NOT EXISTS idx_connections_from_user ON connections(from_user);
CREATE INDEX IF NOT EXISTS idx_connections_to_user ON connections(to_user);
CREATE INDEX IF NOT EXISTS idx_messages_connection_id ON messages(connection_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;

CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own record" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own record" ON users FOR UPDATE USING (true);

-- 9. RLS Policies for profiles table
DROP POLICY IF EXISTS "Profiles are viewable based on visibility" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;

CREATE POLICY "Profiles are viewable based on visibility" ON profiles FOR SELECT 
  USING (
    visibility = 'public' OR 
    (visibility = 'nearby' AND true) OR  -- In real app, check if users are nearby
    true  -- For now, allow all (you can refine this)
  );
CREATE POLICY "Users can insert their own profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profiles" ON profiles FOR UPDATE USING (true);

-- 10. RLS Policies for locations table
CREATE POLICY "Locations are viewable by everyone" ON locations FOR SELECT USING (true);
CREATE POLICY "Users can insert their own location" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own location" ON locations FOR UPDATE USING (true);

-- 11. RLS Policies for connections table
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can update their connections" ON connections;

-- Note: Since we're using Firebase Auth, auth.uid() won't work. 
-- We'll use service role key which bypasses RLS, or adjust policies
CREATE POLICY "Users can view their own connections" ON connections FOR SELECT USING (true);
CREATE POLICY "Users can create connections" ON connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their connections" ON connections FOR UPDATE USING (true);

-- 12. RLS Policies for messages table
DROP POLICY IF EXISTS "Users can view messages in their connections" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their messages" ON messages;

-- Note: Since we're using Firebase Auth, auth.uid() won't work
CREATE POLICY "Users can view messages in their connections" ON messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their messages" ON messages FOR UPDATE USING (true);

