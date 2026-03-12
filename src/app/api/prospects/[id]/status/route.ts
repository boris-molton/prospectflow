import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateProspectStatus } from "@/services/prospect.service";
import type { ProspectStatus } from "@prisma/client";

const VALID_STATUSES: ProspectStatus[] = [
  "NOUVEAU",
  "A_ENRICHIR",
  "PRET_A_CONTACTER",
  "EMAIL_GENERE",
  "ENVOYE",
  "RELANCE_A_FAIRE",
  "EN_ATTENTE_REPONSE",
  "REPONSE_RECUE",
  "REPONSE_POSITIVE",
  "REPONSE_NEGATIVE",
  "ENTRETIEN_OBTENU",
  "OPPORTUNITE_FERMEE",
  "ARCHIVE",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Statut invalide" },
      { status: 400 }
    );
  }

  const prospect = await updateProspectStatus(id, status);
  return NextResponse.json(prospect);
}
