/**
 * Unified Memory Question Component
 * 
 * A question component that automatically syncs responses to unified memory.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUnifiedMemoryContext } from './UnifiedMemoryProvider';
import { syncResponseToUnifiedMemory } from '@/lib/unified-memory';
import type { ResponseData, UnifiedResponse } from '@/lib/unified-memory';

interface UnifiedMemoryQuestionProps {
  masterPlanId: string;
  workspaceId: string;
  assessmentId?: string;
  questionId: string;
  questionText: string;
  sectionName?: string;
  sectionType?: string;
  questionType: 'text' | 'number' | 'select' | 'multiselect' | 'scale' | 'boolean' | 'textarea' | 'radio';
  options?: Array<{ value: string; label: string; score?: number }>;
  maxScore?: number;
  required?: boolean;
  helpText?: string;
  showCrossContext?: boolean;
  onSyncComplete?: (success: boolean) => void;
  className?: string;
}

export function UnifiedMemoryQuestion({
  masterPlanId,
  workspaceId,
  assessmentId,
  questionId,
  questionText,
  sectionName,
  sectionType,
  questionType,
  options,
  maxScore = 100,
  required = false,
  helpText,
  showCrossContext = true,
  onSyncComplete,
  className = '',
}: UnifiedMemoryQuestionProps) {
  const [value, setValue] = useState<string | string[]>('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const { crossContext } = useUnifiedMemoryContext();

  // Look for previous responses to this question or related questions
  const previousResponses = crossContext?.profitResponses?.filter(
    (r: UnifiedResponse) => r.question_id === questionId || r.section_type === sectionType
  ) || [];

  const hasPreviousResponse = previousResponses.length > 0;

  // Calculate score based on answer
  const calculateScore = useCallback((answerValue: string | string[]): number => {
    if (questionType === 'scale' && options) {
      const selectedOption = options.find(o => o.value === answerValue);
      return selectedOption?.score ?? (parseInt(answerValue as string, 10) || 0);
    }
    if (questionType === 'select' && options) {
      const selectedOption = options.find(o => o.value === answerValue);
      return selectedOption?.score ?? (maxScore / 2);
    }
    // Default scoring for other types
    return maxScore / 2;
  }, [questionType, options, maxScore]);

  // Determine sentiment based on score
  const determineSentiment = useCallback((score: number): 'positive' | 'neutral' | 'negative' | 'concern' => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'positive';
    if (percentage >= 60) return 'neutral';
    if (percentage >= 40) return 'negative';
    return 'concern';
  }, [maxScore]);

  // Determine priority based on sentiment
  const determinePriority = useCallback((sentiment: string): 'critical' | 'high' | 'medium' | 'low' => {
    switch (sentiment) {
      case 'concern': return 'critical';
      case 'negative': return 'high';
      case 'neutral': return 'medium';
      case 'positive': return 'low';
      default: return 'medium';
    }
  }, []);

  // Sync response to unified memory
  const syncResponse = useCallback(async (answerValue: string | string[]) => {
    if (!answerValue || (Array.isArray(answerValue) && answerValue.length === 0)) {
      return;
    }

    setSyncStatus('syncing');
    setError(null);

    try {
      const score = calculateScore(answerValue);
      const sentiment = determineSentiment(score);
      const priority = determinePriority(sentiment);

      const responseData: ResponseData = {
        questionId,
        questionText,
        sectionName,
        sectionType,
        answerValue,
        answerText: Array.isArray(answerValue) 
          ? answerValue.map(v => options?.find(o => o.value === v)?.label || v).join(', ')
          : options?.find(o => o.value === answerValue)?.label || answerValue,
        score,
        maxScore,
        sentiment,
        priorityLevel: priority,
        extractedInsights: [],
        relatedResponseIds: [],
      };

      const result = await syncResponseToUnifiedMemory(
        { masterPlanId, workspaceId, assessmentId },
        responseData
      );

      if (result.success) {
        setSyncStatus('synced');
        onSyncComplete?.(true);
      } else {
        throw new Error(result.error || 'Failed to sync');
      }
    } catch (err) {
      console.error('Error syncing response:', err);
      setSyncStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to sync');
      onSyncComplete?.(false);
    } finally {
      // Sync complete
    }
  }, [masterPlanId, workspaceId, assessmentId, questionId, questionText, sectionName, sectionType, options, maxScore, calculateScore, determineSentiment, determinePriority, onSyncComplete]);

  // Debounced sync
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value) {
        syncResponse(value);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, syncResponse]);

  const handleChange = (newValue: string | string[]) => {
    setValue(newValue);
  };

  // Render different input types
  const renderInput = () => {
    switch (questionType) {
      case 'scale':
        return (
          <div className="space-y-3">
            {options?.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  value === option.value
                    ? 'border-[#D4AF63] bg-[#D4AF63]/5'
                    : 'border-[#D4AF63]/20 hover:border-[#D4AF63]/40'
                }`}
              >
                <input
                  type="radio"
                  name={questionId}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  className="w-4 h-4 text-[#D4AF63] focus:ring-[#D4AF63]"
                />
                <span className="text-[#1F315B] dark:text-[#F6F1E8]">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case 'select':
      case 'radio':
        return (
          <div className="space-y-3">
            {options?.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  value === option.value
                    ? 'border-[#D4AF63] bg-[#D4AF63]/5'
                    : 'border-[#D4AF63]/20 hover:border-[#D4AF63]/40'
                }`}
              >
                <input
                  type="radio"
                  name={questionId}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  className="mt-1 w-4 h-4 text-[#D4AF63] focus:ring-[#D4AF63]"
                />
                <span className="text-[#1F315B] dark:text-[#F6F1E8]">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case 'multiselect':
        return (
          <div className="space-y-3">
            {options?.map((option) => (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  Array.isArray(value) && value.includes(option.value)
                    ? 'border-[#D4AF63] bg-[#D4AF63]/5'
                    : 'border-[#D4AF63]/20 hover:border-[#D4AF63]/40'
                }`}
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleChange([...currentValue, option.value]);
                    } else {
                      handleChange(currentValue.filter(v => v !== option.value));
                    }
                  }}
                  className="mt-1 w-4 h-4 text-[#D4AF63] focus:ring-[#D4AF63] rounded"
                />
                <span className="text-[#1F315B] dark:text-[#F6F1E8]">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            className="w-full p-4 rounded-xl border-2 border-[#D4AF63]/20 focus:border-[#D4AF63] focus:ring-[#D4AF63] bg-transparent text-[#1F315B] dark:text-[#F6F1E8] resize-none"
            placeholder="Enter your response..."
          />
        );

      case 'boolean':
        return (
          <div className="flex gap-4">
            {[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  value === option.value
                    ? 'border-[#D4AF63] bg-[#D4AF63]/5'
                    : 'border-[#D4AF63]/20 hover:border-[#D4AF63]/40'
                }`}
              >
                <input
                  type="radio"
                  name={questionId}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  className="w-4 h-4 text-[#D4AF63] focus:ring-[#D4AF63]"
                />
                <span className="text-[#1F315B] dark:text-[#F6F1E8]">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full p-4 rounded-xl border-2 border-[#D4AF63]/20 focus:border-[#D4AF63] focus:ring-[#D4AF63] bg-transparent text-[#1F315B] dark:text-[#F6F1E8]"
            placeholder="Enter a number..."
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full p-4 rounded-xl border-2 border-[#D4AF63]/20 focus:border-[#D4AF63] focus:ring-[#D4AF63] bg-transparent text-[#1F315B] dark:text-[#F6F1E8]"
            placeholder="Enter your response..."
          />
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Question Text */}
      <div>
        <p className="text-lg font-medium text-[#1F315B] dark:text-[#F6F1E8]">
          {questionText}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
        {helpText && (
          <p className="text-sm text-[#B9A9A9] mt-1">{helpText}</p>
        )}
      </div>

      {/* Input */}
      {renderInput()}

      {/* Cross-Context Indicator */}
      {showCrossContext && hasPreviousResponse && (
        <div className="flex items-center gap-2 text-sm text-[#2E7C83]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Related responses available from other assessments</span>
        </div>
      )}

      {/* Sync Status */}
      <div className="flex items-center gap-2 text-xs">
        {syncStatus === 'syncing' && (
          <span className="text-[#B9A9A9]">Syncing...</span>
        )}
        {syncStatus === 'synced' && (
          <span className="text-green-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
        {syncStatus === 'error' && (
          <span className="text-red-500">Error: {error}</span>
        )}
      </div>
    </div>
  );
}
