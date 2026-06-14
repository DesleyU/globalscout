import {
  accountPaths,
  type AccountTypeChangeResponse,
  type ApiTransport,
  type GetAccountInfoResponse,
  type SetAccountRoleRequest,
  type SetAccountRoleResponse,
} from "@globalscout/shared";

export function createAccountApi(client: ApiTransport) {
  return {
    getInfo() {
      return client.get<GetAccountInfoResponse>(accountPaths.info);
    },

    upgrade() {
      return client.post<AccountTypeChangeResponse>(accountPaths.upgrade);
    },

    downgrade() {
      return client.post<AccountTypeChangeResponse>(accountPaths.downgrade);
    },

    setRole(body: SetAccountRoleRequest) {
      return client.post<SetAccountRoleResponse>(accountPaths.role, body);
    },
  };
}

export type AccountApi = ReturnType<typeof createAccountApi>;
