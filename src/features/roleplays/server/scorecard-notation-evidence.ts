import type { RoleplayNotationTranscriptPayload } from "@/features/roleplays/domain";

type JsonRecord = Record<string, unknown>;

export const SCORECARD_NO_LEARNER_EVIDENCE = "Aucune preuve utilisateur observée";

export interface NormalizedScorecardMethodoEvidence {
    methodoResult: JsonRecord;
    warnings: string[];
}

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asFiniteNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractMessageRefs(criterion: JsonRecord) {
    if (!Array.isArray(criterion.preuve_message_refs)) return [];

    return Array.from(new Set(
        criterion.preuve_message_refs
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim().toUpperCase())
            .filter(Boolean),
    ));
}

function canonicalLearnerEvidence(
    messages: RoleplayNotationTranscriptPayload["conversation"],
) {
    return messages
        .map((message) => {
            const timecode = message.timecode_absolute || message.timecode_relative;
            return `${timecode ? `${timecode} ` : ""}Apprenant: ${message.verbatim}`;
        })
        .join(" | ");
}

/**
 * Verrou de confiance du moteur scorecard v2.
 *
 * L'IA choisit des références de messages, mais le serveur résout ces références
 * uniquement dans le transcript de la session courante. Le texte libre renvoyé par
 * l'IA n'est jamais utilisé comme preuve persistée et un message Persona ne peut
 * jamais justifier des points attribués à l'apprenant.
 */
export function normalizeScorecardMethodoEvidence(
    methodoResult: JsonRecord,
    transcript: RoleplayNotationTranscriptPayload,
): NormalizedScorecardMethodoEvidence {
    const learnerMessagesByRef = new Map<
        string,
        RoleplayNotationTranscriptPayload["conversation"][number]
    >(
        transcript.conversation
            .filter((message) => message.speaker === "Apprenant")
            .map((message) => [`M${message.id}`, message] as const),
    );
    const allMessageRefs = new Set<string>(
        transcript.conversation.map((message) => `M${message.id}`),
    );
    const rawCriteria = Array.isArray(methodoResult.criteres)
        ? methodoResult.criteres
        : [];
    const warnings: string[] = [];

    const criteres = rawCriteria.map((value) => {
        if (!isRecord(value)) return value;

        const criterionRef = typeof value.ref === "string" && value.ref.trim()
            ? value.ref.trim()
            : "inconnue";
        const requestedRefs = extractMessageRefs(value);
        const learnerMessages = requestedRefs.flatMap((messageRef) => {
            const message = learnerMessagesByRef.get(messageRef);
            return message ? [message] : [];
        });
        const validMessageRefs = learnerMessages.map((message) => `M${message.id}`);
        const rejectedMessageRefs = requestedRefs.filter((messageRef) => (
            !allMessageRefs.has(messageRef) || !learnerMessagesByRef.has(messageRef)
        ));
        const awardedPoints = asFiniteNumber(value.points_obtenus) ?? 0;
        const hasTrustedEvidence = validMessageRefs.length > 0;

        if (rejectedMessageRefs.length > 0) {
            warnings.push(
                `${criterionRef}: références de preuve ignorées car absentes de la session ou attribuées au Persona (${rejectedMessageRefs.join(", ")}).`,
            );
        }

        if (awardedPoints > 0 && !hasTrustedEvidence) {
            warnings.push(
                `${criterionRef}: points ramenés à zéro faute de preuve provenant de l'apprenant dans cette session.`,
            );
        }

        return {
            ...value,
            points_obtenus: awardedPoints > 0 && !hasTrustedEvidence ? 0 : awardedPoints,
            preuve: hasTrustedEvidence
                ? canonicalLearnerEvidence(learnerMessages)
                : SCORECARD_NO_LEARNER_EVIDENCE,
            preuve_message_refs: validMessageRefs,
        };
    });

    return {
        methodoResult: {
            ...methodoResult,
            criteres,
        },
        warnings,
    };
}
