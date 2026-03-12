import { notFound } from "next/navigation";
import { getProspect } from "@/services/prospect.service";
import { ProspectForm } from "@/components/prospects/ProspectForm";

export default async function EditProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prospect = await getProspect(id);

  if (!prospect) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Modifier {prospect.contactName}
        </h1>
        <p className="mt-1 text-slate-600">
          {prospect.companyName}
        </p>
      </div>
      <ProspectForm prospect={prospect as unknown as Record<string, unknown>} />
    </div>
  );
}
