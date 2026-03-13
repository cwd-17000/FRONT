// Shared types matching the ReportingService response shapes.

export interface ReportingSummary {
  from: string;
  to: string;
  /** Map of GoalProgressStatus → count, e.g. { ACTIVE: 8, COMPLETED: 3 } */
  objectiveCountsByStatus: Record<string, number>;
  overallObjectiveCompletionPercent: number;
  averageKeyResultProgressPercent: number;
  totalObjectives: number;
}

export interface ProgressBucket {
  /** ISO date string of Monday that starts this 7-day bucket (YYYY-MM-DD) */
  bucketStartDate: string;
  /** Null when there were no check-ins in this bucket */
  averageKeyResultProgressPercent: number | null;
  objectivesCompletedCount: number;
}

export interface ProgressOverTimeData {
  from: string;
  to: string;
  buckets: ProgressBucket[];
}

export interface TeamComparisonItem {
  teamId: string;
  teamName: string;
  activeObjectivesCount: number;
  averageKeyResultProgressPercent: number;
  /** Goals whose most recent check-in is RED or YELLOW */
  atRiskObjectivesCount: number;
  totalObjectivesCount: number;
}

export interface CheckInSummary {
  progress: number;
  confidenceScore: number;
  statusColor: 'RED' | 'YELLOW' | 'GREEN';
  createdAt: string;
  note: string | null;
}

export interface KeyResultDetail {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number | null;
  unit: string | null;
  status: string;
  confidenceScore: number;
  checkIns: CheckInSummary[];
}

export interface ObjectiveDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  timeframe: string | null;
  category: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  currentValue: number;
  targetValue: number | null;
  unit: string | null;
  confidenceScore: number;
  owner: { firstName: string | null; lastName: string | null; email: string } | null;
  team: { id: string; name: string } | null;
  childGoals: KeyResultDetail[];
}

export interface ReportingFilters {
  teamId: string | null;
  from: string;
  to: string;
}

export interface Team {
  id: string;
  name: string;
}
