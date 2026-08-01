import { z } from "zod";
import {
    buildEntityJsonPrefillLiveCatalogInstruction,
    buildEntityJsonPrefillPromptPreamble,
    isJsonPrefillRecord,
    parseEntityJsonPrefillData,
    requireJsonPrefillKeys,
    type EntityJsonPrefillFieldErrors,
} from "@/features/entity-json-prefill/domain";
import {
    CONTENT_CATEGORIES_BY_DOMAIN,
    CONTENT_DOMAINS,
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_SCOPES,
    isContentCategoryForDomain,
    type ContentCategory,
    type ContentDomain,
    type ContentTargetGroupOption,
    type ContentTargetOrganizationOption,
    type ContentTargetUserOption,
    type ContentVisibilityScope,
} from "@/features/content/domain";
import { SKILL_TYPES, type SkillType } from "./skills";

export const SKILL_JSON_PREFILL_SCHEMA_VERSION = 1;
export const SKILL_JSON_PREFILL_ENTITY_TYPE = "skill";

const SKILL_SOURCE_ANALYSIS_INSTRUCTIONS = [
    "Transforme fidèlement le document source en compétence exploitable sans inventer de connaissance, de pratique ou de comportement métier absent du document.",
    "Le nom doit identifier précisément la compétence en 180 caractères maximum. La description doit expliquer son objectif et son contexte en 4 000 caractères maximum.",
    "Choisis type, domain et category uniquement parmi les valeurs autorisées, par correspondance avec le contenu. Si aucune correspondance fiable n’existe, utilise une chaîne vide afin que l’interface signale le champ à corriger.",
    "Répartis les éléments dans les trois dimensions sans doublon : savoir pour les connaissances théoriques, savoir_faire pour les actions et techniques observables, savoir_etre pour les attitudes et comportements attendus.",
    "Chaque élément de dimension doit être précis, autonome et vérifiable. Conserve toutes les exigences utiles du document sans créer d’éléments artificiels.",
    "Chaque dimension doit contenir au moins un élément. Si le document ne permet réellement pas de renseigner une dimension sans invention, utilise [] afin que l’interface signale la dimension à compléter.",
    "Si aucune cible privée n’est explicitement identifiable dans les catalogues disponibles, utilise scope=\"public\" et organizationId, groupId, assignedUserId à null.",
    "Pour une cible privée, utilise uniquement les identifiants exacts des catalogues et respecte leurs relations : un groupe appartient à son organisation et un utilisateur doit appartenir à l’organisation ou au groupe ciblé.",
] as const;

export const SKILL_JSON_PREFILL_FIELD = {
    assignedUserId: "assignedUserId",
    attitude: "dimensionItems.savoir_etre",
    category: "category",
    description: "description",
    domain: "domain",
    groupId: "groupId",
    knowledge: "dimensionItems.savoir",
    knowHow: "dimensionItems.savoir_faire",
    name: "name",
    organizationId: "organizationId",
    scope: "scope",
    type: "type",
} as const;

export type SkillJsonPrefillField =
    | (typeof SKILL_JSON_PREFILL_FIELD)[keyof typeof SKILL_JSON_PREFILL_FIELD]
    | `dimensionItems.savoir.${number}`
    | `dimensionItems.savoir_faire.${number}`
    | `dimensionItems.savoir_etre.${number}`;

export type SkillJsonPrefillFieldErrors = EntityJsonPrefillFieldErrors;

export interface SkillJsonPrefillDraft {
    assignedUserId: string;
    category: ContentCategory | null;
    description: string;
    dimensionItems: {
        savoir: string[];
        savoir_etre: string[];
        savoir_faire: string[];
    };
    domain: ContentDomain | null;
    groupId: string;
    name: string;
    organizationId: string | null;
    scope: ContentVisibilityScope;
    type: SkillType | null;
}

export interface SkillJsonPrefillOptions {
    groupOptions: readonly ContentTargetGroupOption[];
    organizationOptions: readonly ContentTargetOrganizationOption[];
    userOptions: readonly ContentTargetUserOption[];
}

