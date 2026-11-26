-- SpeakUp Civic Complaint System — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor when switching from Demo Mode to live backend.

create extension if not exists "pgcrypto";

-- 1. Citizen Profiles (optional minimal user profile)
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_uid uuid unique,
  name text,
  phone text,
  default_address text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi', 'te')),
  delete_recordings_after_filing boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Complaints Table
create table if not exists public.complaints (
  id text primary key,
  reference_number text unique not null,
  user_id text not null,
  title text not null,
  category text not null,
  department text not null,
  description text not null,
  original_transcript text not null,
  language text not null default 'en' check (language in ('en', 'hi', 'te')),
  location text not null,
  latitude double precision,
  longitude double precision,
  urgency text not null default 'medium' check (urgency in ('low', 'medium', 'high')),
  status text not null default 'submitted' check (status in ('submitted', 'received', 'in_progress', 'resolved')),
  evidence_urls jsonb not null default '[]'::jsonb,
  voice_note_url text,
  is_demo boolean not null default false,
  reminder_sent_at timestamptz,
  status_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Normalized Status History Table (optional audit log)
create table if not exists public.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id text not null references public.complaints(id) on delete cascade,
  status text not null check (status in ('submitted', 'received', 'in_progress', 'resolved')),
  title text not null,
  description text,
  actor text not null default 'citizen',
  created_at timestamptz not null default now()
);

create index if not exists idx_complaints_user_created on public.complaints(user_id, created_at desc);
create index if not exists idx_complaints_ref on public.complaints(reference_number);
create index if not exists idx_complaints_category_loc on public.complaints(category, location);

-- Row Level Security (enable & customize policies before production launch)
alter table public.user_profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_status_history enable row level security;

-- Example open hackathon policy (restrict by auth.uid() in production!)
create policy "Allow public read complaints"
  on public.complaints for select using (true);

create policy "Allow insert complaints"
  on public.complaints for insert with check (true);

create policy "Allow update complaints"
  on public.complaints for update using (true);
