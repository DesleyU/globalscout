import Image from "next/image";
import type { AudienceSection } from "@/components/marketing/content";
import { FeatureItem } from "@/components/marketing/feature-item";
import { cn } from "@/lib/utils";

interface FeatureSectionProps {
  section: AudienceSection;
  className?: string;
}

export function FeatureSection({ section, className }: FeatureSectionProps) {
  const {
    id,
    headingIcon: HeadingIcon,
    iconBgClass,
    iconClass,
    title,
    subtitle,
    imageSrc,
    imageAlt,
    features,
    imageFirst,
    mobileImageFirst,
  } = section;

  return (
    <div id={id} className={cn("scroll-mt-20", className)}>
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div
          className={cn(
            imageFirst ? "md:order-2" : "md:order-1",
            mobileImageFirst ? "order-2" : "order-1",
          )}
        >
          <div className="mb-6 flex items-center gap-3">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-lg",
                iconBgClass,
              )}
            >
              <HeadingIcon className={cn("size-6", iconClass)} aria-hidden />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{title}</h3>
          </div>
          <p className="mb-8 text-lg text-gray-600">{subtitle}</p>
          <div className="space-y-4">
            {features.map(({ icon, text }) => (
              <FeatureItem key={text} icon={icon} text={text} />
            ))}
          </div>
        </div>

        <div
          className={cn(
            imageFirst ? "md:order-1" : "md:order-2",
            mobileImageFirst ? "order-1" : "order-2",
          )}
        >
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={800}
              height={384}
              className="h-96 w-full object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
