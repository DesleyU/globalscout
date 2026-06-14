import type {
  GetFootballCountriesResult,
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
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return parseJson<T>(response);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
  });
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

    searchTeams(body: { country: string; searchTerm: string }) {
      return postJson<SearchFootballTeamsResult>(
        "/api/reference-data/football/teams/search",
        body,
      );
    },
  };
}
