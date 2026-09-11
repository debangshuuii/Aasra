-- ==============================================================================
-- AASRA (MindTrauma AI) - Complete Supabase Database Schema
-- Run this script in your Supabase Project -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. User Profiles & Privacy Settings Table
-- Stores user profile, consent status, and client-side PIN encryption metadata.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT DEFAULT 'Anonymous User',
    consent_accepted BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMPTZ,
    pin_configured BOOLEAN DEFAULT false,
    pin_salt TEXT,      -- Salt for PBKDF2 client-side encryption
    pin_hash TEXT,      -- SHA-256 hash for local validation
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- 3. Clinical Assessments Table
-- Stores PC-PTSD-5, GAD-7, and AI clinical summary records.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trauma_exposure BOOLEAN DEFAULT false,
    ptsd_score INTEGER CHECK (ptsd_score >= 0 AND ptsd_score <= 5),
    ptsd_positive BOOLEAN DEFAULT false,
    ptsd_answers JSONB DEFAULT '[]'::jsonb,
    gad7_score INTEGER CHECK (gad7_score >= 0 AND gad7_score <= 21),
    gad7_severity TEXT CHECK (gad7_severity IN ('minimal', 'mild', 'moderate', 'severe')),
    gad7_needs_referral BOOLEAN DEFAULT false,
    gad7_answers JSONB DEFAULT '[]'::jsonb,
    risk_level TEXT CHECK (risk_level IN ('routine', 'elevated', 'critical')) DEFAULT 'routine',
    urgent_distress BOOLEAN DEFAULT false,
    self_harm_or_danger BOOLEAN DEFAULT false,
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- 4. Daily Mood Check-Ins Table
-- Stores daily emotional tracking, sleep quality, stress levels, and notes.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    display_date TEXT,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    mood_label TEXT,
    energy_level TEXT,
    mental_clarity TEXT,
    day_overall TEXT,
    stress_level TEXT,
    sleep_quality TEXT,
    felt_supported TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Ensure a user can only log one primary check-in per day (optional constraint)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_daily_checkin 
ON public.daily_checkins (user_id, checkin_date)
WHERE user_id IS NOT NULL;

-- ==============================================================================
-- 5. Saathi AI Chat Sessions Table
-- Stores conversation threads with the AI psychoeducational assistant.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Saathi Consultation Session',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- 6. Saathi AI Chat Messages Table
-- Stores individual message turns in each chat session.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    message_text TEXT NOT NULL,
    is_fallback BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- 7. Automated Updated_At Trigger Function
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER set_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous User'))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON public.assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON public.daily_checkins(user_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id, created_at ASC);

-- ==============================================================================
-- 9. Row Level Security (RLS) Policies
-- Ensures patient confidentiality, strict isolation, and consent privacy.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 9.1 Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 9.2 Assessments Policies (Authenticated + Anonymous Support)
DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
CREATE POLICY "Users can view own assessments"
    ON public.assessments FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert assessments" ON public.assessments;
CREATE POLICY "Users can insert assessments"
    ON public.assessments FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete own assessments" ON public.assessments;
CREATE POLICY "Users can delete own assessments"
    ON public.assessments FOR DELETE
    USING (auth.uid() = user_id);

-- 9.3 Daily Check-Ins Policies
DROP POLICY IF EXISTS "Users can view own check-ins" ON public.daily_checkins;
CREATE POLICY "Users can view own check-ins"
    ON public.daily_checkins FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert own check-ins" ON public.daily_checkins;
CREATE POLICY "Users can insert own check-ins"
    ON public.daily_checkins FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own check-ins" ON public.daily_checkins;
CREATE POLICY "Users can update own check-ins"
    ON public.daily_checkins FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own check-ins" ON public.daily_checkins;
CREATE POLICY "Users can delete own check-ins"
    ON public.daily_checkins FOR DELETE
    USING (auth.uid() = user_id);

-- 9.4 Chat Sessions Policies
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view own chat sessions"
    ON public.chat_sessions FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can create own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can create own chat sessions"
    ON public.chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can update own chat sessions"
    ON public.chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can delete own chat sessions"
    ON public.chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- 9.5 Chat Messages Policies
DROP POLICY IF EXISTS "Users can view messages in their sessions" ON public.chat_messages;
CREATE POLICY "Users can view messages in their sessions"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND (chat_sessions.user_id = auth.uid() OR chat_sessions.user_id IS NULL)
        )
    );

DROP POLICY IF EXISTS "Users can insert messages into their sessions" ON public.chat_messages;
CREATE POLICY "Users can insert messages into their sessions"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND (chat_sessions.user_id = auth.uid() OR chat_sessions.user_id IS NULL)
        )
    );

DROP POLICY IF EXISTS "Users can delete messages in their sessions" ON public.chat_messages;
CREATE POLICY "Users can delete messages in their sessions"
    ON public.chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND (chat_sessions.user_id = auth.uid())
        )
    );

-- ==============================================================================
-- 10. WHO-5 Well-Being Assessments Table  (optional — for cloud sync)
-- Stores WHO-5 assessment results per user.
-- Run this section separately once ready to enable Supabase sync.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.who5_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    raw_score INTEGER NOT NULL CHECK (raw_score >= 0 AND raw_score <= 25),
    percent_score INTEGER NOT NULL CHECK (percent_score >= 0 AND percent_score <= 100),
    answers JSONB DEFAULT '[]'::jsonb,  -- Array of 5 values (0–5)
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_who5_user_date
    ON public.who5_assessments(user_id, assessment_date DESC);

-- Enable RLS
ALTER TABLE public.who5_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as assessments table)
DROP POLICY IF EXISTS "Users can view own WHO-5 assessments" ON public.who5_assessments;
CREATE POLICY "Users can view own WHO-5 assessments"
    ON public.who5_assessments FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert WHO-5 assessments" ON public.who5_assessments;
CREATE POLICY "Users can insert WHO-5 assessments"
    ON public.who5_assessments FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete own WHO-5 assessments" ON public.who5_assessments;
CREATE POLICY "Users can delete own WHO-5 assessments"
    ON public.who5_assessments FOR DELETE
    USING (auth.uid() = user_id);

