/**
 * Unified Memory - Sync Scores API
 * 
 * POST: Sync 12-domain scores to client_master_plans
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface DomainScore {
  domainNumber: number;
  domainName: string;
  score: number;
  maxScore: number;
  sources?: string[];
  weight?: number;
}

interface SyncScoresRequest {
  masterPlanId: string;
  workspaceId: string;
  assessmentId?: string;
  overallScore?: number;
  brainScore?: number;
  soulScore?: number;
  profitScore?: number;
  domainScores: DomainScore[];
  keyInsights?: Array<{
    title: string;
    description: string;
    source: string;
  }>;
  topStrengths?: Array<{
    domain: string;
    description: string;
  }>;
  priorityGaps?: Array<{
    domain: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

// POST /api/unified-memory/sync-scores - Sync scores to master plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body: SyncScoresRequest = await request.json();
    
    // Validate required fields
    if (!body.masterPlanId || !body.workspaceId || !body.domainScores) {
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
    const hasAccess = masterPlan.user_id === user.id || await checkWorkspaceAccess(supabase, body.workspaceId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Format domain scores for JSONB storage
    const formattedDomainScores: Record<string, unknown> = {};
    for (const ds of body.domainScores) {
      formattedDomainScores[`domain_${ds.domainNumber}`] = {
        name: ds.domainName,
        score: ds.score,
        max_score: ds.maxScore,
        percentage: Math.round((ds.score / ds.maxScore) * 100),
        sources: ds.sources || ['profit_architecture'],
        weight: ds.weight || 1.0,
        updated_at: new Date().toISOString()
      };
    }
    
    // Calculate overall alignment score if not provided
    const overallAlignment = body.overallScore ?? Math.round(
      body.domainScores.reduce((sum, ds) => sum + (ds.score / ds.maxScore) * 100, 0) / body.domainScores.length
    );
    
    // Get current assessments completed count
    const { data: currentPlan } = await supabase
      .from('client_master_plans')
      .select('assessments_completed')
      .eq('id', body.masterPlanId)
      .single();
    
    const assessmentsCompleted = (currentPlan?.assessments_completed || 0) + 1;
    
    // Update master plan with scores
    const { data: updatedPlan, error: updateError } = await supabase
      .from('client_master_plans')
      .update({
        overall_alignment_score: overallAlignment,
        brain_score: body.brainScore ?? null,
        soul_score: body.soulScore ?? null,
        profit_score: body.profitScore ?? overallAlignment,
        domain_scores: formattedDomainScores,
        key_insights: body.keyInsights || [],
        top_strengths: body.topStrengths || [],
        priority_gaps: body.priorityGaps || [],
        assessments_completed: assessmentsCompleted,
        last_assessment_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', body.masterPlanId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error syncing scores:', updateError);
      return NextResponse.json({ error: 'Failed to sync scores' }, { status: 500 });
    }
    
    // Auto-generate action items for low-scoring domains
    const lowScoringDomains = body.domainScores.filter(ds => (ds.score / ds.maxScore) < 0.6);
    if (lowScoringDomains.length > 0) {
      await generateActionItemsForGaps(supabase, body.masterPlanId, body.workspaceId, user.id, lowScoringDomains, body.assessmentId);
    }
    
    return NextResponse.json({
      success: true,
      masterPlan: updatedPlan,
      domainsSynced: body.domainScores.length,
      lowScoringDomains: lowScoringDomains.length
    });
    
  } catch (error) {
    console.error('Error in sync-scores:', error);
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

// Helper function to generate action items for low-scoring domains
async function generateActionItemsForGaps(
  supabase: ReturnType<typeof createClient>,
  masterPlanId: string,
  workspaceId: string,
  userId: string,
  lowScoringDomains: DomainScore[],
  assessmentId?: string
): Promise<void> {
  const actionItems = lowScoringDomains.map(ds => ({
    master_plan_id: masterPlanId,
    workspace_id: workspaceId,
    user_id: userId,
    title: `Improve ${ds.domainName}`,
    description: `Address gaps identified in ${ds.domainName} (Score: ${Math.round((ds.score / ds.maxScore) * 100)}%). Focus on strengthening this area to improve overall business alignment.`,
    source_type: 'profit_assessment' as const,
    source_id: assessmentId || null,
    category: 'profit' as const,
    domain_number: ds.domainNumber,
    priority: ((ds.score / ds.maxScore) < 0.4 ? 'critical' : 'high') as 'critical' | 'high' | 'medium' | 'low',
    status: 'pending' as const,
    assigned_to: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  const { error } = await supabase
    .from('client_action_items')
    .upsert(actionItems, {
      onConflict: 'master_plan_id,source_type,source_id,domain_number'
    });
  
  if (error) {
    console.error('Error generating action items:', error);
  }
}
