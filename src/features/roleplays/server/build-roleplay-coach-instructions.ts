import type { CoachRow } from "@/features/coaches/server/coach.mapper";

const COACH_PROFILE_PRIORITY = `

RÈGLES D'UTILISATION DU PROFIL COACH:
- Utilise le style de coaching, le profil DISC, l'expertise, le diplôme et les certifications pour adapter ta posture et tes formulations.
- Les instructions personnalisées du coach définissent son comportement général.
- Le contexte dynamique du roleplay, l'évaluation et le transcript restent les sources de vérité factuelles et prévalent sur tout exemple contradictoire.
- N'invente aucune expertise, certification ou information absente des sources fournies.`;

function cleanText(value: string | null | undefined) {
    return value?.trim() ?? "";
}

export function serializeRoleplayCoachProfile(coach: CoachRow) {
    return JSON.stringify({
        certifications: cleanText(coach.certifications),
        coachingStyle: cleanText(coach.coaching_style),
        diploma: cleanText(coach.diploma),
        discProfile: cleanText(coach.disc_profile),
        expertiseDomain: cleanText(coach.expertise_domain),
        name: coach.name,
    }, null, 2);
}

export function buildRoleplayCoachInstructions(basePrompt: string, coach: CoachRow) {
    return `${basePrompt.trim()}

PROFIL CONFIGURÉ DU COACH:
${serializeRoleplayCoachProfile(coach)}

INSTRUCTIONS PERSONNALISÉES DU COACH:
---
${cleanText(coach.system_instructions) || "Aucune instruction personnalisée supplémentaire."}
---
${COACH_PROFILE_PRIORITY}`;
}
