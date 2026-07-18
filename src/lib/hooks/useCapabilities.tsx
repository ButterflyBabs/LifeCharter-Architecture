/**
 * useCapabilities Hook
 * Check and enforce plan capabilities
 */

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Capabilities {
  seats: number;
  workspaces: number;
  ai_actions_per_month: number;
  automations: number;
  modules: string[];
  features: string[];
}

export function useCapabilities() {
  const supabase = createClient();

  const getCapabilities = useCallback(async (): Promise<Capabilities | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .rpc("get_user_capabilities", { p_user_id: user.id });

    if (error) {
      console.error("Error getting capabilities:", error);
      return null;
    }

    return data as Capabilities;
  }, [supabase]);

  const checkCapability = useCallback(async (
    capability: string,
    amount: number = 1
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc("check_capability", {
        p_user_id: user.id,
        p_capability: capability,
        p_amount: amount,
      });

    if (error) {
      console.error("Error checking capability:", error);
      return false;
    }

    return data as boolean;
  }, [supabase]);

  const incrementUsage = useCallback(async (
    capability: string,
    amount: number = 1
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .rpc("increment_capability_usage", {
        p_user_id: user.id,
        p_capability: capability,
        p_amount: amount,
      });

    if (error) {
      console.error("Error incrementing usage:", error);
      return false;
    }

    return data as boolean;
  }, [supabase]);

  const canUseAI = useCallback(async (): Promise<boolean> => {
    return checkCapability("ai_actions_per_month", 1);
  }, [checkCapability]);

  const canCreateWorkspace = useCallback(async (): Promise<boolean> => {
    return checkCapability("workspaces", 1);
  }, [checkCapability]);

  const canAddTeamMember = useCallback(async (): Promise<boolean> => {
    return checkCapability("seats", 1);
  }, [checkCapability]);

  const canEnableAutomation = useCallback(async (): Promise<boolean> => {
    return checkCapability("automations", 1);
  }, [checkCapability]);

  const hasModule = useCallback(async (module: string): Promise<boolean> => {
    const caps = await getCapabilities();
    if (!caps) return false;
    return caps.modules.includes(module);
  }, [getCapabilities]);

  const hasFeature = useCallback(async (feature: string): Promise<boolean> => {
    const caps = await getCapabilities();
    if (!caps) return false;
    return caps.features.includes(feature);
  }, [getCapabilities]);

  return {
    getCapabilities,
    checkCapability,
    incrementUsage,
    canUseAI,
    canCreateWorkspace,
    canAddTeamMember,
    canEnableAutomation,
    hasModule,
    hasFeature,
  };
}
