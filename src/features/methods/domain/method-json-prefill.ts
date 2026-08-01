import { z } from "zod";
import {
    CONTENT_CATEGORIES_BY_DOMAIN,
    CONTENT_DOMAINS,
    CONTENT_VISIBILITY_CHOICE,
    CONTENT_VISIBILITY_CHOICES,
    isContentCategoryForDomain,
    type ContentCategory,
    type ContentDomain,
    type ContentVisibilityChoice,
} from "@/features/content/domain";
import {
    buildEntityJsonPrefillLiveCatalogInstruction,
    buildEntityJsonPrefillPromptPreamble,
    parseEntityJsonPrefillData,
    type EntityJsonPrefillFieldErrors,
    isJsonPrefillRecord,
    readJsonPrefillText,
    requireJsonPrefillKeys,
} from "@/features/entity-json-prefill/domain";
import type { QuizOption } from "@/features/evaluations/domain";
import {
    DEFAULT_METHOD_STEP_ICON,
    METHOD_STEP_ICONS,
    type MethodOrganizationOption,
    type MethodStepIcon,
} from "./method";

export const METHOD_JSON_PREFILL_SCHEMA_VERSION = 1;
export const METHOD_JSON_PREFILL_ENTITY_TYPE = "method";

const METHOD_SOURCE_ANALYSIS_INSTRUCTIONS = [
    "Structure fidèlement le contenu source en méthode opérationnelle sans ajouter de savoir métier absent du document.",
    "Conserve l’ordre logique du document. Regroupe son contenu en étapes distinctes et cohérentes ; la méthode doit contenir au moins une étape avec un titre non vide.",
    "Le nom doit résumer la méthode en 180 caractères maximum. La description doit expliquer son objectif et son usage en 4 000 caractères maximum.",
    "Choisis domain et category uniquement lorsqu’ils correspondent clairement au contenu et aux valeurs autorisées ; sinon utilise null pour les deux.",
    "Utilise un quizId uniquement si le document correspond sans ambiguïté à un quiz disponible ; sinon utilise null.",
    "Utilise le temps de lecture explicitement indiqué dans le document. S’il est absent, utilise null au lieu de l’inventer.",
    "Si aucune cible privée n’est explicitement identifiable dans les organisations disponibles, utilise visibility=\"public\" et organizationId=null.",
    "Reprends uniquement les URL complètes réellement présentes dans la source. Si aucune ressource n’est fournie, utilise [] pour resources et null pour learningResource.",
    "Pour les informations textuelles facultatives absentes, utilise une chaîne vide ou []. N’utilise jamais une URL d’exemple et n’invente pas de citation, de verbatim ou de ressource.",
    "Pour chaque étape, distingue précisément objectifs, bonnes pratiques, erreurs à éviter, posture et verbatims lorsqu’ils existent dans la source.",
    "Choisis pour chaque étape l’icône autorisée dont le sens est le plus proche de son contenu.",
] as const;

export interface MethodJsonPrefillResourceDraft {
    externalUrl: string;
    label: string;
}

export interface MethodJsonPrefillStepDraft {
    bestPractices: string[];
    description: string;
    icon: MethodStepIcon;
    learningResource: MethodJsonPrefillResourceDraft | null;
    objectives: string[];
    pitfalls: string[];
    posture: string[];
    shortDescription: string;
    shortName: string;
    title: string;
    verbatims: string[];
}

export interface MethodJsonPrefillDraft {
    category: ContentCategory | null;
    challenges: string[];
    description: string;
    domain: ContentDomain | null;
    name: string;
    objectives: string[];
    organizationId: string | null;
    quizId: string | null;
    readingTimeMinutes: number | null;
    resources: MethodJsonPrefillResourceDraft[];
    steps: MethodJsonPrefillStepDraft[];
    visibility: ContentVisibilityChoice;
}

