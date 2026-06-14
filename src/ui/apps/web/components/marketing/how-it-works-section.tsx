import { howItWorksSteps } from "@/components/marketing/content";
import { StepCard } from "@/components/marketing/step-card";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-gray-50 py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2
            id="how-it-works-heading"
            className="mb-4 text-4xl font-bold text-gray-900"
          >
            How It Works
          </h2>
          <p className="text-xl text-gray-600">Simple steps to connect and grow</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {howItWorksSteps.map((step) => (
            <StepCard key={step.step} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
