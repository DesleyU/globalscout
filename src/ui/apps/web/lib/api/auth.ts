import {
  authPaths,
  type ApiTransport,
  type AuthProfileResponse,
  type LoginRequest,
  type LoginResponse,
  type LogoutResponse,
  type RegisterRequest,
  type RegisterResponse,
} from "@globalscout/shared";

export function createAuthApi(client: ApiTransport) {
  return {
    login(body: LoginRequest) {
      return client.post<LoginResponse>(authPaths.login, body);
    },

    register(body: RegisterRequest) {
      return client.post<RegisterResponse>(authPaths.register, body);
    },

    getProfile() {
      return client.get<AuthProfileResponse>(authPaths.profile);
    },

    logout() {
      return client.post<LogoutResponse>(authPaths.logout);
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
