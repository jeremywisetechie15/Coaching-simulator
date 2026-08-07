import { z } from "zod";
import {
    ACTIVITY_SECTORS,
    CONTENT_CATEGORIES_BY_DOMAIN,
    CONTENT_DIFFICULTIES,
    CONTENT_DOMAINS,
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_SCOPES,
    isActivitySectorCode,
    isContentCategoryForDomain,
    type ActivitySectorCode,
    type ContentDifficulty,
    type ContentDomain,
    type ContentVisibilityScope,
} from "@/features/content/domain";
import {
    buildEntityJsonPrefillLiveCatalogInstruction,
    buildEntityJsonPrefillPromptPreamble,
    isJsonPrefillRecord,
    parseEntityJsonPrefillData,
    readJsonPrefillText,
    requireJsonPrefillKeys,
    type EntityJsonPrefillFieldErrors,
} from "@/features/entity-json-prefill/domain";
import {
    QUIZ_PARTICIPATION,
    QUIZ_PARTICIPATIONS,
    type QuizParticipation,
} from "@/features/evaluations/domain";
import {
    ROLEPLAY_AI_INSTRUCTIONS_MAX_LENGTH,
} from "./scenario-ai-instructions";
import { ROLEPLAY_DEFAULT_VALIDATION_THRESHOLD_PERCENT } from "./roleplay-score";
import type {
    RoleplayCoachOption,
    RoleplayGroupOption,
    RoleplayMethodOption,
    RoleplayOrganizationOption,
    RoleplayPersonaOption,
    RoleplayQuizOption,
    RoleplayScorecardOption,
    RoleplayUserOption,
} from "./roleplay";
import { getAssignableRoleplayQuizOptions } from "./roleplay-quiz-assignment";
import { getAssignableRoleplayScorecardOptions } from "./roleplay-scorecard-selection";

export const ROLEPLAY_JSON_PREFILL_SCHEMA_VERSION = 1;
export const ROLEPLAY_JSON_PREFILL_ENTITY_TYPE = "roleplay";

const ROLEPLAY_JSON_PREFILL_FIELDS = [
    "activitySectorCode",
    "aiInstructions",
    "assignedUserId",
    "category",
    "coachId",
    "context",
    "difficulty",
    "domain",
    "estimatedDurationMinutes",
    "groupId",
    "learnerRole",
    "methodId",
    "objective",
    "obstacles",
    "organizationId",
    "personaId",
    "previewDescription",
    "previewTitle",
    "quizIds",
    "quizParticipation",
    "resources",
    "scope",
    "scorecardId",
    "validationThreshold",
] as const;

export interface RoleplayJsonPrefillResourceDraft {
    externalUrl: string;
    label: string;
}

export interface RoleplayJsonPrefillDraft {
    activitySectorCode: ActivitySectorCode | null;
    aiInstructions: string;
    assignedUserId: string | null;
    category: string | null;
    coachId: string | null;
    context: string;
    difficulty: ContentDifficulty | null;
    domain: ContentDomain | null;
    estimatedDurationMinutes: number | null;
    groupId: string | null;
    learnerRole: string;
    methodId: string | null;
    objective: string;
    obstacles: string;
    organizationId: string | null;
    personaId: string | null;
    previewDescription: string;
    previewTitle: string;
    quizIds: string[];
    quizParticipation: QuizParticipation;
    resources: RoleplayJsonPrefillResourceDraft[];
    scope: ContentVisibilityScope;
    scorecardId: string | null;
    validationThreshold: number;
}

export interface RoleplayJsonPrefillOptions {
    coachOptions: readonly RoleplayCoachOption[];
    groupOptions: readonly RoleplayGroupOption[];
    methodOptions: readonly RoleplayMethodOption[];
    organizationOptions: readonly RoleplayOrganizationOption[];
    personaOptions: readonly RoleplayPersonaOption[];
    quizOptions: readonly RoleplayQuizOption[];
    scorecardOptions: readonly RoleplayScorecardOption[];
    userOptions: readonly RoleplayUserOption[];
}

export interface RoleplayJsonPrefillResult {
    draft: RoleplayJsonPrefillDraft;
    fieldErrors: EntityJsonPrefillFieldErrors;
}

function selectableIds(options: readonly { id: string; isSelectable?: boolean }[]) {
    return new Set(options.filter((option) => option.isSelectable !== false).map((option) => option.id));
}

function readNullableSelection(
    value: unknown,
    path: string,
    allowedIds: ReadonlySet<string>,
    errors: EntityJsonPrefillFieldErrors,
) {
    if (value === null) return null;
    if (typeof value === "string" && allowedIds.has(value)) return value;
    errors[path] = "Aucune option disponible ne correspond à cet identifiant.";
    return null;
}

