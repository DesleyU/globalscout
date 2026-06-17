import type { AuthUserDto } from "./auth";

export interface AccountLimits {
  [key: string]: unknown;
}

export interface AccountInfo {
  id: string;
  email: string;
  accountType: string;
  createdAt: string;
  limits: AccountLimits;
}

export interface GetAccountInfoResponse {
  success: boolean;
  data: AccountInfo;
}

export interface AccountTypeChangeResponse {
  accountType: string;
}

export interface SetAccountRoleRequest {
  role: string;
}

export interface SetAccountRoleResponse {
  token: string;
  user: AuthUserDto;
}
