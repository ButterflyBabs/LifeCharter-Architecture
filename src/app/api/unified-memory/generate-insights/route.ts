/**
 * Unified Memory - Generate Insights API
 * 
 * POST: Extract insights and save to client_insights
 * GET: Get insights for a master plan
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface InsightEvidence {
  responseId: string;
  questionText: string;
  answerSummary: string;
}

interface GenerateInsightRequest {
  masterPlanId: string;
  workspaceId: string;
  insightType: 'pattern' | 'strength' | 'gap' | 'opportunity' | 'risk' | 'recommendation' | 'milestone';
  source: 'ai_analysis' | 'coach' | 'system' | 'client';
  title: string;
  description: string;
  evidence?: InsightEvidence[];
  relatedResponseIds?: string[];
  priority?: 'critical' | 'high' | 'medium' | 'low';
  sourceAssessmentTypes?: string[];
}

// POST /api/unified-memory/generate-insights - Create a new insight
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body: GenerateInsightRequest = await request.json();
    
    // Validate required fields
    const requiredFields = ['masterPlanId', 'workspaceId', 'insightType', 'source', 'title', 'description'];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
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
    const hasAccess = masterPlan.user_id === user.id || await checkWorkspaceAccess(supabase, body.workspaceId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Create the insight
    const { data: insight, error: insertError } = await supabase
      .from('client_insights')
      .insert({
        master_plan_id: body.masterPlanId,
        workspace_id: body.workspaceId,
        user_id: masterPlan.user_id, // Insight belongs to the client
        insight_type: body.insightType,
        source: body.source,
        source_assessment_types: body.sourceAssessmentTypes || ['profit_architecture'],
        title: body.title,
        description: body.description,
        evidence: body.evidence || [],
        related_response_ids: body.relatedResponseIds || [],
        priority: body.priority || 'medium',
        status: 'active',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating insight:', insertError);
      return NextResponse.json({ error: 'Failed to create insight' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      insight
    });
    
  } catch (error) {
    console.error('Error in generate-insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/unified-memory/generate-insights?masterPlanId=xxx - Get insights for a master plan
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
    const insightType = searchParams.get('type');
    const status = searchParams.get('status') || 'active';
    
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
      .from('client_insights')
      .select('*')
      .eq('master_plan_id', masterPlanId);
    
    if (insightType) {
      query = query.eq('insight_type', insightType);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute query
    const { data: insights, error: fetchError } = await query
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('Error fetching insights:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      insights: insights || [],
      count: insights?.length || 0
    });
    
  } catch (error) {
    console.error('Error in generate-insights GET:', error);
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
