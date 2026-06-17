-- Flight Path Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notion pages table (crawled content)
CREATE TABLE IF NOT EXISTS public.notion_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notion_page_id TEXT UNIQUE NOT NULL,  -- Notion's page ID
    parent_page_id TEXT,  -- For hierarchical structure
    title TEXT NOT NULL,
    content JSONB,  -- Full page content (blocks, etc.)
    url TEXT,  -- Original Notion URL
    icon TEXT,  -- Page icon (emoji)
    cover TEXT,  -- Cover image URL
    is_hidden BOOLEAN DEFAULT false,  -- "Hidden Pages" toggle
    subscription_required TEXT CHECK (subscription_required IN ('free', 'basic', 'premium')),
    slug TEXT UNIQUE,  -- URL-friendly identifier
    order_index INTEGER,  -- For sorting
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page versions table (for change tracking)
CREATE TABLE IF NOT EXISTS public.page_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES public.notion_pages(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    version_number INTEGER NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crawl logs table (worker activity)
CREATE TABLE IF NOT EXISTS public.crawl_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT CHECK (status IN ('running', 'completed', 'failed')),
    pages_processed INTEGER DEFAULT 0,
    pages_created INTEGER DEFAULT 0,
    pages_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notion_pages_notion_id ON public.notion_pages(notion_page_id);
CREATE INDEX IF NOT EXISTS idx_notion_pages_parent ON public.notion_pages(parent_page_id);
CREATE INDEX IF NOT EXISTS idx_notion_pages_slug ON public.notion_pages(slug);
CREATE INDEX IF NOT EXISTS idx_notion_pages_hidden ON public.notion_pages(is_hidden);
CREATE INDEX IF NOT EXISTS idx_notion_pages_subscription ON public.notion_pages(subscription_required);
CREATE INDEX IF NOT EXISTS idx_notion_pages_search ON public.notion_pages USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_page_versions_page ON public.page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_status ON public.crawl_logs(status);

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value) VALUES
    ('crawl_config', '{"maxDepth": 5, "concurrentRequests": 3, "delayBetweenRequests": 1000, "enabled": true}'::jsonb),
    ('site_config', '{"siteName": "Flight Path", "siteDescription": "Your Flight Path content platform"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notion_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Users policies: users can read their own profile, update it
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Notion pages policies: public read for non-hidden pages, subscription-based read for hidden pages
CREATE POLICY "Anyone can view non-hidden pages" ON public.notion_pages FOR SELECT USING (NOT is_hidden);
CREATE POLICY "Premium users can view hidden pages" ON public.notion_pages FOR SELECT USING (
    is_hidden = true AND
    auth.uid() IN (
        SELECT id FROM public.users WHERE subscription_tier IN ('basic', 'premium')
    )
);

-- Page versions policies: users can read versions of pages they can access
CREATE POLICY "Users can view page versions" ON public.page_versions FOR SELECT USING (
    page_id IN (
        SELECT id FROM public.notion_pages WHERE
        NOT is_hidden OR
        (is_hidden = true AND auth.uid() IN (SELECT id FROM public.users WHERE subscription_tier IN ('basic', 'premium')))
    )
);

-- Crawl logs policies: only authenticated users can read
CREATE POLICY "Authenticated users can view crawl logs" ON public.crawl_logs FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin settings policies: only admins can read/write
CREATE POLICY "Admins can view settings" ON public.admin_settings FOR SELECT USING (
    auth.uid() IN (
        SELECT id FROM public.users WHERE email = 'admin@flightpath.com'
    )
);
CREATE POLICY "Admins can update settings" ON public.admin_settings FOR UPDATE USING (
    auth.uid() IN (
        SELECT id FROM public.users WHERE email = 'admin@flightpath.com'
    )
);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notion_pages_updated_at BEFORE UPDATE ON public.notion_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique slugs
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_title TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert title to URL-friendly slug
    base_slug := lower(regexp_replace(base_title, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    final_slug := base_slug;

    -- Check if slug exists and make unique if needed
    WHILE EXISTS (SELECT 1 FROM public.notion_pages WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
