import { withAdminApiClient } from "@/lib/api/admin-route";

type RouteContext = {
  params: Promise<{ claimId: string; evidenceId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { claimId, evidenceId } = await context.params;

  return withAdminApiClient((admin) =>
    admin.getEvidenceReadUrl(claimId, evidenceId),
  );
}
