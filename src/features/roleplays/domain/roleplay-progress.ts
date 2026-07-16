import {
    calculateRoleplayIndex,
    selectRoleplayIndexScorePositions,
} from "./roleplay-index";

export type DimensionKey = "savoir" | "savoir-faire" | "savoir-etre";

export type ScoreLevel = "green" | "yellow" | "orange" | "red";

export interface DimensionScore {
    key: DimensionKey;
    label: string;
    subtitle: string;
    score: number;
}

export interface DimensionDiagnostic {
    key: DimensionKey;
    label: string;
    score: number;
    diagnostic: string;
}

export interface DimensionModality {
    label: string;
    icon: "quiz" | "simulation";
    score: number;
    description: string;
}

export interface ProgressCompetency {
    name: string;
    score: number;
    initial: number;
    afterTraining: number;
    delta: number;
    dimensions: DimensionDiagnostic[];
}

export interface ProgressStep {
    number: number;
    title: string;
    icon: "phone" | "message" | "shield" | "check";
    score: number;
    delta: number;
    diagnostic: string;
    competencies: ProgressCompetency[];
}

export interface RoleplayProgress {
    title: string;
    masteryScore: number;
    initialScore: number;
    afterTraining: number;
    delta: number;
    target: number;
    dimensions: DimensionScore[];
    modalities: DimensionModality[];
    steps: ProgressStep[];
}

export interface CompetencySummary {
    name: string;
    score: number;
    delta: number;
}

export interface ProgressSessionResult {
    completedAt: string | null;
    scorePercent: number;
    sessionId: string;
}

export interface ProgressStepResult {
    coachComment: string | null;
    pointsAwarded: number | null;
    pointsMax: number | null;
    scorePercent: number;
    scorecardStepId: string | null;
    sessionId: string;
    stepOrder: number;
    title: string;
}

export interface ProgressCriterionResult {
    advice: string | null;
    coachComment: string | null;
    completedAt?: string | null;
    criterionRef: string;
    dimension: string;
    dimensionItemId: string | null;
    dimensionItemLabel?: string | null;
    pointsAwarded: number;
    pointsMax: number;
    scorePercent: number;
    scorecardStepId: string | null;
    sessionId: string;
    skillId: string | null;
    skillName?: string | null;
    sourceGroupId?: string | null;
}

export interface ProgressBaselineCriterion {
    criterionRef: string;
    dimension: string;
    dimensionItemId: string | null;
    dimensionItemLabel?: string | null;
    skillId: string | null;
    skillName?: string | null;
}

export interface ProgressBaselineStep {
    criteria: ProgressBaselineCriterion[];
    scorecardStepId: string | null;
    stepOrder: number;
    title: string;
}

export interface BuildRoleplayProgressInput {
    baselineSteps?: ProgressBaselineStep[];
    criteria: ProgressCriterionResult[];
    quizCriteria?: ProgressCriterionResult[];
    sessions: ProgressSessionResult[];
    steps: ProgressStepResult[];
    title: string;
}

export const ROLEPLAY_PROGRESS_TARGET = 80;

export const ROLEPLAY_PROGRESS_DIMENSIONS: Array<Omit<DimensionScore, "score">> = [
    { key: "savoir", label: "Savoir", subtitle: "Théorie" },
    { key: "savoir-faire", label: "Savoir-faire", subtitle: "Pratique" },
    { key: "savoir-etre", label: "Savoir-être", subtitle: "Posture" },
];

function roundScore(value: number) {
    return Math.round(Math.max(0, Math.min(100, value)));
}

function dateValue(value: string | null) {
    return value ? new Date(value).getTime() : 0;
}

function weightedScore(items: Array<{ pointsAwarded: number | null; pointsMax: number | null; scorePercent: number }>) {
    const pointsMax = items.reduce((total, item) => total + Math.max(0, Number(item.pointsMax) || 0), 0);

    if (pointsMax > 0) {
        const pointsAwarded = items.reduce((total, item) => total + Math.max(0, Number(item.pointsAwarded) || 0), 0);
        return roundScore((pointsAwarded / pointsMax) * 100);
    }

    if (items.length === 0) return 0;

    return roundScore(items.reduce((total, item) => total + item.scorePercent, 0) / items.length);
}

function normalizeDimension(value: string): DimensionKey | null {
    if (value === "savoir") return "savoir";
    if (value === "savoir_faire" || value === "savoir-faire") return "savoir-faire";
    if (value === "savoir_etre" || value === "savoir-etre") return "savoir-etre";
    return null;
}

