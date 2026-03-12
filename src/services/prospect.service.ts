import { prisma } from "@/lib/db";
import type { ProspectStatus, ActivityType } from "@prisma/client";

export interface CreateProspectInput {
  contactName: string;
  contactEmail: string;
  contactRole?: string;
  contactLinkedInUrl?: string;
  companyName: string;
  companyWebsite?: string;
  companyLinkedInUrl?: string;
  industry?: string;
  country?: string;
  city?: string;
  linkedInSummary?: string;
  companyInfo?: string;
  commonPoints?: string;
  opportunityType?: string;
  preferredLanguage?: string;
  notes?: string;
  source?: string;
  tagIds?: string[];
}

export interface UpdateProspectInput extends Partial<CreateProspectInput> {
  status?: ProspectStatus;
}

export async function createProspect(data: CreateProspectInput) {
  const { tagIds, ...prospectData } = data;
  const prospect = await prisma.prospect.create({
    data: {
      ...prospectData,
      tags: tagIds?.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  await createActivity(prospect.id, "PROSPECT_CREATED", "Prospect créé");

  return prospect;
}

export async function updateProspect(id: string, data: UpdateProspectInput) {
  const { tagIds, ...prospectData } = data;
  const prospect = await prisma.prospect.update({
    where: { id },
    data: {
      ...prospectData,
      tags: tagIds
        ? { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: {
      tags: { include: { tag: true } },
      emailsSent: true,
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  await createActivity(prospect.id, "PROSPECT_UPDATED", "Prospect mis à jour");

  return prospect;
}

export async function getProspect(id: string) {
  return prisma.prospect.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      emailsSent: { orderBy: { sentAt: "desc" } },
      replies: { orderBy: { receivedAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function listProspects(params?: {
  status?: ProspectStatus;
  search?: string;
  tagId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};

  if (params?.status) where.status = params.status;
  if (params?.tagId) {
    where.tags = { some: { tagId: params.tagId } };
  }
  if (params?.search) {
    where.OR = [
      { contactName: { contains: params.search, mode: "insensitive" } },
      { contactEmail: { contains: params.search, mode: "insensitive" } },
      { companyName: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [prospects, total] = await Promise.all([
    prisma.prospect.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        emailsSent: { take: 1, orderBy: { sentAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: params?.limit ?? 50,
      skip: params?.offset ?? 0,
    }),
    prisma.prospect.count({ where }),
  ]);

  return { prospects, total };
}

export async function deleteProspect(id: string) {
  return prisma.prospect.delete({ where: { id } });
}

export async function updateProspectStatus(id: string, status: ProspectStatus) {
  const prospect = await prisma.prospect.update({
    where: { id },
    data: { status },
  });
  await createActivity(id, "STATUS_CHANGED", `Statut: ${status}`, { status });
  return prospect;
}

export async function createActivity(
  prospectId: string,
  type: ActivityType,
  description?: string,
  metadata?: Record<string, unknown>
) {
  return prisma.activity.create({
    data: {
      prospectId,
      type,
      description,
      metadata: metadata ? (metadata as object) : undefined,
    },
  });
}

export async function getDashboardStats() {
  const [
    totalProspects,
    emailsSent,
    toFollowUp,
    responseReceived,
    responsePositive,
  ] = await Promise.all([
    prisma.prospect.count(),
    prisma.prospect.count({ where: { status: { in: ["ENVOYE", "RELANCE_A_FAIRE", "EN_ATTENTE_REPONSE", "REPONSE_RECUE", "REPONSE_POSITIVE", "REPONSE_NEGATIVE", "ENTRETIEN_OBTENU", "OPPORTUNITE_FERMEE"] } } }),
    prisma.prospect.count({ where: { status: "RELANCE_A_FAIRE" } }),
    prisma.prospect.count({ where: { status: { in: ["REPONSE_RECUE", "REPONSE_POSITIVE", "REPONSE_NEGATIVE", "ENTRETIEN_OBTENU"] } } }),
    prisma.prospect.count({ where: { status: { in: ["REPONSE_POSITIVE", "ENTRETIEN_OBTENU"] } } }),
  ]);

  const emailsNotSent = totalProspects - emailsSent;
  const responseRate = emailsSent > 0 ? (responseReceived / emailsSent) * 100 : 0;
  const positiveRate = responseReceived > 0 ? (responsePositive / responseReceived) * 100 : 0;

  return {
    totalProspects,
    emailsNotSent,
    emailsSent,
    responsesReceived: responseReceived,
    responseRate: Math.round(responseRate * 10) / 10,
    positiveResponseRate: Math.round(positiveRate * 10) / 10,
    toFollowUp,
  };
}

export async function getRecentActivity(limit = 10) {
  return prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      prospect: {
        select: { id: true, contactName: true, companyName: true },
      },
    },
  });
}
