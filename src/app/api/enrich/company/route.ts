import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { scrapeAndSummarizeCompany } from "@/services/enrichment.service";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { websiteUrl } = await request.json();

    if (!websiteUrl || typeof websiteUrl !== "string") {
      return NextResponse.json(
        { error: "L'URL du site web est requise" },
        { status: 400 }
      );
    }

    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: "URL invalide" },
        { status: 400 }
      );
    }

    const summary = await scrapeAndSummarizeCompany(websiteUrl);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Company enrichment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'analyse du site web",
      },
      { status: 500 }
    );
  }
}
