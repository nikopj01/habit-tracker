import api from './api';
import type { DashboardResponse, ActivityAnalytics, UpdateActivityStatusRequest, ActivityLogResponse } from '../types/dashboard';

export const dashboardService = {
  getDashboard: async (year?: number, month?: number): Promise<DashboardResponse> => {
    const params: { year?: number; month?: number } = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    const response = await api.get<DashboardResponse>('/dashboard', { params });
    return response.data;
  },

  getActivityAnalytics: async (activityId: string, year?: number, month?: number): Promise<ActivityAnalytics> => {
    const params: { year?: number; month?: number } = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    const response = await api.get<ActivityAnalytics>(`/dashboard/activities/${activityId}/analytics`, { params });
    return response.data;
  },

  updateActivityStatus: async (activityId: string, data: UpdateActivityStatusRequest): Promise<ActivityLogResponse> => {
    const response = await api.put<ActivityLogResponse>(`/dashboard/activities/${activityId}/status`, data);
    return response.data;
  },
};