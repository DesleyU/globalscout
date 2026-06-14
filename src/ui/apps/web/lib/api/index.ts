import { createAccountApi } from "./account";
import { createAdminApi } from "./admin";
import { createAuthApi } from "./auth";
import { createBillingApi } from "./billing";
import { createWebApiClient, type WebApiClientOptions } from "./client";
import { createConnectionsApi } from "./connections";
import { createFollowApi } from "./follow";
import { createMediaApi } from "./media";
import { createMessagesApi } from "./messages";
import { createPlayerIdentityApi } from "./player-identity";
import { createStatsApi } from "./stats";
import { createUsersApi } from "./users";

export function createGlobalScoutApi(options: WebApiClientOptions = {}) {
  const client = createWebApiClient(options);

  return {
    client,
    auth: createAuthApi(client),
    account: createAccountApi(client),
    users: createUsersApi(client),
    stats: createStatsApi(client),
    media: createMediaApi(client),
    billing: createBillingApi(client),
    connections: createConnectionsApi(client),
    follow: createFollowApi(client),
    messages: createMessagesApi(client),
    admin: createAdminApi(client),
    playerIdentity: createPlayerIdentityApi(client),
  };
}

export type GlobalScoutApi = ReturnType<typeof createGlobalScoutApi>;

export { createWebApiClient, type ApiTransport, type WebApiClientOptions } from "./client";
export { createServerApiClient, AUTH_TOKEN_COOKIE } from "./server";
export { createAuthApi, type AuthApi } from "./auth";
export { createAccountApi, type AccountApi } from "./account";
export { createUsersApi, type UsersApi } from "./users";
export { createStatsApi, type StatsApi } from "./stats";
export { createMediaApi, type MediaApi } from "./media";
export { createBillingApi, type BillingApi } from "./billing";
export { createConnectionsApi, type ConnectionsApi } from "./connections";
export { createFollowApi, type FollowApi } from "./follow";
export { createMessagesApi, type MessagesApi } from "./messages";
export { createAdminApi, type AdminApi } from "./admin";
export {
  createPlayerIdentityApi,
  type PlayerIdentityApi,
} from "./player-identity";
