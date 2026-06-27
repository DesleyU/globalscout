import { requireMember } from "@/lib/auth/require-member";

export default async function MemberLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireMember();

  return children;
}
