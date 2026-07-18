/**
 * Unified Memory Integration Utilities
 * 
 * Helper functions for working with the Unified Client Memory system.
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';

// Types
export interface UnifiedMemoryConfig {
  masterPlanId: string;
  workspaceId: string;
  assessmentId?: string;
  userId?: string;
}

export interface ResponseData {
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
  extractedInsights?: Array<{ type: string; content: string }>;
  relatedResponseIds?: string[];
}

export interface DomainScoreData {
  domainNumber: number;
  domainName: string;
  score: number;
  maxScore: number;
  sources?: string[];
}

export interface InsightData {
  insightType: 'pattern' | 'strength' | 'gap' | 'opportunity' | 'risk' | 'recommendation' | 'milestone';
  source: 'ai_analysis' | 'coach' | 'system' | 'client';
  title: string;
  description: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  sourceAssessmentTypes?: string[];
  evidence?: Array<{
    responseId: string;
    questionText: string;
    answerSummary: string;
  }>;
  relatedResponseIds?: string[];
}

export interface ActionItemData {
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

export interface UnifiedResponse {
  id: string;
  master_plan_id: string;
  assessment_type: string;
  question_id: string;
  question_text: string;
  section_name: string | null;
  section_type: string | null;
  answer_value: unknown;
  answer_text: string | null;
  score: number | null;
  max_score: number | null;
  sentiment: string | null;
  priority_level: string | null;
  extracted_insights: unknown[];
  answered_at: string;
}

export interface MasterPlan {
  id: string;
  workspace_id: string;
  user_id: string;
  client_name: string;
  client_email: string | null;
  status: string;
  overall_alignment_score: number | null;
  brain_score: number | null;
  soul_score: number | null;
  profit_score: number | null;
  domain_scores: Record<string, { name: string; score: number; percentage: number; sources: string[] }>;
  key_insights: unknown[];
  top_strengths: unknown[];
  priority_gaps: unknown[];
  assessments_completed: number;
  total_questions_answered: number;
  last_assessment_at: string | null;
}

export interface ClientInsight {
  id: string;
  master_plan_id: string;
  insight_type: string;
  source: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface ActionItem {
  id: string;
  master_plan_id: string;
  title: string;
  description: string | null;
  category: string | null;
  domain_number: number | null;
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
}

export interface CrossAssessmentContext {
  brainResponses: UnifiedResponse[];
  soulResponses: UnifiedResponse[];
  profitResponses: UnifiedResponse[];
  insights: ClientInsight[];
  actionItems: ActionItem[];
}

/**
 * Client-side: Sync a single response to unified memory via API
 */