export interface SkillJsonPrefillResult {
    draft: SkillJsonPrefillDraft;
    fieldErrors: SkillJsonPrefillFieldErrors;
}

const requiredNameSchema = z.string().trim().min(1).max(180);
const requiredDescriptionSchema = z.string().trim().min(1).max(4000);
const skillTypeSchema = z.enum(SKILL_TYPES);
const skillDomainSchema = z.enum(CONTENT_DOMAINS);
const dimensionLabelSchema = z.string().trim().min(1).max(800);

function readRequiredString<T extends string>(
    value: unknown,
    schema: z.ZodType<T>,
    errorMessage: string,
    errors: SkillJsonPrefillFieldErrors,
    field: SkillJsonPrefillField,
): T | null {
    const result = schema.safeParse(value);
    if (!result.success) {
        errors[field] = errorMessage;
        return null;
    }

    return result.data;
}

function readDimension(
    value: unknown,
    field: typeof SKILL_JSON_PREFILL_FIELD.knowledge
        | typeof SKILL_JSON_PREFILL_FIELD.knowHow
        | typeof SKILL_JSON_PREFILL_FIELD.attitude,
    errors: SkillJsonPrefillFieldErrors,
) {
    if (!Array.isArray(value) || value.length === 0) {
        errors[field] = "Ajoutez au moins un élément dans cette dimension.";
        errors[`${field}.0` as SkillJsonPrefillField] = "Cet élément est obligatoire.";
        return [""];
    }

    return value.map((item, index) => {
        const parsed = dimensionLabelSchema.safeParse(item);
        if (!parsed.success) {
            errors[`${field}.${index}` as SkillJsonPrefillField] =
                "Cet élément est obligatoire et doit contenir au maximum 800 caractères.";
            return typeof item === "string" ? item.trim().slice(0, 800) : "";
        }

        return parsed.data;
    });
}

