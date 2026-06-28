import { AgentAppShell } from "@/features/agent/agent-app-shell";
import { requireAgent } from "@/lib/auth";

export default async function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAgent();

  return <AgentAppShell user={session.user}>{children}</AgentAppShell>;
}