export async function syncResponseToUnifiedMemory(
  config: UnifiedMemoryConfig,
  data: ResponseData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/unified-memory/sync-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterPlanId: config.masterPlanId,
        workspaceId: config.workspaceId,
        assessmentId: config.assessmentId,
        questionId: data.questionId,
        questionText: data.questionText,
        sectionName: data.sectionName,
        sectionType: data.sectionType,
        answerValue: data.answerValue,
        answerText: data.answerText,
        score: data.score,
        maxScore: data.maxScore,
        sentiment: data.sentiment,
        priorityLevel: data.priorityLevel,
        extractedInsights: data.extractedInsights,
        relatedResponseIds: data.relatedResponseIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to sync response' };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception syncing response:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Client-side: Sync domain scores to master plan via API
 */
export async function syncScoresToUnifiedMemory(
  config: UnifiedMemoryConfig,
  domainScores: DomainScoreData[],
  options?: {
    overallScore?: number;
    brainScore?: number;
    soulScore?: number;
    profitScore?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/unified-memory/sync-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterPlanId: config.masterPlanId,
        workspaceId: config.workspaceId,
        assessmentId: config.assessmentId,
        domainScores,
        overallScore: options?.overallScore,
        brainScore: options?.brainScore,
        soulScore: options?.soulScore,
        profitScore: options?.profitScore,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to sync scores' };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception syncing scores:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Client-side: Create an insight via API
 */
export async function createInsightInUnifiedMemory(
  config: UnifiedMemoryConfig,
  data: InsightData
): Promise<{ success: boolean; insightId?: string; error?: string }> {
  try {
    const response = await fetch('/api/unified-memory/generate-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterPlanId: config.masterPlanId,
        workspaceId: config.workspaceId,
        insightType: data.insightType,
        source: data.source,
        title: data.title,
        description: data.description,
        priority: data.priority,
        sourceAssessmentTypes: data.sourceAssessmentTypes,
        evidence: data.evidence,
        relatedResponseIds: data.relatedResponseIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to create insight' };
    }

    const result = await response.json();
    return { success: true, insightId: result.insight?.id };
  } catch (err) {
    console.error('Exception creating insight:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Client-side: Create an action item via API
 */
export async function createActionItemInUnifiedMemory(
  config: UnifiedMemoryConfig,
  data: ActionItemData
): Promise<{ success: boolean; actionId?: string; error?: string }> {
  try {
    const response = await fetch('/api/unified-memory/create-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterPlanId: config.masterPlanId,
        workspaceId: config.workspaceId,
        title: data.title,
        description: data.description,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        category: data.category,
        domainNumber: data.domainNumber,
        priority: data.priority,
        dueDate: data.dueDate,
        assignedTo: data.assignedTo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to create action item' };
    }

    const result = await response.json();
    return { success: true, actionId: result.actionItem?.id };
  } catch (err) {
    console.error('Exception creating action item:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Client-side: Auto-generate action items for low-scoring domains
 */
export async function autoGenerateActionItems(
  config: UnifiedMemoryConfig,
  threshold = 60
): Promise<{ success: boolean; actionsCreated: number; error?: string }> {
  try {
    const response = await fetch('/api/unified-memory/create-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        masterPlanId: config.masterPlanId,
        workspaceId: config.workspaceId,
        assessmentId: config.assessmentId,
        autoGenerate: true,
        domainThreshold: threshold,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, actionsCreated: 0, error: error.error || 'Failed to generate actions' };
    }

    const result = await response.json();
    return { success: true, actionsCreated: result.actionsCreated || 0 };
  } catch (err) {
    console.error('Exception auto-generating actions:', err);
    return { success: false, actionsCreated: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Client-side: Get or create a master plan
 */
export async function getOrCreateMasterPlan(
  params: {
    userId: string;
    workspaceId: string;
    clientName: string;
    clientEmail?: string;
  }
): Promise<{ id: string; error?: string }> {
  try {
    const supabase = createBrowserClient();
    
    // Try to find existing active plan
    const { data: existing } = await supabase
      .from('client_master_plans')
      .select('id')
      .eq('user_id', params.userId)
      .eq('workspace_id', params.workspaceId)
      .eq('status', 'active')
      .single();
    
    if (existing) {
      return { id: existing.id };
    }
    
    // Create new
    const { data: created, error } = await supabase
      .from('client_master_plans')
      .insert({
        workspace_id: params.workspaceId,
        user_id: params.userId,
        client_name: params.clientName,
        client_email: params.clientEmail,
        status: 'active'
      })
      .select('id')
      .single();
    
    if (error) {
      return { id: '', error: error.message };
    }
    
    return { id: created.id };
  } catch (err) {
    return { id: '', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Client-side: Fetch cross-assessment context
 */
export async function fetchCrossAssessmentContext(
  masterPlanId: string
): Promise<{ success: boolean; context?: CrossAssessmentContext; error?: string }> {
  try {
    const supabase = createBrowserClient();
    
    // Fetch responses from all assessment types
    const { data: responses } = await supabase
      .from('unified_client_responses')
      .select('*')
      .eq('master_plan_id', masterPlanId)
      .order('answered_at', { ascending: false });
    
    // Fetch insights
    const { data: insights } = await supabase
      .from('client_insights')
      .select('*')
      .eq('master_plan_id', masterPlanId)
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });
    
    // Fetch action items
    const { data: actionItems } = await supabase
      .from('client_action_items')
      .select('*')
      .eq('master_plan_id', masterPlanId)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true });
    
    const context: CrossAssessmentContext = {
      brainResponses: (responses || []).filter((r: { assessment_type: string }) => r.assessment_type === 'brain'),
      soulResponses: (responses || []).filter((r: { assessment_type: string }) => r.assessment_type === 'soul'),
      profitResponses: (responses || []).filter((r: { assessment_type: string }) => r.assessment_type === 'profit_architecture'),
      insights: insights || [],
      actionItems: actionItems || [],
    };
    
    return { success: true, context };
  } catch (err) {
    console.error('Exception fetching cross-assessment context:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Client-side: Batch sync multiple responses
 */
export async function batchSyncResponses(
  config: UnifiedMemoryConfig,
  responses: ResponseData[]
): Promise<{ success: boolean; synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;
  
  for (const response of responses) {
    const result = await syncResponseToUnifiedMemory(config, response);
    if (result.success) {
      synced++;
    } else {
      failed++;
    }
  }
  
  return { success: failed === 0, synced, failed };
}
