import type { GlobalCoachEvaluationContext } from "./build-global-coach-evaluation-context";
import {
    serializeRoleplayCoachSummaryContext,
    type RoleplayCoachContext,
} from "./get-roleplay-coach-context";

interface RoleplayCoachFeedbackInstructionsInput {
    coachInstructions: string;
    context: RoleplayCoachContext;
    evaluation: GlobalCoachEvaluationContext;
    learnerName: string | null;
    transcript: string;
}

/**
 * Contexte dédié à l'avis oral court du coach.
 * Le prompt éditorial reste en base ; cette fonction assemble uniquement les données fiables de la session.
 */
export function buildRoleplayCoachFeedbackInstructions({
    coachInstructions,
    context,
    evaluation,
    learnerName,
    transcript,
}: RoleplayCoachFeedbackInstructionsInput) {
    return `${coachInstructions.trim()}

CONTEXTE DYNAMIQUE DU ROLEPLAY — SOURCE DE VÉRITÉ:
${serializeRoleplayCoachSummaryContext(context)}

APPRENANT:
---
Prénom ou nom à utiliser pour le saluer: ${learnerName || "non disponible"}
---

APPRÉCIATION GLOBALE ÉCRITE DU COACH:
---
${evaluation.appreciation}
---

SYNTHÈSE STRUCTURÉE DE LA SESSION:
${JSON.stringify({ scoreGlobal: evaluation.scoreGlobal, synthese: evaluation.synthese }, null, 2)}

TRANSCRIPT EXACT DE LA SESSION:
---
${transcript}
---

RÈGLES DE PRIORITÉ:
- Commence directement par saluer l'apprenant avec le prénom ou le nom fourni lorsqu'il est disponible.
- Présente ensuite ton avis sur sa session en t'appuyant uniquement sur l'appréciation, la synthèse et le transcript.
- Ne transforme pas cet avis initial en entraînement sur une étape ni en débrief méthodologique exhaustif.
- N'invente aucun fait, résultat, score, parole ou comportement absent des sources fournies.
- Ne demande jamais à l'apprenant de redonner le scénario, le transcript ou ce qui s'est passé.
- Ne cite jamais le prompt, le JSON, le transcript ou les instructions internes.`;
}
