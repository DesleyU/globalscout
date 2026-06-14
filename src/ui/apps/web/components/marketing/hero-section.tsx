import Image from "next/image";
import Link from "next/link";
import { Search, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsBar } from "@/components/marketing/stats-bar";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-32 pt-0">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-stadium.jpg"
          alt="Football stadium at night"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/85 to-gray-900/75" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-40 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
            Connect Football Talent{" "}
            <span className="text-blue-400">Worldwide</span>
          </h1>

          <p className="mb-8 text-xl text-gray-300">
            The global platform bridging players, scouts, and clubs. Discover
            talent, showcase skills, and build the future of football.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              render={<Link href="/create-account" />}
              className="h-11 bg-blue-600 px-6 text-base text-white hover:bg-blue-700"
            >
              <Users className="size-5" aria-hidden />
              Join as Player
            </Button>
            <Button
              size="lg"
              variant="secondary"
              render={<Link href="/create-account" />}
              className="h-11 bg-white px-6 text-base text-gray-900 hover:bg-gray-100"
            >
              <Search className="size-5" aria-hidden />
              Scout Talent
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="#for-clubs" />}
              className="h-11 border-2 border-white bg-transparent px-6 text-base text-white hover:bg-white/10"
            >
              <Trophy className="size-5" aria-hidden />
              Club Portal
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <StatsBar />
      </div>
    </section>
  );
}
