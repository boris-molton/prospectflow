import OpenAI from "openai";
import {
  buildEmailGenerationPrompt,
  EMAIL_GENERATION_SYSTEM,
  SUBJECT_GENERATION_PROMPT,
} from "@/lib/prompts";
import type { EmailTone } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerateEmailParams {
  contactName: string;
  contactRole?: string;
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  linkedInSummary?: string;
  companyInfo?: string;
  commonPoints?: string;
  opportunityType?: string;
  notes?: string;
  tone: EmailTone;
  language: string;
  isFollowUp?: boolean;
  previousEmail?: string;
  candidateProfile?: string;
  model?: string;
}

export interface GeneratedEmailResult {
  subject: string;
  body: string;
  suggestions?: string[];
}

export async function generateEmail(params: GenerateEmailParams): Promise<GeneratedEmailResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY non configurée");
  }

  const prompt = buildEmailGenerationPrompt({
    ...params,
    tone: params.tone,
  });

  const selectedModel = params.model || "gpt-5-mini";
  const supportsTemperature = ["gpt-4o", "gpt-4o-mini"].includes(selectedModel);

  const response = await openai.chat.completions.create({
    model: selectedModel,
    messages: [
      { role: "system", content: EMAIL_GENERATION_SYSTEM },
      { role: "user", content: prompt },
    ],
    ...(supportsTemperature && { temperature: 0.7 }),
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Réponse vide de l'IA");
  }

  try {
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
    return {
      subject: parsed.subject || "",
      body: parsed.body || "",
      suggestions: parsed.suggestions || [],
    };
  } catch {
    throw new Error("Format de réponse IA invalide");
  }
}

export async function generateSubjects(
  companyName: string,
  contactName: string,
  language = "fr"
): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY non configurée");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "user",
        content: `${SUBJECT_GENERATION_PROMPT}\n\nEntreprise: ${companyName}\nContact: ${contactName}\nLangue: ${language}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
    return parsed.subjects || [];
  } catch {
    return [];
  }
}
