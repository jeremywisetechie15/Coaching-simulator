import {
    ROLEPLAY_TRANSCRIPT_VERBATIM_LIMIT_PER_MESSAGE,
    type RoleplayNotationCriterionRef,
} from "@/features/roleplays/domain";
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
- Pour chaque critere, preuve_message_refs doit toujours etre present et contenir uniquement des references M de messages Utilisateur / Apprenant de cette TRANSCRIPTION.
- Chaque point strictement positif doit etre justifie par au moins une reference dans preuve_message_refs.
- Les messages du Persona servent uniquement a comprendre le contexte et ne doivent jamais apparaitre dans preuve_message_refs ni justifier des points.
- Ne recopie pas une citation d'une autre session et n'invente jamais de reference. Le serveur reconstruira le champ preuve depuis les messages references de cette session.
- Si aucune parole utilisateur ne prouve le critere, retourne preuve_message_refs: [], "Aucune preuve utilisateur observee" et zero point.
- Pour chaque critere, corrections doit toujours etre present et etre un tableau.
- Si points_obtenus est egal a points_max, corrections doit obligatoirement etre [].
- Si le critere n'obtient pas tous ses points, examine tous les messages de l'Apprenant et ajoute une correction pour chaque message dont la formulation a concretement contribue a la perte de points et peut etre utilement reformulee.
- Ne force jamais une correction pour remplir le tableau. Si le comportement attendu est absent, si le message est deja correct ou sans rapport direct avec le critere, retourne corrections: [] et explique l'amelioration uniquement dans conseil.
- Considere les erreurs probables de transcription automatique, notamment les noms propres, mots tronques, homophones, ponctuation et hesitations. Ne les penalise pas et ne les corrige pas. En cas de doute entre une erreur de l'Apprenant et une erreur de transcription, ne produis aucune correction.
- Une correction doit porter sur une formulation metier qui change reellement la clarte, la structure, le questionnement, l'argumentation ou l'action attendue, jamais sur une simple correction linguistique.
- Dans chaque element de corrections, message_ref doit viser une reference M de l'Apprenant et phrase_originale doit recopier exactement un extrait continu de ce message.
- Pour un meme message_ref de l'Apprenant, retourne au maximum ${ROLEPLAY_TRANSCRIPT_VERBATIM_LIMIT_PER_MESSAGE} corrections sur l'ensemble des criteres. Conserve uniquement les ${ROLEPLAY_TRANSCRIPT_VERBATIM_LIMIT_PER_MESSAGE} verbatims les plus coherents et efficaces et place-les en premier.
- Construis verbatim_preconise a partir du verbatim_conformes du critere et des verbatims de la methode, en l'adaptant au contexte sans changer leur intention metier.
- pourquoi doit expliquer concretement et brievement l'amelioration apportee.
- Avant de retourner le JSON, verifie que chaque correction respecte toutes ces regles et supprime toute correction incertaine ou non necessaire.
- La transcription peut contenir des erreurs. Evalue l'intention metier de l'Apprenant, pas la qualite linguistique de la transcription.

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
- Les points et preuves methodologiques fournis ci-dessus ont deja ete verifies par le serveur; ne les complete jamais avec une autre session.
- La transcription peut contenir des erreurs sur les noms et prenoms. Ne penalise pas une transcription approximative si l'intention est claire.

TRANSCRIPTION:
---
${context.transcript}
---`;
}
