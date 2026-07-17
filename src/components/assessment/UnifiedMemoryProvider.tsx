/**
 * Unified Memory Provider Component
 * 
 * Wraps assessment pages with unified memory context.
 */

'use client';

import { UnifiedMemoryProvider as BaseProvider } from '@/lib/hooks/useUnifiedMemory';

interface UnifiedMemoryProviderProps {
  masterPlanId: string;
  workspaceId: string;
  assessmentId?: string;
  enableRealtime?: boolean;
  children: React.ReactNode;
}

export function UnifiedMemoryProvider({
  masterPlanId,
  workspaceId,
  assessmentId,
  enableRealtime = true,
  children,
}: UnifiedMemoryProviderProps) {
  return (
    <BaseProvider
      masterPlanId={masterPlanId}
      workspaceId={workspaceId}
      assessmentId={assessmentId}
      enableRealtime={enableRealtime}
    >
      {children}
    </BaseProvider>
  );
}

// Re-export the hook for convenience
export { useUnifiedMemoryContext } from '@/lib/hooks/useUnifiedMemory';
export type {
  UnifiedResponse,
  CrossAssessmentContext,
  MasterPlan,
  ClientInsight,
  ActionItem
} from '@/lib/hooks/useUnifiedMemory';
