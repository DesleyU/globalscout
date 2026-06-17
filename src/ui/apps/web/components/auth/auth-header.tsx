import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, X } from "lucide-react";

export function AuthHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-5">
      <Link
        href="/"
        className="flex items-center gap-2 text-gray-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <Image
          src="/logo/globalscout-logo.png"
          alt="GlobalScout"
          width={140}
          height={40}
          className="h-8 w-auto brightness-0 invert"
        />
      </Link>
      <Link
        href="/"
        className="rounded-full p-2 transition hover:bg-white/10"
        aria-label="Exit"
      >
        <X className="h-4 w-4 text-gray-400" />
      </Link>
    </header>
  );
}
