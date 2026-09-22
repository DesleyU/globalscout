import type { AuthUserDto } from "@globalscout/shared";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SidebarVariant } from "@/components/layout/app-sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { formatUserDisplayName } from "@/lib/auth/format-user-display";

type DashboardHeaderProps = {
  user: AuthUserDto;
  variant: SidebarVariant;
  avatarUrl?: string | null;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const SUBTITLE_BY_VARIANT: Record<SidebarVariant, string> = {
  player: "Player",
  agent: "Agent",
  admin: "Administrator",
};

const SEARCH_PLACEHOLDER_BY_VARIANT: Record<SidebarVariant, string> = {
  player: "Search matches, stats, scouts...",
  agent: "Search players, clubs, scouts...",
  admin: "",
};

export function DashboardHeader({
  user,
  variant,
  avatarUrl,
}: DashboardHeaderProps) {
  const displayName = formatUserDisplayName(user);
  const isAdmin = variant === "admin";
  const subtitle =
    variant === "player"
      ? user.profile?.position?.trim() || SUBTITLE_BY_VARIANT.player
      : SUBTITLE_BY_VARIANT[variant];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-8 py-4">
        {isAdmin ? (
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">Administration</p>
          </div>
        ) : (
          <label className="flex max-w-xl flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <Search className="size-4 shrink-0 text-gray-400" aria-hidden />
            <input
              type="search"
              placeholder={SEARCH_PLACEHOLDER_BY_VARIANT[variant]}
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              aria-label={SEARCH_PLACEHOLDER_BY_VARIANT[variant]}
            />
          </label>
        )}

        <div className="flex items-center gap-4">
          {!isAdmin ? <NotificationBell variant={variant} /> : null}

          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {displayName}
              </div>
              <div className="text-xs text-gray-500">{subtitle}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
