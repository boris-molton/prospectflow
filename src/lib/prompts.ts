/**
 * Prompts pour la génération IA des emails de candidature spontanée
 */

export const EMAIL_GENERATION_SYSTEM = `Tu es un expert en rédaction d'emails de candidature spontanée. Tu écris des messages personnalisés, naturels et convaincants qui maximisent les chances de réponse positive.

Règles importantes:
- Utilise TOUJOURS les informations du candidat, du prospect et de l'entreprise fournies
- Le profil du candidat est ta référence principale : adapte l'email à ses compétences, son parcours et ses envies
- Évite les formules génériques et les clichés
- Sois concis: 150-250 mots maximum
- Trouve un angle d'approche pertinent et unique reliant le candidat à l'entreprise/contact
- Mentionne des éléments concrets (projets, actualités, points communs)
- Adapte le ton selon la demande (professionnel, humain, direct, premium, concis)
- Écris dans la langue demandée
- Ne mens jamais, n'invente pas d'informations`;

export function buildEmailGenerationPrompt(params: {
  contactName: string;
  contactRole?: string;
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  linkedInSummary?: string;
  companyInfo?: string;
  commonPoints?: string;
  opportunityType?: string;
  notes?: string;
  tone: string;
  language: string;
  isFollowUp?: boolean;
  previousEmail?: string;
  candidateProfile?: string;
}) {
  const {
    contactName,
    contactRole,
    companyName,
    companyWebsite,
    industry,
    linkedInSummary,
    companyInfo,
    commonPoints,
    opportunityType,
    notes,
    tone,
    language,
    isFollowUp,
    previousEmail,
    candidateProfile,
  } = params;

  let prompt = `Génère un email de candidature spontanée avec les informations suivantes:

`;

  if (candidateProfile) {
    prompt += `## Profil du candidat (TOI, l'expéditeur)\n${candidateProfile}\n\n`;
  }

  prompt += `## Contact destinataire
- Nom: ${contactName}
${contactRole ? `- Rôle: ${contactRole}` : ""}

## Entreprise
- Nom: ${companyName}
${companyWebsite ? `- Site: ${companyWebsite}` : ""}
${industry ? `- Secteur: ${industry}` : ""}
${companyInfo ? `- Infos entreprise: ${companyInfo}` : ""}

`;

  if (linkedInSummary) {
    prompt += `## Profil LinkedIn du contact\n${linkedInSummary}\n\n`;
  }
  if (commonPoints) {
    prompt += `## Points d'accroche / éléments communs\n${commonPoints}\n\n`;
  }
  if (opportunityType) {
    prompt += `## Type d'opportunité recherchée\n${opportunityType}\n\n`;
  }
  if (notes) {
    prompt += `## Notes personnelles\n${notes}\n\n`;
  }

  prompt += `## Contraintes
- Ton: ${tone}
- Langue: ${language}
`;

  if (isFollowUp && previousEmail) {
    prompt += `
## RELANCE
C'est une relance. L'email initial envoyé était:
---
${previousEmail}
---
Génère une relance courte, courtoise et pertinente. Ne répète pas tout le message initial. Rappelle qui tu es et pourquoi tu contactes, avec un nouvel angle si possible.

## Format de réponse (JSON strict)
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown:
{
  "subject": "Objet de la relance (ex: Re: [sujet initial])",
  "body": "Corps de la relance en texte brut",
  "suggestions": []
}`;
  } else {
    prompt += `
## Format de réponse attendu (JSON strict)
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans \`\`\`:
{
  "subject": "Objet de l'email (court, personnalisé, accrocheur)",
  "body": "Corps de l'email en texte brut, avec retours à la ligne \\n",
  "suggestions": ["suggestion 1 d'amélioration", "suggestion 2"]
}`;
  }

  return prompt;
}

export const SUBJECT_GENERATION_PROMPT = `Génère 3 variantes d'objets d'email pour une candidature spontanée. Chaque objet doit être:
- Court (6-10 mots max)
- Personnalisé (mentionner l'entreprise ou le contact)
- Accrocheur sans être clickbait
- En français sauf indication contraire

Réponds en JSON: {"subjects": ["objet 1", "objet 2", "objet 3"]}`;

// ============ ENRICHMENT PROMPTS ============

