"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/sign-out-button";
import {
  adminNavItems,
  agentNavItems,
  isNavItemActive,
  playerNavItems,
  type DashboardNavItem,
} from "@/features/dashboard/nav-config";
import { cn } from "@/lib/utils";

export type SidebarVariant = "player" | "agent" | "admin";

type AppSidebarProps = {
  variant: SidebarVariant;
};

const NAV_ITEMS_BY_VARIANT: Record<SidebarVariant, DashboardNavItem[]> = {
  player: playerNavItems,
  agent: agentNavItems,
  admin: adminNavItems,
};

const HOME_HREF_BY_VARIANT: Record<SidebarVariant, string> = {
  player: "/dashboard",
  agent: "/agent/profile",
  admin: "/admin",
};

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  badge,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "text-gray-300 hover:bg-slate-700 hover:text-white",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="size-4" aria-hidden />
        <span className="text-xs font-medium">{label}</span>
      </span>
      {badge ? (
        <Badge className="border-0 bg-blue-500 px-1.5 py-0.5 text-[10px] text-white">
          {badge}
        </Badge>
      ) : null}
    </Link>
  );
}

function SignOutFooter() {
  return (
    <div className="border-t border-slate-700 px-4 py-3">
      <SignOutButton
        redirectTo="/sign-in"
        className="flex h-auto w-full items-center justify-start gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-xs font-medium text-gray-300 shadow-none hover:bg-slate-700 hover:text-white"
      >
        <>
          <LogOut className="size-4" aria-hidden />
          Sign out
        </>
      </SignOutButton>
    </div>
  );
}

function PlayerFooter({ pathname }: { pathname: string }) {
  const settingsActive = pathname === "/profile";

  return (
    <>
      <div className="border-t border-slate-700 px-4 py-3">
        <Link
          href="/profile"
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
            settingsActive
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-slate-700 hover:text-white",
          )}
        >
          <Settings className="size-4" aria-hidden />
          Settings
        </Link>
      </div>

      <div className="m-3 rounded-lg border border-blue-500/30 bg-blue-600/20 p-3">
        <p className="mb-1 text-xs font-semibold text-white">Upgrade to Pro</p>
        <p className="mb-2 text-xs text-gray-300">Get unlimited visibility</p>
        <Button
          size="sm"
          className="h-7 w-full text-xs"
          render={<Link href="/billing" />}
        >
          Upgrade Now
        </Button>
      </div>
    </>
  );
}

export function AppSidebar({ variant }: AppSidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS_BY_VARIANT[variant];
  const homeHref = HOME_HREF_BY_VARIANT[variant];

  return (
    <aside className="fixed z-40 flex h-full w-48 flex-col overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="flex-1 p-4">
        <Link href={homeHref} className="mb-6 block">
          <Image
            src="/logo/globalscout-logo-sidebar.png"
            alt="GlobalScout"
            width={160}
            height={96}
            className="mx-auto h-24 w-auto brightness-0 invert"
            priority
          />
        </Link>

        <nav className="space-y-1" aria-label="Dashboard navigation">
          {navItems.map((item) => (
            <SidebarNavLink
              key={`${item.href}-${item.label}`}
              href={item.href}
              label={item.label}
              icon={item.icon}
              badge={item.badge}
              active={isNavItemActive(pathname, item)}
            />
          ))}
        </nav>
      </div>

      {variant === "player" ? (
        <PlayerFooter pathname={pathname} />
      ) : (
        <SignOutFooter />
      )}
    </aside>
  );
}
