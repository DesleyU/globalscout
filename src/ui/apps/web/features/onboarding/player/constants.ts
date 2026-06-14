import type { EvidenceType } from "@globalscout/shared";

export const SEARCH_MESSAGES = [
  "Searching football databases...",
  "Comparing player records...",
  "Finding matching statistics...",
  "Looking for your football profile...",
  "Almost there...",
] as const;

export const DATABASE_SOURCES = [
  "API-Football",
  "FIFA Data",
  "Transfermarkt",
] as const;

export const ONBOARDING_POSITIONS = [
  { value: "GOALKEEPER", label: "Goalkeeper (GK)" },
  { value: "DEFENDER", label: "Defender" },
  { value: "MIDFIELDER", label: "Midfielder" },
  { value: "FORWARD", label: "Forward" },
] as const;

export const EVIDENCE_TYPE_OPTIONS: {
  value: EvidenceType;
  label: string;
  description: string;
}[] = [
  {
    value: "RosterListing",
    label: "Roster listing",
    description: "Official squad or roster page",
  },
  {
    value: "FederationCard",
    label: "Federation card",
    description: "National federation player registration",
  },
  {
    value: "ClubId",
    label: "Club ID",
    description: "Club-issued player identification",
  },
  {
    value: "ProfileUrl",
    label: "Profile URL",
    description: "Official club or league profile page",
  },
  {
    value: "SocialAccount",
    label: "Social account",
    description: "Verified social media profile",
  },
  {
    value: "Passport",
    label: "Passport",
    description: "Government-issued passport scan",
  },
  {
    value: "CountryPersonalId",
    label: "National ID",
    description: "Government-issued personal ID",
  },
  {
    value: "Other",
    label: "Other",
    description: "Other supporting documentation",
  },
];

export const VERIFICATION_TIMELINE_STEPS = [
  { label: "Account Created", done: true },
  { label: "Football Profile Selected", done: true },
  { label: "Claim Submitted", done: true },
  { label: "Verification Review", done: false, pending: true },
] as const;

export const SUBMITTED_INFO_ITEMS = [
  "You can already start using Global Scout.",
  "Your football statistics will be visible while verification is pending.",
  "Your profile will display an Unverified badge until approved.",
] as const;
