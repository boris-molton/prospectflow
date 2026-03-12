import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProspect, createActivity } from "@/services/prospect.service";
import { generateEmail } from "@/services/ai.service";
import { getProfileForAI } from "@/services/profile.service";
import type { EmailTone } from "@/types";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const { prospectId, tone = "professionnel", language = "fr", isFollowUp, model } = await request.json();

    if (!prospectId) {
      return NextResponse.json(
        { error: "prospectId requis" },
        { status: 400 }
      );
    }

    const [prospect, candidateProfile] = await Promise.all([
      getProspect(prospectId),
      getProfileForAI(userId),
    ]);

    if (!prospect) {
      return NextResponse.json({ error: "Prospect non trouvé" }, { status: 404 });
    }

    let previousEmail: string | undefined;
    if (isFollowUp && prospect.emailsSent.length > 0) {
      const lastEmail = prospect.emailsSent[0];
      previousEmail = `Sujet: ${lastEmail.subject}\n\n${lastEmail.body}`;
    }

    const result = await generateEmail({
      contactName: prospect.contactName,
      contactRole: prospect.contactRole ?? undefined,
      companyName: prospect.companyName,
      companyWebsite: prospect.companyWebsite ?? undefined,
      industry: prospect.industry ?? undefined,
      linkedInSummary: prospect.linkedInSummary ?? undefined,
      companyInfo: prospect.companyInfo ?? undefined,
      commonPoints: prospect.commonPoints ?? undefined,
      opportunityType: prospect.opportunityType ?? undefined,
      notes: prospect.notes ?? undefined,
      tone: tone as EmailTone,
      language,
      isFollowUp: !!isFollowUp,
      previousEmail,
      candidateProfile: candidateProfile ?? undefined,
      model: model ?? undefined,
    });

    await createActivity(prospectId, "EMAIL_GENERATED", "Email généré par IA");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Email generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de génération" },
      { status: 500 }
    );
  }
}
