/**
 * Unified Memory - Create Actions API
 * 
 * POST: Generate action items based on low scores/gaps
 * GET: Get action items for a master plan
 * PATCH: Update action item status
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface ActionItemRequest {
  masterPlanId: string;
  workspaceId: string;
  title: string;
  description?: string;
  sourceType?: 'brain_assessment' | 'soul_assessment' | 'profit_assessment' | 'insight' | 'coach' | 'client';
  sourceId?: string;
  category?: 'brain' | 'soul' | 'profit' | 'integration' | 'general';
  domainNumber?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: string;
  assignedTo?: string;
}

interface BulkCreateRequest {
  masterPlanId: string;
  workspaceId: string;
  assessmentId?: string;
  autoGenerate?: boolean;
  domainThreshold?: number; // Score percentage below which to generate actions (default 60)
}

// POST /api/unified-memory/create-actions - Create action item(s)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Check if this is a bulk auto-generate request
    if (body.autoGenerate) {
      return handleBulkCreate(supabase, user.id, body as BulkCreateRequest);
    }
    
    // Single action item creation
    return handleSingleCreate(supabase, user.id, body as ActionItemRequest);
    
  } catch (error) {
    console.error('Error in create-actions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle single action item creation
async function handleSingleCreate(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: ActionItemRequest
) {
  // Validate required fields
  if (!body.masterPlanId || !body.workspaceId || !body.title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // Verify master plan exists and user has access
  const { data: masterPlan, error: planError } = await supabase
    .from('client_master_plans')
    .select('id, user_id, workspace_id')
    .eq('id', body.masterPlanId)
    .single();
  
  if (planError || !masterPlan) {
    return NextResponse.json({ error: 'Master plan not found' }, { status: 404 });
  }
  
  // Check permissions
  const hasAccess = masterPlan.user_id === userId || await checkWorkspaceAccess(supabase, body.workspaceId, userId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  
  // Create the action item
  const { data: actionItem, error: insertError } = await supabase
    .from('client_action_items')
    .insert({
      master_plan_id: body.masterPlanId,
      workspace_id: body.workspaceId,
      user_id: masterPlan.user_id, // Action belongs to the client
      title: body.title,
      description: body.description || null,
      source_type: body.sourceType || 'coach',
      source_id: body.sourceId || null,
      category: body.category || 'general',
      domain_number: body.domainNumber || null,
      priority: body.priority || 'medium',
      status: 'pending',
      due_date: body.dueDate || null,
      assigned_to: body.assignedTo || userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('Error creating action item:', insertError);
    return NextResponse.json({ error: 'Failed to create action item' }, { status: 500 });
  }
  
  return NextResponse.json({
    success: true,
    actionItem
  });
}

// Handle bulk auto-generation of action items
async function handleBulkCreate(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: BulkCreateRequest
) {
  // Validate required fields
  if (!body.masterPlanId || !body.workspaceId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const threshold = body.domainThreshold || 60;
  
  // Verify master plan exists and user has access
  const { data: masterPlan, error: planError } = await supabase
    .from('client_master_plans')
    .select('id, user_id, workspace_id, domain_scores')
    .eq('id', body.masterPlanId)
    .single();
  
  if (planError || !masterPlan) {
    return NextResponse.json({ error: 'Master plan not found' }, { status: 404 });
  }
  
  // Check permissions
  const hasAccess = masterPlan.user_id === userId || await checkWorkspaceAccess(supabase, body.workspaceId, userId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  
  // Get low-scoring domains from domain_scores
  const domainScores = masterPlan.domain_scores as Record<string, { name: string; percentage: number }> || {};
  const lowScoringDomains = Object.entries(domainScores)
    .filter(([, data]) => data.percentage < threshold)
    .map(([key, data]) => ({
      domainNumber: parseInt(key.replace('domain_', '')),
      domainName: data.name,
      percentage: data.percentage
    }));
  
  if (lowScoringDomains.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No low-scoring domains found below threshold',
      actionsCreated: 0
    });
  }
  
  // Generate action items for low-scoring domains
  const actionItems = lowScoringDomains.map(ds => ({
    master_plan_id: body.masterPlanId,
    workspace_id: body.workspaceId,
    user_id: masterPlan.user_id,
    title: `Address ${ds.domainName} Gap`,
    description: `Current score in ${ds.domainName} is ${ds.percentage}%, which is below the ${threshold}% target. Review assessment responses and develop improvement plan.`,
    source_type: 'profit_assessment' as const,
    source_id: body.assessmentId || null,
    category: 'profit' as const,
    domain_number: ds.domainNumber,
    priority: (ds.percentage < 40 ? 'critical' : ds.percentage < 60 ? 'high' : 'medium') as 'critical' | 'high' | 'medium' | 'low',
    status: 'pending' as const,
    assigned_to: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  const { data: createdActions, error: insertError } = await supabase
    .from('client_action_items')
    .upsert(actionItems, {
      onConflict: 'master_plan_id,source_type,source_id,domain_number'
    })
    .select();
  
  if (insertError) {
    console.error('Error creating action items:', insertError);
    return NextResponse.json({ error: 'Failed to create action items' }, { status: 500 });
  }
  
  return NextResponse.json({
    success: true,
    actionsCreated: createdActions?.length || 0,
    actionItems: createdActions || []
  });
}

// GET /api/unified-memory/create-actions?masterPlanId=xxx - Get action items for a master plan
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const masterPlanId = searchParams.get('masterPlanId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    
    if (!masterPlanId) {
      return NextResponse.json({ error: 'Missing masterPlanId parameter' }, { status: 400 });
    }
    
    // Verify access to master plan
    const { data: masterPlan, error: planError } = await supabase
      .from('client_master_plans')
      .select('id, user_id, workspace_id')
      .eq('id', masterPlanId)
      .single();
    
    if (planError || !masterPlan) {
      return NextResponse.json({ error: 'Master plan not found' }, { status: 404 });
    }
    
    // Check permissions
    const hasAccess = masterPlan.user_id === user.id || await checkWorkspaceAccess(supabase, masterPlan.workspace_id, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Build query
    let query = supabase
      .from('client_action_items')
      .select('*')
      .eq('master_plan_id', masterPlanId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    // Execute query
    const { data: actionItems, error: fetchError } = await query
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true });
    
    if (fetchError) {
      console.error('Error fetching action items:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      actionItems: actionItems || [],
      count: actionItems?.length || 0
    });
    
  } catch (error) {
    console.error('Error in create-actions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/unified-memory/create-actions - Update action item status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { actionItemId, status, completedAt } = body;
    
    if (!actionItemId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get the action item to check permissions
    const { data: actionItem, error: fetchError } = await supabase
      .from('client_action_items')
      .select('*, master_plan:client_master_plans!inner(user_id, workspace_id)')
      .eq('id', actionItemId)
      .single();
    
    if (fetchError || !actionItem) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }
    
    // Check permissions
    const masterPlan = actionItem.master_plan as { user_id: string; workspace_id: string };
    const hasAccess = masterPlan.user_id === user.id || 
                      actionItem.assigned_to === user.id || 
                      await checkWorkspaceAccess(supabase, masterPlan.workspace_id, user.id);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Update the action item
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'completed' || completedAt) {
      updateData.completed_at = completedAt || new Date().toISOString();
    }
    
    const { data: updatedItem, error: updateError } = await supabase
      .from('client_action_items')
      .update(updateData)
      .eq('id', actionItemId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating action item:', updateError);
      return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      actionItem: updatedItem
    });
    
  } catch (error) {
    console.error('Error in create-actions PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to check workspace access
async function checkWorkspaceAccess(
  supabase: ReturnType<typeof createClient>, 
  workspaceId: string, 
  userId: string
): Promise<boolean> {
  const { data: membership } = await supabase
    .from('client_master_plans')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();
  
  return !!membership;
}
