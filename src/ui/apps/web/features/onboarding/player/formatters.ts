function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPositionLabel(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const EXTERNAL_PROVIDER_LABELS: Record<string, string> = {
  "api-football": "API-Football",
};

function formatExternalProvider(provider: string | null | undefined): string {
  if (!provider) {
    return "Football database";
  }

  return EXTERNAL_PROVIDER_LABELS[provider] ?? provider.replace(/-/g, " ");
}

function normalizeComparisonValue(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function valuesMatch(left: string, right: string): boolean {
  return normalizeComparisonValue(left) === normalizeComparisonValue(right);
}

export {
  formatDateLabel,
  formatExternalProvider,
  formatPositionLabel,
  valuesMatch,
};
