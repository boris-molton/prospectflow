import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  extractTextFromPdf,
  summarizeCvWithAI,
  saveCvText,
} from "@/services/profile.service";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const language = (formData.get("language") as string) || "fr";

    if (!file) {
      return NextResponse.json(
        { error: "Fichier PDF requis" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Seuls les fichiers PDF sont acceptés" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10 MB)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rawText = await extractTextFromPdf(buffer);

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: "Impossible d'extraire du texte de ce PDF. Vérifiez que le PDF contient du texte et non des images." },
        { status: 400 }
      );
    }

    const lang = language === "en" ? "en" : "fr";
    const summary = await summarizeCvWithAI(rawText, lang);

    await saveCvText(userId, lang, summary, file.name);

    return NextResponse.json({
      summary,
      filename: file.name,
      language: lang,
    });
  } catch (error) {
    console.error("CV upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du traitement du CV",
      },
      { status: 500 }
    );
  }
}
