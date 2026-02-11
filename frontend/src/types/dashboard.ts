export interface ActivityAnalytics {
  activityId: string;
  activityName: string;
  activityDescription: string;
  completionHistory: boolean[];
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  effortScore: number;
  monthlyProgress: number;
  isCompletedToday: boolean;
}

export interface DashboardResponse {
  year: number;
  month: number;
  daysInMonth: number;
  currentDay: number;
  activities: ActivityAnalytics[];
}

export interface UpdateActivityStatusRequest {
  date: string;
  isCompleted: boolean;
}

export interface ActivityLogResponse {
  id: string;
  activityId: string;
  date: string;
  isCompleted: boolean;
  createdAt: string;
}