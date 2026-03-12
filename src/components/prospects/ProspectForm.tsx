"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Globe,
  Linkedin,
  Loader2,
  ExternalLink,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProspectForm({
  prospect,
}: {
  prospect?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isEdit = !!prospect;
  const p = prospect as Record<string, string> | undefined;

  const [linkedInSummary, setLinkedInSummary] = useState(
    p?.linkedInSummary ?? ""
  );
  const [companyInfo, setCompanyInfo] = useState(p?.companyInfo ?? "");
  const [commonPoints, setCommonPoints] = useState(p?.commonPoints ?? "");

  const [linkedInModalOpen, setLinkedInModalOpen] = useState(false);
  const [linkedInPasteText, setLinkedInPasteText] = useState("");
  const [enrichingLinkedIn, setEnrichingLinkedIn] = useState(false);
  const [enrichingCompany, setEnrichingCompany] = useState(false);
  const [enrichingCommonPoints, setEnrichingCommonPoints] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      contactName: formData.get("contactName") as string,
      contactEmail: formData.get("contactEmail") as string,
      contactRole: (formData.get("contactRole") as string) || undefined,
      contactLinkedInUrl:
        (formData.get("contactLinkedInUrl") as string) || undefined,
      companyName: formData.get("companyName") as string,
      companyWebsite:
        (formData.get("companyWebsite") as string) || undefined,
      companyLinkedInUrl:
        (formData.get("companyLinkedInUrl") as string) || undefined,
      industry: (formData.get("industry") as string) || undefined,
      country: (formData.get("country") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      linkedInSummary: linkedInSummary || undefined,
      companyInfo: companyInfo || undefined,
      commonPoints: commonPoints || undefined,
      opportunityType:
        (formData.get("opportunityType") as string) || undefined,
      preferredLanguage:
        (formData.get("preferredLanguage") as string) || "fr",
      notes: (formData.get("notes") as string) || undefined,
      source: (formData.get("source") as string) || undefined,
    };

    try {
      const url = isEdit ? `/api/prospects/${prospect.id}` : "/api/prospects";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur");
      }

      const result = await res.json();
      router.push(`/prospects/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrichLinkedIn = async () => {
    setEnrichingLinkedIn(true);
    setEnrichError(null);

    try {
      const res = await fetch("/api/enrich/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText: linkedInPasteText }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur");
      }

      const { summary } = await res.json();
      setLinkedInSummary(summary);
      setLinkedInModalOpen(false);
      setLinkedInPasteText("");
    } catch (err) {
      setEnrichError(
        err instanceof Error ? err.message : "Erreur d'enrichissement"
      );
    } finally {
      setEnrichingLinkedIn(false);
    }
  };

  const handleEnrichCompany = async () => {
    const form = formRef.current;
    if (!form) return;
    const websiteUrl = new FormData(form).get("companyWebsite") as string;

    if (!websiteUrl) {
      setEnrichError("Renseigne d'abord l'URL du site web de l'entreprise");
      return;
    }

    setEnrichingCompany(true);
    setEnrichError(null);

    try {
      const res = await fetch("/api/enrich/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur");
      }

      const { summary } = await res.json();
      setCompanyInfo(summary);
    } catch (err) {
      setEnrichError(
        err instanceof Error ? err.message : "Erreur d'enrichissement"
      );
    } finally {
      setEnrichingCompany(false);
    }
  };

  const handleGenerateCommonPoints = async () => {
    if (!linkedInSummary && !companyInfo) {
      setEnrichError(
        "Renseigne d'abord le résumé LinkedIn ou les infos entreprise"
      );
      return;
    }

    const form = formRef.current;
    const formData = form ? new FormData(form) : null;

    setEnrichingCommonPoints(true);
    setEnrichError(null);

    try {
      const res = await fetch("/api/enrich/common-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedInSummary: linkedInSummary || undefined,
          companyInfo: companyInfo || undefined,
          contactRole: (formData?.get("contactRole") as string) || undefined,
          industry: (formData?.get("industry") as string) || undefined,
          notes: (formData?.get("notes") as string) || undefined,
          opportunityType:
            (formData?.get("opportunityType") as string) || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur");
      }

      const { points } = await res.json();
      setCommonPoints(points);
    } catch (err) {
      setEnrichError(
        err instanceof Error ? err.message : "Erreur de génération"
      );
    } finally {
      setEnrichingCommonPoints(false);
    }
  };

  const openLinkedInModal = () => {
    const form = formRef.current;
    if (form) {
      const linkedInUrl = new FormData(form).get(
        "contactLinkedInUrl"
      ) as string;
      if (linkedInUrl) {
        window.open(linkedInUrl, "_blank");
      }
    }
    setLinkedInModalOpen(true);
    setLinkedInPasteText("");
    setEnrichError(null);
  };

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nom complet *</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  required
                  defaultValue={p?.contactName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  required
                  defaultValue={p?.contactEmail}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactRole">Rôle / Poste</Label>
                <Input
                  id="contactRole"
                  name="contactRole"
                  defaultValue={p?.contactRole}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactLinkedInUrl">LinkedIn contact</Label>
                <Input
                  id="contactLinkedInUrl"
                  name="contactLinkedInUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  defaultValue={p?.contactLinkedInUrl}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom entreprise *</Label>
              <Input
                id="companyName"
                name="companyName"
                required
                defaultValue={p?.companyName}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Site web</Label>
                <Input
                  id="companyWebsite"
                  name="companyWebsite"
                  type="url"
                  defaultValue={p?.companyWebsite}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyLinkedInUrl">LinkedIn entreprise</Label>
                <Input
                  id="companyLinkedInUrl"
                  name="companyLinkedInUrl"
                  type="url"
                  defaultValue={p?.companyLinkedInUrl}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="industry">Secteur</Label>
                <Input
                  id="industry"
                  name="industry"
                  defaultValue={p?.industry}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={p?.country}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" name="city" defaultValue={p?.city} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Personnalisation (pour l&apos;IA)</CardTitle>
            <p className="text-sm text-slate-500">
              Plus tu renseignes, plus les emails générés seront personnalisés.
              Utilise les boutons IA pour enrichir automatiquement.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {enrichError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {enrichError}
              </div>
            )}

            {/* LinkedIn Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="linkedInSummary">Résumé profil LinkedIn</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openLinkedInModal}
                  disabled={enrichingLinkedIn}
                  className="gap-1.5 text-xs"
                >
                  {enrichingLinkedIn ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Linkedin className="h-3.5 w-3.5" />
                  )}
                  Enrichir depuis LinkedIn
                </Button>
              </div>
              <Textarea
                id="linkedInSummary"
                name="linkedInSummary"
                rows={4}
                value={linkedInSummary}
                onChange={(e) => setLinkedInSummary(e.target.value)}
                placeholder="Résumé généré par l'IA ou saisi manuellement..."
              />
            </div>

            {/* Company Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="companyInfo">Infos entreprise</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEnrichCompany}
                  disabled={enrichingCompany}
                  className="gap-1.5 text-xs"
                >
                  {enrichingCompany ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Globe className="h-3.5 w-3.5" />
                  )}
                  Analyser le site web
                </Button>
              </div>
              <Textarea
                id="companyInfo"
                name="companyInfo"
                rows={4}
                value={companyInfo}
                onChange={(e) => setCompanyInfo(e.target.value)}
                placeholder="Infos générées par l'IA ou saisies manuellement..."
              />
            </div>

            {/* Common Points */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="commonPoints">
                  Points d&apos;accroche / éléments communs
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCommonPoints}
                  disabled={
                    enrichingCommonPoints ||
                    (!linkedInSummary && !companyInfo)
                  }
                  className="gap-1.5 text-xs"
                >
                  {enrichingCommonPoints ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Générer avec l&apos;IA
                </Button>
              </div>
              <Textarea
                id="commonPoints"
                name="commonPoints"
                rows={4}
                value={commonPoints}
                onChange={(e) => setCommonPoints(e.target.value)}
                placeholder="Points d'accroche générés par l'IA ou saisis manuellement..."
              />
              {!linkedInSummary && !companyInfo && (
                <p className="text-xs text-slate-400">
                  Renseigne le résumé LinkedIn ou les infos entreprise pour
                  activer la génération
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="opportunityType">
                  Type d&apos;opportunité recherchée
                </Label>
                <Input
                  id="opportunityType"
                  name="opportunityType"
                  defaultValue={p?.opportunityType}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Langue préférée</Label>
                <Input
                  id="preferredLanguage"
                  name="preferredLanguage"
                  defaultValue={p?.preferredLanguage ?? "fr"}
                  placeholder="fr, en, es..."
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source">Source du lead</Label>
                <Input id="source" name="source" defaultValue={p?.source} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes personnelles</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={p?.notes}
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading
              ? "Enregistrement..."
              : isEdit
                ? "Mettre à jour"
                : "Créer le prospect"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
        </div>
      </form>

      {/* LinkedIn Paste Modal */}
      {linkedInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Enrichir depuis LinkedIn
              </h3>
              <button
                type="button"
                onClick={() => setLinkedInModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Instructions :</p>
                  <ol className="mt-1 list-inside list-decimal space-y-1">
                    <li>
                      Le profil LinkedIn s&apos;est ouvert dans un nouvel onglet
                      (sinon, ouvre-le manuellement)
                    </li>
                    <li>
                      Sélectionne tout le contenu de la page (Ctrl+A) puis
                      copie-le (Ctrl+C)
                    </li>
                    <li>Colle le texte ci-dessous (Ctrl+V)</li>
                  </ol>
                </div>
              </div>
            </div>

            <Textarea
              value={linkedInPasteText}
              onChange={(e) => setLinkedInPasteText(e.target.value)}
              rows={8}
              placeholder="Collez ici le contenu copié depuis la page LinkedIn..."
              className="mb-4"
            />

            {enrichError && (
              <p className="mb-3 text-sm text-red-600">{enrichError}</p>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLinkedInModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleEnrichLinkedIn}
                disabled={
                  enrichingLinkedIn || linkedInPasteText.trim().length < 50
                }
              >
                {enrichingLinkedIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyser avec l&apos;IA
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
