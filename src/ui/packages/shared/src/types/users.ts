export interface UserProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  bio?: string | null;
  position?: string | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  nationality?: string | null;
  clubName?: string | null;
  clubLogo?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  country?: string | null;
  city?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersFullProfileResult {
  user: {
    id: string;
    email: string;
    role: string;
    accountType: string;
    profile: UserProfileDto;
  };
}

export interface PublicUserProfile {
  id: string;
  role: string;
  accountType: string;
  profile: UserProfileDto;
  subscriptionTier?: string;
}

export interface GetUserByIdResponse {
  user: PublicUserProfile;
}

export interface SearchUserItem {
  id: string;
  role: string;
  accountType: string;
  profile: UserProfileDto | null;
}

export interface SearchUsersResult {
  users: SearchUserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SearchUsersParams {
  q?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface GetUserRecommendationsResult {
  recommendations: SearchUserItem[];
}

export interface VisitorTypeCount {
  type: string;
  count: number;
}

export interface VisitorProfileSnippet {
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  clubName?: string | null;
}

export interface VisitorSummary {
  id: string;
  role: string;
  profile: VisitorProfileSnippet;
}

export interface ProfileVisitorEntry {
  id: string;
  visitorType: string;
  visitedAt: string;
  visitor: VisitorSummary;
}

export interface GetProfileVisitorsResult {
  tier: string;
  message?: string | null;
  stats: VisitorTypeCount[];
  totalVisitors: number;
  visitors?: ProfileVisitorEntry[] | null;
}

export interface InitiateAvatarUploadRequest {
  fileName: string;
  contentType: string;
  contentLength: number;
}

export interface CompleteAvatarUploadRequest {
  storageKey: string;
}

export interface UploadUserAvatarResult {
  message: string;
  avatar: string;
  profile: UserProfileDto;
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string | null;
  position?: string | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  nationality?: string | null;
  clubName?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  country?: string | null;
  city?: string | null;
}
