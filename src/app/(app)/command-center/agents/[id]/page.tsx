import { AgentDetail } from "@/components/command-center/AgentDetail";
import { COMMAND_CENTER_AGENTS } from "@/components/command-center/roster";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const descriptor =
    COMMAND_CENTER_AGENTS.find((agent) => agent.id === id) ?? null;
  return <AgentDetail descriptor={descriptor} id={id} />;
}
