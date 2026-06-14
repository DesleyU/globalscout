"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { SessionProvider } from "@/features/auth/session-provider";
import type { AuthUserDto } from "@globalscout/shared";

type ProvidersProps = {
  children: React.ReactNode;
  initialUser?: AuthUserDto | null;
};

export function Providers({ children, initialUser = null }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider initialUser={initialUser}>{children}</SessionProvider>
      <Toaster richColors closeButton position="top-center" />
    </QueryClientProvider>
  );
}
