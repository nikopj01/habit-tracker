import api from './api';
import type { AuthResponse, SignInRequest, SignUpRequest, UserProfile, SetNicknameRequest } from '../types/auth';

export const authService = {
  signUp: async (data: SignUpRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  signIn: async (data: SignInRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/profile');
    return response.data;
  },

  setNickname: async (data: SetNicknameRequest): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/users/profile', data);
    return response.data;
  },
};