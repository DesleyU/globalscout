import type {
  CompetitionLevel,
  CompetitionType,
  FootballCompetitionDto,
  FootballTeamDto,
  GetFootballCountriesResult,
  ListFootballCompetitionsResult,
  SearchFootballCompetitionsResult,
  SearchFootballTeamsResult,
} from "@/lib/api/reference-data-types";

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return parseJson<T>(response);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include" });
  return parseJson<T>(response);
}

/** Browser-safe reference data API via Next route handlers. */
export function createBrowserReferenceDataApi() {
  return {
    getCountries() {
      return getJson<GetFootballCountriesResult>(
        "/api/reference-data/football/countries",
      );
    },

    searchTeams(body: {
      country: string;
      searchTerm: string;
      requiresExternalId?: boolean;
    }) {
      return postJson<SearchFootballTeamsResult>(
        "/api/reference-data/football/teams/search",
        body,
      );
    },

    listCompetitions(country: string, level?: CompetitionLevel | null) {
      const params = new URLSearchParams({ country });
      if (level) {
        params.set("level", level);
      }
      return getJson<ListFootballCompetitionsResult>(
        `/api/reference-data/football/competitions?${params.toString()}`,
      );
    },

    searchCompetitions(body: {
      country: string;
      searchTerm: string;
      level?: CompetitionLevel | null;
    }) {
      return postJson<SearchFootballCompetitionsResult>(
        "/api/reference-data/football/competitions/search",
        body,
      );
    },

    submitTeam(body: { country: string; name: string }) {
      return postJson<FootballTeamDto>(
        "/api/reference-data/football/teams",
        body,
      );
    },

    submitCompetition(body: {
      country: string;
      name: string;
      levelHint: CompetitionLevel;
      typeHint: CompetitionType;
    }) {
      return postJson<FootballCompetitionDto>(
        "/api/reference-data/football/competitions",
        body,
      );
    },
  };
}
