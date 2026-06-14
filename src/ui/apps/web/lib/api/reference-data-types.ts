export type FootballTeamDto = {
  externalTeamId: number;
  name: string;
  code?: string | null;
  country: string;
  founded?: number | null;
  national: boolean;
  logoUrl?: string | null;
};

export type FootballCountryDto = {
  name: string;
  code?: string | null;
  flagUrl?: string | null;
  isPreloaded: boolean;
};

export type GetFootballCountriesResult = {
  countries: FootballCountryDto[];
};

export type SearchFootballTeamsResult = {
  teams: FootballTeamDto[];
};
