-- Operating Rhythm System Migration
-- Creates tables for tracking daily/weekly/monthly business rhythms

-- Enable RLS
alter table if exists public.operating_rhythm_items enable row level security;

-- Create operating_rhythm_items table
CREATE TABLE IF NOT EXISTS public.operating_rhythm_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('daily', 'weekly', 'monthly')),
    title TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_operating_rhythm_workspace_id ON public.operating_rhythm_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_operating_rhythm_user_id ON public.operating_rhythm_items(user_id);
CREATE INDEX IF NOT EXISTS idx_operating_rhythm_category ON public.operating_rhythm_items(category);
CREATE INDEX IF NOT EXISTS idx_operating_rhythm_completed ON public.operating_rhythm_items(completed);

-- Enable RLS
ALTER TABLE public.operating_rhythm_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own workspace's rhythm items
CREATE POLICY "Users can view workspace rhythm items"
    ON public.operating_rhythm_items
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Users can create rhythm items in their workspaces
CREATE POLICY "Users can create rhythm items"
    ON public.operating_rhythm_items
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

-- Users can update their own rhythm items
CREATE POLICY "Users can update their rhythm items"
    ON public.operating_rhythm_items
    FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Users can delete their own rhythm items
CREATE POLICY "Users can delete their rhythm items"
    ON public.operating_rhythm_items
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_operating_rhythm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_operating_rhythm_updated_at ON public.operating_rhythm_items;
CREATE TRIGGER update_operating_rhythm_updated_at
    BEFORE UPDATE ON public.operating_rhythm_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_operating_rhythm_updated_at();

-- Function to auto-update completed_at when completed changes
CREATE OR REPLACE FUNCTION public.update_operating_rhythm_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
        NEW.completed_at = now();
    ELSIF NEW.completed = false THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update completed_at
DROP TRIGGER IF EXISTS update_operating_rhythm_completed_at ON public.operating_rhythm_items;
CREATE TRIGGER update_operating_rhythm_completed_at
    BEFORE UPDATE ON public.operating_rhythm_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_operating_rhythm_completed_at();

-- Seed default rhythm items for new workspaces (optional helper function)
CREATE OR REPLACE FUNCTION public.seed_default_operating_rhythm(p_workspace_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Daily items
    INSERT INTO public.operating_rhythm_items (workspace_id, user_id, category, title, frequency)
    VALUES
        (p_workspace_id, p_user_id, 'daily', 'Review cash position', 'daily'),
        (p_workspace_id, p_user_id, 'daily', 'Check key metrics', 'daily'),
        (p_workspace_id, p_user_id, 'daily', 'Prioritize top 3 tasks', 'daily');
    
    -- Weekly items
    INSERT INTO public.operating_rhythm_items (workspace_id, user_id, category, title, frequency)
    VALUES
        (p_workspace_id, p_user_id, 'weekly', 'Team sync meeting', 'weekly'),
        (p_workspace_id, p_user_id, 'weekly', 'Review sales pipeline', 'weekly'),
        (p_workspace_id, p_user_id, 'weekly', 'Client follow-ups', 'weekly');
    
    -- Monthly items
    INSERT INTO public.operating_rhythm_items (workspace_id, user_id, category, title, frequency)
    VALUES
        (p_workspace_id, p_user_id, 'monthly', 'Financial review', 'monthly'),
        (p_workspace_id, p_user_id, 'monthly', 'Goal progress check', 'monthly'),
        (p_workspace_id, p_user_id, 'monthly', 'Strategic planning', 'monthly');
END;
$$ LANGUAGE plpgsql;