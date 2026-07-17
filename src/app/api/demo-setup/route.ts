import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@lifecharter.architecture',
  full_name: 'Demo User'
};

export async function POST() {
  try {
    const supabase = createServerClient();
    
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
    
    // Create demo profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        full_name: DEMO_USER.full_name,
        workspace_id: demoWorkspace.id,
      });
    
    if (profileError) {
      console.error('Profile creation error:', profileError);
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
        { error: 'Failed to create demo master plan' },
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
