"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Loader2,
  Save,
  CheckCircle,
  User,
  Briefcase,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProfileData {
  fullName: string;
  headline: string;
  presentation: string;
  desiredRoles: string;
  desiredLocations: string;
  desiredIndustries: string;
  workPreferences: string;
  keySkills: string;
  uniqueValue: string;
  additionalContext: string;
  cvFrText: string;
  cvEnText: string;
  cvFrFilename: string;
  cvEnFilename: string;
}

const EMPTY_PROFILE: ProfileData = {
  fullName: "",
  headline: "",
  presentation: "",
  desiredRoles: "",
  desiredLocations: "",
  desiredIndustries: "",
  workPreferences: "",
  keySkills: "",
  uniqueValue: "",
  additionalContext: "",
  cvFrText: "",
  cvEnText: "",
  cvFrFilename: "",
  cvEnFilename: "",
};

export function ProfileForm() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFr, setUploadingFr] = useState(false);
  const [uploadingEn, setUploadingEn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputFrRef = useRef<HTMLInputElement>(null);
  const fileInputEnRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile({
          fullName: data.fullName ?? "",
          headline: data.headline ?? "",
          presentation: data.presentation ?? "",
          desiredRoles: data.desiredRoles ?? "",
          desiredLocations: data.desiredLocations ?? "",
          desiredIndustries: data.desiredIndustries ?? "",
          workPreferences: data.workPreferences ?? "",
          keySkills: data.keySkills ?? "",
          uniqueValue: data.uniqueValue ?? "",
          additionalContext: data.additionalContext ?? "",
          cvFrText: data.cvFrText ?? "",
          cvEnText: data.cvEnText ?? "",
          cvFrFilename: data.cvFrFilename ?? "",
          cvEnFilename: data.cvEnFilename ?? "",
        });
      })
      .catch(() => setError("Impossible de charger le profil"))
      .finally(() => setLoadingProfile(false));
  }, []);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          headline: profile.headline,
          presentation: profile.presentation,
          desiredRoles: profile.desiredRoles,
          desiredLocations: profile.desiredLocations,
          desiredIndustries: profile.desiredIndustries,
          workPreferences: profile.workPreferences,
          keySkills: profile.keySkills,
          uniqueValue: profile.uniqueValue,
          additionalContext: profile.additionalContext,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur");
      }

      showSuccess("Profil sauvegardé");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleCvUpload = async (
    file: File,
    language: "fr" | "en"
  ) => {
    const setUploading = language === "fr" ? setUploadingFr : setUploadingEn;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", language);

      const res = await fetch("/api/profile/cv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur");
      }

      const { summary, filename } = await res.json();

      if (language === "fr") {
        setProfile((p) => ({ ...p, cvFrText: summary, cvFrFilename: filename }));
      } else {
        setProfile((p) => ({ ...p, cvEnText: summary, cvEnFilename: filename }));
      }

      showSuccess(
        `CV ${language === "fr" ? "français" : "anglais"} analysé et sauvegardé`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'upload");
    } finally {
      setUploading(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">Chargement du profil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-slate-600" />
            <CardTitle>Identité</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Boris Molton"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Titre / Headline</Label>
              <Input
                id="headline"
                value={profile.headline}
                onChange={(e) => updateField("headline", e.target.value)}
                placeholder="Data Engineer | IA & Cloud"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="presentation">Présentation personnelle</Label>
            <Textarea
              id="presentation"
              value={profile.presentation}
              onChange={(e) => updateField("presentation", e.target.value)}
              rows={4}
              placeholder="Décris-toi en quelques phrases : ton parcours, ce qui te motive, ce que tu apportes..."
            />
          </div>
        </CardContent>
      </Card>

      {/* CV Upload */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <CardTitle>CV</CardTitle>
          </div>
          <p className="text-sm text-slate-500">
            Uploade ton CV en PDF. L&apos;IA l&apos;analysera pour en extraire les
            informations clés.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CV FR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>CV Français</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputFrRef.current?.click()}
                disabled={uploadingFr}
                className="gap-1.5"
              >
                {uploadingFr ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadingFr
                  ? "Analyse en cours..."
                  : profile.cvFrFilename
                    ? "Remplacer"
                    : "Uploader PDF"}
              </Button>
              <input
                ref={fileInputFrRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCvUpload(file, "fr");
                  e.target.value = "";
                }}
              />
            </div>
            {profile.cvFrFilename && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{profile.cvFrFilename}</span>
                </div>
                {profile.cvFrText && (
                  <p className="mt-2 whitespace-pre-line text-xs text-slate-500 line-clamp-4">
                    {profile.cvFrText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* CV EN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>CV Anglais</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputEnRef.current?.click()}
                disabled={uploadingEn}
                className="gap-1.5"
              >
                {uploadingEn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadingEn
                  ? "Analyse en cours..."
                  : profile.cvEnFilename
                    ? "Remplacer"
                    : "Uploader PDF"}
              </Button>
              <input
                ref={fileInputEnRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCvUpload(file, "en");
                  e.target.value = "";
                }}
              />
            </div>
            {profile.cvEnFilename && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{profile.cvEnFilename}</span>
                </div>
                {profile.cvEnText && (
                  <p className="mt-2 whitespace-pre-line text-xs text-slate-500 line-clamp-4">
                    {profile.cvEnText}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-slate-600" />
            <CardTitle>Préférences de candidature</CardTitle>
          </div>
          <p className="text-sm text-slate-500">
            Ces informations aident l&apos;IA à adapter le contenu et le ton
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="desiredRoles">Postes recherchés</Label>
              <Input
                id="desiredRoles"
                value={profile.desiredRoles}
                onChange={(e) => updateField("desiredRoles", e.target.value)}
                placeholder="Data Engineer, ML Engineer, IA Lead..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desiredIndustries">Secteurs visés</Label>
              <Input
                id="desiredIndustries"
                value={profile.desiredIndustries}
                onChange={(e) =>
                  updateField("desiredIndustries", e.target.value)
                }
                placeholder="Tech, Finance, Santé, Énergie..."
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <Label htmlFor="desiredLocations">
                  Localisations souhaitées
                </Label>
              </div>
              <Input
                id="desiredLocations"
                value={profile.desiredLocations}
                onChange={(e) =>
                  updateField("desiredLocations", e.target.value)
                }
                placeholder="Paris, Lyon, Remote, International..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workPreferences">Préférences de travail</Label>
              <Input
                id="workPreferences"
                value={profile.workPreferences}
                onChange={(e) =>
                  updateField("workPreferences", e.target.value)
                }
                placeholder="Full remote, Hybride, CDI, Freelance..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value proposition */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-slate-600" />
            <CardTitle>Ce qui te rend unique</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keySkills">Compétences clés</Label>
            <Textarea
              id="keySkills"
              value={profile.keySkills}
              onChange={(e) => updateField("keySkills", e.target.value)}
              rows={2}
              placeholder="Python, SQL, Spark, AWS, Machine Learning, Leadership technique..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uniqueValue">Proposition de valeur unique</Label>
            <Textarea
              id="uniqueValue"
              value={profile.uniqueValue}
              onChange={(e) => updateField("uniqueValue", e.target.value)}
              rows={3}
              placeholder="Qu'est-ce qui te différencie ? Tes accomplissements marquants, ta double compétence, ton expérience particulière..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalContext">
              Contexte additionnel pour l&apos;IA
            </Label>
            <Textarea
              id="additionalContext"
              value={profile.additionalContext}
              onChange={(e) =>
                updateField("additionalContext", e.target.value)
              }
              rows={3}
              placeholder="Tout ce que l'IA devrait savoir : ton style de communication préféré, des choses à ne jamais mentionner, des éléments de contexte importants..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Sauvegarde..." : "Sauvegarder le profil"}
        </Button>
      </div>
    </div>
  );
}
