import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getProspect,
  updateProspect,
  deleteProspect,
} from "@/services/prospect.service";
import type { ProspectStatus } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  contactName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactRole: z.string().optional(),
  contactLinkedInUrl: z.string().url().optional().or(z.literal("")),
  companyName: z.string().min(1).optional(),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  companyLinkedInUrl: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  linkedInSummary: z.string().optional(),
  companyInfo: z.string().optional(),
  commonPoints: z.string().optional(),
  opportunityType: z.string().optional(),
  preferredLanguage: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const prospect = await getProspect(id);
  if (!prospect) {
    return NextResponse.json({ error: "Prospect non trouvé" }, { status: 404 });
  }

  return NextResponse.json(prospect);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    const data = {
      ...parsed,
      status: parsed.status as ProspectStatus | undefined,
    };
    const prospect = await updateProspect(id, data);
    return NextResponse.json(prospect);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  await deleteProspect(id);
  return NextResponse.json({ success: true });
}
