import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProspect, createActivity } from "@/services/prospect.service";
import { sendEmailViaGmail } from "@/services/gmail.service";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
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
    const { prospectId, subject, body, emailType = "INITIAL" } = await request.json();

    if (!prospectId || !subject || !body) {
      return NextResponse.json(
        { error: "prospectId, subject et body requis" },
        { status: 400 }
      );
    }

    const prospect = await getProspect(prospectId);
    if (!prospect) {
      return NextResponse.json({ error: "Prospect non trouvé" }, { status: 404 });
    }

    const result = await sendEmailViaGmail({
      to: prospect.contactEmail,
      subject,
      body,
      accessToken,
    });

    const emailSent = await prisma.emailSent.create({
      data: {
        prospectId,
        subject,
        body,
        type: emailType,
        gmailMessageId: result.id,
        gmailThreadId: result.threadId,
      },
    });

    const newStatus = emailType === "INITIAL" ? "EN_ATTENTE_REPONSE" : "EN_ATTENTE_REPONSE";
    await prisma.prospect.update({
      where: { id: prospectId },
      data: { status: newStatus },
    });

    await createActivity(
      prospectId,
      emailType === "INITIAL" ? "EMAIL_SENT" : "FOLLOWUP_SENT",
      `Email envoyé: ${subject}`,
      { emailSentId: emailSent.id }
    );

    return NextResponse.json({
      success: true,
      emailSent: {
        id: emailSent.id,
        gmailMessageId: result.id,
        gmailThreadId: result.threadId,
      },
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur d'envoi" },
      { status: 500 }
    );
  }
}
