import type { Metadata } from "next";
import { AuthHeader } from "@/components/auth/auth-header";

export const metadata: Metadata = {
  title: "Account",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <AuthHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
