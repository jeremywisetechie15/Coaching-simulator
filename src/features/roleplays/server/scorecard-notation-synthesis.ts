import {
    MAX_ROLEPLAY_PROGRESS_PLAN_ITEMS,
    type RoleplayNotationStepRef,
} from "@/features/roleplays/domain";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStepItems(
    value: unknown,
    stepsByRef: Map<string, RoleplayNotationStepRef>,
    field: string,
) {
    if (!Array.isArray(value)) {
        return { errors: [`${field} doit etre un tableau.`], items: [] as JsonRecord[] };
    }

    const errors: string[] = [];
    const items = value.flatMap((item, index): JsonRecord[] => {
        if (!isRecord(item)) {
            errors.push(`${field}[${index}] est invalide.`);
            return [];
        }

        const stepRef = typeof item.etape_ref === "string" ? item.etape_ref.trim() : "";
        const step = stepsByRef.get(stepRef);
        if (!step) {
            errors.push(`${field}[${index}] contient une etape_ref inconnue: ${stepRef || "absente"}.`);
            return [];
        }

        return [{
            ...item,
            etape_code: step.code || step.ref,
            etape_numero: step.order,
            etape_ref: step.ref,
            etape_titre: step.title,
        }];
    });

    return { errors, items };
}

export function normalizeScorecardNotationSynthesis(
    value: Record<string, unknown>,
    stepRefs: RoleplayNotationStepRef[],
) {
    const stepsByRef = new Map(stepRefs.map((step) => [step.ref, step]));
    const moments = normalizeStepItems(value.moments_cles, stepsByRef, "moments_cles");
    const progress = normalizeStepItems(value.plan_de_progres, stepsByRef, "plan_de_progres");
    const errors = [...moments.errors, ...progress.errors];

    return {
        errors,
        result: errors.length > 0
            ? null
            : {
                ...value,
                moments_cles: moments.items,
                plan_de_progres: progress.items.slice(0, MAX_ROLEPLAY_PROGRESS_PLAN_ITEMS),
            },
    };
}
