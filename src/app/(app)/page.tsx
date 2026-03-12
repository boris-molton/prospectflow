import { Dashboard } from "@/components/dashboard/Dashboard";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Vue d&apos;ensemble de tes candidatures spontanées
        </p>
      </div>
      <Dashboard />
    </div>
  );
}
