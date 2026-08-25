export const competitionLevels = [
  "Unknown",
  "ProfessionalTier1",
  "ProfessionalTier2",
  "ProfessionalTier3",
  "SemiPro",
  "Amateur",
  "YouthAcademy",
  "SchoolUniversity",
] as const;

export type CompetitionLevel = (typeof competitionLevels)[number];

export const competitionTypes = ["League", "Cup"] as const;

export type CompetitionType = (typeof competitionTypes)[number];

export type FootballTeamDto = {
  id: string;
  externalTeamId: number | null;
  name: string;
  code?: string | null;
  country: string;
  founded?: number | null;
  national: boolean;
  logoUrl?: string | null;
  isVerified: boolean;
};

export type FootballCompetitionDto = {
  id: string;
  externalCompetitionId: number | null;
  name: string;
  country: string;
  type?: string | null;
  logoUrl?: string | null;
  level: CompetitionLevel;
  isVerified: boolean;
};

export type FootballCountryDto = {
  name: string;
  code?: string | null;
  flagUrl?: string | null;
};

export type GetFootballCountriesResult = {
  countries: FootballCountryDto[];
};

export type SearchFootballTeamsResult = {
  teams: FootballTeamDto[];
};

export type ListFootballCompetitionsResult = {
  competitions: FootballCompetitionDto[];
};

export type SearchFootballCompetitionsResult = {
  competitions: FootballCompetitionDto[];
};

export const referenceDataSources = [
  "Provider",
  "UserSubmitted",
  "AdminCurated",
] as const;

export const referenceDataStatuses = [
  "Approved",
  "Pending",
  "Rejected",
  "Merged",
] as const;

export type ReferenceDataSource = (typeof referenceDataSources)[number];
export type ReferenceDataStatus = (typeof referenceDataStatuses)[number];

export type AdminReferenceDataCountry = {
  name: string;
  code?: string | null;
  flagUrl?: string | null;
  competitionCount: number;
  competitionsNeedingLevelCount: number;
  pendingCompetitionCount: number;
  teamCount: number;
  lastSyncedAt?: string | null;
};

export type AdminFootballCompetition = {
  id: string;
  externalCompetitionId: number | null;
  name: string;
  countryCode: string;
  type?: string | null;
  logoUrl?: string | null;
  level: CompetitionLevel;
  submittedLevelHint?: CompetitionLevel | null;
  submittedTypeHint?: CompetitionType | null;
  source: ReferenceDataSource;
  status: ReferenceDataStatus;
  submittedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListAdminReferenceDataCountriesResult = {
  countries: AdminReferenceDataCountry[];
};

export type ListAdminCountryCompetitionsResult = {
  competitions: AdminFootballCompetition[];
};
