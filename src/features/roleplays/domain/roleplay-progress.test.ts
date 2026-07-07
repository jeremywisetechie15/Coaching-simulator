import { describe, expect, it } from "vitest";
import {
    buildRoleplayProgress,
    createEmptyRoleplayProgress,
    progressCompetencies,
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
    it("builds progress from the best session and compares it to the first session", () => {
        const progress = buildRoleplayProgress(createProgressInput());

        expect(progress).toMatchObject({
            afterTraining: 75,
            delta: 30,
            initialScore: 45,
            masteryScore: 75,
            title: "Progression découverte",
        });
        expect(progress.steps[0]).toMatchObject({
            delta: 30,
            score: 75,
            title: "Qualifier le besoin",
        });
        expect(progress.steps[0].competencies[0]).toMatchObject({
            delta: 30,
            name: "Découverte des besoins",
            score: 75,
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
                delta: 30,
                name: "Découverte des besoins",
                score: 75,
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
            diagnostic: "Savoir maîtrisé sur la meilleure session.",
            key: "savoir",
            label: "Savoir",
            score: 90,
        });
    });
});
