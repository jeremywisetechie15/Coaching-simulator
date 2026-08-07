import { z } from "zod";
import {
    CONTENT_CATEGORIES_BY_DOMAIN,
    CONTENT_DIFFICULTIES,
    CONTENT_DOMAINS,
    isContentCategoryForDomain,
    type ContentDifficulty,
} from "@/features/content/domain";
import {
    buildEntityJsonPrefillLiveCatalogInstruction,
    buildEntityJsonPrefillPromptPreamble,
    isJsonPrefillRecord,
    parseEntityJsonPrefillDocument,
    readJsonPrefillText,
    requireJsonPrefillKeys,
    type EntityJsonPrefillFieldErrors,
} from "@/features/entity-json-prefill/domain";
import type { SkillOption } from "@/features/skills/domain/skills";
import {
    QUIZ_ATTACHMENT_TYPES,
    QUIZ_EVALUATED_DIMENSION,
    QUIZ_KIND,
    QUIZ_KINDS,
    QUIZ_PARTICIPATIONS,
    QUIZ_QUESTION_TYPES,
    QUIZ_TYPES,
    QUIZ_VISIBILITY_SCOPES,
    type QuizAttachmentType,
    type QuizGroupOption,
    type QuizKind,
    type QuizMethodOption,
    type QuizOrganizationOption,
    type QuizParticipation,
    type QuizQuestionType,
    type QuizType,
    type QuizUserOption,
    type QuizVisibilityScope,
} from "./quiz";
import {
    getQuizMethodOptionsForKind,
    isQuizMethodSelectableForKind,
} from "./quiz-method-selection";

export const QUIZ_JSON_PREFILL_SCHEMA_VERSION = 2;
export const QUIZ_JSON_PREFILL_LEGACY_SCHEMA_VERSION = 1;
export const QUIZ_JSON_PREFILL_ENTITY_TYPE = "quiz";

const QUIZ_SOURCE_ANALYSIS_INSTRUCTIONS = [
    "Transforme fidèlement le document source en quiz exploitable sans inventer de règle, de bonne réponse ou de connaissance métier absente du document.",
    "Lis toutes les sections, tableaux, annexes et exemples avant de rédiger les questions. Couvre les notions importantes sans créer de doublons artificiels.",
    "Le titre doit résumer le quiz en 180 caractères maximum et la description doit préciser ce qui est évalué en 4 000 caractères maximum.",
    "Utilise quizType=\"knowledge\" par défaut. Utilise quizType=\"self_assessment\" uniquement si le document décrit explicitement une auto-évaluation ou un auto-positionnement.",
    "Utilise quizKind=\"method_knowledge\" uniquement si la source décrit le quiz principal de validation d’une méthode. Utilise quizKind=\"contextual\" pour un quiz complémentaire ou contextuel.",
    "Si une méthode disponible correspond sans ambiguïté au document, utilise son methodId exact et inclus chacune de ses étapes exactement une fois avec son methodStepId exact. Sinon, utilise methodId=null, methodStepId=null et construis des étapes thématiques fidèles au document.",
    "Associe chaque étape et chaque question aux compétences et items Savoir disponibles par correspondance sémantique. Une question ne peut utiliser qu’une competenceId déjà présente dans competenceIds de son étape.",
    "Si le document fournit des pondérations d’étapes valides, entières et totalisant 100, conserve-les. Sinon, répartis 100 équitablement entre les étapes en nombres entiers et attribue le reliquat d’un point aux premières étapes.",
    "Si les étapes de la méthode sélectionnée possèdent toutes une pondération entière valide totalisant 100, utilise prioritairement ces pondérations.",
    "Si le document fournit des points entiers entre 0 et 100 pour les questions, conserve-les. Sinon, attribue 1 point à chaque question afin qu’elles aient le même poids dans leur étape. Une question à 0 point ne contribue pas au score.",
    "Le score de chaque étape est le prorata des points obtenus sur les points possibles de cette étape. Le score global est ensuite le prorata des scores d’étape selon leur weight ; les points d’une question ne pondèrent donc que les questions de sa propre étape.",
    "Une QCU doit avoir au moins deux choix et exactement une bonne réponse. Une QCM doit avoir au moins deux choix et au moins une bonne réponse.",
    "Rédige une explication fidèle à la source pour chaque question. Si aucune explication n’est disponible ou déductible sans invention, utilise une chaîne vide.",
    "Pour difficulty absent, utilise null. Pour domain absent, utilise null et categories=[]. Pour tags absents, utilise [].",
    "Pour les paramètres absents, utilise durationMinutes=30, maxAttempts=null, validationThreshold=70 et participation=\"optional\". Utilise un entier supérieur à 0 uniquement si le document exige une limite de tentatives.",
    "Si aucune cible privée n’est explicitement identifiable dans les catalogues disponibles, utilise scope=\"public\" et organizationId, groupId, assignedUserId à null.",
    "Si aucune compétence ou aucun item Savoir disponible ne correspond de façon fiable, utilise un tableau vide ou une chaîne vide dans le champ concerné afin que l’interface le signale ; n’invente jamais d’identifiant.",
    "N’ajoute une pièce jointe que si la source contient une URL complète pertinente. Une question accepte au maximum une pièce jointe ; sinon utilise attachments=[].",
] as const;

