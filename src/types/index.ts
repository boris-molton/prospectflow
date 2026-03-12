import type { Prospect, ProspectStatus, Tag, EmailSent, Activity, ProspectTag } from "@prisma/client";

export type { Prospect, ProspectStatus, Tag, EmailSent, Activity };

export interface ProspectWithRelations extends Prospect {
  tags: (ProspectTag & { tag: Tag })[];
  emailsSent: EmailSent[];
  activities: Activity[];
}

export interface DashboardStats {
  totalProspects: number;
  emailsNotSent: number;
  emailsSent: number;
  responsesReceived: number;
  responseRate: number;
  positiveResponseRate: number;
  toFollowUp: number;
}

export type EmailTone = "professionnel" | "humain" | "direct" | "premium" | "concis";

export interface GeneratedEmail {
  subject: string;
  body: string;
  tone: EmailTone;
  language: string;
  suggestions?: string[];
}
