import type { Metadata } from "next";
import { ReferenceDataPageClient } from "@/features/admin/reference-data/reference-data-page-client";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Reference Data",
};

export default async function AdminReferenceDataPage() {
  await requireAdmin();

  return <ReferenceDataPageClient />;
}
