import { z } from "zod";
import {
    CONTENT_CATEGORIES_BY_DOMAIN,
    CONTENT_DOMAINS,
    CONTENT_LEVELS,
    isContentCategoryForDomain,
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
import type { SkillOption } from "@/features/skills/domain/skills";
import {
    SCORECARD_CRITERION_DIMENSIONS,
    SCORECARD_VISIBILITIES,
    SCORECARD_VISIBILITY,
    type ScorecardCriterionDimension,
    type ScorecardMethodOption,
    type ScorecardOrganizationOption,
    type ScorecardVisibility,
} from "./scorecard";
import {
    distributeScorecardStepWeights,
    SCORECARD_STEP_WEIGHT_TOTAL_PERCENT,
} from "./scorecard-weighting";

export const SCORECARD_JSON_PREFILL_SCHEMA_VERSION = 1;
export const SCORECARD_JSON_PREFILL_ENTITY_TYPE = "scorecard";

const SCORECARD_SOURCE_ANALYSIS_INSTRUCTIONS = [
    "Analyse intégralement le document joint pour transformer son contenu en une scorecard d’évaluation complète.",
    "Lis toutes les pages, tous les tableaux, critères, barèmes et annexes avant de produire le résultat.",
    "Utilise uniquement les informations du document. Tu peux reformuler un critère pour le rendre clair, précis et observable, sans modifier son sens.",
    "N’omets aucun critère présent dans la source et n’invente aucune méthode, étape, compétence, preuve, note ou règle d’évaluation.",
    "Le nom doit résumer fidèlement la scorecard en 180 caractères maximum. La description doit préciser son contenu et son objectif d’évaluation.",
    "Pour chaque critère, renseigne : key avec le comportement ou résultat observable ; expectedEvidence avec les preuves concrètes de réussite ; aiInstruction avec la manière précise dont l’IA doit l’analyser ; verbatim avec un exemple présent dans le document ou une reformulation fidèle.",
    "Conserve les critères dans leur ordre d’apparition dans le document. L’ordre des étapes est imposé par la méthode choisie et par les methodStepId disponibles.",
    "Si le document fournit une pondération valide des étapes, conserve-la. Sinon, répartis weightPercent équitablement entre toutes les étapes, à deux décimales maximum, en ajustant le reliquat pour obtenir exactement 100.",
    "Si le document fournit un barème de points, conserve-le dans la limite de 1 à 100 points par critère. Sinon, répartis 100 points en nombres entiers aussi équitablement que possible entre tous les critères, en ajustant le reliquat pour obtenir exactement 100.",
    "Pour une information textuelle absente, utilise exactement \"Non renseigné\". Pour domain, category ou level absents, utilise null. Pour un identifiant obligatoire sans correspondance fiable, utilise une chaîne vide afin que l’interface signale le champ à corriger ; n’invente jamais d’identifiant.",
    "Utilise toujours visibility=\"public\" et organizationId=null.",
    "Vérifie en interne que les poids totalisent 100, mais n’ajoute aucun bloc de vérification ni aucune propriété de calcul au JSON final.",
] as const;

function distributeIntegerTotal(total: number, itemCount: number) {
    if (itemCount <= 0) return [];

    const base = Math.floor(total / itemCount);
    const remainder = total % itemCount;

    return Array.from({ length: itemCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

export interface ScorecardJsonPrefillCriterionDraft {
    aiInstruction: string;
    competenceId: string | null;
    dimension: ScorecardCriterionDimension | null;
    dimensionItemId: string | null;
    expectedEvidence: string;
    key: string;
    maxPoints: number;
    verbatim: string;
}

export interface ScorecardJsonPrefillStepDraft {
    criteria: ScorecardJsonPrefillCriterionDraft[];
    methodStepId: string;
    name: string;
    order: number;
    weightPercent: number;
}

export interface ScorecardJsonPrefillDraft {
    category: string | null;
    description: string;
    domain: string | null;
    level: string | null;
    methodId: string | null;
    name: string;
    organizationId: string | null;
    steps: ScorecardJsonPrefillStepDraft[];
    visibility: ScorecardVisibility;
}

export interface ScorecardJsonPrefillOptions {
    methodOptions: readonly ScorecardMethodOption[];
    organizationOptions: readonly ScorecardOrganizationOption[];
    skillOptions: readonly SkillOption[];
}

export interface ScorecardJsonPrefillResult {
    draft: ScorecardJsonPrefillDraft;
    fieldErrors: EntityJsonPrefillFieldErrors;
}

function readCriterion(
    value: unknown,
    path: string,
    skillsById: Map<string, SkillOption>,
    errors: EntityJsonPrefillFieldErrors,
): ScorecardJsonPrefillCriterionDraft {
    const criterion = isJsonPrefillRecord(value) ? value : {};
    if (!isJsonPrefillRecord(value)) errors[path] = "Le critère doit être un objet.";
    requireJsonPrefillKeys(
        criterion,
        ["key", "expectedEvidence", "competenceId", "dimension", "dimensionItemId", "maxPoints", "aiInstruction", "verbatim"],
        path,
        errors,
    );

    let competenceId: string | null = null;
    const skill = typeof criterion.competenceId === "string"
        ? skillsById.get(criterion.competenceId)
        : undefined;
    if (skill) competenceId = skill.id;
    else errors[`${path}.competenceId`] = "Aucune compétence disponible ne correspond à cet identifiant.";

    const dimensionResult = z.enum(SCORECARD_CRITERION_DIMENSIONS).safeParse(criterion.dimension);
    const dimension = dimensionResult.success ? dimensionResult.data : null;
    if (!dimensionResult.success) {
        errors[`${path}.dimension`] = `La dimension doit être l’une des valeurs suivantes : ${SCORECARD_CRITERION_DIMENSIONS.join(", ")}.`;
    }

    const dimensionItem = skill?.dimensionItems.find(
        (item) =>
            item.isActive &&
            item.id === criterion.dimensionItemId &&
            item.dimension === dimension,
    );
    if (!dimensionItem) {
        errors[`${path}.dimensionItemId`] = competenceId && dimension
            ? "Aucun item actif de cette compétence et de cette dimension ne correspond à cet identifiant."
            : "L’item ne peut pas être validé sans compétence et dimension valides.";
    }

    const maxPointsResult = z.number().int().min(1).max(100).safeParse(criterion.maxPoints);
    if (!maxPointsResult.success) {
        errors[`${path}.maxPoints`] = "Les points doivent être un nombre entier compris entre 1 et 100.";
    }

    return {
        aiInstruction: readJsonPrefillText(criterion.aiInstruction, `${path}.aiInstruction`, errors, 1600),
        competenceId,
        dimension,
        dimensionItemId: dimensionItem?.id ?? null,
        expectedEvidence: readJsonPrefillText(criterion.expectedEvidence, `${path}.expectedEvidence`, errors, 1200, true),
        key: readJsonPrefillText(criterion.key, `${path}.key`, errors, 600, true),
        maxPoints: maxPointsResult.success ? maxPointsResult.data : 1,
        verbatim: readJsonPrefillText(criterion.verbatim, `${path}.verbatim`, errors, 1600, true),
    };
}

export function parseScorecardJsonPrefillText(
    text: string,
    { methodOptions, organizationOptions, skillOptions }: ScorecardJsonPrefillOptions,
): ScorecardJsonPrefillResult {
    const data = parseEntityJsonPrefillData(
        text,
        SCORECARD_JSON_PREFILL_ENTITY_TYPE,
        "une scorecard",
        SCORECARD_JSON_PREFILL_SCHEMA_VERSION,
    );
    const errors: EntityJsonPrefillFieldErrors = {};
    requireJsonPrefillKeys(
        data,
        ["name", "methodId", "domain", "category", "level", "description", "visibility", "organizationId", "steps"],
        "",
        errors,
    );

    const selectableMethods = methodOptions.filter((option) => option.isSelectable !== false);
    const selectedMethod = typeof data.methodId === "string"
        ? selectableMethods.find((option) => option.id === data.methodId)
        : undefined;
    if (!selectedMethod) errors.methodId = "Aucune méthode disponible ne correspond à cet identifiant.";

    let domain: string | null = null;
    if (data.domain !== null) {
        const result = z.enum(CONTENT_DOMAINS).safeParse(data.domain);
        if (result.success) domain = result.data;
        else errors.domain = `Le domaine doit être null ou l’une des valeurs suivantes : ${CONTENT_DOMAINS.join(", ")}.`;
    }

    let category: string | null = null;
    if (data.category !== null) {
        if (typeof data.category === "string" && isContentCategoryForDomain(domain, data.category)) category = data.category;
        else errors.category = domain
            ? `La catégorie doit appartenir au domaine « ${domain} ».`
            : "La catégorie doit être null lorsqu’aucun domaine n’est sélectionné.";
    }

    let level: string | null = null;
    if (data.level !== null) {
        const result = z.enum(CONTENT_LEVELS).safeParse(data.level);
        if (result.success) level = result.data;
        else errors.level = `Le niveau doit être null ou l’une des valeurs suivantes : ${CONTENT_LEVELS.join(", ")}.`;
    }

    const visibilityResult = z.enum(SCORECARD_VISIBILITIES).safeParse(data.visibility);
    const visibility = visibilityResult.success ? visibilityResult.data : SCORECARD_VISIBILITY.public;
    if (!visibilityResult.success) {
        errors.visibility = `La visibilité doit être l’une des valeurs suivantes : ${SCORECARD_VISIBILITIES.join(", ")}.`;
    }

    const availableOrganizationIds = new Set(
        organizationOptions.filter((option) => option.isSelectable !== false).map((option) => option.id),
    );
    let organizationId: string | null = null;
    if (visibility === SCORECARD_VISIBILITY.private) {
        if (typeof data.organizationId === "string" && availableOrganizationIds.has(data.organizationId)) {
            organizationId = data.organizationId;
        } else {
            errors.organizationId = "Aucune organisation disponible ne correspond à cet identifiant.";
        }
    } else if (data.organizationId !== null) {
        errors.organizationId = "L’identifiant d’organisation doit être null pour une scorecard publique.";
    }

    const skillsById = new Map(
        skillOptions
            .filter((option) => option.isSelectable !== false)
            .map((option) => [option.id, option]),
    );
    const methodStepsById = new Map(selectedMethod?.steps.map((step) => [step.id, step]) ?? []);
    let steps: ScorecardJsonPrefillStepDraft[] = [];
    if (!Array.isArray(data.steps) || data.steps.length === 0) {
        errors.steps = "La scorecard doit contenir les étapes de la méthode sélectionnée.";
    } else {
        steps = data.steps.map((value, index) => {
            const path = `steps.${index}`;
            const step = isJsonPrefillRecord(value) ? value : {};
            if (!isJsonPrefillRecord(value)) errors[path] = "L’étape doit être un objet.";
            requireJsonPrefillKeys(step, ["methodStepId", "weightPercent", "criteria"], path, errors);

            const methodStep = typeof step.methodStepId === "string"
                ? methodStepsById.get(step.methodStepId)
                : undefined;
            if (!methodStep) {
                errors[`${path}.methodStepId`] = "Cette étape n’appartient pas à la méthode sélectionnée.";
            }

            const weightResult = z.number().positive().max(100).safeParse(step.weightPercent);
            if (!weightResult.success) {
                errors[`${path}.weightPercent`] = "Le poids doit être un nombre supérieur à 0 et inférieur ou égal à 100.";
            }

            let criteria: ScorecardJsonPrefillCriterionDraft[];
            if (!Array.isArray(step.criteria) || step.criteria.length === 0) {
                errors[`${path}.criteria`] = "Ajoutez au moins un critère observable à cette étape.";
                criteria = [readCriterion({}, `${path}.criteria.0`, skillsById, errors)];
            } else {
                criteria = step.criteria.map((criterion, criterionIndex) =>
                    readCriterion(criterion, `${path}.criteria.${criterionIndex}`, skillsById, errors),
                );
            }

            return {
                criteria,
                methodStepId: methodStep?.id ?? "",
                name: methodStep?.title ?? "Étape non reconnue",
                order: methodStep?.order ?? index + 1,
                weightPercent: weightResult.success ? weightResult.data : 0,
            };
        });

        const importedStepIds = steps.map((step) => step.methodStepId).filter(Boolean);
        const expectedStepIds = selectedMethod?.steps.map((step) => step.id) ?? [];
        if (
            importedStepIds.length !== new Set(importedStepIds).size ||
            expectedStepIds.some((stepId) => !importedStepIds.includes(stepId))
        ) {
            errors.steps = "Chaque étape de la méthode doit être présente une seule fois.";
        }

        const totalWeight = steps.reduce((total, step) => total + step.weightPercent, 0);
        if (Math.round(totalWeight * 100) / 100 !== SCORECARD_STEP_WEIGHT_TOTAL_PERCENT) {
            errors.steps = `La pondération des étapes doit totaliser ${SCORECARD_STEP_WEIGHT_TOTAL_PERCENT}%.`;
        }
    }

    return {
        draft: {
            category,
            description: readJsonPrefillText(data.description, "description", errors, 4000),
            domain,
            level,
            methodId: selectedMethod?.id ?? null,
            name: readJsonPrefillText(data.name, "name", errors, 180, true),
            organizationId,
            steps,
            visibility,
        },
        fieldErrors: errors,
    };
}

export function buildScorecardJsonPrefillPrompt({
    methodOptions,
    organizationOptions,
    skillOptions,
}: ScorecardJsonPrefillOptions) {
    const methods = methodOptions
        .filter((method) => method.isSelectable !== false)
        .map(({ id, name, steps }) => ({
            id,
            name,
            steps: steps.map(({ id: stepId, order, title }) => ({ id: stepId, order, title })),
        }));
    const organizations = organizationOptions
        .filter((organization) => organization.isSelectable !== false)
        .map(({ id, name }) => ({ id, name }));
    const skills = skillOptions
        .filter((skill) => skill.isSelectable !== false)
        .map(({ id, name, dimensionItems }) => ({
            id,
            name,
            dimensionItems: dimensionItems
                .filter((item) => item.isActive && SCORECARD_CRITERION_DIMENSIONS.includes(item.dimension as ScorecardCriterionDimension))
                .map(({ dimension, id: itemId, label }) => ({ dimension, id: itemId, label })),
        }));
    const exampleMethod = methods[0];
    const exampleSkill = skills.find((skill) => skill.dimensionItems.length > 0);
    const exampleItem = exampleSkill?.dimensionItems[0];
    const rawExampleSteps = exampleMethod?.steps.length
        ? exampleMethod.steps
        : [{ id: "ID_ETAPE_METHODE", order: 1, title: "Étape" }];
    const exampleWeights = distributeScorecardStepWeights(rawExampleSteps.length);
    const exampleCriterionPoints = distributeIntegerTotal(100, rawExampleSteps.length);
    const exampleSteps = rawExampleSteps.map(
        (step, index) => ({
            methodStepId: step.id,
            weightPercent: exampleWeights[index],
            criteria: [{
                key: "Comportement observable attendu",
                expectedEvidence: "Preuves concrètes permettant de valider le critère",
                competenceId: exampleSkill?.id ?? "ID_COMPETENCE",
                dimension: exampleItem?.dimension ?? SCORECARD_CRITERION_DIMENSIONS[0],
                dimensionItemId: exampleItem?.id ?? "UUID_ITEM_DIMENSION",
                maxPoints: exampleCriterionPoints[index],
                aiInstruction: "Instruction précise pour analyser ce critère",
                verbatim: "Exemple de formulation conforme",
            }],
        }),
    );

    return [
        ...buildEntityJsonPrefillPromptPreamble({ entityLabel: "une scorecard" }),
        buildEntityJsonPrefillLiveCatalogInstruction([
            "méthodes et étapes",
            "compétences et items de dimension",
            "organisations",
        ]),
        ["Règles d’analyse du document et de construction de la scorecard :", ...SCORECARD_SOURCE_ANALYSIS_INSTRUCTIONS.map((instruction) => `- ${instruction}`)].join("\n"),
        `Méthodes et étapes actuellement disponibles : ${JSON.stringify(methods)}. Choisis un methodId exact puis inclus chaque étape de cette méthode une seule fois avec son methodStepId exact.`,
        `Compétences et items de dimension actuellement disponibles : ${JSON.stringify(skills)}. Associe chaque critère par correspondance sémantique avec les libellés, puis utilise uniquement les id exacts dans le JSON. dimensionItemId doit appartenir à competenceId et à la dimension indiquée.`,
        `Dimensions autorisées : ${JSON.stringify(SCORECARD_CRITERION_DIMENSIONS)}.`,
        `Domaines autorisés : ${JSON.stringify(CONTENT_DOMAINS)}. Catégories autorisées par domaine : ${JSON.stringify(CONTENT_CATEGORIES_BY_DOMAIN)}. Niveaux autorisés : ${JSON.stringify(CONTENT_LEVELS)}.`,
        `Visibilités autorisées : ${JSON.stringify(SCORECARD_VISIBILITIES)}. Pour cette génération, applique la règle client visibility="public" avec organizationId=null. Organisations disponibles conservées dans le référentiel : ${JSON.stringify(organizations)} ; si cette règle est ultérieurement remplacée explicitement par visibility="private", utilise uniquement un id exact de ce référentiel.`,
        "Les noms des entités servent uniquement à choisir la bonne correspondance dans les catalogues ci-dessus : écris leurs IDs exacts dans les champs prévus et n’ajoute aucun champ contenant leur nom.",
        "Chaque étape doit contenir au moins un critère. La somme de weightPercent doit être exactement égale à 100. maxPoints doit être un entier entre 1 et 100.",
        "Respecte exactement cette structure :",
        JSON.stringify({
            schemaVersion: SCORECARD_JSON_PREFILL_SCHEMA_VERSION,
            entityType: SCORECARD_JSON_PREFILL_ENTITY_TYPE,
            data: {
                name: "Nom de la scorecard",
                methodId: exampleMethod?.id ?? "ID_METHODE",
                domain: CONTENT_DOMAINS[0],
                category: CONTENT_CATEGORIES_BY_DOMAIN[CONTENT_DOMAINS[0]][0],
                level: CONTENT_LEVELS[0],
                description: "Description de la scorecard",
                visibility: SCORECARD_VISIBILITY.public,
                organizationId: null,
                steps: exampleSteps,
            },
        }, null, 2),
    ].join("\n\n");
}
