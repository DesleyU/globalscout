import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Home,
  LayoutDashboard,
  MessageCircle,
  Search,
  ShieldCheck,
  User,
  Users,
  Video,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  matchPaths?: string[];
  exactMatch?: boolean;
};

export const playerNavItems: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    matchPaths: ["/dashboard", "/dashboard/verified"],
  },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/videos", label: "Videos", icon: Video },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageCircle,
    badge: "3",
  },
  { href: "/connections", label: "My Network", icon: Users },
  { href: "/search", label: "Search", icon: Search },
];

export const agentNavItems: DashboardNavItem[] = [
  { href: "/agent/profile", label: "My Profile", icon: User },
  {
    href: "/agent/messages",
    label: "Messages",
    icon: MessageCircle,
  },
  { href: "/agent/connections", label: "My Network", icon: Users },
  { href: "/agent/search", label: "Search", icon: Search },
];

export const adminNavItems: DashboardNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    matchPaths: ["/admin"],
    exactMatch: true,
  },
  {
    href: "/admin/player-claims",
    label: "Player Claims",
    icon: ShieldCheck,
    matchPaths: ["/admin/player-claims"],
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: Users,
    matchPaths: ["/admin/users"],
  },
];

export function isNavItemActive(pathname: string, item: DashboardNavItem): boolean {
  const paths = item.matchPaths ?? [item.href];
  return paths.some((path) =>
    item.exactMatch
      ? pathname === path
      : pathname === path || pathname.startsWith(`${path}/`),
  );
}