export function parseSkillJsonPrefillText(
    text: string,
    { groupOptions, organizationOptions, userOptions }: SkillJsonPrefillOptions,
): SkillJsonPrefillResult {
    const data = parseEntityJsonPrefillData(
        text,
        SKILL_JSON_PREFILL_ENTITY_TYPE,
        "une compétence",
        SKILL_JSON_PREFILL_SCHEMA_VERSION,
    );
    const errors: SkillJsonPrefillFieldErrors = {};
    requireJsonPrefillKeys(data, [
        "name",
        "description",
        "type",
        "domain",
        "category",
        "scope",
        "organizationId",
        "groupId",
        "assignedUserId",
        "dimensionItems",
    ], "", errors);
    const name = readRequiredString(
        data.name,
        requiredNameSchema,
        "Le nom est obligatoire et doit contenir au maximum 180 caractères.",
        errors,
        SKILL_JSON_PREFILL_FIELD.name,
    );
    const description = readRequiredString(
        data.description,
        requiredDescriptionSchema,
        "La description est obligatoire et doit contenir au maximum 4 000 caractères.",
        errors,
        SKILL_JSON_PREFILL_FIELD.description,
    );
    const type = readRequiredString(
        data.type,
        skillTypeSchema,
        `Le type doit être l’une des valeurs suivantes : ${SKILL_TYPES.join(", ")}.`,
        errors,
        SKILL_JSON_PREFILL_FIELD.type,
    );
    const domain = readRequiredString(
        data.domain,
        skillDomainSchema,
        `Le domaine doit être l’une des valeurs suivantes : ${CONTENT_DOMAINS.join(", ")}.`,
        errors,
        SKILL_JSON_PREFILL_FIELD.domain,
    );

    let category: ContentCategory | null = null;
    if (typeof data.category !== "string" || !isContentCategoryForDomain(domain, data.category)) {
        errors[SKILL_JSON_PREFILL_FIELD.category] = domain
            ? `La catégorie doit appartenir au domaine « ${domain} ».`
            : "La catégorie ne peut être vérifiée sans domaine valide.";
    } else {
        category = data.category;
    }

    const scopeResult = z.enum(CONTENT_VISIBILITY_SCOPES).safeParse(data.scope);
    const scope = scopeResult.success ? scopeResult.data : CONTENT_VISIBILITY_SCOPE.public;
    if (!scopeResult.success) {
        errors[SKILL_JSON_PREFILL_FIELD.scope] =
            `La visibilité doit être l’une des valeurs suivantes : ${CONTENT_VISIBILITY_SCOPES.join(", ")}.`;
    }

    const selectableOrganizations = organizationOptions.filter((option) => option.isSelectable !== false);
    const selectableGroups = groupOptions.filter((option) => option.isSelectable !== false);
    const selectableUsers = userOptions.filter((option) => option.isSelectable !== false);
    const organization = typeof data.organizationId === "string"
        ? selectableOrganizations.find((option) => option.id === data.organizationId)
        : undefined;
    const group = typeof data.groupId === "string"
        ? selectableGroups.find((option) => option.id === data.groupId)
        : undefined;
    const user = typeof data.assignedUserId === "string"
        ? selectableUsers.find((option) => option.id === data.assignedUserId)
        : undefined;
    let organizationId: string | null = null;
    let groupId = "";
    let assignedUserId = "";

    if (scope === CONTENT_VISIBILITY_SCOPE.public) {
        if (data.organizationId !== null || data.groupId !== null || data.assignedUserId !== null) {
            errors[SKILL_JSON_PREFILL_FIELD.scope] =
                "Pour une visibilité publique, les trois identifiants de ciblage doivent être null.";
        }
    } else if (scope === CONTENT_VISIBILITY_SCOPE.organization) {
        if (!organization) {
            errors[SKILL_JSON_PREFILL_FIELD.organizationId] =
                "Aucune organisation disponible ne correspond à cet identifiant.";
        } else {
            organizationId = organization.id;
        }
        if (data.groupId !== null || data.assignedUserId !== null) {
            errors[SKILL_JSON_PREFILL_FIELD.scope] =
                "Un ciblage organisation ne doit pas contenir de groupe ni d’utilisateur.";
        }
    } else if (scope === CONTENT_VISIBILITY_SCOPE.group) {
        if (!organization) {
            errors[SKILL_JSON_PREFILL_FIELD.organizationId] =
                "Aucune organisation disponible ne correspond à cet identifiant.";
        }
        if (!group) {
            errors[SKILL_JSON_PREFILL_FIELD.groupId] =
                "Aucun groupe disponible ne correspond à cet identifiant.";
        }
        if (organization && group && group.organizationId !== organization.id) {
            errors[SKILL_JSON_PREFILL_FIELD.groupId] =
                "Ce groupe n’appartient pas à l’organisation sélectionnée.";
        }
        if (organization) organizationId = organization.id;
        if (group) groupId = group.id;
        if (data.assignedUserId !== null) {
            errors[SKILL_JSON_PREFILL_FIELD.scope] =
                "Un ciblage groupe ne doit pas contenir d’utilisateur.";
        }
    } else if (scope === CONTENT_VISIBILITY_SCOPE.user) {
        if (!user) {
            errors[SKILL_JSON_PREFILL_FIELD.assignedUserId] =
                "Aucun utilisateur disponible ne correspond à cet identifiant.";
        } else {
            assignedUserId = user.id;
            const requestedGroup = group && user.groupIds.includes(group.id) ? group : undefined;
            const requestedOrganization = organization && user.organizationIds.includes(organization.id)
                ? organization
                : undefined;
            groupId = requestedGroup?.id ?? user.groupIds[0] ?? "";
            organizationId = requestedOrganization?.id ?? user.organizationIds[0] ?? null;
            if (data.groupId !== null && !requestedGroup) {
                errors[SKILL_JSON_PREFILL_FIELD.groupId] =
                    "Ce groupe n’est pas rattaché à l’utilisateur sélectionné.";
            }
            if (data.organizationId !== null && !requestedOrganization) {
                errors[SKILL_JSON_PREFILL_FIELD.organizationId] =
                    "Cette organisation n’est pas rattachée à l’utilisateur sélectionné.";
            }
        }
    }

    const dimensions = isJsonPrefillRecord(data.dimensionItems) ? data.dimensionItems : {};

    return {
        draft: {
            assignedUserId,
            category,
            description: description ?? "",
            dimensionItems: {
                savoir: readDimension(
                    dimensions.savoir,
                    SKILL_JSON_PREFILL_FIELD.knowledge,
                    errors,
                ),
                savoir_etre: readDimension(
                    dimensions.savoir_etre,
                    SKILL_JSON_PREFILL_FIELD.attitude,
                    errors,
                ),
                savoir_faire: readDimension(
                    dimensions.savoir_faire,
                    SKILL_JSON_PREFILL_FIELD.knowHow,
                    errors,
                ),
            },
            domain,
            groupId,
            name: name ?? "",
            organizationId,
            scope,
            type,
        },
        fieldErrors: errors,
    };
}

