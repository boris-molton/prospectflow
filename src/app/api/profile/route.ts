import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getOrCreateProfile,
  updateProfile,
} from "@/services/profile.service";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const profile = await getOrCreateProfile(userId);

  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await request.json();

    const allowedFields = [
      "fullName",
      "headline",
      "presentation",
      "desiredRoles",
      "desiredLocations",
      "desiredIndustries",
      "workPreferences",
      "keySkills",
      "uniqueValue",
      "additionalContext",
    ];

    const data: Record<string, string> = {};
    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field] ?? "";
      }
    }

    const profile = await updateProfile(userId, data);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Erreur de mise à jour du profil" },
      { status: 500 }
    );
  }
}