function progressDelta(current: number, initial: number) {
    return roundScore(current) - roundScore(initial);
}

function scoreDiagnostic(score: number, label: string) {
    if (score >= 80) return `${label} maîtrisé selon les résultats retenus.`;
    if (score >= 60) return `${label} solide, à consolider pour atteindre la cible.`;
    if (score >= 40) return `${label} à renforcer avec de nouveaux entraînements.`;
    if (score > 0) return `${label} prioritaire dans les prochains entraînements.`;
    return `Aucune donnée exploitable pour ${label.toLowerCase()}.`;
}

function stepIcon(stepOrder: number): ProgressStep["icon"] {
    if (stepOrder === 1) return "phone";
    if (stepOrder === 2) return "message";
    if (stepOrder === 3) return "shield";
    return "check";
}

function groupBy<T>(items: T[], keyOf: (item: T) => string) {
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const key = keyOf(item);
        groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return groups;
}

function criterionSkillKey(criterion: ProgressCriterionResult) {
    return criterion.skillId || criterion.dimensionItemId || criterion.criterionRef;
}

function criterionSkillName(criterion: ProgressCriterionResult) {
    return criterion.skillName || criterion.dimensionItemLabel || criterion.criterionRef || "Compétence non renseignée";
}

function buildCompetencyDimensions(criteria: ProgressCriterionResult[]): DimensionDiagnostic[] {
    return ROLEPLAY_PROGRESS_DIMENSIONS.map((dimension) => {
        const dimensionCriteria = criteria.filter((criterion) => normalizeDimension(criterion.dimension) === dimension.key);
        const score = weightedScore(dimensionCriteria);

        return {
            diagnostic: scoreDiagnostic(score, dimension.label),
            key: dimension.key,
            label: dimension.label,
            score,
        };
    });
}

function buildCompetencies(
    currentCriteria: ProgressCriterionResult[],
    initialCriteria: ProgressCriterionResult[],
): ProgressCompetency[] {
    const initialCriteriaBySkill = groupBy(initialCriteria, criterionSkillKey);

    return Array.from(groupBy(currentCriteria, criterionSkillKey).entries()).map(([, criteria]) => {
        const sample = criteria[0];
        const initial = weightedScore(initialCriteriaBySkill.get(criterionSkillKey(sample)) ?? []);
        const score = weightedScore(criteria);

        return {
            afterTraining: score,
            delta: progressDelta(score, initial),
            dimensions: buildCompetencyDimensions(criteria),
            initial,
            name: criterionSkillName(sample),
            score,
        };
    });
}

function selectBestAttemptCriteria(criteria: ProgressCriterionResult[]) {
    const criteriaBySession = Array.from(groupBy(criteria, (criterion) => criterion.sessionId).values());
    if (criteriaBySession.length === 0) return [];

    return criteriaBySession
        .slice()
        .sort((first, second) => {
            const scoreDelta = weightedScore(second) - weightedScore(first);
            if (scoreDelta !== 0) return scoreDelta;

            const firstCompletedAt = Math.max(...first.map((criterion) => dateValue(criterion.completedAt ?? null)));
            const secondCompletedAt = Math.max(...second.map((criterion) => dateValue(criterion.completedAt ?? null)));
            return secondCompletedAt - firstCompletedAt;
        })[0] ?? [];
}

function selectBestQuizCriteriaByAttempt(criteria: ProgressCriterionResult[]) {
    return Array.from(
        groupBy(criteria, (criterion) => criterion.sourceGroupId || "legacy-quiz").values(),
    ).flatMap(selectBestAttemptCriteria);
}

function buildBaselineCompetencies(criteria: ProgressBaselineCriterion[]): ProgressCompetency[] {
    return Array.from(groupBy(criteria, (criterion) => criterion.skillId || criterion.dimensionItemId || criterion.criterionRef).entries())
        .map(([, groupedCriteria]) => {
            const sample = groupedCriteria[0];

            return {
                afterTraining: 0,
                delta: 0,
                dimensions: ROLEPLAY_PROGRESS_DIMENSIONS.map((dimension) => ({
                    diagnostic: scoreDiagnostic(0, dimension.label),
                    key: dimension.key,
                    label: dimension.label,
                    score: 0,
                })),
                initial: 0,
                name: sample.skillName || sample.dimensionItemLabel || sample.criterionRef || "Compétence non renseignée",
                score: 0,
            };
        });
}

