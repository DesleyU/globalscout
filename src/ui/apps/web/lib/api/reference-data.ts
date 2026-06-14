import type { ApiTransport } from "@globalscout/shared";
import type {
  GetFootballCountriesResult,
  SearchFootballTeamsResult,
} from "@/lib/api/reference-data-types";

const referenceDataPaths = {
  countries: "/reference-data/football/countries",
  teamsSearch: "/reference-data/football/teams/search",
} as const;

export function createReferenceDataApi(client: ApiTransport) {
  return {
    getCountries() {
      return client.get<GetFootballCountriesResult>(referenceDataPaths.countries);
    },

    searchTeams(body: { country: string; searchTerm: string }) {
      return client.post<SearchFootballTeamsResult>(
        referenceDataPaths.teamsSearch,
        body,
      );
    },
  };
}

export type ReferenceDataApi = ReturnType<typeof createReferenceDataApi>;
