import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkGmailReplies } from "@/services/gmail-reply.service";

export async function POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const accessToken = (session as { accessToken?: string }).accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Connexion Gmail requise. Reconnecte-toi avec Google." },
      { status: 400 }
    );
  }

  try {
    const result = await checkGmailReplies(accessToken);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Check replies error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de vérification" },
      { status: 500 }
    );
  }
}
