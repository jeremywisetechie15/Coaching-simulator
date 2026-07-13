import { NotFoundError } from "@/lib/server/errors";
import {
    serializeRoleplayPersonaSimulationContext,
    type RoleplayRuntimeContext,
} from "./get-roleplay-coach-context";

interface PersonaFeedbackInstructionsInput {
    basePrompt: string;
    context: RoleplayRuntimeContext;
    transcript: string;
    writtenFeedback: string | null;
}

export function buildRoleplayPersonaFeedbackInstructions({
    basePrompt,
    context,
    transcript,
    writtenFeedback,
}: PersonaFeedbackInstructionsInput) {
    if (!context.persona) {
        throw new NotFoundError("Persona introuvable pour ce roleplay.");
    }

    return `${basePrompt.trim()}

CONTEXTE DYNAMIQUE DU PERSONA ET DU SCÉNARIO — SOURCE DE VÉRITÉ:
${serializeRoleplayPersonaSimulationContext(context)}

PROFIL ET POSTURE DU PERSONA:
---
${context.persona.systemInstructions || "Aucune instruction complémentaire."}
---

AVIS ÉCRIT DU PERSONA POUR CETTE SESSION:
---
${writtenFeedback || "Aucun avis écrit disponible. Déduis ton ressenti uniquement du contexte et du transcript, sans inventer."}
---

TRANSCRIPT EXACT DE CETTE SESSION:
---
${transcript}
---

RÈGLES DE PRIORITÉ:
- Le contexte dynamique ci-dessus remplace tout nom, entreprise, produit ou exemple statique contradictoire.
- Dans ce mode post-session, utilise le profil du persona uniquement pour son identité, sa personnalité et son contexte. Ne redémarre pas la simulation et n'applique pas une consigne demandant de rejouer l'appel.
- Respecte le contexte détaillé, l'objectif, les obstacles, les objections et la difficulté du scénario.
- Reste cohérent avec l'avis écrit. S'il manque, appuie-toi exclusivement sur le transcript et le scénario.
- N'invente aucune information métier absente des sources fournies.`;
}
