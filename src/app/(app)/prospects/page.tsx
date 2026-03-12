import { ProspectsList } from "@/components/prospects/ProspectsList";

export default function ProspectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
          <p className="mt-1 text-slate-600">
            Gère tes contacts et entreprises cibles
          </p>
        </div>
      </div>
      <ProspectsList />
    </div>
  );
}