function buildBaselineSteps(
    steps: ProgressBaselineStep[],
    quizCriteria: ProgressCriterionResult[] = [],
): ProgressStep[] {
    const quizCriteriaByStepId = groupBy(
        quizCriteria,
        (criterion) => criterion.scorecardStepId || "unassigned",
    );

    return steps
        .slice()
        .sort((first, second) => first.stepOrder - second.stepOrder)
        .map((step) => {
            const baselineCompetencies = buildBaselineCompetencies(step.criteria);
            const quizCompetencies = step.scorecardStepId
                ? buildCompetencies(quizCriteriaByStepId.get(step.scorecardStepId) ?? [], [])
                : [];
            const competenciesByName = new Map(
                [...baselineCompetencies, ...quizCompetencies].map((competency) => [competency.name, competency]),
            );

            return {
                competencies: Array.from(competenciesByName.values()),
                delta: 0,
                diagnostic: "Aucune simulation notée pour cette étape.",
                icon: stepIcon(step.stepOrder),
                number: step.stepOrder,
                score: 0,
                title: step.title,
            };
        });
}

function buildProgressSteps(
    selectedSessionIds: string[],
    initialSessionId: string,
    steps: ProgressStepResult[],
    criteria: ProgressCriterionResult[],
    quizCriteria: ProgressCriterionResult[],
): ProgressStep[] {
    const selectedSessionIdSet = new Set(selectedSessionIds);
    const initialStepsByOrder = new Map(
        steps.filter((step) => step.sessionId === initialSessionId).map((step) => [step.stepOrder, step]),
    );
    const criteriaByStepId = groupBy(criteria, (criterion) => criterion.scorecardStepId || `step-${criterion.sessionId}`);
    const quizCriteriaByStepId = groupBy(quizCriteria, (criterion) => criterion.scorecardStepId || "unassigned");
    const selectedStepsByOrder = groupBy(
        steps.filter((step) => selectedSessionIdSet.has(step.sessionId)),
        (step) => String(step.stepOrder),
    );

    return Array.from(selectedStepsByOrder.values())
        .sort((first, second) => first[0].stepOrder - second[0].stepOrder)
        .map((selectedSteps) => {
            const step = selectedSteps[0];
            const initialStepScore = roundScore(initialStepsByOrder.get(step.stepOrder)?.scorePercent ?? 0);
            const stepCriteria = step.scorecardStepId ? criteriaByStepId.get(step.scorecardStepId) ?? [] : [];
            const currentCriteria = stepCriteria.filter(
                (criterion) =>
                    selectedSessionIdSet.has(criterion.sessionId) && normalizeDimension(criterion.dimension) !== "savoir",
            );
            const initialCriteria = stepCriteria.filter(
                (criterion) =>
                    criterion.sessionId === initialSessionId && normalizeDimension(criterion.dimension) !== "savoir",
            );
            const currentQuizCriteria = step.scorecardStepId
                ? quizCriteriaByStepId.get(step.scorecardStepId) ?? []
                : [];
            const score = weightedScore(selectedSteps);
            const latestSelectedStep = selectedSessionIds
                .map((sessionId) => selectedSteps.find((candidate) => candidate.sessionId === sessionId))
                .find((candidate): candidate is ProgressStepResult => Boolean(candidate));

            return {
                competencies: buildCompetencies([...currentCriteria, ...currentQuizCriteria], initialCriteria),
                delta: progressDelta(score, initialStepScore),
                diagnostic: latestSelectedStep?.coachComment || scoreDiagnostic(score, step.title),
                icon: stepIcon(step.stepOrder),
                number: step.stepOrder,
                score,
                title: step.title,
            };
        });
}

export function createEmptyRoleplayProgress(
    title: string,
    baselineSteps: ProgressBaselineStep[] = [],
    quizCriteria: ProgressCriterionResult[] = [],
): RoleplayProgress {
    return {
        afterTraining: 0,
        delta: 0,
        dimensions: ROLEPLAY_PROGRESS_DIMENSIONS.map((dimension) => ({ ...dimension, score: 0 })),
        initialScore: 0,
        masteryScore: 0,
        modalities: [
            {
                description: "Aucune tentative de quiz terminée pour ce scénario.",
                icon: "quiz",
                label: "Quiz de Connaissance",
                score: 0,
            },
            {
                description: "Aucune simulation notée pour ce scénario.",
                icon: "simulation",
                label: "Simulations IA",
                score: 0,
            },
        ],
        steps: buildBaselineSteps(baselineSteps, quizCriteria),
        target: ROLEPLAY_PROGRESS_TARGET,
        title,
    };
}