export interface QuizJsonPrefillChoiceDraft {
    isCorrect: boolean;
    label: string;
}

export interface QuizJsonPrefillAttachmentDraft {
    externalUrl: string;
    label: string;
    type: QuizAttachmentType;
}

export interface QuizJsonPrefillQuestionDraft {
    attachments: QuizJsonPrefillAttachmentDraft[];
    choices: QuizJsonPrefillChoiceDraft[];
    competenceId: string | null;
    dimensionItemId: string | null;
    explanation: string;
    points: number;
    prompt: string;
    type: QuizQuestionType;
}

export interface QuizJsonPrefillStepDraft {
    competenceIds: string[];
    methodStepId: string | null;
    name: string;
    questions: QuizJsonPrefillQuestionDraft[];
    weight: number;
}

export interface QuizJsonPrefillDraft {
    assignedUserId: string;
    categories: string[];
    description: string;
    difficulty: ContentDifficulty | null;
    domain: string | null;
    durationMinutes: number;
    groupId: string;
    maxAttempts: number | null;
    methodId: string | null;
    organizationId: string | null;
    participation: QuizParticipation;
    quizKind: QuizKind | null;
    quizType: QuizType;
    scope: QuizVisibilityScope;
    steps: QuizJsonPrefillStepDraft[];
    tags: string[];
    title: string;
    validationThreshold: number | null;
}

export interface QuizJsonPrefillOptions {
    groupOptions: readonly QuizGroupOption[];
    methodOptions: readonly QuizMethodOption[];
    organizationOptions: readonly QuizOrganizationOption[];
    skillOptions: readonly SkillOption[];
    userOptions: readonly QuizUserOption[];
}

export interface QuizJsonPrefillResult {
    draft: QuizJsonPrefillDraft;
    fieldErrors: EntityJsonPrefillFieldErrors;
}

function readTextList(
    value: unknown,
    path: string,
    errors: EntityJsonPrefillFieldErrors,
    max = 120,
) {
    if (!Array.isArray(value)) {
        errors[path] = "Ce champ doit être un tableau de textes.";
        return [];
    }
    let hasInvalidItem = false;
    const items = value.flatMap((item, index) => {
        const result = z.string().trim().min(1).max(max).safeParse(item);
        if (result.success) return [result.data];
        hasInvalidItem = true;
        errors[`${path}.${index}`] = `La valeur doit être un texte non vide de ${max} caractères maximum.`;
        return [];
    });
    if (hasInvalidItem) errors[path] = "Corrigez ou retirez les valeurs invalides de cette liste.";
    return items;
}

