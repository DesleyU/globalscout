import {
  authPaths,
  type ApiTransport,
  type AuthProfileResponse,
  type ExternalExchangeRequest,
  type ExternalExchangeResponse,
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

    exchangeExternalCode(body: ExternalExchangeRequest) {
      return client.post<ExternalExchangeResponse>(authPaths.externalExchange, body);
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
