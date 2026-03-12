import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { summarizeLinkedInProfile } from "@/services/enrichment.service";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { profileText } = await request.json();

    if (!profileText || typeof profileText !== "string") {
      return NextResponse.json(
        { error: "Le texte du profil LinkedIn est requis" },
        { status: 400 }
      );
    }

    const summary = await summarizeLinkedInProfile(profileText);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("LinkedIn enrichment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'analyse du profil",
      },
      { status: 500 }
    );
  }
}
