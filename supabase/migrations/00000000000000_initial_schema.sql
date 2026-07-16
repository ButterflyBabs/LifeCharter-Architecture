-- Initial Schema for LifeCharter-Architecture
-- Creates workspace, auth, and user profile foundations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces table (multi-tenant foundation)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL,
    settings JSONB DEFAULT '{}',
    theme_preference TEXT DEFAULT 'light',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member', 'coach')),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace memberships
CREATE TABLE IF NOT EXISTS workspace_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'coach')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Audit events
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    changes JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
CREATE POLICY "Users can view their own workspaces"
    ON workspaces FOR SELECT
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_id = workspaces.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners and admins can update workspaces"
    ON workspaces FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_id = workspaces.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- RLS Policies for workspace_memberships
CREATE POLICY "Users can view memberships in their workspaces"
    ON workspace_memberships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE id = workspace_memberships.workspace_id
            AND (owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM workspace_memberships wm2
                    WHERE wm2.workspace_id = workspace_memberships.workspace_id
                    AND wm2.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Owners and admins can manage memberships"
    ON workspace_memberships FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE id = workspace_memberships.workspace_id
            AND (owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM workspace_memberships wm2
                    WHERE wm2.workspace_id = workspace_memberships.workspace_id
                    AND wm2.user_id = auth.uid()
                    AND wm2.role IN ('owner', 'admin')
                )
            )
        )
    );

-- RLS Policies for audit_events
CREATE POLICY "Users can view audit events in their workspaces"
    ON audit_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspaces
            WHERE id = audit_events.workspace_id
            AND (owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM workspace_memberships
                    WHERE workspace_id = audit_events.workspace_id
                    AND user_id = auth.uid()
                )
            )
        )
    );

-- Indexes for performance
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspace_memberships_workspace ON workspace_memberships(workspace_id);
CREATE INDEX idx_workspace_memberships_user ON workspace_memberships(user_id);
CREATE INDEX idx_audit_events_workspace ON audit_events(workspace_id);
CREATE INDEX idx_audit_events_created ON audit_events(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
