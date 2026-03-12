import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateCommonPoints } from "@/services/enrichment.service";
import { getProfileForAI } from "@/services/profile.service";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { linkedInSummary, companyInfo, contactRole, industry, notes, opportunityType } =
      await request.json();

    if (!linkedInSummary && !companyInfo) {
      return NextResponse.json(
        {
          error:
            "Au moins le résumé LinkedIn ou les infos entreprise sont nécessaires",
        },
        { status: 400 }
      );
    }

    const candidateProfile = await getProfileForAI(userId);

    const points = await generateCommonPoints({
      linkedInSummary,
      companyInfo,
      contactRole,
      industry,
      notes,
      opportunityType,
      candidateProfile: candidateProfile ?? undefined,
    });

    return NextResponse.json({ points });
  } catch (error) {
    console.error("Common points generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la génération des points d'accroche",
      },
      { status: 500 }
    );
  }
}
