import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { APP_NAME } from "@globalscout/shared";
import { Providers } from "@/components/providers";
import { getSession } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "GlobalScout web platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.className} flex min-h-full flex-col`}>
        <Providers initialUser={session?.user ?? null}>{children}</Providers>
      </body>
    </html>
  );
}
