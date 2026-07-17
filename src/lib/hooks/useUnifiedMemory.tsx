/**
 * Unified Memory React Hook
 * 
 * Provides easy access to Unified Client Memory functionality in React components.
 */

'use client';

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  syncResponseToUnifiedMemory,
  syncScoresToUnifiedMemory,
  createInsightInUnifiedMemory,
  createActionItemInUnifiedMemory,
  autoGenerateActionItems,
  fetchCrossAssessmentContext,
} from '@/lib/unified-memory';

// Import types
import type {
  UnifiedMemoryConfig,
  ResponseData,
  DomainScoreData,
  InsightData,
  ActionItemData,
  CrossAssessmentContext,
  MasterPlan,
} from '@/lib/unified-memory';

// Re-export types for convenience
export type {
  UnifiedMemoryConfig,
  ResponseData,
  DomainScoreData,
  InsightData,
  ActionItemData,
  UnifiedResponse,
  CrossAssessmentContext,
  MasterPlan,
  ClientInsight,
  ActionItem,
} from '@/lib/unified-memory';

interface UnifiedMemoryState {
  masterPlan: MasterPlan | null;
  crossContext: CrossAssessmentContext | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
}

interface UnifiedMemoryActions {
  syncResponse: (data: ResponseData) => Promise<boolean>;
  syncScores: (domainScores: DomainScoreData[]) => Promise<boolean>;
  createInsight: (data: InsightData) => Promise<string | null>;
  createActionItem: (data: ActionItemData) => Promise<string | null>;
  autoGenerateActions: (threshold?: number) => Promise<number>;
  refreshContext: () => Promise<void>;
}

interface UnifiedMemoryContextValue extends UnifiedMemoryState, UnifiedMemoryActions {
  config: UnifiedMemoryConfig;
}

const UnifiedMemoryContext = createContext<UnifiedMemoryContextValue | null>(null);

interface UnifiedMemoryProviderProps {
  masterPlanId: string;
  workspaceId: string;
  assessmentId?: string;
  userId?: string;
  enableRealtime?: boolean;
  children: React.ReactNode;
}

