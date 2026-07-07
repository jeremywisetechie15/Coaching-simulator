import type { SkillOption } from "@/features/skills/domain/skills";
import type { ScorecardCriterionDimension, ScorecardDetail } from "./scorecard";

/**
 * Vue (présentation) d'un critère pour la page de détail : labels déjà résolus
 * (nom de compétence, dimension) — découplée de la persistance qui ne stocke que des IDs.
 */
export interface ScorecardCriterionView {
    competenceName: string;
    dimension: ScorecardCriterionDimension;
    expectedEvidence: string;
    id: string;
    key: string;
    maxPoints: number;
    verbatim: string;
}

export interface ScorecardStepView {
    criteria: ScorecardCriterionView[];
    id: string;
    order: number;
    title: string;
}

export interface ScorecardDetailView {
    description: string;
    id: string;
    level: string;
    methodName: string;
    name: string;
    steps: ScorecardStepView[];
}

export interface ScorecardViewStats {
    competenceCount: number;
    criteriaCount: number;
    stepCount: number;
    totalPoints: number;
}

/** Statistiques d'en-tête dérivées des étapes (source unique : les critères). */
export function getScorecardViewStats(view: ScorecardDetailView): ScorecardViewStats {
    const criteria = view.steps.flatMap((step) => step.criteria);
    const competences = new Set(criteria.map((criterion) => criterion.competenceName));

    return {
        competenceCount: competences.size,
        criteriaCount: criteria.length,
        stepCount: view.steps.length,
        totalPoints: criteria.reduce((total, criterion) => total + criterion.maxPoints, 0),
    };
}

export function getScorecardStepPoints(step: ScorecardStepView): number {
    return step.criteria.reduce((total, criterion) => total + criterion.maxPoints, 0);
}

export function mapScorecardDetailToView(
    scorecard: ScorecardDetail,
    skillOptions: SkillOption[],
): ScorecardDetailView {
    const skillNameById = new Map(skillOptions.map((skill) => [skill.id, skill.name]));

    return {
        description: scorecard.description,
        id: scorecard.id,
        level: scorecard.level || "Non renseigné",
        methodName: scorecard.methodName || "Non renseignée",
        name: scorecard.name,
        steps: scorecard.steps.map((step) => ({
            criteria: step.criteria.map((criterion) => ({
                competenceName:
                    skillNameById.get(criterion.competenceId) ||
                    criterion.competenceId ||
                    "Compétence inconnue",
                dimension: criterion.dimension,
                expectedEvidence: criterion.expectedEvidence,
                id: criterion.id,
                key: criterion.key,
                maxPoints: criterion.maxPoints,
                verbatim: criterion.verbatim,
            })),
            id: step.id,
            order: step.order,
            title: step.name,
        })),
    };
}