function readResources(value: unknown, errors: EntityJsonPrefillFieldErrors) {
    if (!Array.isArray(value)) {
        errors.resources = "Les ressources doivent être un tableau.";
        return [];
    }

    return value.map((item, index) => {
        const path = `resources.${index}`;
        const resource = isJsonPrefillRecord(item) ? item : {};
        if (!isJsonPrefillRecord(item)) errors[path] = "La ressource doit être un objet.";
        requireJsonPrefillKeys(resource, ["label", "externalUrl"], path, errors);
        const url = z.string().trim().url().max(1000).safeParse(resource.externalUrl);
        if (!url.success) errors[`${path}.externalUrl`] = "Renseignez une URL complète et valide.";

        return {
            externalUrl: url.success
                ? url.data
                : typeof resource.externalUrl === "string"
                  ? resource.externalUrl.trim()
                  : "",
            label: readJsonPrefillText(resource.label, `${path}.label`, errors, 180),
        };
    });
}

export function parseRoleplayJsonPrefillText(
    text: string,
    options: RoleplayJsonPrefillOptions,
): RoleplayJsonPrefillResult {
    const data = parseEntityJsonPrefillData(
        text,
        ROLEPLAY_JSON_PREFILL_ENTITY_TYPE,
        "un roleplay",
        ROLEPLAY_JSON_PREFILL_SCHEMA_VERSION,
    );
    const errors: EntityJsonPrefillFieldErrors = {};
    requireJsonPrefillKeys(data, ROLEPLAY_JSON_PREFILL_FIELDS, "", errors);

    let activitySectorCode: ActivitySectorCode | null = null;
    if (data.activitySectorCode !== undefined && data.activitySectorCode !== null) {
        if (isActivitySectorCode(data.activitySectorCode)) activitySectorCode = data.activitySectorCode;
        else errors.activitySectorCode = "Le code du secteur d’activité est inconnu.";
    }

    let domain: ContentDomain | null = null;
    if (data.domain !== null) {
        const result = z.enum(CONTENT_DOMAINS).safeParse(data.domain);
        if (result.success) domain = result.data;
        else errors.domain = `Le domaine doit être null ou l’une des valeurs suivantes : ${CONTENT_DOMAINS.join(", ")}.`;
    }

    let category: string | null = null;
    if (data.category !== null) {
        if (typeof data.category === "string" && isContentCategoryForDomain(domain, data.category)) {
            category = data.category;
        } else {
            errors.category = domain
                ? `La catégorie doit appartenir au domaine « ${domain} ».`
                : "La catégorie doit être null lorsqu’aucun domaine n’est sélectionné.";
        }
    }

    let difficulty: ContentDifficulty | null = null;
    if (data.difficulty !== null) {
        const result = z.enum(CONTENT_DIFFICULTIES).safeParse(data.difficulty);
        if (result.success) difficulty = result.data;
        else errors.difficulty = `La difficulté doit être null ou l’une des valeurs suivantes : ${CONTENT_DIFFICULTIES.join(", ")}.`;
    }

    const methodId = readNullableSelection(
        data.methodId,
        "methodId",
        selectableIds(options.methodOptions),
        errors,
    );
    const personaId = readNullableSelection(
        data.personaId,
        "personaId",
        selectableIds(options.personaOptions),
        errors,
    );
    const coachId = readNullableSelection(
        data.coachId,
        "coachId",
        selectableIds(options.coachOptions),
        errors,
    );

    let scorecardId: string | null = null;
    if (data.scorecardId !== null) {
        const scorecard = getAssignableRoleplayScorecardOptions(
            options.scorecardOptions,
            methodId,
        ).find((option) => option.id === data.scorecardId);
        if (scorecard) scorecardId = scorecard.id;
        else errors.scorecardId = "La scorecard doit être disponible et appartenir à la méthode sélectionnée.";
    }

    let quizIds: string[] = [];
    if (!Array.isArray(data.quizIds)) {
        errors.quizIds = "Les quiz complémentaires doivent être un tableau d’identifiants.";
    } else {
        const allowedQuizIds = new Set(
            getAssignableRoleplayQuizOptions(options.quizOptions, methodId)
                .map((quiz) => quiz.id),
        );
        quizIds = [...new Set(data.quizIds.flatMap((value, index) => {
            if (typeof value === "string" && allowedQuizIds.has(value)) return [value];
            errors[`quizIds.${index}`] = "Ce quiz ne peut pas être associé à la méthode sélectionnée.";
            return [];
        }))];
    }

    const participationResult = z.enum(QUIZ_PARTICIPATIONS).safeParse(data.quizParticipation);
    if (!participationResult.success) {
        errors.quizParticipation = `La participation doit être l’une des valeurs suivantes : ${QUIZ_PARTICIPATIONS.join(", ")}.`;
    }

    const scopeResult = z.enum(CONTENT_VISIBILITY_SCOPES).safeParse(data.scope);
    const scope = scopeResult.success ? scopeResult.data : CONTENT_VISIBILITY_SCOPE.public;
    if (!scopeResult.success) {
        errors.scope = `La portée doit être l’une des valeurs suivantes : ${CONTENT_VISIBILITY_SCOPES.join(", ")}.`;
    }

    const organizationIds = selectableIds(options.organizationOptions);
    const groupIds = selectableIds(options.groupOptions);
    const userIds = selectableIds(options.userOptions);
    let organizationId: string | null = null;
    let groupId: string | null = null;
    let assignedUserId: string | null = null;

    if (scope === CONTENT_VISIBILITY_SCOPE.organization) {
        organizationId = readNullableSelection(data.organizationId, "organizationId", organizationIds, errors);
        if (!organizationId) errors.organizationId = "Une organisation disponible est requise pour cette portée.";
    } else if (scope === CONTENT_VISIBILITY_SCOPE.group) {
        organizationId = readNullableSelection(data.organizationId, "organizationId", organizationIds, errors);
        groupId = readNullableSelection(data.groupId, "groupId", groupIds, errors);
        const group = options.groupOptions.find((option) => option.id === groupId);
        if (!organizationId) errors.organizationId = "Une organisation disponible est requise pour cette portée.";
        if (!groupId) errors.groupId = "Un groupe disponible est requis pour cette portée.";
        else if (group?.organizationId !== organizationId) {
            errors.groupId = "Le groupe doit appartenir à l’organisation sélectionnée.";
            groupId = null;
        }
    } else if (scope === CONTENT_VISIBILITY_SCOPE.user) {
        assignedUserId = readNullableSelection(data.assignedUserId, "assignedUserId", userIds, errors);
        if (!assignedUserId) errors.assignedUserId = "Un utilisateur disponible est requis pour cette portée.";
    } else {
        if (data.organizationId !== null) errors.organizationId = "L’organisation doit être null pour un roleplay public.";
        if (data.groupId !== null) errors.groupId = "Le groupe doit être null pour un roleplay public.";
        if (data.assignedUserId !== null) errors.assignedUserId = "L’utilisateur doit être null pour un roleplay public.";
    }

    const durationResult = z.number().int().min(1).safeParse(data.estimatedDurationMinutes);
    const estimatedDurationMinutes = data.estimatedDurationMinutes === null
        ? null
        : durationResult.success
          ? durationResult.data
          : null;
    if (data.estimatedDurationMinutes !== null && !durationResult.success) {
        errors.estimatedDurationMinutes = "La durée doit être null ou un entier supérieur à 0.";
    }

    const thresholdResult = z.number().int().min(0).max(100).safeParse(data.validationThreshold);
    if (!thresholdResult.success) {
        errors.validationThreshold = "Le seuil doit être un entier compris entre 0 et 100.";
    }

    return {
        draft: {
            activitySectorCode,
            aiInstructions: readJsonPrefillText(
                data.aiInstructions,
                "aiInstructions",
                errors,
                ROLEPLAY_AI_INSTRUCTIONS_MAX_LENGTH,
            ),
            assignedUserId,
            category,
            coachId,
            context: readJsonPrefillText(data.context, "context", errors, 4000),
            difficulty,
            domain,
            estimatedDurationMinutes,
            groupId,
            learnerRole: readJsonPrefillText(data.learnerRole, "learnerRole", errors, 2500),
            methodId,
            objective: readJsonPrefillText(data.objective, "objective", errors, 2500),
            obstacles: readJsonPrefillText(data.obstacles, "obstacles", errors, 2500),
            organizationId,
            personaId,
            previewDescription: readJsonPrefillText(data.previewDescription, "previewDescription", errors, 500),
            previewTitle: readJsonPrefillText(data.previewTitle, "previewTitle", errors, 180, true),
            quizIds,
            quizParticipation: participationResult.success
                ? participationResult.data
                : QUIZ_PARTICIPATION.optional,
            resources: readResources(data.resources, errors),
            scope,
            scorecardId,
            validationThreshold: thresholdResult.success
                ? thresholdResult.data
                : ROLEPLAY_DEFAULT_VALIDATION_THRESHOLD_PERCENT,
        },
        fieldErrors: errors,
    };
}