export function UnifiedMemoryProvider({
  masterPlanId,
  workspaceId,
  assessmentId,
  userId,
  enableRealtime = false,
  children,
}: UnifiedMemoryProviderProps) {
  const [state, setState] = useState<UnifiedMemoryState>({
    masterPlan: null,
    crossContext: null,
    isLoading: true,
    isSyncing: false,
    error: null,
  });

  const config: UnifiedMemoryConfig = {
    masterPlanId,
    workspaceId,
    assessmentId,
    userId,
  };

  const supabase = createClient();

  // Fetch master plan data
  const fetchMasterPlan = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('client_master_plans')
        .select('*')
        .eq('id', masterPlanId)
        .single();

      if (error) throw error;
      
      setState(prev => ({ ...prev, masterPlan: data as MasterPlan, error: null }));
    } catch (err) {
      console.error('Error fetching master plan:', err);
      setState(prev => ({ ...prev, error: 'Failed to load master plan' }));
    }
  }, [masterPlanId, supabase]);

  // Fetch cross-assessment context
  const refreshContext = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await fetchCrossAssessmentContext(masterPlanId);
      
      if (result.success && result.context) {
        setState(prev => ({ 
          ...prev, 
          crossContext: result.context as CrossAssessmentContext,
          isLoading: false,
          error: null 
        }));
      } else {
        throw new Error(result.error || 'Failed to fetch context');
      }
    } catch (err) {
      console.error('Error fetching cross-assessment context:', err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }));
    }
  }, [masterPlanId]);

  // Initial load
  useEffect(() => {
    fetchMasterPlan();
    refreshContext();
  }, [fetchMasterPlan, refreshContext]);

  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime) return;

    const subscription = supabase
      .channel(`unified-memory-${masterPlanId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'unified_client_responses',
          filter: `master_plan_id=eq.${masterPlanId}`,
        },
        () => {
          refreshContext();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_insights',
          filter: `master_plan_id=eq.${masterPlanId}`,
        },
        () => {
          refreshContext();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_action_items',
          filter: `master_plan_id=eq.${masterPlanId}`,
        },
        () => {
          refreshContext();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [enableRealtime, masterPlanId, supabase, refreshContext]);

  // Sync a single response
  const syncResponse = useCallback(async (data: ResponseData): Promise<boolean> => {
    setState(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const result = await syncResponseToUnifiedMemory(config, data);
      
      if (result.success) {
        // Refresh context to show updated data
        await refreshContext();
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error syncing response:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to sync response' 
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [config, refreshContext]);

  // Sync domain scores
  const syncScores = useCallback(async (domainScores: DomainScoreData[]): Promise<boolean> => {
    setState(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const result = await syncScoresToUnifiedMemory(config, domainScores);
      
      if (result.success) {
        await fetchMasterPlan();
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error syncing scores:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to sync scores' 
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [config, fetchMasterPlan]);

  // Create an insight
  const createInsight = useCallback(async (data: InsightData): Promise<string | null> => {
    try {
      const result = await createInsightInUnifiedMemory(config, data);
      
      if (result.success && result.insightId) {
        await refreshContext();
        return result.insightId;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error creating insight:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to create insight' 
      }));
      return null;
    }
  }, [config, refreshContext]);

  // Create an action item
  const createActionItem = useCallback(async (data: ActionItemData): Promise<string | null> => {
    try {
      const result = await createActionItemInUnifiedMemory(config, data);
      
      if (result.success && result.actionId) {
        await refreshContext();
        return result.actionId;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error creating action item:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to create action item' 
      }));
      return null;
    }
  }, [config, refreshContext]);

  // Auto-generate action items for low-scoring domains
  const autoGenerateActions = useCallback(async (threshold = 60): Promise<number> => {
    try {
      const result = await autoGenerateActionItems(config, threshold);
      
      if (result.success) {
        await refreshContext();
        return result.actionsCreated;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error auto-generating actions:', err);
      return 0;
    }
  }, [config, refreshContext]);

  const value: UnifiedMemoryContextValue = {
    ...state,
    config,
    syncResponse,
    syncScores,
    createInsight,
    createActionItem,
    autoGenerateActions,
    refreshContext,
  };

  return (
    <UnifiedMemoryContext.Provider value={value}>
      {children}
    </UnifiedMemoryContext.Provider>
  );
}

export function useUnifiedMemoryContext(): UnifiedMemoryContextValue {
  const context = useContext(UnifiedMemoryContext);
  if (!context) {
    throw new Error('useUnifiedMemoryContext must be used within a UnifiedMemoryProvider');
  }
  return context;
}

// Convenience hook for components that just need to sync responses
export function useUnifiedResponse(config: UnifiedMemoryConfig) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async (data: ResponseData): Promise<boolean> => {
    setIsSyncing(true);
    setError(null);
    
    try {
      const result = await syncResponseToUnifiedMemory(config, data);
      
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'Failed to sync');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [config]);

  return { sync, isSyncing, error };
}

// Hook for fetching previous responses
export function usePreviousResponses(
  masterPlanId: string,
  assessmentType?: string
) {
  const [responses, setResponses] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchResponses() {
      try {
        setIsLoading(true);
        
        let query = supabase
          .from('unified_client_responses')
          .select('*')
          .eq('master_plan_id', masterPlanId);
        
        if (assessmentType) {
          query = query.eq('assessment_type', assessmentType);
        }
        
        const { data, error: fetchError } = await query.order('answered_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        setResponses(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch responses');
      } finally {
        setIsLoading(false);
      }
    }

    if (masterPlanId) {
      fetchResponses();
    }
  }, [masterPlanId, assessmentType, supabase]);

  return { responses, isLoading, error };
}
