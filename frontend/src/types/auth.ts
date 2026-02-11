export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  requiresProfileSetup: boolean;
}

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
}

export interface SetNicknameRequest {
  nickname: string;
}