export function buildRoleplayProgress(input: BuildRoleplayProgressInput): RoleplayProgress {
    const bestQuizCriteria = selectBestQuizCriteriaByAttempt(input.quizCriteria ?? []);
    const quizScore = bestQuizCriteria.length > 0 ? weightedScore(bestQuizCriteria) : null;

    if (input.sessions.length === 0) {
        const emptyProgress = createEmptyRoleplayProgress(
            input.title,
            input.baselineSteps,
            bestQuizCriteria,
        );
        if (quizScore === null) return emptyProgress;

        return {
            ...emptyProgress,
            dimensions: emptyProgress.dimensions.map((dimension) =>
                dimension.key === "savoir"
                    ? { ...dimension, score: weightedScore(bestQuizCriteria.filter((criterion) => normalizeDimension(criterion.dimension) === "savoir")) }
                    : dimension,
            ),
            modalities: emptyProgress.modalities.map((modality) =>
                modality.icon === "quiz"
                    ? {
                          ...modality,
                          description: "Évalue le Savoir théorique des compétences mobilisées",
                          score: quizScore,
                      }
                    : modality,
            ),
        };
    }

    const sessionsByDate = input.sessions.slice().sort((first, second) => dateValue(first.completedAt) - dateValue(second.completedAt));
    const sessionsByRecency = sessionsByDate.slice().reverse();
    const initialSession = sessionsByDate[0];
    const selectedSessionIds = selectRoleplayIndexScorePositions(
        sessionsByRecency.map((session) => session.scorePercent),
    ).map((position) => sessionsByRecency[position].sessionId);
    const selectedSessionIdSet = new Set(selectedSessionIds);
    const selectedSessionCriteria = input.criteria.filter((criterion) => selectedSessionIdSet.has(criterion.sessionId));
    const bestQuizSavoirCriteria = bestQuizCriteria.filter((criterion) => normalizeDimension(criterion.dimension) === "savoir");
    const dimensions = ROLEPLAY_PROGRESS_DIMENSIONS.map((dimension) => ({
        ...dimension,
        score: weightedScore(
            dimension.key === "savoir"
                ? bestQuizSavoirCriteria
                : selectedSessionCriteria.filter((criterion) => normalizeDimension(criterion.dimension) === dimension.key),
        ),
    }));
    const masteryScore = calculateRoleplayIndex(
        sessionsByRecency.map((session) => session.scorePercent),
    ).score ?? 0;
    const initialScore = roundScore(initialSession.scorePercent);

    return {
        afterTraining: masteryScore,
        delta: progressDelta(masteryScore, initialScore),
        dimensions,
        initialScore,
        masteryScore,
        modalities: [
            {
                description: "Évalue le Savoir théorique des compétences mobilisées",
                icon: "quiz",
                label: "Quiz de Connaissance",
                score: quizScore ?? dimensions.find((dimension) => dimension.key === "savoir")?.score ?? 0,
            },
            {
                description: "Évalue le Savoir-faire et Savoir-être des compétences mobilisées",
                icon: "simulation",
                label: "Simulations IA",
                score: masteryScore,
            },
        ],
        steps: buildProgressSteps(
            selectedSessionIds,
            initialSession.sessionId,
            input.steps,
            input.criteria,
            bestQuizCriteria,
        ),
        target: ROLEPLAY_PROGRESS_TARGET,
        title: input.title,
    };
}

export function scoreLevel(score: number): ScoreLevel {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    if (score >= 40) return "orange";
    return "red";
}

export function progressCompetencies(progress: RoleplayProgress): CompetencySummary[] {
    return Array.from(groupBy(progress.steps.flatMap((step) => step.competencies), (competency) => competency.name).entries())
        .map(([name, competencies]) => ({
            delta: Math.round(competencies.reduce((total, competency) => total + competency.delta, 0) / competencies.length),
            name,
            score: Math.round(competencies.reduce((total, competency) => total + competency.score, 0) / competencies.length),
        }))
        .sort((first, second) => first.name.localeCompare(second.name, "fr"));
}
