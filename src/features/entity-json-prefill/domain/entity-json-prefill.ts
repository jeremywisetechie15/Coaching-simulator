export const ENTITY_CREATION_MODE = {
    json: "json",
    manual: "manual",
} as const;

export type EntityCreationMode = (typeof ENTITY_CREATION_MODE)[keyof typeof ENTITY_CREATION_MODE];

export const ENTITY_CREATION_MODES = [
    ENTITY_CREATION_MODE.manual,
    ENTITY_CREATION_MODE.json,
] as const satisfies readonly EntityCreationMode[];

export const ENTITY_CREATION_MODE_LABELS: Record<EntityCreationMode, string> = {
    [ENTITY_CREATION_MODE.json]: "Importer un fichier JSON",
    [ENTITY_CREATION_MODE.manual]: "Créer manuellement",
};

export const ENTITY_CREATION_MODE_DESCRIPTIONS: Record<EntityCreationMode, string> = {
    [ENTITY_CREATION_MODE.json]:
        "Préremplissez le formulaire depuis un fichier conforme au modèle fourni.",
    [ENTITY_CREATION_MODE.manual]:
        "Commencez avec un formulaire vide et renseignez chaque champ vous-même.",
};

export type EntityJsonPrefillFieldErrors = Partial<Record<string, string>>;

export function isJsonPrefillRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasJsonPrefillField(record: Record<string, unknown>, field: string) {
    return Object.prototype.hasOwnProperty.call(record, field);
}

export function parseEntityJsonPrefillData(
    text: string,
    expectedEntityType: string,
    entityLabel: string,
    schemaVersion = 1,
) {
    const normalizedText = text.replace(/^\uFEFF/, "").trim();
    if (!normalizedText) {
        throw new Error("Le fichier JSON est vide.");
    }

    let payload: unknown;
    try {
        payload = JSON.parse(normalizedText) as unknown;
    } catch {
        throw new Error("Le fichier ne contient pas un JSON valide.");
    }

    if (!isJsonPrefillRecord(payload)) {
        throw new Error("La racine du fichier JSON doit être un objet.");
    }

    if (payload.schemaVersion !== schemaVersion) {
        throw new Error(`La version du fichier doit être ${schemaVersion}.`);
    }

    if (payload.entityType !== expectedEntityType) {
        throw new Error(`Ce fichier JSON ne correspond pas à ${entityLabel}.`);
    }

    return isJsonPrefillRecord(payload.data) ? payload.data : {};
}
