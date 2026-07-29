import type { GlobalCoachEvaluationContext } from "./build-global-coach-evaluation-context";
import {
    serializeRoleplayCoachSummaryContext,
    type RoleplayCoachContext,
} from "./get-roleplay-coach-context";

interface GlobalCoachSessionSourcesInput {
    context: RoleplayCoachContext;
    evaluation: GlobalCoachEvaluationContext;
    transcript: string;
}

/** Sources factuelles partagées par Ask IA Coach et le Débrief Coach. */
export function buildGlobalCoachSessionSources({
    context,
    evaluation,
    transcript,
}: GlobalCoachSessionSourcesInput) {
    return `CONTEXTE DYNAMIQUE DU ROLEPLAY — SOURCE DE VÉRITÉ:
${serializeRoleplayCoachSummaryContext(context)}

ÉVALUATION STRUCTURÉE DE LA SESSION:
${JSON.stringify(evaluation, null, 2)}

TRANSCRIPT EXACT DE LA SESSION:
---
${transcript}
---`;
}
