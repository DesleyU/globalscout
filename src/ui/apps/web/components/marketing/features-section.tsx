import { audienceSections } from "@/components/marketing/content";
import { FeatureSection } from "@/components/marketing/feature-section";

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Built for Every Player in the Game
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            Whether you&apos;re showcasing talent, discovering the next star, or
            building your dream team, GlobalScout has you covered.
          </p>
        </div>

        <div className="space-y-20">
          {audienceSections.map((section) => (
            <FeatureSection key={section.id} section={section} />
          ))}
        </div>
      </div>
    </section>
  );
}
