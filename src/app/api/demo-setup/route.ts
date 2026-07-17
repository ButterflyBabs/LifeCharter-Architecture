import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000001', // Valid UUID format
  email: 'demo@lifecharter.architecture',
  full_name: 'Demo User'
};

export async function POST() {
  try {
    // Use raw supabase-js client with service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Check for existing demo plan
    const { data: existingPlans } = await supabase
      .from('client_master_plans')
      .select('id, workspace_id')
      .eq('user_id', DEMO_USER.id)
      .eq('status', 'active')
      .limit(1);
    
    if (existingPlans && existingPlans.length > 0) {
      return NextResponse.json({
        masterPlanId: existingPlans[0].id,
        workspaceId: existingPlans[0].workspace_id,
        isDemoMode: true
      });
    }
    
    // Create demo workspace with service role (bypasses RLS)
    const { data: demoWorkspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: 'Demo Workspace',
        slug: 'demo-workspace-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      })
      .select('id')
      .single();
    
    if (wsError || !demoWorkspace) {
      console.error('Workspace creation error:', wsError);
      return NextResponse.json(
        { error: 'Failed to create demo workspace' },
        { status: 500 }
      );
    }
    
    // Create demo user in auth schema first (required for profiles FK)
    const { error: authError } = await supabase.auth.admin.createUser({
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      email_confirm: true,
      user_metadata: { full_name: DEMO_USER.full_name }
    });
    
    // Ignore error if user already exists
    if (authError && !authError.message.includes('already been registered')) {
      console.error('Auth user creation error:', authError);
    }
    
    // Create demo profile first (required for FK constraint)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        full_name: DEMO_USER.full_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { error: 'Failed to create demo profile: ' + profileError.message },
        { status: 500 }
      );
    }
    
    // Create demo master plan
    const { data: newPlan, error: planError } = await supabase
      .from('client_master_plans')
      .insert({
        workspace_id: demoWorkspace.id,
        user_id: DEMO_USER.id,
        client_name: DEMO_USER.full_name,
        client_email: DEMO_USER.email,
        status: 'active',
      })
      .select('id, workspace_id')
      .single();
    
    if (planError || !newPlan) {
      console.error('Master plan creation error:', planError);
      return NextResponse.json(
        { error: 'Failed to create demo master plan: ' + (planError?.message || 'Unknown error') },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      masterPlanId: newPlan.id,
      workspaceId: newPlan.workspace_id,
      isDemoMode: true
    });
    
  } catch (err) {
    console.error('Demo setup error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
