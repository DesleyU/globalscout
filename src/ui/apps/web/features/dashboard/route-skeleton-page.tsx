import type { Metadata } from "next";
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type RouteSkeletonPageProps = {
  title: string;
  description: string;
  footer?: React.ReactNode;
};

export function RouteSkeletonPage({
  title,
  description,
  footer,
}: RouteSkeletonPageProps) {
  return (
    <div className="flex flex-col gap-6 p-8">
      <Card className="border-0 shadow-sm">
        <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-10 text-center">
          <Construction className="size-10 text-blue-600" aria-hidden />
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
      {footer}
    </div>
  );
}

export function createRouteSkeletonMetadata(title: string): Metadata {
  return { title };
}
