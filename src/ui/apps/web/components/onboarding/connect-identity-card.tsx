import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Eye,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ConnectIdentityCardProps = {
  connectHref: string;
  skipHref: string;
};

const benefits = [
  { icon: TrendingUp, text: "Official football statistics" },
  { icon: BadgeCheck, text: "Verified player profile" },
  { icon: Eye, text: "Increased scout visibility" },
  { icon: Award, text: "Professional credibility" },
] as const;

export function ConnectIdentityCard({
  connectHref,
  skipHref,
}: ConnectIdentityCardProps) {
  return (
    <div className="space-y-4">
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
        <CardContent className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h3 className="mb-2 font-bold text-gray-900">
            Connect Your Football Identity
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-gray-600">
            We&apos;ll search professional football databases and connect your
            statistics to your Global Scout profile.
          </p>
          <div className="mb-6 space-y-2.5">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Icon className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">{text}</span>
              </div>
            ))}
          </div>
          <Button render={<Link href={connectHref} />} className="mb-3 w-full">
            Connect My Football Profile
          </Button>
          <Button
            render={<Link href={skipHref} />}
            variant="ghost"
            className="w-full text-sm text-gray-500"
          >
            Skip For Now
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 text-center">
          <Star
            className="mx-auto mb-2 h-6 w-6 text-amber-400"
            fill="#fbbf24"
          />
          <p className="text-xs leading-relaxed text-gray-600">
            Profiles with verified football statistics receive{" "}
            <span className="font-semibold text-gray-900">
              3× more scout views
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
