import { isApiError, type PublicUserProfile } from "@globalscout/shared";
import { createServerApiClient } from "@/lib/api/server";
import { createUsersApi } from "@/lib/api/users";

/** Fetches another user's public profile (tier-masked server-side). Returns null if not found. */
export async function fetchPublicUserProfile(id: string): Promise<PublicUserProfile | null> {
  try {
    const client = await createServerApiClient();
    const result = await createUsersApi(client).getUserById(id);
    return result.user;
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }
    throw error;
  }
}
