"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Mail,
  MailCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardData {
  stats: {
    totalProspects: number;
    emailsNotSent: number;
    emailsSent: number;
    responsesReceived: number;
    responseRate: number;
    positiveResponseRate: number;
    toFollowUp: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string | null;
    createdAt: string;
    prospect: { id: string; contactName: string; companyName: string };
  }>;
}

const statCards = [
  {
    key: "totalProspects",
    label: "Prospects",
    icon: Users,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
  {
    key: "emailsNotSent",
    label: "À contacter",
    icon: Mail,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  {
    key: "emailsSent",
    label: "Emails envoyés",
    icon: MailCheck,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    key: "responsesReceived",
    label: "Réponses",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    key: "toFollowUp",
    label: "À relancer",
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
];

const activityLabels: Record<string, string> = {
  PROSPECT_CREATED: "Prospect créé",
  PROSPECT_UPDATED: "Prospect mis à jour",
  STATUS_CHANGED: "Statut modifié",
  EMAIL_GENERATED: "Email généré",
  EMAIL_SENT: "Email envoyé",
  FOLLOWUP_SENT: "Relance envoyée",
  REPLY_RECEIVED: "Réponse reçue",
  TAG_ADDED: "Tag ajouté",
  NOTE_ADDED: "Note ajoutée",
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const loadDashboard = () =>
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!data) return;
    fetch("/api/gmail/check-replies", { method: "POST" })
      .then((res) => res.json())
      .then((result) => {
        if (result.repliesFound > 0) {
          setCheckResult(
            `${result.repliesFound} nouvelle(s) réponse(s) détectée(s)`
          );
          loadDashboard();
        }
      })
      .catch(() => {});
  }, [!!data]);

  const checkReplies = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch("/api/gmail/check-replies", { method: "POST" });
      const result = await res.json();
      if (result.error) {
        setCheckResult(`Erreur: ${result.error}`);
      } else if (result.repliesFound > 0) {
        setCheckResult(
          `${result.repliesFound} nouvelle(s) réponse(s) détectée(s) !`
        );
        loadDashboard();
      } else {
        setCheckResult(
          `${result.checked} thread(s) vérifiés – aucune nouvelle réponse`
        );
      }
    } catch {
      setCheckResult("Erreur de vérification");
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 rounded bg-slate-200" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded bg-slate-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentActivity } = data;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats as Record<string, number>)[key] ?? 0}
              </div>
              {key === "responsesReceived" && stats.emailsSent > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Taux: {stats.responseRate}% · Positives: {stats.positiveResponseRate}%
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <p className="text-sm text-slate-500">
              Dernières actions sur tes prospects
            </p>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="py-8 text-center text-slate-500">
                Aucune activité pour le moment
              </p>
            ) : (
              <ul className="space-y-4">
                {recentActivity.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-slate-400" />
                      <div>
                        <Link
                          href={`/prospects/${activity.prospect.id}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {activity.prospect.contactName} · {activity.prospect.companyName}
                        </Link>
                        <p className="text-sm text-slate-500">
                          {activityLabels[activity.type] ?? activity.type} ·{" "}
                          {activity.description ?? ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(activity.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-between">
              <Link href="/prospects/new">
                Nouveau prospect
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/prospects">
                Voir tous les prospects
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={checkReplies}
              disabled={checking}
            >
              {checking ? (
                <>
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Vérification...
                  </span>
                </>
              ) : (
                <>
                  Vérifier les réponses Gmail
                  <RefreshCw className="h-4 w-4" />
                </>
              )}
            </Button>
            {checkResult && (
              <p className="text-xs text-slate-600 mt-1">{checkResult}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
