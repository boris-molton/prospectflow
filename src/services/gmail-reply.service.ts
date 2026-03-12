import { google } from "googleapis";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { createActivity } from "@/services/prospect.service";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ReplyCheckResult {
  checked: number;
  repliesFound: number;
  updatedProspects: string[];
  replies: Array<{
    prospectId: string;
    prospectName: string;
    companyName: string;
    sentiment: string;
    snippet: string;
  }>;
}

interface ParsedReply {
  gmailMessageId: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
  snippet: string;
  receivedAt: Date;
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractTextFromParts(parts: Array<{ mimeType?: string; body?: { data?: string }; parts?: Array<{ mimeType?: string; body?: { data?: string } }> }>): string {
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
  }
  for (const part of parts) {
    if (part.mimeType === "text/html" && part.body?.data) {
      const html = decodeBase64Url(part.body.data);
      return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
  }
  for (const part of parts) {
    if (part.parts) {
      const nested = extractTextFromParts(part.parts as typeof parts);
      if (nested) return nested;
    }
  }
  return "";
}

function parseEmailAddress(raw: string): { email: string; name: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].replace(/"/g, "").trim(), email: match[2].trim().toLowerCase() };
  return { name: "", email: raw.trim().toLowerCase() };
}

async function analyzeReplySentiment(
  replyBody: string,
  originalSubject: string,
  prospectName: string
): Promise<{ sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE"; analysis: string; suggestion: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { sentiment: "NEUTRAL", analysis: "Analyse IA non disponible", suggestion: "" };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en analyse de réponses à des emails de candidature spontanée.
Analyse la réponse reçue et détermine :
1. Le sentiment : POSITIVE (intéressé, veut un entretien, demande de CV, etc.), NEGATIVE (pas intéressé, pas de poste, refus), ou NEUTRAL (réponse automatique, absence, redirige vers un autre contact).
2. Une analyse courte (2-3 phrases) expliquant pourquoi.
3. Une suggestion d'action concrète pour le candidat (1 phrase).

Réponds en JSON : { "sentiment": "POSITIVE|NEUTRAL|NEGATIVE", "analysis": "...", "suggestion": "..." }`,
        },
        {
          role: "user",
          content: `Email original envoyé à ${prospectName} — Objet : "${originalSubject}"

Réponse reçue :
---
${replyBody.slice(0, 3000)}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());

    return {
      sentiment: ["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(parsed.sentiment)
        ? parsed.sentiment
        : "NEUTRAL",
      analysis: parsed.analysis ?? "",
      suggestion: parsed.suggestion ?? "",
    };
  } catch (err) {
    console.error("AI sentiment analysis error:", err);
    return { sentiment: "NEUTRAL", analysis: "Erreur d'analyse IA", suggestion: "" };
  }
}

