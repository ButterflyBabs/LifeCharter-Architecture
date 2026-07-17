/**
 * Business Plan Health Calculations
 * Real data from Finance, Sales, Operations → Health Scores
 */

export interface MonthlyReviewData {
  // Finance
  revenue: number;
  expenses: number;
  revenue_goal: number;
  cash_in_bank: number;
  // Sales
  new_clients: number;
  total_clients: number;
  leads: number;
  conversion_rate: number;
  // Operations
  hours_worked: number;
  target_hours: number;
  sops_created: number;
  delegated_tasks: number;
  // Goals
  goal_progress: number;
}

export interface HealthScores {
  overall: number;
  vision: number;
  revenue: number;
  systems: number;
}

/**
 * Calculate Revenue Health from actual financial data
 * NOT from theoretical assessment scores
 */
export function calculateRevenueHealth(
  data: MonthlyReviewData
): number {
  // 1. Revenue vs Goal (40% weight)
  const revenueAchievement = Math.min(
    (data.revenue / Math.max(data.revenue_goal, 1)) * 100,
    150 // Cap at 150% to prevent skewing
  );
  const revenueScore = Math.min(revenueAchievement, 100);

  // 2. Profit Margin (30% weight)
  const profit = data.revenue - data.expenses;
  const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
  // Target: 40% margin = 100 points
  const marginScore = Math.min((margin / 40) * 100, 100);

  // 3. Cash Runway (20% weight)
  // Target: 12 months = 100 points
  const monthlyExpenses = Math.max(data.expenses, 1000); // Minimum baseline
  const runwayMonths = data.cash_in_bank / monthlyExpenses;
  const runwayScore = Math.min((runwayMonths / 12) * 100, 100);

  // 4. Growth Trend (10% weight) - simplified
  // For now, assume stable if we have data
  const growthScore = revenueScore >= 80 ? 100 : revenueScore;

  // Weighted average
  const health =
    revenueScore * 0.4 +
    marginScore * 0.3 +
    runwayScore * 0.2 +
    growthScore * 0.1;

  return Math.round(health);
}

/**
 * Calculate Systems Strength from actual operations data
 * NOT from theoretical assessment scores
 */
export function calculateSystemsHealth(data: MonthlyReviewData): number {
  // 1. Delegation Ratio (35% weight)
  // Compare hours worked vs target - working less = more delegated/systematized
  const delegationRatio =
    data.target_hours > 0
      ? Math.max(0, (1 - data.hours_worked / data.target_hours) * 100)
      : 0;
  // Invert: if working 45 hrs vs 35 target = 22% "overwork" = 78% delegation score
  const delegationScore = Math.max(0, 100 - delegationRatio);

  // 2. Hours Efficiency (25% weight)
  // Working within target hours = good systems
  const hoursEfficiency =
    data.target_hours > 0
      ? Math.min((data.target_hours / Math.max(data.hours_worked, 1)) * 100, 100)
      : 50;

  // 3. Documentation (25% weight)
  // Target: 20 SOPs = fully documented
  const sopScore = Math.min((data.sops_created / 20) * 100, 100);

  // 4. Delegation Activity (15% weight)
  // Tasks delegated this month - target 20
  const taskScore = Math.min((data.delegated_tasks / 20) * 100, 100);

  // Weighted average
  const health =
    delegationScore * 0.35 +
    hoursEfficiency * 0.25 +
    sopScore * 0.25 +
    taskScore * 0.15;

  return Math.round(health);
}

/**
 * Calculate Vision Alignment
 * This CAN use assessment data since it's about alignment/purpose
 */
export function calculateVisionHealth(
  soulAssessmentScore: number,
  businessPlanCompleteness: number
): number {
  // 80% from Soul Assessment (purpose, values, alignment)
  // 20% from Business Plan (vision documented)
  const health = soulAssessmentScore * 0.8 + businessPlanCompleteness * 0.2;
  return Math.round(health);
}

/**
 * Calculate Overall Business Health
 */
export function calculateOverallHealth(
  revenueHealth: number,
  systemsHealth: number,
  visionHealth: number
): number {
  // Revenue and Systems are based on ACTUAL data
  // Vision is based on alignment (still important but weighted less)
  const health = revenueHealth * 0.4 + systemsHealth * 0.35 + visionHealth * 0.25;
  return Math.round(health);
}

/**
 * Get health status label and color
 */
export function getHealthStatus(health: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (health >= 80) {
    return { label: "Thriving", color: "text-green-500", bgColor: "bg-green-500" };
  } else if (health >= 60) {
    return { label: "Healthy", color: "text-[#84cc16]", bgColor: "bg-[#84cc16]" };
  } else if (health >= 40) {
    return { label: "Building", color: "text-yellow-500", bgColor: "bg-yellow-500" };
  } else if (health >= 20) {
    return { label: "Challenged", color: "text-orange-500", bgColor: "bg-orange-500" };
  } else {
    return { label: "Critical", color: "text-red-500", bgColor: "bg-red-500" };
  }
}

/**
 * Calculate variance from goal
 */
export function calculateVariance(actual: number, goal: number): {
  amount: number;
  percent: number;
  status: "ahead" | "behind" | "on_track";
} {
  const diff = actual - goal;
  const percent = goal > 0 ? (diff / goal) * 100 : 0;

  let status: "ahead" | "behind" | "on_track";
  if (percent > 5) status = "ahead";
  else if (percent < -5) status = "behind";
  else status = "on_track";

  return { amount: diff, percent, status };
}
