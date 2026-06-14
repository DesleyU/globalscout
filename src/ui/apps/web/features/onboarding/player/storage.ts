import type { PlayerMatchDto } from "@globalscout/shared";
import type { PlayerIdentitySearchFormValues } from "@/lib/validation/player-identity";

const SEARCH_KEY = "gs:onboarding:search";
const MATCHES_KEY = "gs:onboarding:matches";
const SELECTED_MATCH_KEY = "gs:onboarding:selected-match";

export function saveSearchCriteria(data: PlayerIdentitySearchFormValues): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(SEARCH_KEY, JSON.stringify(data));
}

export function loadSearchCriteria(): PlayerIdentitySearchFormValues | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(SEARCH_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PlayerIdentitySearchFormValues;
  } catch {
    return null;
  }
}

export function saveMatches(matches: PlayerMatchDto[]): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

export function loadMatches(): PlayerMatchDto[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(MATCHES_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PlayerMatchDto[];
  } catch {
    return null;
  }
}

export function saveSelectedMatch(match: PlayerMatchDto): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(SELECTED_MATCH_KEY, JSON.stringify(match));
}

export function loadSelectedMatch(): PlayerMatchDto | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(SELECTED_MATCH_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PlayerMatchDto;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(SEARCH_KEY);
  sessionStorage.removeItem(MATCHES_KEY);
  sessionStorage.removeItem(SELECTED_MATCH_KEY);
}