export async function checkGmailReplies(
  accessToken: string
): Promise<ReplyCheckResult> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const userProfile = await gmail.users.getProfile({ userId: "me" });
  const userEmail = userProfile.data.emailAddress?.toLowerCase() ?? "";

  const pendingEmails = await prisma.emailSent.findMany({
    where: {
      gmailThreadId: { not: null },
      prospect: {
        status: { in: ["ENVOYE", "EN_ATTENTE_REPONSE", "RELANCE_A_FAIRE"] },
      },
    },
    include: {
      prospect: { select: { id: true, contactName: true, companyName: true, status: true } },
    },
  });

  const threadIds = [
    ...new Set(pendingEmails.map((e) => e.gmailThreadId).filter(Boolean)),
  ] as string[];

  const result: ReplyCheckResult = {
    checked: threadIds.length,
    repliesFound: 0,
    updatedProspects: [],
    replies: [],
  };

  const existingReplyMsgIds = new Set(
    (await prisma.emailReply.findMany({
      where: { gmailMessageId: { not: null } },
      select: { gmailMessageId: true },
    })).map((r) => r.gmailMessageId)
  );

  for (const threadId of threadIds) {
    try {
      const thread = await gmail.users.threads.get({
        userId: "me",
        id: threadId,
        format: "full",
      });

      const messages = thread.data.messages ?? [];
      if (messages.length <= 1) continue;

      const sentEmail = pendingEmails.find((e) => e.gmailThreadId === threadId);
      if (!sentEmail) continue;

      const replyMessages: ParsedReply[] = [];

      for (const msg of messages) {
        const msgId = msg.id ?? "";
        if (existingReplyMsgIds.has(msgId)) continue;

        const headers = msg.payload?.headers ?? [];
        const fromRaw = headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
        const { email: fromAddr, name: fromName } = parseEmailAddress(fromRaw);

        if (fromAddr.includes(userEmail)) continue;

        const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
        const dateStr = headers.find((h) => h.name?.toLowerCase() === "date")?.value;
        const receivedAt = dateStr ? new Date(dateStr) : new Date();

        let body = "";
        if (msg.payload?.parts) {
          body = extractTextFromParts(msg.payload.parts as Parameters<typeof extractTextFromParts>[0]);
        } else if (msg.payload?.body?.data) {
          body = decodeBase64Url(msg.payload.body.data);
        }

        replyMessages.push({
          gmailMessageId: msgId,
          fromEmail: fromAddr,
          fromName,
          subject,
          body: body || msg.snippet || "",
          snippet: msg.snippet ?? "",
          receivedAt,
        });
      }

      if (replyMessages.length === 0) continue;

      for (const reply of replyMessages) {
        const { sentiment, analysis, suggestion } = await analyzeReplySentiment(
          reply.body,
          sentEmail.subject,
          sentEmail.prospect.contactName
        );

        await prisma.emailReply.create({
          data: {
            prospectId: sentEmail.prospect.id,
            emailSentId: sentEmail.id,
            gmailMessageId: reply.gmailMessageId,
            gmailThreadId: threadId,
            fromEmail: reply.fromEmail,
            fromName: reply.fromName,
            subject: reply.subject,
            body: reply.body,
            snippet: reply.snippet,
            receivedAt: reply.receivedAt,
            sentiment,
            aiAnalysis: analysis,
            aiSuggestion: suggestion,
          },
        });

        existingReplyMsgIds.add(reply.gmailMessageId);

        result.replies.push({
          prospectId: sentEmail.prospect.id,
          prospectName: sentEmail.prospect.contactName,
          companyName: sentEmail.prospect.companyName,
          sentiment,
          snippet: reply.snippet.slice(0, 120),
        });
      }

      if (!result.updatedProspects.includes(sentEmail.prospect.id)) {
        const bestSentiment = replyMessages.length > 0
          ? (result.replies
              .filter((r) => r.prospectId === sentEmail.prospect.id)
              .some((r) => r.sentiment === "POSITIVE")
              ? "REPONSE_POSITIVE"
              : result.replies
                  .filter((r) => r.prospectId === sentEmail.prospect.id)
                  .every((r) => r.sentiment === "NEGATIVE")
                ? "REPONSE_NEGATIVE"
                : "REPONSE_RECUE")
          : "REPONSE_RECUE";

        await prisma.prospect.update({
          where: { id: sentEmail.prospect.id },
          data: { status: bestSentiment as "REPONSE_RECUE" | "REPONSE_POSITIVE" | "REPONSE_NEGATIVE" },
        });

        const sentimentLabel = bestSentiment === "REPONSE_POSITIVE"
          ? "positive"
          : bestSentiment === "REPONSE_NEGATIVE"
            ? "negative"
            : "recue";

        await createActivity(
          sentEmail.prospect.id,
          "REPLY_RECEIVED",
          `Réponse ${sentimentLabel} détectée – ${replyMessages.length} message(s)`
        );

        result.repliesFound += replyMessages.length;
        result.updatedProspects.push(sentEmail.prospect.id);
      }
    } catch (err) {
      console.error(`Error checking thread ${threadId}:`, err);
    }
  }

  return result;
}
