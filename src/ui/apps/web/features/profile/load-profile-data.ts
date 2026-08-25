import type { UsersFullProfileResult } from "@globalscout/shared";
import { createServerApiClient } from "@/lib/api/server";
import { createUsersApi } from "@/lib/api/users";

export async function fetchMyFullProfile(): Promise<UsersFullProfileResult | null> {
  try {
    const client = await createServerApiClient();
    return await createUsersApi(client).getProfile();
  } catch {
    return null;
  }
}

export async function fetchMyAvatarUrl(userId: string): Promise<string | null> {
  try {
    const client = await createServerApiClient();
    const result = await createUsersApi(client).getAvatarUrl(userId);
    return result.url;
  } catch {
    return null;
  }
}
