import { notFound } from "next/navigation";
import { getProspect } from "@/services/prospect.service";
import { ProspectDetail } from "@/components/prospects/ProspectDetail";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prospect = await getProspect(id);

  if (!prospect) notFound();

  return <ProspectDetail prospect={prospect} />;
}
