export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  force_password_change: boolean;
  user: User;
}

export interface User {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role_id: number;
  role: {
    role_id: number;
    role_name: string;
    description?: string;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}