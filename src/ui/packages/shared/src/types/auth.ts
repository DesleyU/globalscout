export interface AuthProfileDto {
  firstName: string;
  lastName: string;
  position?: string | null;
  age?: number | null;
  clubName?: string | null;
}

export interface AuthUserDto {
  id: string;
  email: string;
  role: string;
  accountType?: string;
  status?: string;
  profile: AuthProfileDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUserDto;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  message: string;
  token: string;
  user: AuthUserDto;
}

export interface AuthProfileResponse {
  user: AuthUserDto;
}

export interface LogoutResponse {
  message: string;
}