export const LINKEDIN_SUMMARY_SYSTEM = `Tu es un expert en analyse de profils professionnels. Tu produis des résumés structurés et concis, optimisés pour personnaliser des emails de candidature spontanée. Tu ne mens jamais et n'inventes pas d'informations.`;

export const LINKEDIN_SUMMARY_PROMPT = `Analyse le texte suivant, copié depuis un profil LinkedIn, et produis un résumé structuré optimisé pour personnaliser un email de candidature spontanée.

Le résumé doit inclure (si les informations sont disponibles) :
- **Poste actuel** et entreprise
- **Parcours** : les 2-3 postes/expériences les plus pertinents
- **Compétences clés** : domaines d'expertise principaux
- **Centres d'intérêt professionnels** : sujets, causes, publications
- **Réalisations notables** : projets, résultats chiffrés, prix
- **Formation** : diplômes ou certifications marquants
- **Éléments de personnalité** : ton, style de communication visible

Sois factuel et concis (200-300 mots max). N'invente rien.
Écris en français.
Réponds UNIQUEMENT avec un objet JSON valide :
{
  "summary": "Le résumé structuré en texte"
}`;

export const COMPANY_SUMMARY_SYSTEM = `Tu es un expert en analyse d'entreprises. Tu produis des résumés structurés et concis à partir de contenus de sites web, optimisés pour personnaliser des emails de candidature spontanée. Tu ne mens jamais et n'inventes pas d'informations.`;

export const COMPANY_SUMMARY_PROMPT = `Analyse le contenu suivant, extrait du site web d'une entreprise, et produis un résumé structuré optimisé pour personnaliser un email de candidature spontanée.

Le résumé doit inclure (si les informations sont disponibles) :
- **Activité principale** : ce que fait l'entreprise en 1-2 phrases
- **Taille et portée** : nombre d'employés, chiffre d'affaires, pays
- **Valeurs et culture** : mission, vision, engagements
- **Actualités récentes** : projets, lancements, acquisitions
- **Technologies / méthodologies** : stack technique, approches
- **Clients / secteurs cibles** : à qui s'adresse l'entreprise
- **Points différenciants** : ce qui rend l'entreprise unique

Sois factuel et concis (200-300 mots max). N'invente rien. Si le contenu est pauvre, dis-le.
Écris en français.
Réponds UNIQUEMENT avec un objet JSON valide :
{
  "summary": "Le résumé structuré en texte"
}`;

export const COMMON_POINTS_SYSTEM = `Tu es un expert en stratégie de candidature spontanée. Tu identifies des points d'accroche pertinents et concrets entre un candidat et une entreprise/contact pour maximiser les chances de réponse positive. Tu ne mens jamais et n'inventes pas de faux points communs.`;

export function buildCommonPointsPrompt(params: {
  linkedInSummary?: string;
  companyInfo?: string;
  contactRole?: string;
  industry?: string;
  notes?: string;
  opportunityType?: string;
  candidateProfile?: string;
}) {
  let prompt = `À partir des informations suivantes, identifie 3 à 5 points d'accroche concrets et pertinents pour une candidature spontanée.\n\n`;

  if (params.candidateProfile) {
    prompt += `## Profil du candidat (l'expéditeur)\n${params.candidateProfile}\n\n`;
  }
  if (params.linkedInSummary) {
    prompt += `## Profil LinkedIn du contact destinataire\n${params.linkedInSummary}\n\n`;
  }
  if (params.companyInfo) {
    prompt += `## Informations entreprise\n${params.companyInfo}\n\n`;
  }
  if (params.contactRole) {
    prompt += `## Rôle du contact\n${params.contactRole}\n\n`;
  }
  if (params.industry) {
    prompt += `## Secteur\n${params.industry}\n\n`;
  }
  if (params.notes) {
    prompt += `## Notes personnelles\n${params.notes}\n\n`;
  }
  if (params.opportunityType) {
    prompt += `## Type d'opportunité recherchée\n${params.opportunityType}\n\n`;
  }

  prompt += `## Consignes
Chaque point d'accroche doit être :
- Concret et spécifique (pas de généralités)
- Exploitable directement dans un email
- Basé uniquement sur les informations fournies

Réponds UNIQUEMENT avec un objet JSON valide :
{
  "points": "Les 3-5 points d'accroche, chacun sur une ligne, sous forme de texte structuré"
}`;

  return prompt;
}
