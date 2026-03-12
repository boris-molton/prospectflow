import { ProspectForm } from "@/components/prospects/ProspectForm";

export default function NewProspectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nouveau prospect</h1>
        <p className="mt-1 text-slate-600">
          Ajoute un contact pour ta candidature spontanée
        </p>
      </div>
      <ProspectForm />
    </div>
  );
}
