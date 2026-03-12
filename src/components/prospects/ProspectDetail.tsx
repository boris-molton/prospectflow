"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Sparkles,
  ExternalLink,
  Building2,
  User,
  Linkedin,
  Globe,
  Loader2,
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Lightbulb,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { EmailComposer } from "./EmailComposer";

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

interface ProspectDetailProps {
  prospect: {
    id: string;
    contactName: string;
    contactEmail: string;
    contactRole?: string | null;
    contactLinkedInUrl?: string | null;
    companyName: string;
    companyWebsite?: string | null;
    companyLinkedInUrl?: string | null;
    industry?: string | null;
    country?: string | null;
    city?: string | null;
    linkedInSummary?: string | null;
    companyInfo?: string | null;
    commonPoints?: string | null;
    opportunityType?: string | null;
    notes?: string | null;
    source?: string | null;
    status: string;
    preferredLanguage?: string | null;
    tags: Array<{ tag: { name: string } }>;
    emailsSent: Array<{
      id: string;
      subject: string;
      sentAt: Date | string;
      type: string;
    }>;
    replies: Array<{
      id: string;
      fromEmail: string;
      fromName?: string | null;
      subject?: string | null;
      body: string;
      snippet?: string | null;
      receivedAt: Date | string;
      sentiment: string;
      aiAnalysis?: string | null;
      aiSuggestion?: string | null;
    }>;
    activities: Array<{
      id: string;
      type: string;
      description: string | null;
      createdAt: Date | string;
    }>;
  };
}

