import type { AuthUserDto } from "@globalscout/shared";

export const ROLES = {
  PENDING: "PENDING",
  PLAYER: "PLAYER",
  SCOUT_AGENT: "SCOUT_AGENT",
  ADMIN: "ADMIN",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const DEFAULT_PLAYER_REDIRECT = "/dashboard";
export const DEFAULT_AGENT_REDIRECT = "/agent/profile";
export const DEFAULT_ADMIN_REDIRECT = "/admin";

function roleOf(user: AuthUserDto | null | undefined): string | undefined {
  return user?.role;
}

export function isPendingUser(user: AuthUserDto | null | undefined): boolean {
  return roleOf(user) === ROLES.PENDING;
}

export function isPlayerUser(user: AuthUserDto | null | undefined): boolean {
  return roleOf(user) === ROLES.PLAYER;
}

export function isAgentUser(user: AuthUserDto | null | undefined): boolean {
  return roleOf(user) === ROLES.SCOUT_AGENT;
}

export function isAdminUser(user: AuthUserDto | null | undefined): boolean {
  return roleOf(user) === ROLES.ADMIN;
}