export function buildSkillJsonPrefillPrompt({
    groupOptions,
    organizationOptions,
    userOptions,
}: SkillJsonPrefillOptions) {
    const organizations = organizationOptions
        .filter((option) => option.isSelectable !== false)
        .map(({ id, name }) => ({ id, name }));
    const groups = groupOptions
        .filter((option) => option.isSelectable !== false)
        .map(({ id, name, organizationId }) => ({ id, name, organizationId }));
    const users = userOptions
        .filter((option) => option.isSelectable !== false)
        .map(({ groupIds, id, name, organizationIds }) => ({ groupIds, id, name, organizationIds }));
    const example = {
        schemaVersion: SKILL_JSON_PREFILL_SCHEMA_VERSION,
        entityType: SKILL_JSON_PREFILL_ENTITY_TYPE,
        data: {
            name: "Nom de la compétence",
            description: "Description complète de la compétence",
            type: SKILL_TYPES[0],
            domain: CONTENT_DOMAINS[0],
            category: CONTENT_CATEGORIES_BY_DOMAIN[CONTENT_DOMAINS[0]][0],
            scope: CONTENT_VISIBILITY_SCOPE.public,
            organizationId: null,
            groupId: null,
            assignedUserId: null,
            dimensionItems: {
                savoir: ["Connaissance théorique attendue"],
                savoir_faire: ["Compétence pratique attendue"],
                savoir_etre: ["Comportement ou attitude attendue"],
            },
        },
    };

    return [
        ...buildEntityJsonPrefillPromptPreamble({ entityLabel: "une compétence" }),
        buildEntityJsonPrefillLiveCatalogInstruction(["organisations, groupes et utilisateurs"]),
        [
            "Règles d’analyse du document et de construction de la compétence :",
            ...SKILL_SOURCE_ANALYSIS_INSTRUCTIONS.map((instruction) => `- ${instruction}`),
        ].join("\n"),
        `Valeurs autorisées pour data.type : ${JSON.stringify(SKILL_TYPES)}.`,
        `Valeurs autorisées pour data.domain : ${JSON.stringify(CONTENT_DOMAINS)}.`,
        `Catégories autorisées par domaine : ${JSON.stringify(CONTENT_CATEGORIES_BY_DOMAIN)}.`,
        `Visibilités autorisées : ${JSON.stringify(CONTENT_VISIBILITY_SCOPES)}.`,
        `Organisations : ${JSON.stringify(organizations)}. Groupes : ${JSON.stringify(groups)}. Utilisateurs : ${JSON.stringify(users)}. Respecte les relations entre ces identifiants.`,
        "Pour scope=\"public\", les trois identifiants doivent être null. Pour scope=\"organization\", seul organizationId est renseigné. Pour scope=\"group\", organizationId et groupId sont renseignés. Pour scope=\"user\", assignedUserId est obligatoire et organizationId/groupId peuvent préciser un rattachement valide de cet utilisateur.",
        "Chaque tableau de data.dimensionItems doit contenir au moins une chaîne non vide.",
        "Respecte exactement cette structure :",
        JSON.stringify(example, null, 2),
    ].join("\n\n");
}
