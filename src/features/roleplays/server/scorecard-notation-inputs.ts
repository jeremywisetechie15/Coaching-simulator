import type { RoleplayNotationCriterionRef } from "@/features/roleplays/domain";
import type { RoleplayScorecardNotationContext } from "./build-roleplay-notation-context";

function criterionRefToPrompt(ref: RoleplayNotationCriterionRef) {
    return {
        competence: ref.skillName,
        critere: ref.criterionKey,
        dimension: ref.dimension,
        etape_ref: ref.stepRef,
        item_dimension: ref.dimensionItemLabel,
        points_max: ref.maxPoints,
        preuve_attendue: ref.expectedEvidence,
        ref: ref.ref,
        verbatim_conformes: ref.verbatim,
    };
}

export function buildScorecardMethodoInput(context: RoleplayScorecardNotationContext) {
    return `CONTEXTE DU PERSONA:
${JSON.stringify(context.persona, null, 2)}

CONTEXTE DU SCENARIO:
${JSON.stringify(context.scenario, null, 2)}

SESSION:
${JSON.stringify(context.session, null, 2)}

METHODE:
${JSON.stringify(context.method, null, 2)}

SCORECARD:
${JSON.stringify(context.scorecard, null, 2)}

REFERENCES ETAPES A UTILISER STRICTEMENT:
${JSON.stringify(context.stepRefs, null, 2)}

REFERENCES CRITERES A UTILISER STRICTEMENT:
${JSON.stringify(context.criterionRefs.map(criterionRefToPrompt), null, 2)}

REGLES:
- Retourne uniquement un JSON valide.
- N'invente aucun critere et ne renomme aucune reference.
- Retourne exactement un resultat pour chaque ref C fournie, sans doublon ni reference inconnue.
- points_obtenus peut etre nuance et doit rester compris entre 0 et points_max.
- Utilise les instructions IA, preuves attendues et verbatims comme guides, jamais comme preuves observees.
- Pour le champ preuve, utilise uniquement les paroles de l'Utilisateur / Apprenant dans la TRANSCRIPTION.
- Cite si possible un extrait exact avec sa reference M et son horodatage.
- Si aucune parole utilisateur ne prouve le critere, retourne "Aucune preuve utilisateur observee" et zero point.
- La transcription peut contenir des erreurs sur les noms et prenoms. Ne penalise pas une transcription approximative si l'intention est claire.

TRANSCRIPTION:
---
${context.transcript}
---`;
}

export function buildScorecardSynthesisInput(
    context: RoleplayScorecardNotationContext,
    notation: { methodo?: Record<string, unknown>; score_global?: Record<string, unknown> },
) {
    return `CONTEXTE DU PERSONA:
${JSON.stringify(context.persona, null, 2)}

CONTEXTE DU SCENARIO:
${JSON.stringify(context.scenario, null, 2)}

SESSION:
${JSON.stringify(context.session, null, 2)}

METHODE:
${JSON.stringify(context.method, null, 2)}

SCORECARD:
${JSON.stringify(context.scorecard, null, 2)}

REFERENCES ETAPES A UTILISER STRICTEMENT:
${JSON.stringify(context.stepRefs, null, 2)}

RESULTAT METHODOLOGIQUE DE REFERENCE:
${JSON.stringify({ score_global: notation.score_global, methodo: notation.methodo }, null, 2)}

REGLES:
- Retourne uniquement un JSON valide conforme au schema synthese scorecard.
- Reste coherent avec le score global et l'analyse methodologique deja calcules. Ne modifie aucun score.
- Pour chaque moment cle et chaque action du plan de progres, utilise uniquement une etape_ref S fournie.
- Ne deduis jamais une etape depuis une lettre codee en dur.
- L'avis du persona doit respecter son identite, son role, son entreprise et le contexte du scenario.
- Les preuves et extraits doivent provenir uniquement de la TRANSCRIPTION.
- La transcription peut contenir des erreurs sur les noms et prenoms. Ne penalise pas une transcription approximative si l'intention est claire.

TRANSCRIPTION:
---
${context.transcript}
---`;
}
