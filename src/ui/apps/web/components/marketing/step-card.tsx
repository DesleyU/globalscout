import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StepCardProps {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export function StepCard({
  step,
  title,
  description,
  icon: Icon,
}: StepCardProps) {
  return (
    <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
      <CardContent className="flex flex-col items-center p-8 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Icon className="size-8" aria-hidden />
        </div>
        <div className="mb-4 text-4xl font-bold text-blue-600">{step}</div>
        <h3 className="mb-3 text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}
