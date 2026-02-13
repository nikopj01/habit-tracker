export interface Activity {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  archivedAt: string | null;
  createdAt: string;
}

export interface ActivityListResponse {
  activities: Activity[];
  totalCount: number;
  activeCount: number;
  remainingSlots: number;
}

export interface CreateActivityRequest {
  name: string;
  description: string;
  icon: string;
}

export interface UpdateActivityRequest {
  name: string;
  description: string;
  icon: string;
}

export interface MonthlyActivityPlanRequest {
  year: number;
  month: number;
  activityIds: string[];
}

export interface MonthlyActivityPlanItem {
  activityId: string;
  name: string;
  description: string;
  icon: string;
  isSelected: boolean;
  isArchived: boolean;
}

export interface MonthlyActivityPlanResponse {
  year: number;
  month: number;
  maxActivities: number;
  selectedCount: number;
  activities: MonthlyActivityPlanItem[];
}