export interface MethodJsonPrefillOptions {
    organizationOptions: readonly MethodOrganizationOption[];
    quizOptions: readonly QuizOption[];
}

export interface MethodJsonPrefillResult {
    draft: MethodJsonPrefillDraft;
    fieldErrors: EntityJsonPrefillFieldErrors;
}

const urlText = z.string().trim().url().max(1000);
const listItem = z.string().trim().min(1).max(800);

function readTextList(
    value: unknown,
    path: string,
    errors: EntityJsonPrefillFieldErrors,
) {
    if (!Array.isArray(value)) {
        errors[path] = "Ce champ doit être un tableau de textes.";
        return [""];
    }

    if (value.length === 0) return [""];

    return value.map((item, index) => {
        const result = listItem.safeParse(item);
        if (!result.success) {
            errors[`${path}.${index}`] = "La valeur doit être un texte non vide de 800 caractères maximum.";
            return typeof item === "string" ? item.trim().slice(0, 800) : "";
        }
        return result.data;
    });
}

function readUrlResource(
    value: unknown,
    path: string,
    errors: EntityJsonPrefillFieldErrors,
): MethodJsonPrefillResourceDraft {
    const resource = isJsonPrefillRecord(value) ? value : {};
    if (!isJsonPrefillRecord(value)) {
        errors[path] = "La ressource doit être un objet.";
    }

    const label = readJsonPrefillText(resource.label, `${path}.label`, errors, 160);
    const urlResult = urlText.safeParse(resource.externalUrl);
    if (!urlResult.success) {
        errors[`${path}.externalUrl`] = "Renseignez une URL complète et valide.";
    }

    return {
        externalUrl: urlResult.success ? urlResult.data : typeof resource.externalUrl === "string" ? resource.externalUrl.trim() : "",
        label,
    };
}

function readStep(
    value: unknown,
    index: number,
    errors: EntityJsonPrefillFieldErrors,
): MethodJsonPrefillStepDraft {
    const path = `steps.${index}`;
    const step = isJsonPrefillRecord(value) ? value : {};
    if (!isJsonPrefillRecord(value)) errors[path] = "L’étape doit être un objet.";

    const requiredFields = [
        "title",
        "description",
        "shortName",
        "shortDescription",
        "icon",
        "learningResource",
        "objectives",
        "bestPractices",
        "pitfalls",
        "posture",
        "verbatims",
    ];
    requireJsonPrefillKeys(step, requiredFields, path, errors);

    const iconResult = z.enum(METHOD_STEP_ICONS).safeParse(step.icon);
    if (!iconResult.success) {
        errors[`${path}.icon`] = `L’icône doit être l’une des valeurs suivantes : ${METHOD_STEP_ICONS.join(", ")}.`;
    }

    let learningResource: MethodJsonPrefillResourceDraft | null = null;
    if (step.learningResource !== null) {
        learningResource = readUrlResource(step.learningResource, `${path}.learningResource`, errors);
    }

    return {
        bestPractices: readTextList(step.bestPractices, `${path}.bestPractices`, errors),
        description: readJsonPrefillText(step.description, `${path}.description`, errors, 1200),
        icon: iconResult.success ? iconResult.data : DEFAULT_METHOD_STEP_ICON,
        learningResource,
        objectives: readTextList(step.objectives, `${path}.objectives`, errors),
        pitfalls: readTextList(step.pitfalls, `${path}.pitfalls`, errors),
        posture: readTextList(step.posture, `${path}.posture`, errors),
        shortDescription: readJsonPrefillText(step.shortDescription, `${path}.shortDescription`, errors, 500),
        shortName: readJsonPrefillText(step.shortName, `${path}.shortName`, errors, 120),
        title: readJsonPrefillText(step.title, `${path}.title`, errors, 180, true),
        verbatims: readTextList(step.verbatims, `${path}.verbatims`, errors),
    };
}