function ReplyCard({
  reply,
  sentimentConfig,
  SentimentIcon,
}: {
  reply: ProspectDetailProps["prospect"]["replies"][number];
  sentimentConfig: { color: string; bg: string; border: string; label: string };
  SentimentIcon: React.ComponentType<{ className?: string }>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg border ${sentimentConfig.border} ${sentimentConfig.bg} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <SentimentIcon className={`h-4 w-4 shrink-0 ${sentimentConfig.color}`} />
            <Badge variant="secondary" className={`text-xs ${sentimentConfig.color}`}>
              {sentimentConfig.label}
            </Badge>
            <span className="text-xs text-slate-500">
              {new Date(reply.receivedAt as string).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            De : {reply.fromName ? `${reply.fromName} (${reply.fromEmail})` : reply.fromEmail}
          </p>
          {reply.subject && (
            <p className="text-xs text-slate-500 truncate">
              Objet : {reply.subject}
            </p>
          )}
        </div>
      </div>

      {reply.aiAnalysis && (
        <div className="mt-2 rounded border border-slate-200 bg-white p-2">
          <p className="text-xs font-medium text-slate-700">Analyse IA</p>
          <p className="text-xs text-slate-600 mt-0.5">{reply.aiAnalysis}</p>
        </div>
      )}

      {reply.aiSuggestion && (
        <div className="mt-1.5 flex items-start gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
          <p className="text-xs text-amber-700">{reply.aiSuggestion}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-blue-600 hover:underline"
      >
        {expanded ? "Masquer le contenu" : "Voir le contenu complet"}
      </button>

      {expanded && (
        <div className="mt-2 rounded border border-slate-200 bg-white p-3">
          <p className="whitespace-pre-line text-xs text-slate-700 max-h-64 overflow-y-auto">
            {reply.body}
          </p>
        </div>
      )}
    </div>
  );
}

export function ProspectDetail({ prospect }: ProspectDetailProps) {
  const router = useRouter();
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  const [linkedInSummary, setLinkedInSummary] = useState(
    prospect.linkedInSummary ?? ""
  );
  const [companyInfo, setCompanyInfo] = useState(prospect.companyInfo ?? "");
  const [commonPoints, setCommonPoints] = useState(
    prospect.commonPoints ?? ""
  );

  const [linkedInModalOpen, setLinkedInModalOpen] = useState(false);
  const [linkedInPasteText, setLinkedInPasteText] = useState("");
  const [enrichingLinkedIn, setEnrichingLinkedIn] = useState(false);
  const [enrichingCompany, setEnrichingCompany] = useState(false);
  const [enrichingCommonPoints, setEnrichingCommonPoints] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [enrichSuccess, setEnrichSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function patchProspect(data: Record<string, string | undefined>) {
    const res = await fetch(`/api/prospects/${prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Erreur de sauvegarde");
    }
    return res.json();
  }

  function showSuccess(msg: string) {
    setEnrichSuccess(msg);
    setTimeout(() => setEnrichSuccess(null), 4000);
  }

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
      await patchProspect({ linkedInSummary: summary });
      setLinkedInSummary(summary);
      setLinkedInModalOpen(false);
      setLinkedInPasteText("");
      showSuccess("Profil LinkedIn analysé et sauvegardé");
      router.refresh();
    } catch (err) {
      setEnrichError(
        err instanceof Error ? err.message : "Erreur d'enrichissement"
      );
    } finally {
      setEnrichingLinkedIn(false);
    }
  };

  const handleEnrichCompany = async () => {
    if (!prospect.companyWebsite) {
      setEnrichError("Aucune URL de site web renseignée pour ce prospect");
      return;
    }

    setEnrichingCompany(true);
    setEnrichError(null);

    try {
      const res = await fetch("/api/enrich/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: prospect.companyWebsite }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur");
      }

      const { summary } = await res.json();
      await patchProspect({ companyInfo: summary });
      setCompanyInfo(summary);
      showSuccess("Site web analysé et sauvegardé");
      router.refresh();
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
        "Enrichis d'abord le profil LinkedIn ou les infos entreprise"
      );
      return;
    }

    setEnrichingCommonPoints(true);
    setEnrichError(null);

    try {
      const res = await fetch("/api/enrich/common-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedInSummary: linkedInSummary || undefined,
          companyInfo: companyInfo || undefined,
          contactRole: prospect.contactRole ?? undefined,
          industry: prospect.industry ?? undefined,
          notes: prospect.notes ?? undefined,
          opportunityType: prospect.opportunityType ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur");
      }

      const { points } = await res.json();
      await patchProspect({ commonPoints: points });
      setCommonPoints(points);
      showSuccess("Points d'accroche générés et sauvegardés");
      router.refresh();
    } catch (err) {
      setEnrichError(
        err instanceof Error ? err.message : "Erreur de génération"
      );
    } finally {
      setEnrichingCommonPoints(false);
    }
  };

  const openLinkedInModal = () => {
    if (prospect.contactLinkedInUrl) {
      window.open(prospect.contactLinkedInUrl, "_blank");
    }
    setLinkedInModalOpen(true);
    setLinkedInPasteText("");
    setEnrichError(null);
  };

  const handleDeleteProspect = async () => {
    if (!confirm(`Supprimer ${prospect.contactName} et toutes ses données (emails envoyés, réponses, activités) ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/prospects");
    } catch {
      setEnrichError("Erreur lors de la suppression");
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/prospects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteProspect}
              disabled={deleting}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/prospects/${prospect.id}/edit`}>Modifier</Link>
            </Button>
            <Button onClick={() => setShowEmailComposer(!showEmailComposer)}>
              <Mail className="mr-2 h-4 w-4" />
              {showEmailComposer ? "Masquer" : "Générer & Envoyer un email"}
            </Button>
          </div>
        </div>

        {showEmailComposer && (
          <EmailComposer
            prospect={prospect}
            onClose={() => setShowEmailComposer(false)}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {prospect.contactName}
                    </CardTitle>
                    <p className="mt-1 text-slate-600">
                      {prospect.companyName}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {STATUS_LABELS[prospect.status] ?? prospect.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {prospect.tags.map(({ tag }) => (
                    <Badge key={tag.name} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <a
                      href={`mailto:${prospect.contactEmail}`}
                      className="text-blue-600 hover:underline"
                    >
                      {prospect.contactEmail}
                    </a>
                  </div>
                  {prospect.contactRole && (
                    <p className="text-sm text-slate-600">
                      {prospect.contactRole}
                    </p>
                  )}
                  {prospect.contactLinkedInUrl && (
                    <a
                      href={prospect.contactLinkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn contact
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  {prospect.companyWebsite && (
                    <a
                      href={prospect.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Building2 className="h-4 w-4" />
                      {prospect.companyWebsite}
                    </a>
                  )}
                  {prospect.companyLinkedInUrl && (
                    <a
                      href={prospect.companyLinkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      LinkedIn entreprise
                    </a>
                  )}
                </div>
                {(prospect.industry ||
                  prospect.city ||
                  prospect.country) && (
                  <p className="text-sm text-slate-500">
                    {[prospect.industry, prospect.city, prospect.country]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Enrichment / Personalization Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informations pour personnalisation</CardTitle>
                <p className="text-sm text-slate-500">
                  Enrichis les données avec l&apos;IA pour de meilleurs emails
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {enrichError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {enrichError}
                  </div>
                )}
                {enrichSuccess && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {enrichSuccess}
                  </div>
                )}

                {/* LinkedIn Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">
                      Profil LinkedIn
                    </p>
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
                      {linkedInSummary
                        ? "Re-analyser"
                        : "Enrichir depuis LinkedIn"}
                    </Button>
                  </div>
                  {linkedInSummary ? (
                    <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      {linkedInSummary}
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      Aucun résumé LinkedIn. Clique sur le bouton pour enrichir.
                    </p>
                  )}
                </div>

                {/* Company Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">
                      Entreprise
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEnrichCompany}
                      disabled={enrichingCompany || !prospect.companyWebsite}
                      className="gap-1.5 text-xs"
                    >
                      {enrichingCompany ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Globe className="h-3.5 w-3.5" />
                      )}
                      {companyInfo ? "Re-analyser" : "Analyser le site web"}
                    </Button>
                  </div>
                  {companyInfo ? (
                    <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      {companyInfo}
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      {prospect.companyWebsite
                        ? "Aucune info. Clique sur le bouton pour analyser le site web."
                        : "Renseigne l'URL du site web (page Modifier) pour activer l'analyse."}
                    </p>
                  )}
                </div>

                {/* Common Points */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">
                      Points d&apos;accroche
                    </p>
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
                      {commonPoints ? "Régénérer" : "Générer avec l'IA"}
                    </Button>
                  </div>
                  {commonPoints ? (
                    <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      {commonPoints}
                    </p>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      {linkedInSummary || companyInfo
                        ? "Clique sur le bouton pour générer des points d'accroche."
                        : "Enrichis d'abord le profil LinkedIn ou les infos entreprise."}
                    </p>
                  )}
                </div>

                {prospect.notes && (
                  <div>
                    <p className="text-sm font-medium text-slate-600">Notes</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                      {prospect.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emails envoyés</CardTitle>
              </CardHeader>
              <CardContent>
                {prospect.emailsSent.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun email envoyé</p>
                ) : (
                  <ul className="space-y-2">
                    {prospect.emailsSent.map((email) => (
                      <li
                        key={email.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 p-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {email.subject}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(
                              email.sentAt as string
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {prospect.replies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Réponses reçues ({prospect.replies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {prospect.replies.map((reply) => {
                    const sentimentConfig = {
                      POSITIVE: { icon: ThumbsUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Positive" },
                      NEGATIVE: { icon: ThumbsDown, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Négative" },
                      NEUTRAL: { icon: Minus, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", label: "Neutre" },
                    }[reply.sentiment] ?? { icon: Minus, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", label: "Neutre" };
                    const SentimentIcon = sentimentConfig.icon;

                    return (
                      <ReplyCard
                        key={reply.id}
                        reply={reply}
                        sentimentConfig={sentimentConfig}
                        SentimentIcon={SentimentIcon}
                      />
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Activité</CardTitle>
              </CardHeader>
              <CardContent>
                {prospect.activities.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune activité</p>
                ) : (
                  <ul className="space-y-3">
                    {prospect.activities.slice(0, 10).map((activity) => (
                      <li
                        key={activity.id}
                        className="flex gap-2 text-sm"
                      >
                        <div className="h-2 w-2 shrink-0 rounded-full bg-slate-300 mt-1.5" />
                        <div>
                          <p>{activity.description ?? activity.type}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(
                              activity.createdAt as string
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