function liveCatalog<T extends { id: string; isSelectable?: boolean }>(
    options: readonly T[],
    select: (option: T) => Record<string, unknown>,
) {
    return options.filter((option) => option.isSelectable !== false).map(select);
}

export function buildRoleplayJsonPrefillPrompt(options: RoleplayJsonPrefillOptions) {
    const example = {
        schemaVersion: ROLEPLAY_JSON_PREFILL_SCHEMA_VERSION,
        entityType: ROLEPLAY_JSON_PREFILL_ENTITY_TYPE,
        data: {
            activitySectorCode: null,
            aiInstructions: "",
            assignedUserId: null,
            category: null,
            coachId: null,
            context: "Contexte du scénario",
            difficulty: null,
            domain: null,
            estimatedDurationMinutes: null,
            groupId: null,
            learnerRole: "Rôle de l’apprenant",
            methodId: null,
            objective: "Objectif du scénario",
            obstacles: "",
            organizationId: null,
            personaId: null,
            previewDescription: "Résumé court",
            previewTitle: "Titre du roleplay",
            quizIds: [],
            quizParticipation: QUIZ_PARTICIPATION.optional,
            resources: [],
            scope: CONTENT_VISIBILITY_SCOPE.public,
            scorecardId: null,
            validationThreshold: ROLEPLAY_DEFAULT_VALIDATION_THRESHOLD_PERCENT,
        },
    };

    return [
        ...buildEntityJsonPrefillPromptPreamble({ entityLabel: "un roleplay" }),
        buildEntityJsonPrefillLiveCatalogInstruction([
            "secteurs d’activité",
            "personas",
            "coachs",
            "méthodes",
            "scorecards",
            "quiz",
            "organisations",
            "groupes",
            "utilisateurs",
        ]),
        "Construis un scénario réaliste fidèle à la source. N’invente ni identifiant, ni ressource, ni contrainte métier absente.",
        `Secteurs d’activité autorisés (le code est enregistré, le libellé est affiché) : ${JSON.stringify(ACTIVITY_SECTORS)}. Utilise un code exact ou null.`,
        `Domaines autorisés : ${JSON.stringify(CONTENT_DOMAINS)}.`,
        `Catégories autorisées par domaine : ${JSON.stringify(CONTENT_CATEGORIES_BY_DOMAIN)}.`,
        `Difficultés autorisées : ${JSON.stringify(CONTENT_DIFFICULTIES)}.`,
        `Portées autorisées : ${JSON.stringify(CONTENT_VISIBILITY_SCOPES)}. Pour public, tous les identifiants de cible sont null ; pour organization, renseigne organizationId ; pour group, organizationId et groupId ; pour user, assignedUserId.`,
        `Personas disponibles : ${JSON.stringify(liveCatalog(options.personaOptions, ({ id, name, role, company }) => ({ id, name, role, company })))}.`,
        `Coachs disponibles : ${JSON.stringify(liveCatalog(options.coachOptions, ({ id, name }) => ({ id, name })))}.`,
        `Méthodes disponibles : ${JSON.stringify(liveCatalog(options.methodOptions, ({ id, name }) => ({ id, name })))}.`,
        `Scorecards disponibles : ${JSON.stringify(liveCatalog(options.scorecardOptions, ({ id, methodId, name }) => ({ id, methodId, name })))}. Une scorecard doit appartenir à methodId.`,
        `Quiz disponibles : ${JSON.stringify(liveCatalog(options.quizOptions, ({ id, kind, methodId, title }) => ({ id, kind, methodId, title })))}. quizIds contient uniquement les quiz complémentaires autorisés : même methodId que le roleplay ou methodId=null. Le quiz de connaissance principal de la méthode est associé automatiquement et ne doit pas être ajouté.`,
        `Organisations disponibles : ${JSON.stringify(liveCatalog(options.organizationOptions, ({ id, name }) => ({ id, name })))}.`,
        `Groupes disponibles : ${JSON.stringify(liveCatalog(options.groupOptions, ({ id, name, organizationId }) => ({ id, name, organizationId })))}.`,
        `Utilisateurs disponibles : ${JSON.stringify(liveCatalog(options.userOptions, ({ id, name, groupIds, organizationIds }) => ({ id, name, groupIds, organizationIds })))}.`,
        `Participations aux quiz autorisées : ${JSON.stringify(QUIZ_PARTICIPATIONS)}.`,
        "Les fichiers ne peuvent pas être générés par JSON. Chaque ressource doit avoir exactement label et externalUrl avec une URL complète ; utilise [] si la source n’en fournit pas.",
        "Respecte exactement cette structure :",
        JSON.stringify(example, null, 2),
    ].join("\n\n");
}
