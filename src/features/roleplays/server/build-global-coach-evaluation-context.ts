interface GlobalCoachEvaluationContext {
    appreciation: string;
    scoreGlobal: Record<string, unknown> | null;
    synthese: Record<string, unknown> | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function getAppreciation(synthese: Record<string, unknown> | null) {
    if (!synthese) return "Aucune appréciation globale disponible.";

    const appreciation = synthese.appreciation_globale;
    if (typeof appreciation === "string" && appreciation.trim()) return appreciation.trim();

    const appreciationRecord = asRecord(appreciation);
    return typeof appreciationRecord?.texte === "string" && appreciationRecord.texte.trim()
        ? appreciationRecord.texte.trim()
        : "Aucune appréciation globale disponible.";
}

/** Contexte global minimal transmis au coach : synthèse, réussites, axes, plan et score. */
export function buildGlobalCoachEvaluationContext(notationJson: unknown): GlobalCoachEvaluationContext {
    const notation = asRecord(notationJson);
    const synthese = asRecord(notation?.synthese);

    return {
        appreciation: getAppreciation(synthese),
        scoreGlobal: asRecord(notation?.score_global),
        synthese,
    };
}