export function parseMethodJsonPrefillText(
    text: string,
    { organizationOptions, quizOptions }: MethodJsonPrefillOptions,
): MethodJsonPrefillResult {
    const data = parseEntityJsonPrefillData(
        text,
        METHOD_JSON_PREFILL_ENTITY_TYPE,
        "une méthode",
        METHOD_JSON_PREFILL_SCHEMA_VERSION,
    );
    const errors: EntityJsonPrefillFieldErrors = {};
    requireJsonPrefillKeys(data, [
        "name",
        "domain",
        "category",
        "quizId",
        "description",
        "readingTimeMinutes",
        "visibility",
        "organizationId",
        "resources",
        "objectives",
        "challenges",
        "steps",
    ], "", errors);

    let domain: ContentDomain | null = null;
    if (data.domain !== null) {
        const result = z.enum(CONTENT_DOMAINS).safeParse(data.domain);
        if (result.success) domain = result.data;
        else errors.domain = `Le domaine doit être null ou l’une des valeurs suivantes : ${CONTENT_DOMAINS.join(", ")}.`;
    }

    let category: ContentCategory | null = null;
    if (data.category !== null) {
        if (typeof data.category === "string" && isContentCategoryForDomain(domain, data.category)) {
            category = data.category;
        } else {
            errors.category = domain
                ? `La catégorie doit appartenir au domaine « ${domain} ».`
                : "La catégorie doit être null lorsqu’aucun domaine n’est sélectionné.";
        }
    }

    const availableQuizIds = new Set(
        quizOptions.filter((option) => option.isSelectable !== false).map((option) => option.id),
    );
    let quizId: string | null = null;
    if (data.quizId !== null) {
        if (typeof data.quizId === "string" && availableQuizIds.has(data.quizId)) quizId = data.quizId;
        else errors.quizId = "Aucun quiz disponible ne correspond à cet identifiant.";
    }

    const visibilityResult = z.enum(CONTENT_VISIBILITY_CHOICES).safeParse(data.visibility);
    const visibility = visibilityResult.success
        ? visibilityResult.data
        : CONTENT_VISIBILITY_CHOICE.public;
    if (!visibilityResult.success) {
        errors.visibility = `La visibilité doit être l’une des valeurs suivantes : ${CONTENT_VISIBILITY_CHOICES.join(", ")}.`;
    }

    const availableOrganizationIds = new Set(
        organizationOptions.filter((option) => option.isSelectable !== false).map((option) => option.id),
    );
    let organizationId: string | null = null;
    if (visibility === CONTENT_VISIBILITY_CHOICE.private) {
        if (typeof data.organizationId === "string" && availableOrganizationIds.has(data.organizationId)) {
            organizationId = data.organizationId;
        } else {
            errors.organizationId = "Aucune organisation disponible ne correspond à cet identifiant.";
        }
    } else if (data.organizationId !== null) {
        errors.organizationId = "L’identifiant d’organisation doit être null pour une méthode publique.";
    }

    let readingTimeMinutes: number | null = null;
    if (data.readingTimeMinutes !== null) {
        const readingTimeResult = z.number().int().min(1).safeParse(data.readingTimeMinutes);
        if (readingTimeResult.success) readingTimeMinutes = readingTimeResult.data;
        else errors.readingTimeMinutes = "Le temps de lecture doit être null ou un nombre entier supérieur à 0.";
    }

    let resources: MethodJsonPrefillResourceDraft[] = [];
    if (Array.isArray(data.resources)) {
        resources = data.resources.map((resource, index) => readUrlResource(resource, `resources.${index}`, errors));
    } else {
        errors.resources = "Les ressources doivent être un tableau.";
    }

    let steps: MethodJsonPrefillStepDraft[];
    if (!Array.isArray(data.steps) || data.steps.length === 0) {
        errors.steps = "La méthode doit contenir au moins une étape.";
        steps = [readStep({}, 0, errors)];
    } else {
        steps = data.steps.map((step, index) => readStep(step, index, errors));
    }

    return {
        draft: {
            category,
            challenges: readTextList(data.challenges, "challenges", errors),
            description: readJsonPrefillText(data.description, "description", errors, 4000),
            domain,
            name: readJsonPrefillText(data.name, "name", errors, 180, true),
            objectives: readTextList(data.objectives, "objectives", errors),
            organizationId,
            quizId,
            readingTimeMinutes,
            resources,
            steps,
            visibility,
        },
        fieldErrors: errors,
    };
}

