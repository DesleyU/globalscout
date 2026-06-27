import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>([
    // Default Aspire reverse-proxy hostname for the "web" resource.
    "web-globalscout.dev.localhost",
  ]);

  const aspireWebEndpoint = process.env.ASPIRE_WEB_HTTP_ENDPOINT?.trim();
  if (aspireWebEndpoint) {
    try {
      origins.add(new URL(aspireWebEndpoint).hostname);
    } catch {
      // Ignore invalid Aspire endpoint values.
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  output: "standalone",
  // Trace dependencies from the pnpm workspace root for standalone Docker output.
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: ["@globalscout/shared"],
  images: {
    // Widths used by next/image across the app. CloudFront must forward query strings (url, w, q).
    deviceSizes: [640, 750, 800, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 140, 160, 256, 384],
  },
  // Required when opening the app through Aspire's *.dev.localhost proxy.
  // Without this, Next blocks /_next dev assets cross-origin and client JS never loads.
  allowedDevOrigins: getAllowedDevOrigins(),
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
