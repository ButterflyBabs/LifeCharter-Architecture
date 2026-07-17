/**
 * Unified Memory - Sync Response API
 * 
 * POST: Sync individual question response to unified_client_responses
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface SyncResponseRequest {
  masterPlanId: string;
  workspaceId: string;
  assessmentId?: string;
  questionId: string;
  questionText: string;
  sectionName?: string;
  sectionType?: string;
  answerValue: unknown;
  answerText?: string;
  score?: number;
  maxScore?: number;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'concern';
  priorityLevel?: 'critical' | 'high' | 'medium' | 'low';
  extractedInsights?: Array<{
    type: string;
    content: string;
  }>;
  relatedResponseIds?: string[];
}

// POST /api/unified-memory/sync-response - Sync a response to unified memory
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body: SyncResponseRequest = await request.json();
    
    // Validate required fields
    const requiredFields = ['masterPlanId', 'workspaceId', 'questionId', 'questionText', 'answerValue'];
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
    
    // Upsert the response to unified_client_responses
    const { data: response, error: upsertError } = await supabase
      .from('unified_client_responses')
      .upsert({
        master_plan_id: body.masterPlanId,
        workspace_id: body.workspaceId,
        user_id: user.id,
        assessment_type: 'profit_architecture',
        assessment_id: body.assessmentId,
        question_id: body.questionId,
        question_text: body.questionText,
        section_name: body.sectionName || null,
        section_type: body.sectionType || null,
        answer_value: body.answerValue,
        answer_text: body.answerText || null,
        score: body.score || null,
        max_score: body.maxScore || null,
        sentiment: body.sentiment || null,
        priority_level: body.priorityLevel || null,
        extracted_insights: body.extractedInsights || [],
        related_response_ids: body.relatedResponseIds || [],
        answered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'master_plan_id,assessment_type,question_id'
      })
      .select()
      .single();
    
    if (upsertError) {
      console.error('Error syncing response:', upsertError);
      return NextResponse.json({ error: 'Failed to sync response' }, { status: 500 });
    }
    
    // Update master plan stats
    await updateMasterPlanStats(supabase, body.masterPlanId);
    
    return NextResponse.json({
      success: true,
      response
    });
    
  } catch (error) {
    console.error('Error in sync-response:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to check workspace access
async function checkWorkspaceAccess(
  supabase: ReturnType<typeof createClient>, 
  workspaceId: string, 
  userId: string
): Promise<boolean> {
  // Since we don't have workspace_memberships table in this schema,
  // we'll check if the user has access through the master plan
  const { data: membership } = await supabase
    .from('client_master_plans')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();
  
  return !!membership;
}

// Helper function to update master plan stats
async function updateMasterPlanStats(
  supabase: ReturnType<typeof createClient>, 
  masterPlanId: string
): Promise<void> {
  // Get count of responses
  const { count } = await supabase
    .from('unified_client_responses')
    .select('*', { count: 'exact', head: true })
    .eq('master_plan_id', masterPlanId);
  
  // Update master plan
  await supabase
    .from('client_master_plans')
    .update({
      total_questions_answered: count || 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', masterPlanId);
}
