import {
  CheckCircle2,
  Search,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

type AuthBrandingPanelProps = {
  variant: "sign-in" | "create-account";
};

const signInStats: { icon: LucideIcon; text: string }[] = [
  { icon: Users, text: "50,000+ active players" },
  { icon: Search, text: "2,500+ professional scouts" },
  { icon: Trophy, text: "800+ clubs worldwide" },
];

const createAccountBenefits = [
  "Free profile for players",
  "Connect your official statistics",
  "Visible to 2,500+ professional scouts",
  "Direct messaging with clubs",
];

export function AuthBrandingPanel({ variant }: AuthBrandingPanelProps) {
  if (variant === "create-account") {
    return (
      <div className="hidden md:block">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-600/20 px-4 py-1.5 text-sm text-blue-300">
          <Sparkles className="h-4 w-4" aria-hidden />
          Free to join
        </div>
        <h1 className="mb-4 text-4xl leading-tight font-bold text-white">
          Start your football
          <br />
          journey today
        </h1>
        <p className="mb-10 leading-relaxed text-gray-400">
          Create a free account and connect your football identity to get
          discovered by scouts worldwide.
        </p>
        <div className="space-y-3">
          {createAccountBenefits.map((text) => (
            <div key={text} className="flex items-center gap-3">
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-green-400"
                aria-hidden
              />
              <span className="text-sm text-gray-300">{text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-600/20 px-4 py-1.5 text-sm text-blue-300">
        <Sparkles className="h-4 w-4" aria-hidden />
        Welcome back
      </div>
      <h1 className="mb-4 text-4xl leading-tight font-bold text-white">
        Sign in to your
        <br />
        GlobalScout account
      </h1>
      <p className="mb-10 leading-relaxed text-gray-400">
        Connect with scouts, showcase your career, and unlock opportunities
        worldwide.
      </p>
      <div className="space-y-4">
        {signInStats.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-gray-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20">
              <Icon className="h-4 w-4 text-blue-400" aria-hidden />
            </div>
            <span className="text-sm">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
