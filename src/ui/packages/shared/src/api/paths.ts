/** Relative API paths. The base URL already includes `/api`. */

export const authPaths = {
  login: "/auth/login",
  register: "/auth/register",
  profile: "/auth/profile",
  logout: "/auth/logout",
} as const;

export const accountPaths = {
  info: "/account/info",
  upgrade: "/account/upgrade",
  downgrade: "/account/downgrade",
  role: "/account/role",
} as const;

export const usersPaths = {
  profile: "/users/profile",
  avatarUploadUrl: "/users/avatar/upload-url",
  avatarComplete: "/users/avatar/complete",
  avatarReadUrl: (userId: string) => `/users/${userId}/avatar/url`,
  search: "/users/search",
  recommendations: "/users/recommendations",
  profileVisitors: "/users/profile/visitors",
  byId: (id: string) => `/users/${id}`,
} as const;

export const statsPaths = {
  me: "/stats/me",
  user: (userId: string) => `/stats/user/${userId}`,
  refresh: "/stats/refresh",
  refreshAll: "/stats/refresh/all",
  updateStatus: "/stats/update-status",
} as const;

export const mediaPaths = {
  videoUploadUrl: "/media/video/upload-url",
  videoComplete: "/media/video/complete",
  videos: "/media/videos",
  videosForUser: (userId: string) => `/media/videos/${userId}`,
  readUrl: (mediaId: string) => `/media/${mediaId}/url`,
  deleteVideo: (videoId: string) => `/media/video/${videoId}`,
} as const;

export const billingPaths = {
  checkoutSession: "/billing/checkout-session",
  portalSession: "/billing/portal-session",
} as const;

export const connectionsPaths = {
  list: "/connections",
  send: "/connections/send",
  respond: (connectionId: string) => `/connections/${connectionId}/respond`,
  requests: "/connections/requests",
} as const;

export const followPaths = {
  follow: (userId: string) => `/follow/${userId}/follow`,
  unfollow: (userId: string) => `/follow/${userId}/unfollow`,
  followers: (userId: string) => `/follow/${userId}/followers`,
  following: (userId: string) => `/follow/${userId}/following`,
  status: (userId: string) => `/follow/${userId}/status`,
  stats: (userId: string) => `/follow/${userId}/stats`,
} as const;

export const messagesPaths = {
  send: "/messages",
  conversations: "/messages/conversations",
  conversation: (otherUserId: string) => `/messages/conversation/${otherUserId}`,
  read: (otherUserId: string) => `/messages/read/${otherUserId}`,
} as const;

export const adminPaths = {
  users: "/admin/users",
  userStatus: (userId: string) => `/admin/users/${userId}/status`,
  userById: (userId: string) => `/admin/users/${userId}`,
  stats: "/admin/stats",
  playerClaims: "/admin/player-claims",
  playerClaimApprove: (claimId: string) =>
    `/admin/player-claims/${claimId}/approve`,
  playerClaimReject: (claimId: string) =>
    `/admin/player-claims/${claimId}/reject`,
  playerClaimRequestInfo: (claimId: string) =>
    `/admin/player-claims/${claimId}/request-info`,
  playerClaimEvidenceReadUrl: (claimId: string, evidenceId: string) =>
    `/admin/player-claims/${claimId}/evidence/${evidenceId}/url`,
} as const;

export const playerIdentityPaths = {
  search: "/player-identity/search",
  claims: "/player-identity/claims",
  claimsMe: "/player-identity/claims/me",
  evidenceUploadUrl: "/player-identity/claims/me/evidence/upload-url",
  evidenceComplete: "/player-identity/claims/me/evidence/complete",
  evidenceLink: "/player-identity/claims/me/evidence/link",
} as const;