export function buildMethodJsonPrefillPrompt({
    organizationOptions,
    quizOptions,
}: MethodJsonPrefillOptions) {
    const availableOrganizations = organizationOptions
        .filter((option) => option.isSelectable !== false)
        .map(({ id, name }) => ({ id, name }));
    const availableQuizzes = quizOptions
        .filter((option) => option.isSelectable !== false)
        .map(({ id, kind, title }) => ({ id, kind, title }));
    const example = {
        schemaVersion: METHOD_JSON_PREFILL_SCHEMA_VERSION,
        entityType: METHOD_JSON_PREFILL_ENTITY_TYPE,
        data: {
            name: "Nom de la méthode",
            domain: CONTENT_DOMAINS[0],
            category: CONTENT_CATEGORIES_BY_DOMAIN[CONTENT_DOMAINS[0]][0],
            quizId: null,
            description: "Description complète de la méthode",
            readingTimeMinutes: 12,
            visibility: CONTENT_VISIBILITY_CHOICE.public,
            organizationId: null,
            resources: [{ label: "Guide complémentaire", externalUrl: "https://example.com/guide" }],
            objectives: ["Objectif global de la méthode"],
            challenges: ["Enjeu traité par la méthode"],
            steps: [{
                title: "Titre de l’étape",
                description: "Description détaillée de l’étape",
                shortName: "Nom court",
                shortDescription: "Résumé à retenir",
                icon: DEFAULT_METHOD_STEP_ICON,
                learningResource: { label: "Capsule vidéo", externalUrl: "https://example.com/video" },
                objectives: ["Objectif de l’étape"],
                bestPractices: ["Bonne pratique"],
                pitfalls: ["Erreur à éviter"],
                posture: ["Posture attendue"],
                verbatims: ["Exemple de verbatim"],
            }],
        },
    };

    return [
        ...buildEntityJsonPrefillPromptPreamble({ entityLabel: "une méthode" }),
        buildEntityJsonPrefillLiveCatalogInstruction(["quiz", "organisations"]),
        [
            "Règles d’analyse du document et de construction de la méthode :",
            ...METHOD_SOURCE_ANALYSIS_INSTRUCTIONS.map((instruction) => `- ${instruction}`),
        ].join("\n"),
        `Domaines autorisés : ${JSON.stringify(CONTENT_DOMAINS)}.`,
        `Catégories autorisées par domaine : ${JSON.stringify(CONTENT_CATEGORIES_BY_DOMAIN)}.`,
        `Icônes d’étape autorisées : ${JSON.stringify(METHOD_STEP_ICONS)}.`,
        `Visibilités autorisées : ${JSON.stringify(CONTENT_VISIBILITY_CHOICES)}.`,
        `Quiz actuellement disponibles : ${JSON.stringify(availableQuizzes)}. Utilise uniquement un id exact de cette liste ou null.`,
        `Organisations actuellement disponibles : ${JSON.stringify(availableOrganizations)}. Pour visibility="private", utilise un id exact ; pour visibility="public", organizationId doit être null.`,
        "Les fichiers ne peuvent pas être générés par JSON : chaque ressource doit donc être une URL complète. Utilise [] ou null si aucune ressource n’est pertinente.",
        "Respecte exactement cette structure :",
        JSON.stringify(example, null, 2),
    ].join("\n\n");
}