function readAttachment(
    value: unknown,
    path: string,
    errors: EntityJsonPrefillFieldErrors,
): QuizJsonPrefillAttachmentDraft {
    const attachment = isJsonPrefillRecord(value) ? value : {};
    if (!isJsonPrefillRecord(value)) errors[path] = "La pièce jointe doit être un objet.";
    requireJsonPrefillKeys(attachment, ["type", "label", "externalUrl"], path, errors);

    const typeResult = z.enum(QUIZ_ATTACHMENT_TYPES).safeParse(attachment.type);
    if (!typeResult.success) {
        errors[`${path}.type`] = `Le type doit être l’une des valeurs suivantes : ${QUIZ_ATTACHMENT_TYPES.join(", ")}.`;
    }
    const urlResult = z.string().trim().url().max(1000).safeParse(attachment.externalUrl);
    if (!urlResult.success) errors[`${path}.externalUrl`] = "Renseignez une URL complète et valide.";

    return {
        externalUrl: urlResult.success ? urlResult.data : typeof attachment.externalUrl === "string" ? attachment.externalUrl.trim() : "",
        label: readJsonPrefillText(attachment.label, `${path}.label`, errors, 180),
        type: typeResult.success ? typeResult.data : "link",
    };
}

export function parseQuizJsonPrefillText(
    text: string,
    {
        groupOptions,
        methodOptions,
        organizationOptions,
        skillOptions,
        userOptions,
    }: QuizJsonPrefillOptions,
): QuizJsonPrefillResult {
    const { data, schemaVersion } = parseEntityJsonPrefillDocument(
        text,
        QUIZ_JSON_PREFILL_ENTITY_TYPE,
        "un quiz",
        [QUIZ_JSON_PREFILL_LEGACY_SCHEMA_VERSION, QUIZ_JSON_PREFILL_SCHEMA_VERSION],
    );
    const errors: EntityJsonPrefillFieldErrors = {};
    requireJsonPrefillKeys(
        data,
        [
            "title", "description", "quizType", "difficulty", "domain", "categories",
            "durationMinutes", "maxAttempts", "validationThreshold", "participation", "methodId",
            "scope", "organizationId", "groupId", "assignedUserId", "tags", "steps",
        ],
        "",
        errors,
    );

    if (schemaVersion === QUIZ_JSON_PREFILL_SCHEMA_VERSION) {
        requireJsonPrefillKeys(data, ["quizKind"], "", errors);
    }

    const quizKindResult = z.enum(QUIZ_KINDS).safeParse(data.quizKind);
    const quizKind = quizKindResult.success ? quizKindResult.data : null;
    if (!quizKindResult.success) {
        errors.quizKind = schemaVersion === QUIZ_JSON_PREFILL_LEGACY_SCHEMA_VERSION
            ? "Ancien format détecté : choisissez explicitement l’usage du quiz avant d’enregistrer."
            : `L’usage doit être l’une des valeurs suivantes : ${QUIZ_KINDS.join(", ")}.`;
    }

    const quizTypeResult = z.enum(QUIZ_TYPES).safeParse(data.quizType);
    if (!quizTypeResult.success) errors.quizType = `Le type doit être l’une des valeurs suivantes : ${QUIZ_TYPES.join(", ")}.`;
    const participationResult = z.enum(QUIZ_PARTICIPATIONS).safeParse(data.participation);
    if (!participationResult.success) errors.participation = `La participation doit être l’une des valeurs suivantes : ${QUIZ_PARTICIPATIONS.join(", ")}.`;
    const scopeResult = z.enum(QUIZ_VISIBILITY_SCOPES).safeParse(data.scope);
    if (!scopeResult.success) errors.scope = `La visibilité doit être l’une des valeurs suivantes : ${QUIZ_VISIBILITY_SCOPES.join(", ")}.`;

    let difficulty: ContentDifficulty | null = null;
    if (data.difficulty !== null) {
        const result = z.enum(CONTENT_DIFFICULTIES).safeParse(data.difficulty);
        if (result.success) difficulty = result.data;
        else errors.difficulty = `La difficulté doit être null ou l’une des valeurs suivantes : ${CONTENT_DIFFICULTIES.join(", ")}.`;
    }

    let domain: string | null = null;
    if (data.domain !== null) {
        const result = z.enum(CONTENT_DOMAINS).safeParse(data.domain);
        if (result.success) domain = result.data;
        else errors.domain = `Le domaine doit être null ou l’une des valeurs suivantes : ${CONTENT_DOMAINS.join(", ")}.`;
    }
    const categories = readTextList(data.categories, "categories", errors).filter((category, index) => {
        if (isContentCategoryForDomain(domain, category)) return true;
        errors[`categories.${index}`] = domain
            ? `La catégorie doit appartenir au domaine « ${domain} ».`
            : "Aucune catégorie n’est autorisée sans domaine.";
        return false;
    });

    const durationResult = z.number().int().min(1).safeParse(data.durationMinutes);
    if (!durationResult.success) errors.durationMinutes = "La durée doit être un nombre entier supérieur à 0.";
    let maxAttempts: number | null = null;
    if (data.maxAttempts !== null) {
        const result = z.number().int().min(1).safeParse(data.maxAttempts);
        if (result.success) maxAttempts = result.data;
        else errors.maxAttempts = "Le nombre de tentatives doit être null ou un entier supérieur à 0.";
    }
    let validationThreshold: number | null = null;
    if (data.validationThreshold !== null) {
        const result = z.number().int().min(0).max(100).safeParse(data.validationThreshold);
        if (result.success) validationThreshold = result.data;
        else errors.validationThreshold = "Le seuil doit être null ou un entier compris entre 0 et 100.";
    }

    const selectableMethods = getQuizMethodOptionsForKind(
        methodOptions,
        quizKind ?? QUIZ_KIND.contextual,
    );
    const selectedMethod = data.methodId === null
        ? null
        : selectableMethods.find((option) => option.id === data.methodId) ?? null;
    if (data.methodId !== null && !selectedMethod) {
        errors.methodId = quizKind === QUIZ_KIND.methodKnowledge
            ? "Cette méthode possède déjà un autre quiz principal ou n’est pas disponible."
            : "Aucune méthode disponible ne correspond à cet identifiant.";
    }
    if (quizKind === QUIZ_KIND.methodKnowledge && !selectedMethod) {
        errors.methodId = "Un quiz principal doit être rattaché à une méthode disponible sans autre quiz principal.";
    }

    const scope = scopeResult.success ? scopeResult.data : "public";
    const selectableOrganizations = organizationOptions.filter((option) => option.isSelectable !== false);
    const selectableGroups = groupOptions.filter((option) => option.isSelectable !== false);
    const selectableUsers = userOptions.filter((option) => option.isSelectable !== false);
    let organizationId: string | null = null;
    let groupId = "";
    let assignedUserId = "";
    const organization = typeof data.organizationId === "string"
        ? selectableOrganizations.find((option) => option.id === data.organizationId)
        : undefined;
    const group = typeof data.groupId === "string"
        ? selectableGroups.find((option) => option.id === data.groupId)
        : undefined;
    const user = typeof data.assignedUserId === "string"
        ? selectableUsers.find((option) => option.id === data.assignedUserId)
        : undefined;

    if (scope === "public") {
        if (data.organizationId !== null || data.groupId !== null || data.assignedUserId !== null) {
            errors.scope = "Pour une visibilité publique, les trois identifiants de ciblage doivent être null.";
        }
    } else if (scope === "organization") {
        if (!organization) errors.organizationId = "Aucune organisation disponible ne correspond à cet identifiant.";
        else organizationId = organization.id;
        if (data.groupId !== null || data.assignedUserId !== null) errors.scope = "Un ciblage organisation ne doit pas contenir de groupe ni d’utilisateur.";
    } else if (scope === "group") {
        if (!organization) errors.organizationId = "Aucune organisation disponible ne correspond à cet identifiant.";
        if (!group) errors.groupId = "Aucun groupe disponible ne correspond à cet identifiant.";
        if (organization && group && group.organizationId !== organization.id) errors.groupId = "Ce groupe n’appartient pas à l’organisation sélectionnée.";
        if (organization) organizationId = organization.id;
        if (group) groupId = group.id;
        if (data.assignedUserId !== null) errors.scope = "Un ciblage groupe ne doit pas contenir d’utilisateur.";
    } else if (scope === "user") {
        if (!user) errors.assignedUserId = "Aucun utilisateur disponible ne correspond à cet identifiant.";
        if (user) {
            assignedUserId = user.id;
            const requestedGroup = group && user.groupIds.includes(group.id) ? group : undefined;
            const requestedOrganization = organization && user.organizationIds.includes(organization.id) ? organization : undefined;
            groupId = requestedGroup?.id ?? user.groupIds[0] ?? "";
            organizationId = requestedOrganization?.id ?? user.organizationIds[0] ?? null;
            if (data.groupId !== null && !requestedGroup) errors.groupId = "Ce groupe n’est pas rattaché à l’utilisateur sélectionné.";
            if (data.organizationId !== null && !requestedOrganization) errors.organizationId = "Cette organisation n’est pas rattachée à l’utilisateur sélectionné.";
        }
    }

    const skillsById = new Map(
        skillOptions
            .filter((skill) =>
                skill.isSelectable !== false &&
                skill.dimensionItems.some((item) => item.isActive && item.dimension === QUIZ_EVALUATED_DIMENSION),
            )
            .map((skill) => [skill.id, skill]),
    );
    const methodStepsById = new Map(selectedMethod?.steps.map((step) => [step.id, step]) ?? []);
    let steps: QuizJsonPrefillStepDraft[] = [];
    if (!Array.isArray(data.steps) || data.steps.length === 0) {
        errors.steps = "Le quiz doit contenir au moins une étape.";
    } else {
        steps = data.steps.map((value, stepIndex) => {
            const path = `steps.${stepIndex}`;
            const step = isJsonPrefillRecord(value) ? value : {};
            if (!isJsonPrefillRecord(value)) errors[path] = "L’étape doit être un objet.";
            requireJsonPrefillKeys(step, ["methodStepId", "name", "weight", "competenceIds", "questions"], path, errors);

            let methodStepId: string | null = null;
            let name = readJsonPrefillText(step.name, `${path}.name`, errors, 220, true);
            if (selectedMethod) {
                const methodStep = typeof step.methodStepId === "string" ? methodStepsById.get(step.methodStepId) : undefined;
                if (methodStep) {
                    methodStepId = methodStep.id;
                    name = methodStep.title;
                } else {
                    errors[`${path}.methodStepId`] = "Cette étape n’appartient pas à la méthode sélectionnée.";
                }
            } else if (step.methodStepId !== null) {
                errors[`${path}.methodStepId`] = "L’identifiant d’étape doit être null pour un quiz sans méthode.";
            }

            const weightResult = z.number().int().min(0).max(100).safeParse(step.weight);
            if (!weightResult.success) errors[`${path}.weight`] = "La pondération doit être un entier compris entre 0 et 100.";

            const competenceIds = readTextList(step.competenceIds, `${path}.competenceIds`, errors, 160).filter((skillId, index) => {
                if (skillsById.has(skillId)) return true;
                errors[`${path}.competenceIds.${index}`] = "Aucune compétence disponible ne correspond à cet identifiant.";
                return false;
            });
            if (competenceIds.length === 0) errors[`${path}.competenceIds`] = "Ajoutez au moins une compétence à cette étape.";

            let questions: QuizJsonPrefillQuestionDraft[];
            if (!Array.isArray(step.questions) || step.questions.length === 0) {
                errors[`${path}.questions`] = "Ajoutez au moins une question à cette étape.";
                questions = [];
            } else {
                questions = step.questions.map((questionValue, questionIndex) => {
                    const questionPath = `${path}.questions.${questionIndex}`;
                    const question = isJsonPrefillRecord(questionValue) ? questionValue : {};
                    if (!isJsonPrefillRecord(questionValue)) errors[questionPath] = "La question doit être un objet.";
                    requireJsonPrefillKeys(question, ["prompt", "type", "points", "competenceId", "dimensionItemId", "explanation", "choices", "attachments"], questionPath, errors);

                    const questionTypeResult = z.enum(QUIZ_QUESTION_TYPES).safeParse(question.type);
                    if (!questionTypeResult.success) errors[`${questionPath}.type`] = `Le type doit être l’une des valeurs suivantes : ${QUIZ_QUESTION_TYPES.join(", ")}.`;
                    const questionType = questionTypeResult.success ? questionTypeResult.data : "QCU";
                    const pointsResult = z.number().int().min(0).max(100).safeParse(question.points);
                    if (!pointsResult.success) errors[`${questionPath}.points`] = "Les points doivent être un entier compris entre 0 et 100.";

                    const competenceId = typeof question.competenceId === "string" && competenceIds.includes(question.competenceId)
                        ? question.competenceId
                        : null;
                    const skill = competenceId ? skillsById.get(competenceId) : undefined;
                    if (!skill) errors[`${questionPath}.competenceId`] = "La compétence doit être sélectionnée dans cette étape.";
                    const dimensionItem = skill?.dimensionItems.find(
                        (item) => item.isActive && item.dimension === QUIZ_EVALUATED_DIMENSION && item.id === question.dimensionItemId,
                    );
                    if (!dimensionItem) errors[`${questionPath}.dimensionItemId`] = skill
                        ? "Aucun item Savoir actif de cette compétence ne correspond à cet identifiant."
                        : "L’item ne peut pas être validé sans compétence valide.";

                    let choices: QuizJsonPrefillChoiceDraft[] = [];
                    if (!Array.isArray(question.choices) || question.choices.length < 2) {
                        errors[`${questionPath}.choices`] = "Ajoutez au moins deux choix de réponse.";
                    } else {
                        choices = question.choices.map((choiceValue, choiceIndex) => {
                            const choicePath = `${questionPath}.choices.${choiceIndex}`;
                            const choice = isJsonPrefillRecord(choiceValue) ? choiceValue : {};
                            if (!isJsonPrefillRecord(choiceValue)) errors[choicePath] = "Le choix doit être un objet.";
                            requireJsonPrefillKeys(choice, ["label", "isCorrect"], choicePath, errors);
                            if (typeof choice.isCorrect !== "boolean") errors[`${choicePath}.isCorrect`] = "Cette valeur doit être true ou false.";
                            return {
                                isCorrect: choice.isCorrect === true,
                                label: readJsonPrefillText(choice.label, `${choicePath}.label`, errors, 800, true),
                            };
                        });
                        const correctCount = choices.filter((choice) => choice.isCorrect).length;
                        if ((questionType === "QCU" && correctCount !== 1) || (questionType === "QCM" && correctCount < 1)) {
                            errors[`${questionPath}.choices`] = questionType === "QCU"
                                ? "Une question QCU doit avoir exactement une bonne réponse."
                                : "Une question QCM doit avoir au moins une bonne réponse.";
                        }
                    }

                    let attachments: QuizJsonPrefillAttachmentDraft[] = [];
                    if (!Array.isArray(question.attachments) || question.attachments.length > 1) {
                        errors[`${questionPath}.attachments`] = "Les pièces jointes doivent être un tableau contenant au maximum un élément.";
                    } else {
                        attachments = question.attachments.map((attachment, attachmentIndex) =>
                            readAttachment(attachment, `${questionPath}.attachments.${attachmentIndex}`, errors),
                        );
                    }

                    return {
                        attachments,
                        choices,
                        competenceId,
                        dimensionItemId: dimensionItem?.id ?? null,
                        explanation: readJsonPrefillText(question.explanation, `${questionPath}.explanation`, errors, 1600),
                        points: pointsResult.success ? pointsResult.data : 1,
                        prompt: readJsonPrefillText(question.prompt, `${questionPath}.prompt`, errors, 1800, true),
                        type: questionType,
                    };
                });
            }

            return {
                competenceIds,
                methodStepId,
                name,
                questions,
                weight: weightResult.success ? weightResult.data : 0,
            };
        });

        const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
        if (totalWeight !== 100) errors.steps = "La pondération des étapes doit totaliser 100%.";
        if (selectedMethod) {
            const importedIds = steps.map((step) => step.methodStepId).filter(Boolean);
            if (
                importedIds.length !== new Set(importedIds).size ||
                selectedMethod.steps.some((step) => !importedIds.includes(step.id))
            ) {
                errors.steps = "Chaque étape de la méthode doit être présente une seule fois.";
            }
        }
    }

    return {
        draft: {
            assignedUserId,
            categories,
            description: readJsonPrefillText(data.description, "description", errors, 4000, true),
            difficulty,
            domain,
            durationMinutes: durationResult.success ? durationResult.data : 30,
            groupId,
            maxAttempts,
            methodId: selectedMethod?.id ?? null,
            organizationId,
            participation: participationResult.success ? participationResult.data : "optional",
            quizKind,
            quizType: quizTypeResult.success ? quizTypeResult.data : "knowledge",
            scope,
            steps,
            tags: readTextList(data.tags, "tags", errors),
            title: readJsonPrefillText(data.title, "title", errors, 180, true),
            validationThreshold,
        },
        fieldErrors: errors,
    };
}

