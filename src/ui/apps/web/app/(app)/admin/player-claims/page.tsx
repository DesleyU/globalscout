import type { Metadata } from "next";
import { PlayerClaimsPageClient } from "@/features/admin/player-claims/player-claims-page-client";
import { DEFAULT_PLAYER_CLAIMS_FILTERS } from "@/features/admin/player-claims/constants";
import { createAdminApi } from "@/lib/api/admin";
import { createServerApiClient } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Player Claims",
};

export default async function AdminPlayerClaimsPage() {
  const client = await createServerApiClient();
  const result = await createAdminApi(client).listPlayerClaims(
    DEFAULT_PLAYER_CLAIMS_FILTERS,
  );

  return (
    <PlayerClaimsPageClient
      initialData={result}
      initialFilters={DEFAULT_PLAYER_CLAIMS_FILTERS}
    />
  );
}
