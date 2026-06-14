export const AUTH_TOKEN_COOKIE = "token";

export const AUTH_PUBLIC_PATHS = [
  "/sign-in",
  "/create-account",
  "/forgot-password",
] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/search",
  "/users",
  "/connections",
  "/messages",
  "/billing",
  "/admin",
] as const;

export const DEFAULT_AUTHENTICATED_REDIRECT = "/dashboard";
