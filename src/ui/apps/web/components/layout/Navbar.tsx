"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/components/marketing/content";
import { useSession } from "@/features/auth/session-provider";
import { useScrolled } from "@/hooks/use-scrolled";
import { formatUserDisplayName } from "@/lib/auth/format-user-display";
import { resolveAppEntryPath } from "@/lib/auth/resolve-app-entry-path";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  scrolled,
  children,
  onClick,
}: {
  href: string;
  scrolled: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "text-sm font-medium transition-colors",
        scrolled
          ? "text-gray-700 hover:text-blue-600"
          : "text-white/90 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const scrolled = useScrolled(60);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useSession();
  const displayName = user ? formatUserDisplayName(user) : null;
  const appEntryHref = resolveAppEntryPath(user?.role);

  return (
    <header>
      <nav
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "bg-white/95 shadow-sm backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="relative z-10 shrink-0">
            <Image
              src="/logo/globalscout-logo.png"
              alt="GlobalScout"
              width={160}
              height={48}
              className={cn(
                "h-12 w-auto transition-all duration-300",
                !scrolled && "brightness-0 invert",
              )}
              priority
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(({ label, href }) => (
              <NavLink key={href} href={href} scrolled={scrolled}>
                {label}
              </NavLink>
            ))}

            {user ? (
              <>
                <span
                  className={cn(
                    "text-sm",
                    scrolled ? "text-gray-700" : "text-white/80",
                  )}
                >
                  {displayName}
                </span>
                <Button
                  size="sm"
                  render={<Link href={appEntryHref} />}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Open App
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/sign-in" />}
                  className={cn(
                    scrolled
                      ? "border-blue-600 text-blue-600 hover:bg-blue-50"
                      : "border-white/60 bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  Sign In
                </Button>

                <Button
                  size="sm"
                  render={<Link href="/create-account" />}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className={cn(
              "relative z-10 rounded-lg p-2 md:hidden",
              scrolled ? "text-gray-700" : "text-white",
            )}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="size-6" aria-hidden />
            ) : (
              <Menu className="size-6" aria-hidden />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div
            id="mobile-nav"
            className={cn(
              "border-t px-4 py-4 md:hidden",
              scrolled
                ? "border-gray-200 bg-white/95 backdrop-blur-md"
                : "border-white/10 bg-gray-900/95 backdrop-blur-md",
            )}
          >
            <div className="flex flex-col gap-4">
              {navLinks.map(({ label, href }) => (
                <NavLink
                  key={href}
                  href={href}
                  scrolled={scrolled}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </NavLink>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                {user ? (
                  <>
                    <p
                      className={cn(
                        "px-1 text-sm",
                        scrolled ? "text-gray-600" : "text-white/70",
                      )}
                    >
                      Signed in as{" "}
                      <span className="font-medium">{displayName}</span>
                    </p>
                    <Button
                      render={<Link href={appEntryHref} />}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => setMobileOpen(false)}
                    >
                      Open App
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      render={<Link href="/sign-in" />}
                      className={cn(
                        "w-full",
                        scrolled
                          ? "border-blue-600 text-blue-600"
                          : "border-white/40 text-white",
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign In
                    </Button>
                    <Button
                      render={<Link href="/create-account" />}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => setMobileOpen(false)}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
