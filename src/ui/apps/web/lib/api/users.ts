import {
  usersPaths,
  type ApiTransport,
  type CompleteAvatarUploadRequest,
  type GetProfileVisitorsResult,
  type GetUserByIdResponse,
  type GetUserRecommendationsResult,
  type InitiateAvatarUploadRequest,
  type PresignedReadUrlResult,
  type PresignedUploadResult,
  type SearchUsersParams,
  type SearchUsersResult,
  type UpdateUserProfileRequest,
  type UploadUserAvatarResult,
  type UsersFullProfileResult,
} from "@globalscout/shared";

function toSearchParams(params: SearchUsersParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.role) search.set("role", params.role);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function createUsersApi(client: ApiTransport) {
  return {
    getProfile() {
      return client.get<UsersFullProfileResult>(usersPaths.profile);
    },

    updateProfile(body: UpdateUserProfileRequest) {
      return client.put<UsersFullProfileResult>(usersPaths.profile, body);
    },

    initiateAvatarUpload(body: InitiateAvatarUploadRequest) {
      return client.post<PresignedUploadResult>(
        usersPaths.avatarUploadUrl,
        body,
      );
    },

    completeAvatarUpload(body: CompleteAvatarUploadRequest) {
      return client.post<UploadUserAvatarResult>(
        usersPaths.avatarComplete,
        body,
      );
    },

    getAvatarUrl(userId: string) {
      return client.get<PresignedReadUrlResult>(
        usersPaths.avatarReadUrl(userId),
      );
    },

    searchUsers(params: SearchUsersParams = {}) {
      return client.get<SearchUsersResult>(
        `${usersPaths.search}${toSearchParams(params)}`,
      );
    },

    getRecommendations() {
      return client.get<GetUserRecommendationsResult>(
        usersPaths.recommendations,
      );
    },

    getUserById(id: string) {
      return client.get<GetUserByIdResponse>(usersPaths.byId(id));
    },

    getProfileVisitors() {
      return client.get<GetProfileVisitorsResult>(usersPaths.profileVisitors);
    },
  };
}

export type UsersApi = ReturnType<typeof createUsersApi>;
