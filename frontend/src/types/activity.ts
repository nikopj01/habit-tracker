export interface Activity {
  id: string;
  name: string;
  description: string;
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
}

export interface UpdateActivityRequest {
  name: string;
  description: string;
}