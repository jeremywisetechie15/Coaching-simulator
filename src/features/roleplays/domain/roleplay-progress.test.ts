import { describe, expect, it } from "vitest";
import {
    buildRoleplayProgress,
    createEmptyRoleplayProgress,
    progressCompetencies,
    scoreLevel,
    type BuildRoleplayProgressInput,
} from "./roleplay-progress";

function createProgressInput(): BuildRoleplayProgressInput {
    return {
        criteria: [
            {
                advice: null,
                coachComment: "Bien reformulé.",
                criterionRef: "S1-C1",
                dimension: "savoir_faire",
                dimensionItemId: "item-1",
                dimensionItemLabel: "Reformulation",
                pointsAwarded: 4,
                pointsMax: 10,
                scorePercent: 40,
                scorecardStepId: "step-1",
                sessionId: "session-initial",
                skillId: "skill-1",
                skillName: "Découverte des besoins",
            },
            {
                advice: null,
                coachComment: "Posture claire.",
                criterionRef: "S1-C2",
                dimension: "savoir_etre",
                dimensionItemId: "item-2",
                dimensionItemLabel: "Écoute active",
                pointsAwarded: 5,
                pointsMax: 10,
                scorePercent: 50,
                scorecardStepId: "step-1",
                sessionId: "session-initial",
                skillId: "skill-1",
                skillName: "Découverte des besoins",
            },
            {
                advice: null,
                coachComment: "Très bon questionnement.",
                criterionRef: "S1-C1",
                dimension: "savoir_faire",
                dimensionItemId: "item-1",
                dimensionItemLabel: "Reformulation",
                pointsAwarded: 8,
                pointsMax: 10,
                scorePercent: 80,
                scorecardStepId: "step-1",
                sessionId: "session-best",
                skillId: "skill-1",
                skillName: "Découverte des besoins",
            },
            {
                advice: null,
                coachComment: "Posture solide.",
                criterionRef: "S1-C2",
                dimension: "savoir_etre",
                dimensionItemId: "item-2",
                dimensionItemLabel: "Écoute active",
                pointsAwarded: 7,
                pointsMax: 10,
                scorePercent: 70,
                scorecardStepId: "step-1",
                sessionId: "session-best",
                skillId: "skill-1",
                skillName: "Découverte des besoins",
            },
        ],
        sessions: [
            {
                completedAt: "2026-06-01T10:00:00.000Z",
                scorePercent: 45,
                sessionId: "session-initial",
            },
            {
                completedAt: "2026-06-10T10:00:00.000Z",
                scorePercent: 75,
                sessionId: "session-best",
            },
        ],
        steps: [
            {
                coachComment: "Étape initiale.",
                pointsAwarded: 9,
                pointsMax: 20,
                scorePercent: 45,
                scorecardStepId: "step-1",
                sessionId: "session-initial",
                stepOrder: 1,
                title: "Qualifier le besoin",
            },
            {
                coachComment: "Étape maîtrisée.",
                pointsAwarded: 15,
                pointsMax: 20,
                scorePercent: 75,
                scorecardStepId: "step-1",
                sessionId: "session-best",
                stepOrder: 1,
                title: "Qualifier le besoin",
            },
        ],
        title: "Progression découverte",
    };
}

