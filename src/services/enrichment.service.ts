import OpenAI from "openai";
import * as cheerio from "cheerio";
import {
  LINKEDIN_SUMMARY_SYSTEM,
  LINKEDIN_SUMMARY_PROMPT,
  COMPANY_SUMMARY_SYSTEM,
  COMPANY_SUMMARY_PROMPT,
  COMMON_POINTS_SYSTEM,
  buildCommonPointsPrompt,
} from "@/lib/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseJsonResponse(content: string): Record<string, string> {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned);
}

// ============ LINKEDIN ENRICHMENT ============

export async function summarizeLinkedInProfile(
  profileText: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY non configurée");
  }

  if (!profileText || profileText.trim().length < 50) {
    throw new Error(
      "Le texte du profil est trop court. Copiez plus de contenu depuis LinkedIn."
    );
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: LINKEDIN_SUMMARY_SYSTEM },
      {
        role: "user",
        content: `${LINKEDIN_SUMMARY_PROMPT}\n\n---\n\n${profileText}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Réponse vide de l'IA");

  try {
    const parsed = parseJsonResponse(content);
    return parsed.summary || content;
  } catch {
    return content;
  }
}

// ============ COMPANY WEBSITE SCRAPING ============

async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} pour ${url}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    $("script, style, nav, footer, header, iframe, noscript").remove();

    const text = $("body").text().replace(/\s+/g, " ").trim();
    return text.slice(0, 8000);
  } finally {
    clearTimeout(timeout);
  }
}

async function tryFetchAboutPage(baseUrl: string): Promise<string | null> {
  const aboutPaths = [
    "/about",
    "/about-us",
    "/a-propos",
    "/qui-sommes-nous",
    "/company",
    "/about/",
    "/fr/about",
  ];

  const base = baseUrl.replace(/\/$/, "");

  for (const path of aboutPaths) {
    try {
      const text = await fetchPageText(`${base}${path}`);
      if (text.length > 200) return text;
    } catch {
      continue;
    }
  }
  return null;
}

export async function scrapeAndSummarizeCompany(
  websiteUrl: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY non configurée");
  }

  if (!websiteUrl) {
    throw new Error("URL du site web requise");
  }

  let pageText: string;
  try {
    pageText = await fetchPageText(websiteUrl);
  } catch (err) {
    throw new Error(
      `Impossible d'accéder au site web: ${err instanceof Error ? err.message : "erreur réseau"}`
    );
  }

  const aboutText = await tryFetchAboutPage(websiteUrl);
  const combinedText = aboutText
    ? `--- PAGE PRINCIPALE ---\n${pageText}\n\n--- PAGE À PROPOS ---\n${aboutText}`
    : pageText;

  if (combinedText.length < 100) {
    throw new Error(
      "Pas assez de contenu récupéré depuis le site web. Le site est peut-être protégé ou vide."
    );
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: COMPANY_SUMMARY_SYSTEM },
      {
        role: "user",
        content: `${COMPANY_SUMMARY_PROMPT}\n\n---\n\n${combinedText.slice(0, 6000)}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Réponse vide de l'IA");

  try {
    const parsed = parseJsonResponse(content);
    return parsed.summary || content;
  } catch {
    return content;
  }
}

// ============ COMMON POINTS GENERATION ============

export async function generateCommonPoints(params: {
  linkedInSummary?: string;
  companyInfo?: string;
  contactRole?: string;
  industry?: string;
  notes?: string;
  opportunityType?: string;
  candidateProfile?: string;
}): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY non configurée");
  }

  if (!params.linkedInSummary && !params.companyInfo) {
    throw new Error(
      "Au moins le résumé LinkedIn ou les infos entreprise sont nécessaires pour générer des points d'accroche."
    );
  }

  const prompt = buildCommonPointsPrompt(params);

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: COMMON_POINTS_SYSTEM },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Réponse vide de l'IA");

  try {
    const parsed = parseJsonResponse(content);
    return parsed.points || content;
  } catch {
    return content;
  }
}
