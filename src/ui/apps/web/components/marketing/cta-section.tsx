import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section
      className="bg-gradient-to-br from-blue-600 to-blue-800 py-20"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2
          id="cta-heading"
          className="mb-6 text-4xl font-bold text-white"
        >
          Ready to Join the Global Football Network?
        </h2>
        <p className="mb-8 text-xl text-blue-100">
          Start your journey today. Whether you&apos;re a player, scout, or
          club, GlobalScout connects you to opportunities worldwide.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            render={<Link href="/create-account" />}
            className="h-11 bg-white px-8 text-base text-blue-600 hover:bg-gray-100"
          >
            Get Started Free
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="#features" />}
            className="h-11 border-2 border-white bg-transparent px-8 text-base text-white hover:bg-white/10"
          >
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
