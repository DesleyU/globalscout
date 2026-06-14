import type { AuthUserDto } from "@globalscout/shared";

export const ADMIN_ROLE = "ADMIN";

export function isAdminUser(user: AuthUserDto | null | undefined): boolean {
  return user?.role === ADMIN_ROLE;
}
