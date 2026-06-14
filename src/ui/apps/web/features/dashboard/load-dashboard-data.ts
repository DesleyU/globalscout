import type { AuthUserDto } from "@globalscout/shared";
import type {
  GetMyPlayerIdentityClaimResult,
  GetProfileVisitorsResult,
  PlayerStatisticsResponse,
} from "@globalscout/shared";
import { createPlayerIdentityApi } from "@/lib/api/player-identity";
import { createServerApiClient } from "@/lib/api/server";
import { createStatsApi } from "@/lib/api/stats";
import { createUsersApi } from "@/lib/api/users";
import { formatUserDisplayName } from "@/lib/auth/format-user-display";
import { parseSeasonStats } from "@/features/dashboard/parse-season-stats";

export type DashboardPlayerViewModel = {
  name: string;
  position: string;
  positionShort: string;
  club?: string | null;
  nationality?: string | null;
  age?: number | null;
  imageUrl?: string | null;
  profileViews?: number | null;
  stats: ReturnType<typeof parseSeasonStats>;
};

function toPositionShort(position?: string | null): string {
  const value = position?.trim().toLowerCase() ?? "";

  if (value.includes("forward") || value.includes("striker")) return "ST";
  if (value.includes("goalkeeper")) return "GK";
  if (value.includes("defender")) return "CB";
  if (value.includes("midfielder")) return "CM";
  if (value.includes("winger")) return "RW";

  return position?.slice(0, 2).toUpperCase() || "PL";
}

async function safeFetch<T>(fetcher: () => Promise<T>): Promise<T | null> {
  try {
    return await fetcher();
  } catch {
    return null;
  }
}

export async function fetchMyClaim(): Promise<GetMyPlayerIdentityClaimResult | null> {
  const client = await createServerApiClient();
  return safeFetch(() => createPlayerIdentityApi(client).getMyClaim());
}

export async function fetchMyStats(): Promise<PlayerStatisticsResponse | null> {
  const client = await createServerApiClient();
  return safeFetch(() => createStatsApi(client).getMyStats());
}

export async function fetchProfileVisitors(): Promise<GetProfileVisitorsResult | null> {
  const client = await createServerApiClient();
  return safeFetch(() => createUsersApi(client).getProfileVisitors());
}

export function buildDashboardPlayerViewModel({
  user,
  claimResult,
  statsResult,
  visitorsResult,
}: {
  user: AuthUserDto;
  claimResult?: GetMyPlayerIdentityClaimResult | null;
  statsResult?: PlayerStatisticsResponse | null;
  visitorsResult?: GetProfileVisitorsResult | null;
}): DashboardPlayerViewModel {
  const claim = claimResult?.claim;
  const position =
    claim?.position ?? user.profile?.position ?? "Player";

  return {
    name: formatUserDisplayName(user),
    position,
    positionShort: toPositionShort(position),
    club: claim?.currentClub ?? user.profile?.clubName ?? null,
    nationality: claim?.nationality ?? null,
    age: claim?.candidateAge ?? user.profile?.age ?? null,
    imageUrl: claim?.candidatePhotoUrl ?? null,
    profileViews: visitorsResult?.totalVisitors ?? null,
    stats: parseSeasonStats(statsResult?.data),
  };
}
