"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, RotateCcw, X, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TONES = [
  { value: "professionnel", label: "Professionnel" },
  { value: "humain", label: "Humain" },
  { value: "direct", label: "Direct" },
  { value: "premium", label: "Premium" },
  { value: "concis", label: "Concis" },
];

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

const AI_MODELS = [
  { value: "gpt-5.4", label: "GPT-5.4 (flagship, raisonnement)" },
  { value: "gpt-5-mini", label: "GPT-5 Mini (rapide, économique)" },
  { value: "gpt-5.2", label: "GPT-5.2 (équilibré)" },
  { value: "o3-mini", label: "o3 Mini (raisonnement)" },
  { value: "o1", label: "o1 (raisonnement avancé)" },
  { value: "o1-mini", label: "o1 Mini (raisonnement)" },
  { value: "gpt-4o", label: "GPT-4o (legacy)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (legacy)" },
];

interface EmailComposerProps {
  prospect: { id: string; contactEmail: string };
  onClose: () => void;
}

export function EmailComposer({ prospect, onClose }: EmailComposerProps) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState("professionnel");
  const [language, setLanguage] = useState("fr");
  const [model, setModel] = useState("gpt-5-mini");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateEmail = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          tone,
          language,
          model,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur de génération");
      }

      const data = await res.json();
      setSubject(data.subject);
      setBody(data.body);
      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("Sujet et corps requis");
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          subject,
          body,
          emailType: "INITIAL",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur d'envoi");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-2 border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Composer un email
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Ton</Label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Langue</Label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Modèle IA</Label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              {AI_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={generateEmail}
              disabled={generating}
              variant="secondary"
            >
              {generating ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer avec l&apos;IA
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Objet</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet de l'email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Corps du message</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Clique sur 'Générer avec l'IA' pour créer un email personnalisé"
            rows={10}
            className="font-mono text-sm"
          />
        </div>

        {suggestions.length > 0 && (
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Suggestions d&apos;amélioration
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-amber-700">
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={sendEmail}
            disabled={sending || !subject.trim() || !body.trim()}
          >
            {sending ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer à {prospect.contactEmail}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={generateEmail}
            disabled={generating}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Régénérer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
