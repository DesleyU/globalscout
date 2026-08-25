import type { ApiTransport } from "@globalscout/shared";
import type {
  GetFootballCountriesResult,
  ListFootballCompetitionsResult,
  SearchFootballCompetitionsResult,
  SearchFootballTeamsResult,
  FootballCompetitionDto,
  FootballTeamDto,
  CompetitionLevel,
  CompetitionType,
} from "@/lib/api/reference-data-types";

const referenceDataPaths = {
  countries: "/reference-data/football/countries",
  teamsSearch: "/reference-data/football/teams/search",
  teams: "/reference-data/football/teams",
  competitions: "/reference-data/football/competitions",
  competitionsSearch: "/reference-data/football/competitions/search",
} as const;

export function createReferenceDataApi(client: ApiTransport) {
  return {
    getCountries() {
      return client.get<GetFootballCountriesResult>(referenceDataPaths.countries);
    },

    searchTeams(body: {
      country: string;
      searchTerm: string;
      requiresExternalId?: boolean;
    }) {
      return client.post<SearchFootballTeamsResult>(
        referenceDataPaths.teamsSearch,
        body,
      );
    },

    listCompetitions(country: string, level?: CompetitionLevel | null) {
      const params = new URLSearchParams({ country });
      if (level) {
        params.set("level", level);
      }
      return client.get<ListFootballCompetitionsResult>(
        `${referenceDataPaths.competitions}?${params.toString()}`,
      );
    },

    searchCompetitions(body: {
      country: string;
      searchTerm: string;
      level?: CompetitionLevel | null;
    }) {
      return client.post<SearchFootballCompetitionsResult>(
        referenceDataPaths.competitionsSearch,
        body,
      );
    },

    submitTeam(body: { country: string; name: string }) {
      return client.post<FootballTeamDto>(referenceDataPaths.teams, body);
    },

    submitCompetition(body: {
      country: string;
      name: string;
      levelHint: CompetitionLevel;
      typeHint: CompetitionType;
    }) {
      return client.post<FootballCompetitionDto>(referenceDataPaths.competitions, body);
    },
  };
}

export type ReferenceDataApi = ReturnType<typeof createReferenceDataApi>;
