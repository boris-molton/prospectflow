"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  A_ENRICHIR: "À enrichir",
  PRET_A_CONTACTER: "Prêt à contacter",
  EMAIL_GENERE: "Email généré",
  ENVOYE: "Envoyé",
  RELANCE_A_FAIRE: "Relance à faire",
  EN_ATTENTE_REPONSE: "En attente",
  REPONSE_RECUE: "Réponse reçue",
  REPONSE_POSITIVE: "Réponse positive",
  REPONSE_NEGATIVE: "Réponse négative",
  ENTRETIEN_OBTENU: "Entretien obtenu",
  OPPORTUNITE_FERMEE: "Fermé",
  ARCHIVE: "Archivé",
};

interface Prospect {
  id: string;
  contactName: string;
  contactEmail: string;
  companyName: string;
  status: string;
  createdAt: string;
  tags: Array<{ tag: { name: string } }>;
}

export function ProspectsList() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProspects = (searchTerm?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    fetch(`/api/prospects?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setProspects(data.prospects ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProspects(search);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Supprimer ${name} et toutes ses données (emails, réponses, activités) ?`)) return;
    try {
      const res = await fetch(`/api/prospects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProspects((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher par nom, email, entreprise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Rechercher
          </Button>
        </form>
        <Button asChild>
          <Link href="/prospects/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau prospect
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>
          ) : prospects.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="mb-4">Aucun prospect pour le moment</p>
              <Button asChild>
                <Link href="/prospects/new">Créer ton premier prospect</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {prospects.map((prospect) => (
                <div
                  key={prospect.id}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50"
                >
                  <Link
                    href={`/prospects/${prospect.id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-medium text-slate-900">
                      {prospect.contactName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {prospect.companyName} · {prospect.contactEmail}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {prospect.tags.slice(0, 2).map(({ tag }) => (
                      <Badge key={tag.name} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                    <Badge variant="outline">
                      {STATUS_LABELS[prospect.status] ?? prospect.status}
                    </Badge>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, prospect.id, prospect.contactName)}
                      className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {total > 0 && (
        <p className="text-sm text-slate-500">{total} prospect(s) au total</p>
      )}
    </div>
  );
}
