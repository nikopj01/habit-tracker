import api from './api';
import type { Activity, ActivityListResponse, CreateActivityRequest, UpdateActivityRequest } from '../types/activity';

export const activityService = {
  getActivities: async (isActive?: boolean): Promise<ActivityListResponse> => {
    const params = isActive !== undefined ? { isActive } : {};
    const response = await api.get<ActivityListResponse>('/activities', { params });
    return response.data;
  },

  getActivity: async (id: string): Promise<Activity> => {
    const response = await api.get<Activity>(`/activities/${id}`);
    return response.data;
  },

  createActivity: async (data: CreateActivityRequest): Promise<Activity> => {
    const response = await api.post<Activity>('/activities', data);
    return response.data;
  },

  updateActivity: async (id: string, data: UpdateActivityRequest): Promise<Activity> => {
    const response = await api.put<Activity>(`/activities/${id}`, data);
    return response.data;
  },

  archiveActivity: async (id: string): Promise<void> => {
    await api.delete(`/activities/${id}`);
  },

  restoreActivity: async (id: string): Promise<void> => {
    await api.post(`/activities/${id}/restore`);
  },
};