describe("roleplay progress helpers", () => {
    it("maps score boundaries to the shared four-level scale", () => {
        expect(scoreLevel(0)).toBe("red");
        expect(scoreLevel(39)).toBe("red");
        expect(scoreLevel(40)).toBe("orange");
        expect(scoreLevel(59)).toBe("orange");
        expect(scoreLevel(60)).toBe("yellow");
        expect(scoreLevel(79)).toBe("yellow");
        expect(scoreLevel(80)).toBe("green");
        expect(scoreLevel(100)).toBe("green");
    });

    it("builds progress from the INDEX sessions and compares it to the first session", () => {
        const progress = buildRoleplayProgress(createProgressInput());

        expect(progress).toMatchObject({
            afterTraining: 60,
            delta: 15,
            initialScore: 45,
            masteryScore: 60,
            title: "Progression découverte",
        });
        expect(progress.steps[0]).toMatchObject({
            delta: 15,
            score: 60,
            title: "Qualifier le besoin",
        });
        expect(progress.steps[0].competencies[0]).toMatchObject({
            delta: 15,
            name: "Découverte des besoins",
            score: 60,
        });
    });

    it("returns an explicit empty state when no normalized result exists", () => {
        expect(createEmptyRoleplayProgress("Nouveau scénario")).toMatchObject({
            delta: 0,
            initialScore: 0,
            masteryScore: 0,
            steps: [],
            title: "Nouveau scénario",
        });
    });

    it("keeps expected steps visible before the first session", () => {
        const progress = buildRoleplayProgress({
            baselineSteps: [
                {
                    criteria: [
                        {
                            criterionRef: "Accès au décideur",
                            dimension: "savoir_faire",
                            dimensionItemId: "item-1",
                            dimensionItemLabel: "Passer le barrage",
                            skillId: "skill-1",
                            skillName: "Accès au décideur",
                        },
                    ],
                    scorecardStepId: "step-1",
                    stepOrder: 1,
                    title: "Démarrer l'appel",
                },
            ],
            criteria: [],
            sessions: [],
            steps: [],
            title: "Prise de rendez-vous",
        });

        expect(progress.steps).toHaveLength(1);
        expect(progress.steps[0]).toMatchObject({
            delta: 0,
            score: 0,
            title: "Démarrer l'appel",
        });
        expect(progress.steps[0].competencies[0]).toMatchObject({
            name: "Accès au décideur",
            score: 0,
        });
    });

    it("aggregates duplicated competencies in the competency overview", () => {
        const progress = buildRoleplayProgress(createProgressInput());

        expect(progressCompetencies(progress)).toEqual([
            {
                delta: 15,
                name: "Découverte des besoins",
                score: 60,
            },
        ]);
    });

    it("uses method quiz criteria for the savoir dimension", () => {
        const progress = buildRoleplayProgress({
            ...createProgressInput(),
            quizCriteria: [
                {
                    advice: null,
                    coachComment: null,
                    criterionRef: "quiz-knowledge-1",
                    dimension: "savoir",
                    dimensionItemId: "item-savoir",
                    dimensionItemLabel: "Connaissance des étapes",
                    pointsAwarded: 9,
                    pointsMax: 10,
                    scorePercent: 90,
                    scorecardStepId: "step-1",
                    sessionId: "quiz-attempt-1",
                    skillId: "skill-1",
                    skillName: "Découverte des besoins",
                },
            ],
        });

        expect(progress.dimensions.find((dimension) => dimension.key === "savoir")?.score).toBe(90);
        expect(progress.modalities.find((modality) => modality.icon === "quiz")?.score).toBe(90);
        expect(progress.steps[0]?.competencies[0]?.dimensions).toContainEqual({
            diagnostic: "Savoir maîtrisé selon les résultats retenus.",
            key: "savoir",
            label: "Savoir",
            score: 90,
        });
    });

    it("uses the best three of the six latest sessions while keeping the first session as initial", () => {
        const sessionScores = [
            ["session-initial", 99],
            ["session-2", 10],
            ["session-3", 80],
            ["session-4", 70],
            ["session-5", 60],
            ["session-6", 50],
            ["session-7", 40],
        ] as const;
        const progress = buildRoleplayProgress({
            criteria: [],
            sessions: sessionScores.map(([sessionId, scorePercent], index) => ({
                completedAt: `2026-06-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
                scorePercent,
                sessionId,
            })),
            steps: sessionScores.map(([sessionId, scorePercent]) => ({
                coachComment: null,
                pointsAwarded: scorePercent,
                pointsMax: 100,
                scorePercent,
                scorecardStepId: "step-1",
                sessionId,
                stepOrder: 1,
                title: "Qualifier le besoin",
            })),
            title: "Progression découverte",
        });

        expect(progress).toMatchObject({
            afterTraining: 70,
            delta: -29,
            initialScore: 99,
            masteryScore: 70,
        });
        expect(progress.steps[0]).toMatchObject({
            delta: -29,
            score: 70,
        });
    });

    it("uses the best completed method quiz instead of the latest quiz score", () => {
        const quizCriterion = (sessionId: string, completedAt: string, score: number) => ({
            advice: null,
            coachComment: null,
            completedAt,
            criterionRef: `quiz-${sessionId}`,
            dimension: "savoir",
            dimensionItemId: "item-savoir",
            dimensionItemLabel: "Connaissance des étapes",
            pointsAwarded: score,
            pointsMax: 100,
            scorePercent: score,
            scorecardStepId: "step-1",
            sessionId,
            skillId: "skill-1",
            skillName: "Découverte des besoins",
        });
        const progress = buildRoleplayProgress({
            ...createProgressInput(),
            quizCriteria: [
                quizCriterion("quiz-old", "2026-06-01T10:00:00.000Z", 100),
                quizCriterion("quiz-latest", "2026-06-15T10:00:00.000Z", 40),
            ],
        });

        expect(progress.dimensions.find((dimension) => dimension.key === "savoir")?.score).toBe(100);
        expect(progress.modalities.find((modality) => modality.icon === "quiz")?.score).toBe(100);
    });

    it("does not derive savoir from roleplay simulation criteria", () => {
        const input = createProgressInput();
        const progress = buildRoleplayProgress({
            ...input,
            criteria: [
                ...input.criteria,
                {
                    advice: null,
                    coachComment: null,
                    criterionRef: "legacy-savoir",
                    dimension: "savoir",
                    dimensionItemId: "legacy-item",
                    pointsAwarded: 10,
                    pointsMax: 10,
                    scorePercent: 100,
                    scorecardStepId: "step-1",
                    sessionId: "session-best",
                    skillId: "skill-1",
                    skillName: "Découverte des besoins",
                },
            ],
        });

        expect(progress.dimensions.find((dimension) => dimension.key === "savoir")?.score).toBe(0);
        expect(progress.steps[0]?.competencies[0]?.dimensions).toContainEqual({
            diagnostic: "Aucune donnée exploitable pour savoir.",
            key: "savoir",
            label: "Savoir",
            score: 0,
        });
    });
});
