import { google } from "googleapis";

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  accessToken: string;
}

export interface SendEmailResult {
  id: string;
  threadId: string;
}

export async function sendEmailViaGmail({
  to,
  subject,
  body,
  accessToken,
}: SendEmailParams): Promise<SendEmailResult> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
  const message = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const encoded = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encoded,
    },
  });

  return {
    id: response.data.id!,
    threadId: response.data.threadId!,
  };
}
