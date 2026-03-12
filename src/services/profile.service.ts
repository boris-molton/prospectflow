import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface UserProfileData {
  fullName?: string;
  headline?: string;
  presentation?: string;
  desiredRoles?: string;
  desiredLocations?: string;
  desiredIndustries?: string;
  workPreferences?: string;
  keySkills?: string;
  uniqueValue?: string;
  additionalContext?: string;
}

export async function getOrCreateProfile(userId: string) {
  let profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { userId },
    });
  }

  return profile;
}

export async function updateProfile(userId: string, data: UserProfileData) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function saveCvText(
  userId: string,
  language: "fr" | "en",
  text: string,
  filename: string
) {
  const data =
    language === "fr"
      ? { cvFrText: text, cvFrFilename: filename }
      : { cvEnText: text, cvEnFilename: filename };

  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Import lib directly to avoid the test file loading in pdf-parse's index.js
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (buf: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text;
}

export async function summarizeCvWithAI(cvText: string, language: "fr" | "en"): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY non configurée");
  }

  const lang = language === "fr" ? "français" : "anglais";

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `Tu es un expert en analyse de CV. Tu produis des résumés structurés et exploitables pour la personnalisation d'emails de candidature spontanée. Écris en ${lang}.`,
      },
      {
        role: "user",
        content: `Analyse ce CV et produis un résumé structuré qui servira de base pour personnaliser des emails de candidature spontanée.

Le résumé doit couvrir :
- **Profil** : titre, poste actuel, années d'expérience
- **Compétences clés** : top 5-8 compétences techniques et soft skills
- **Expériences marquantes** : 2-3 réalisations concrètes avec résultats
- **Formation** : diplômes clés
- **Points forts différenciants** : ce qui rend ce profil unique

Sois factuel et concis (300-400 mots max).

---

${cvText.slice(0, 8000)}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function getProfileForAI(userId: string): Promise<string | null> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  const parts: string[] = [];

  if (profile.fullName) {
    parts.push(`Nom : ${profile.fullName}`);
  }
  if (profile.headline) {
    parts.push(`Titre : ${profile.headline}`);
  }
  if (profile.presentation) {
    parts.push(`Présentation : ${profile.presentation}`);
  }
  if (profile.keySkills) {
    parts.push(`Compétences clés : ${profile.keySkills}`);
  }
  if (profile.uniqueValue) {
    parts.push(`Proposition de valeur unique : ${profile.uniqueValue}`);
  }
  if (profile.desiredRoles) {
    parts.push(`Postes recherchés : ${profile.desiredRoles}`);
  }
  if (profile.desiredLocations) {
    parts.push(`Localisations souhaitées : ${profile.desiredLocations}`);
  }
  if (profile.desiredIndustries) {
    parts.push(`Secteurs visés : ${profile.desiredIndustries}`);
  }
  if (profile.workPreferences) {
    parts.push(`Préférences de travail : ${profile.workPreferences}`);
  }
  if (profile.additionalContext) {
    parts.push(`Contexte additionnel : ${profile.additionalContext}`);
  }
  if (profile.cvFrText) {
    parts.push(`\n--- Résumé CV (FR) ---\n${profile.cvFrText}`);
  }
  if (profile.cvEnText) {
    parts.push(`\n--- Résumé CV (EN) ---\n${profile.cvEnText}`);
  }

  return parts.length > 0 ? parts.join("\n") : null;
}
