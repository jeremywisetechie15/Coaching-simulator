import { z } from "zod";
import type { EntityJsonPrefillFieldErrors } from "./entity-json-prefill";
import { hasJsonPrefillField } from "./entity-json-prefill";

/** Validation primitive partagée ; les règles métier restent dans le domaine de chaque entité. */
export function requireJsonPrefillKeys(
    record: Record<string, unknown>,
    fields: readonly string[],
    prefix: string,
    errors: EntityJsonPrefillFieldErrors,
) {
    fields.forEach((field) => {
        if (!hasJsonPrefillField(record, field)) {
            errors[prefix ? `${prefix}.${field}` : field] = "Ce champ est absent du fichier JSON.";
        }
    });
}

export function readJsonPrefillText(
    value: unknown,
    path: string,
    errors: EntityJsonPrefillFieldErrors,
    max: number,
    required = false,
) {
    const schema = required
        ? z.string().trim().min(1).max(max)
        : z.string().trim().max(max);
    const result = schema.safeParse(value);
    if (!result.success) {
        errors[path] = required
            ? `Ce champ est obligatoire et doit contenir au maximum ${max} caractères.`
            : `Ce champ doit être un texte de ${max} caractères maximum.`;
        return typeof value === "string" ? value.trim().slice(0, max) : "";
    }
    return result.data;
}
