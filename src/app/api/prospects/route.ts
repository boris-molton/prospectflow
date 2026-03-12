import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listProspects, createProspect } from "@/services/prospect.service";
import { z } from "zod";

const createSchema = z.object({
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactRole: z.string().optional(),
  contactLinkedInUrl: z.string().url().optional().or(z.literal("")),
  companyName: z.string().min(1),
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
  tagIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const tagId = searchParams.get("tagId") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const result = await listProspects({
    status: status as "NOUVEAU" | "ENVOYE" | undefined,
    search,
    tagId,
    limit,
    offset,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const prospect = await createProspect(data);
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