export function buildQuizJsonPrefillPrompt({
    groupOptions,
    methodOptions,
    organizationOptions,
    skillOptions,
    userOptions,
}: QuizJsonPrefillOptions) {
    const methods = methodOptions.filter((method) => method.isSelectable !== false).map((method) => ({
        canReceiveMethodKnowledgeQuiz: isQuizMethodSelectableForKind(
            method,
            QUIZ_KIND.methodKnowledge,
        ),
        id: method.id,
        methodKnowledgeQuizId: method.methodKnowledgeQuizId,
        name: method.name,
        steps: method.steps.map(({ id: stepId, order, title, weight }) => ({ id: stepId, order, title, weight })),
    }));
    const organizations = organizationOptions.filter((option) => option.isSelectable !== false).map(({ id, name }) => ({ id, name }));
    const groups = groupOptions.filter((option) => option.isSelectable !== false).map(({ id, name, organizationId }) => ({ id, name, organizationId }));
    const users = userOptions.filter((option) => option.isSelectable !== false).map(({ id, name, groupIds, organizationIds }) => ({ id, name, groupIds, organizationIds }));
    const skills = skillOptions
        .filter((skill) => skill.isSelectable !== false)
        .map(({ id, name, dimensionItems }) => ({
            id,
            name,
            savoirItems: dimensionItems
                .filter((item) => item.isActive && item.dimension === QUIZ_EVALUATED_DIMENSION)
                .map(({ id: itemId, label }) => ({ id: itemId, label })),
        }))
        .filter((skill) => skill.savoirItems.length > 0);
    const exampleMethod = methods.find((method) => method.canReceiveMethodKnowledgeQuiz) ?? methods[0] ?? null;
    const exampleQuizKind = exampleMethod?.canReceiveMethodKnowledgeQuiz
        ? QUIZ_KIND.methodKnowledge
        : QUIZ_KIND.contextual;
    const exampleSkill = skills[0];
    const rawExampleSteps = exampleMethod?.steps.length
        ? exampleMethod.steps
        : [{ id: null, title: "Thème du quiz", weight: 100 }];
    const hasCompleteMethodWeighting = rawExampleSteps.every((step) =>
        step.weight !== null &&
        Number.isInteger(step.weight) &&
        step.weight >= 0 &&
        step.weight <= 100
    ) &&
        rawExampleSteps.reduce((sum, step) => sum + (step.weight ?? 0), 0) === 100;
    const distributedBaseWeight = Math.floor(100 / rawExampleSteps.length);
    const distributedWeightRemainder = 100 % rawExampleSteps.length;
    const exampleSteps = rawExampleSteps.map((step, index) => ({
        methodStepId: step.id,
        name: step.title,
        weight: hasCompleteMethodWeighting
            ? step.weight
            : distributedBaseWeight + (index < distributedWeightRemainder ? 1 : 0),
        competenceIds: [exampleSkill?.id ?? "ID_COMPETENCE"],
        questions: [{
            prompt: "Énoncé précis de la question",
            type: "QCU",
            points: 1,
            competenceId: exampleSkill?.id ?? "ID_COMPETENCE",
            dimensionItemId: exampleSkill?.savoirItems[0]?.id ?? "UUID_ITEM_SAVOIR",
            explanation: "Explication affichée après la réponse",
            choices: [
                { label: "Réponse correcte", isCorrect: true },
                { label: "Réponse incorrecte", isCorrect: false },
            ],
            attachments: [],
        }],
    }));

    return [
        ...buildEntityJsonPrefillPromptPreamble({ entityLabel: "un quiz" }),
        buildEntityJsonPrefillLiveCatalogInstruction([
            "méthodes et étapes",
            "compétences et items Savoir",
            "organisations, groupes et utilisateurs",
        ]),
        [
            "Règles d’analyse du document et de construction du quiz :",
            ...QUIZ_SOURCE_ANALYSIS_INSTRUCTIONS.map((instruction) => `- ${instruction}`),
        ].join("\n"),
        `Méthodes et étapes disponibles : ${JSON.stringify(methods)}. Pour quizKind="method_knowledge", choisis uniquement une méthode avec canReceiveMethodKnowledgeQuiz=true. Pour quizKind="contextual", methodId peut être null ou l’id exact d’une méthode disponible. Si methodId est renseigné, inclus chaque étape de la méthode une seule fois.`,
        `Compétences et items Savoir disponibles : ${JSON.stringify(skills)}. Utilise uniquement les id exacts. Chaque question doit cibler une compétence de son étape et un item Savoir appartenant à cette compétence.`,
        `Domaines : ${JSON.stringify(CONTENT_DOMAINS)}. Catégories par domaine : ${JSON.stringify(CONTENT_CATEGORIES_BY_DOMAIN)}. Difficultés : ${JSON.stringify(CONTENT_DIFFICULTIES)}.`,
        `Usages de quiz : ${JSON.stringify(QUIZ_KINDS)}. Types de quiz : ${JSON.stringify(QUIZ_TYPES)}. Participation : ${JSON.stringify(QUIZ_PARTICIPATIONS)}. Visibilités : ${JSON.stringify(QUIZ_VISIBILITY_SCOPES)}. Types de questions : ${JSON.stringify(QUIZ_QUESTION_TYPES)}. Types de pièces jointes : ${JSON.stringify(QUIZ_ATTACHMENT_TYPES)}. Dimension évaluée : ${JSON.stringify(QUIZ_EVALUATED_DIMENSION)}.`,
        `Organisations : ${JSON.stringify(organizations)}. Groupes : ${JSON.stringify(groups)}. Utilisateurs : ${JSON.stringify(users)}. Respecte les relations entre ces identifiants. Pour scope="public", les trois identifiants de ciblage doivent être null.`,
        "Chaque étape doit contenir au moins une compétence disponible et au moins une question. La somme des pondérations des étapes doit être exactement 100.",
        "Respecte exactement cette structure :",
        JSON.stringify({
            schemaVersion: QUIZ_JSON_PREFILL_SCHEMA_VERSION,
            entityType: QUIZ_JSON_PREFILL_ENTITY_TYPE,
            data: {
                title: "Titre du quiz",
                description: "Description complète du quiz",
                quizKind: exampleQuizKind,
                quizType: "knowledge",
                difficulty: CONTENT_DIFFICULTIES[0],
                domain: CONTENT_DOMAINS[0],
                categories: [CONTENT_CATEGORIES_BY_DOMAIN[CONTENT_DOMAINS[0]][0]],
                durationMinutes: 30,
                maxAttempts: null,
                validationThreshold: 70,
                participation: "optional",
                methodId: exampleMethod?.id ?? null,
                scope: "public",
                organizationId: null,
                groupId: null,
                assignedUserId: null,
                tags: ["formation"],
                steps: exampleSteps,
            },
        }, null, 2),
    ].join("\n\n");
}
