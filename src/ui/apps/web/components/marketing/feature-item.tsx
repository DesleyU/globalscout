import type { LucideIcon } from "lucide-react";

interface FeatureItemProps {
  icon: LucideIcon;
  text: string;
}

export function FeatureItem({ icon: Icon, text }: FeatureItemProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-5 shrink-0 text-blue-600" aria-hidden />
      <span className="text-gray-700">{text}</span>
    </div>
  );
}
