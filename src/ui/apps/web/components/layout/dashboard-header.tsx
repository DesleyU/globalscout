import type { AuthUserDto } from "@globalscout/shared";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatUserDisplayName } from "@/lib/auth/format-user-display";

type DashboardHeaderProps = {
  user: AuthUserDto;
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

export function DashboardHeader({ user, avatarUrl }: DashboardHeaderProps) {
  const displayName = formatUserDisplayName(user);
  const position = user.profile?.position?.trim() || "Player";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-8 py-4">
        <label className="flex max-w-xl flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <Search className="size-4 shrink-0 text-gray-400" aria-hidden />
          <input
            type="search"
            placeholder="Search matches, stats, scouts..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
            aria-label="Search matches, stats, scouts"
          />
        </label>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-full p-2 transition hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="size-5 text-gray-600" />
            <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              4
            </span>
          </button>

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
              <div className="text-xs text-gray-500">{position}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
