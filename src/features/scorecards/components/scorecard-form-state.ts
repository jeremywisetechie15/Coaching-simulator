import type { ContentStatus } from "@/features/content/domain";
import {
    SCORECARD_VISIBILITY,
    type ScorecardDetail,
    type ScorecardCriterionDimension,
    type ScorecardMethodStep,
    type ScorecardVisibility,
} from "@/features/scorecards/domain";
import type { SaveScorecardInput } from "@/features/scorecards/dto";

export interface ScorecardCriterionFormState {
    aiInstruction: string;
    competenceId: string | null;
    dimension: ScorecardCriterionDimension | null;
    dimensionItemId: string | null;
    expectedEvidence: string;
    id: string;
    key: string;
    maxPoints: string;
    order: string;
    verbatim: string;
}

export interface ScorecardStepFormState {
    collapsed: boolean;
    criteria: ScorecardCriterionFormState[];
    id: string;
    methodStepId: string;
    name: string;
    order: number;
}

export interface ScorecardFormState {
    category: string | null;
    description: string;
    domain: string | null;
    level: string | null;
    methodId: string | null;
    name: string;
    organizationId: string | null;
    steps: ScorecardStepFormState[];
    visibility: ScorecardVisibility;
}

export function createFormId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function emptyCriterion(order: number): ScorecardCriterionFormState {
    return {
        aiInstruction: "",
        competenceId: null,
        dimension: null,
        dimensionItemId: null,
        expectedEvidence: "",
        id: createFormId(),
        key: "",
        maxPoints: "",
        order: String(order),
        verbatim: "",
    };
}

export function emptyScorecardFormState(): ScorecardFormState {
    return {
        category: null,
        description: "",
        domain: null,
        level: null,
        methodId: null,
        name: "",
        organizationId: null,
        steps: [],
        visibility: SCORECARD_VISIBILITY.public,
    };
}

export function scorecardDetailToFormState(scorecard: ScorecardDetail): ScorecardFormState {
    return {
        category: textOrNull(scorecard.category),
        description: scorecard.description,
        domain: textOrNull(scorecard.domain),
        level: textOrNull(scorecard.level),
        methodId: scorecard.methodId,
        name: scorecard.name,
        organizationId: scorecard.organizationId,
        steps: scorecard.steps.map((step) => ({
            collapsed: false,
            criteria: step.criteria.map((criterion) => ({
                aiInstruction: criterion.aiInstruction,
                competenceId: criterion.competenceId || null,
                dimension: criterion.dimension,
                dimensionItemId: criterion.dimensionItemId,
                expectedEvidence: criterion.expectedEvidence,
                id: criterion.id,
                key: criterion.key,
                maxPoints: String(criterion.maxPoints),
                order: String(criterion.order),
                verbatim: criterion.verbatim,
            })),
            id: step.id,
            methodStepId: step.methodStepId,
            name: step.name,
            order: step.order,
        })),
        visibility: scorecard.visibility,
    };
}

/** Construit les étapes du formulaire à partir des étapes (read-only) de la méthode. */
export function stepsFromMethod(methodSteps: ScorecardMethodStep[]): ScorecardStepFormState[] {
    return methodSteps
        .slice()
        .sort((first, second) => first.order - second.order)
        .map((step) => ({
            collapsed: false,
            criteria: [],
            id: step.id,
            methodStepId: step.id,
            name: step.title,
            order: step.order,
        }));
}

function textOrNull(value: string | null | undefined) {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
}

export function integerFromText(value: string, fallback: number) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number) : fallback;
}

export function toSaveScorecardInput(form: ScorecardFormState, status: ContentStatus): SaveScorecardInput {
    return {
        category: form.category ?? "",
        description: form.description,
        domain: form.domain ?? "",
        level: form.level ?? "",
        methodId: form.methodId ?? "",
        name: form.name,
        organizationId: form.visibility === SCORECARD_VISIBILITY.private ? textOrNull(form.organizationId) : null,
        status,
        steps: form.steps.map((step, stepIndex) => ({
            criteria: step.criteria.map((criterion, criterionIndex) => ({
                aiInstruction: criterion.aiInstruction,
                competenceId: criterion.competenceId ?? "",
                dimension: criterion.dimension,
                dimensionItemId: criterion.dimensionItemId,
                expectedEvidence: criterion.expectedEvidence,
                id: criterion.id,
                key: criterion.key,
                maxPoints: integerFromText(criterion.maxPoints, 1),
                order: integerFromText(criterion.order, criterionIndex + 1),
                verbatim: criterion.verbatim,
            })),
            id: step.id,
            methodStepId: step.methodStepId,
            name: step.name,
            order: step.order || stepIndex + 1,
        })),
        visibility: form.visibility,
    };
}
