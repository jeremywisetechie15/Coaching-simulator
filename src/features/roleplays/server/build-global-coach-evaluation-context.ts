import {
    extractNotationScore,
    limitRoleplaySynthesisItems,
} from "@/features/roleplays/domain";

type JsonRecord = Record<string, unknown>;

export interface GlobalCoachProgressAction {
    action: string;
    step?: string;
}

export interface GlobalCoachKeyMoment {
    impact?: string;
    reason?: string;
    recommendedResponse?: string;
    timecode?: string;
    title: string;
    type?: string;
}

export interface GlobalCoachEvaluationContext {
    appreciationGlobale: string | null;
    axesAmelioration: string[];
    momentsCles: GlobalCoachKeyMoment[];
    planDeProgres: GlobalCoachProgressAction[];
    pointsPositifs: string[];
    prioriteStrategique: string | null;
    scoreGlobal: number | null;
}

function asRecord(value: unknown): JsonRecord | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as JsonRecord)
        : null;
}

function asText(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function textFromValue(value: unknown, fields: string[] = []) {
    const directText = asText(value);
    if (directText) return directText;

    const record = asRecord(value);
    if (!record) return null;

    for (const field of [...fields, "texte", "text", "label", "title", "titre", "description"]) {
        const text = asText(record[field]);
        if (text) return text;
    }

    return null;
}

function firstText(record: JsonRecord | null, fields: string[]) {
    if (!record) return null;

    for (const field of fields) {
        const text = textFromValue(record[field]);
        if (text) return text;
    }

    return null;
}

function firstArray(record: JsonRecord | null, fields: string[]) {
    if (!record) return [];

    for (const field of fields) {
        const value = record[field];
        if (Array.isArray(value)) return value;
    }

    return [];
}

function compactTextList(record: JsonRecord | null, fields: string[]) {
    const items = firstArray(record, fields)
        .map((item) => textFromValue(item))
        .filter((item): item is string => Boolean(item));

    return limitRoleplaySynthesisItems(items);
}

function compactProgressPlan(synthese: JsonRecord | null): GlobalCoachProgressAction[] {
    const items = firstArray(synthese, ["plan_de_progres", "plan_progres", "plan_action"])
        .flatMap((item): GlobalCoachProgressAction[] => {
            const action = textFromValue(item, ["action", "recommandation"]);
            if (!action) return [];

            const record = asRecord(item);
            const step = firstText(record, ["etape_titre", "etape", "step_title"]);

            return [{
                action,
                ...(step ? { step } : {}),
            }];
        });

    return limitRoleplaySynthesisItems(items);
}

function compactKeyMoments(synthese: JsonRecord | null): GlobalCoachKeyMoment[] {
    const items = firstArray(synthese, ["moments_cles"])
        .flatMap((item): GlobalCoachKeyMoment[] => {
            const title = textFromValue(item);
            if (!title) return [];

            const record = asRecord(item);
            const impact = firstText(record, ["impact_sur_objectif", "impact_label", "impact"]);
            const reason = firstText(record, ["pourquoi_moment_cle", "raison", "reason"]);
            const recommendedResponse = firstText(record, [
                "reponse_alternative_recommandee",
                "reponse_recommandee",
                "recommended_response",
            ]);
            const timecode = firstText(record, ["timecode_debut", "timecode", "time"]);
            const type = firstText(record, ["type_impact", "type"]);

            return [{
                title,
                ...(impact ? { impact } : {}),
                ...(reason ? { reason } : {}),
                ...(recommendedResponse ? { recommendedResponse } : {}),
                ...(timecode ? { timecode } : {}),
                ...(type ? { type } : {}),
            }];
        });

    return limitRoleplaySynthesisItems(items);
}

/**
 * Données de notation strictement utiles aux sessions globales Ask IA Coach et Débrief.
 * La synthèse brute n'est jamais transmise : elle contient des champs redondants et des
 * extraits de transcript déjà fournis séparément.
 */
export function buildGlobalCoachEvaluationContext(notationJson: unknown): GlobalCoachEvaluationContext {
    const notation = asRecord(notationJson);
    const synthese = asRecord(notation?.synthese);
    const scoreGlobal = asRecord(notation?.score_global);

    return {
        appreciationGlobale:
            firstText(synthese, ["appreciation_globale", "coach_appreciation", "synthese", "resume"]) ??
            firstText(scoreGlobal, ["interpretation"]),
        axesAmelioration: compactTextList(synthese, [
            "axes_amelioration",
            "axes_d_amelioration",
            "points_a_ameliorer",
            "ameliorations",
        ]),
        momentsCles: compactKeyMoments(synthese),
        planDeProgres: compactProgressPlan(synthese),
        pointsPositifs: compactTextList(synthese, [
            "points_positifs",
            "reussites_observees",
            "forces",
            "points_forts",
        ]),
        prioriteStrategique: firstText(synthese, [
            "priorite_strategique",
            "priorite",
            "recommandation_prioritaire",
        ]),
        scoreGlobal: extractNotationScore(notationJson),
    };
}
