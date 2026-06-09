-- ============================================================
-- Medicodio — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Users table (replaces MongoDB User model)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null default 'user' check (role in ('attorney', 'user')),
  attorney_verified boolean not null default false,
  attorney_specialty text not null default '',
  attorney_visa_types text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Applications table (replaces MongoDB Application model)
-- documents, pipeline, human_review, call_log stored as JSONB
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  applicant_name text not null,
  visa_type text not null check (visa_type in ('F-1', 'O-1', 'B-1', 'B-2', 'B-1/B-2')),
  status text not null default 'processing'
    check (status in ('approved', 'processing', 'needs_info', 'rejected')),
  score integer not null default 0,
  updated_label text not null default 'just now',
  phone_number text not null default '',
  progress jsonb not null default '{"documentsReceived":0,"identityVerification":0,"financialReview":0,"finalDecision":0}'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  pipeline jsonb not null default '{"status":"idle"}'::jsonb,
  human_review jsonb not null default '{"status":"pending","reviewedBy":null,"reviewedAt":null,"attorneyNotes":""}'::jsonb,
  call_log jsonb not null default '[]'::jsonb,
  applicant_user_id uuid references users(id) on delete set null,
  attorney_user_id uuid references users(id) on delete set null,
  submitted_to_attorney boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One application per applicant per visa type
create unique index if not exists idx_applications_applicant_visa
  on applications (applicant_user_id, visa_type)
  where applicant_user_id is not null;

-- Auto-update updated_at on any row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_updated_at on applications;
create trigger applications_updated_at
  before update on applications
  for each row execute function update_updated_at();

-- Optional: disable RLS (service role bypasses it anyway, but this keeps things simple)
alter table users disable row level security;
alter table applications disable row level security;
