import type { AuthUserDto } from "@globalscout/shared";

export function formatUserDisplayName(user: AuthUserDto): string {
  const firstName = user.profile?.firstName?.trim() ?? "";
  const lastName = user.profile?.lastName?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return fullName || user.email;
}
