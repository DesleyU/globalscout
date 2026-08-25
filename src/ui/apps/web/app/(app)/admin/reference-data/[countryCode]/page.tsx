import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CountryCompetitionsPageClient } from "@/features/admin/reference-data/country-competitions-page-client";
import { createAdminApi } from "@/lib/api/admin";
import { createServerApiClient } from "@/lib/api/server";
import { requireAdmin } from "@/lib/auth";

type PageProps = {
  params: Promise<{ countryCode: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { countryCode } = await params;
  return {
    title: `${decodeURIComponent(countryCode)} — Reference Data`,
  };
}

export default async function AdminReferenceDataCountryPage({ params }: PageProps) {
  await requireAdmin();
  const { countryCode } = await params;
  const decodedCode = decodeURIComponent(countryCode);

  const client = await createServerApiClient();
  const admin = createAdminApi(client);

  try {
    const [countriesResult, leaguesResult] = await Promise.all([
      admin.getReferenceDataCountries(),
      admin.getReferenceDataCountryCompetitions(decodedCode),
    ]);

    const country = countriesResult.countries.find(
      (candidate) =>
        candidate.code?.toLowerCase() === decodedCode.toLowerCase(),
    );

    if (!country) {
      notFound();
    }

    return (
      <CountryCompetitionsPageClient country={country} initialData={leaguesResult} />
    );
  } catch {
    notFound();
  }
}
