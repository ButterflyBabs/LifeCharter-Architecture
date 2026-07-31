/**
 * Cross Assessment Sidebar Component
 * 
 * Shows context from Brain and Soul assessments while taking Profit assessment.
 */

'use client';

import { useUnifiedMemoryContext } from './UnifiedMemoryProvider';
import type { UnifiedResponse, ClientInsight, ActionItem } from '@/lib/unified-memory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Brain, Heart, TrendingUp, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';

interface CrossAssessmentSidebarProps {
  currentSection?: string;
  className?: string;
}

export function CrossAssessmentSidebar({
  currentSection,
  className = '',
}: CrossAssessmentSidebarProps) {
  const { crossContext, masterPlan, isLoading } = useUnifiedMemoryContext();

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const brainResponses = crossContext?.brainResponses || [];
  const soulResponses = crossContext?.soulResponses || [];
  const insights = crossContext?.insights || [];
  const actionItems = crossContext?.actionItems || [];

  // Filter responses related to current section
  const relatedBrainResponses = currentSection 
    ? brainResponses.filter((r: UnifiedResponse) => 
        r.section_type?.toLowerCase().includes(currentSection.toLowerCase()) ||
        r.question_text?.toLowerCase().includes(currentSection.toLowerCase())
      )
    : brainResponses.slice(0, 3);

  const relatedSoulResponses = currentSection
    ? soulResponses.filter((r: UnifiedResponse) =>
        r.section_type?.toLowerCase().includes(currentSection.toLowerCase()) ||
        r.question_text?.toLowerCase().includes(currentSection.toLowerCase())
      )
    : soulResponses.slice(0, 3);

  // Get relevant insights
  const relevantInsights = insights.slice(0, 3);

  // Get pending action items
  const pendingActions = actionItems
    .filter((a: ActionItem) => a.status === 'pending' || a.status === 'in_progress')
    .slice(0, 3);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Progress */}
      {masterPlan && (
        <Card className="border-[#c9a227]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-[#c9a227]" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#b8a898]">Overall Alignment</span>
              <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                {masterPlan.overall_alignment_score || 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#e8e4f0]/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c9a227] transition-all duration-500"
                style={{ width: `${masterPlan.overall_alignment_score || 0}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-[#4a9b9b] font-medium">{masterPlan.brain_score || 0}%</div>
                <div className="text-[#b8a898]">Brain</div>
              </div>
              <div>
                <div className="text-[#7b6b8d] font-medium">{masterPlan.soul_score || 0}%</div>
                <div className="text-[#b8a898]">Soul</div>
              </div>
              <div>
                <div className="text-[#c9a227] font-medium">{masterPlan.profit_score || 0}%</div>
                <div className="text-[#b8a898]">Profit</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brain Context */}
      {relatedBrainResponses.length > 0 && (
        <Card className="border-[#4a9b9b]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4 text-[#4a9b9b]" />
              From Brain Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatedBrainResponses.slice(0, 2).map((response: UnifiedResponse) => (
              <div key={response.id} className="text-sm">
                <p className="text-[#b8a898] text-xs mb-1 line-clamp-2">{response.question_text}</p>
                <p className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
                  {typeof response.answer_value === 'string' 
                    ? response.answer_value 
                    : JSON.stringify(response.answer_value)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Soul Context */}
      {relatedSoulResponses.length > 0 && (
        <Card className="border-[#7b6b8d]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-[#7b6b8d]" />
              From Soul Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatedSoulResponses.slice(0, 2).map((response: UnifiedResponse) => (
              <div key={response.id} className="text-sm">
                <p className="text-[#b8a898] text-xs mb-1 line-clamp-2">{response.question_text}</p>
                <p className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
                  {typeof response.answer_value === 'string'
                    ? response.answer_value
                    : JSON.stringify(response.answer_value)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {relevantInsights.length > 0 && (
        <Card className="border-[#c9a227]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="w-4 h-4 text-[#c9a227]" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relevantInsights.map((insight: ClientInsight) => (
              <div key={insight.id} className="text-sm">
                <div className="flex items-start gap-2">
                  {insight.priority === 'critical' || insight.priority === 'high' ? (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Lightbulb className="w-4 h-4 text-[#c9a227] flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{insight.title}</p>
                    <p className="text-[#b8a898] text-xs line-clamp-2">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {pendingActions.length > 0 && (
        <Card className="border-[#4a9b9b]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#4a9b9b]" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingActions.map((action: ActionItem) => (
              <div key={action.id} className="text-sm">
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    action.priority === 'critical' ? 'bg-red-500' :
                    action.priority === 'high' ? 'bg-orange-500' :
                    action.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{action.title}</p>
                    {action.description && (
                      <p className="text-[#b8a898] text-xs line-clamp-2">{action.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!relatedBrainResponses.length && !relatedSoulResponses.length && !relevantInsights.length && !pendingActions.length && (
        <Card className="border-[#c9a227]/20">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#c9a227]/10 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-[#c9a227]" />
            </div>
            <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] font-medium mb-1">
              Building Your Profile
            </p>
            <p className="text-xs text-[#b8a898]">
              As you complete assessments, insights from Brain and Soul will appear here to provide context.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
