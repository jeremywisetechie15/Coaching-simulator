import { describe, expect, it } from "vitest";
import type { Evaluation } from "@/features/roleplays/data/evaluation";
import { applyEvaluationSessionResults } from "./evaluation-session-results";

const baseEvaluation: Evaluation = {
    axesAmelioration: [],
    coachAppreciation: "",
    discourse: [],
    momentsCles: [],
    personaAvis: "",
    planEtape: { number: 1, text: "", title: "" },
    pointsPositifs: [],
    prioriteStrategique: "",
    steps: [
        {
            criteria: [
                {
                    analyse: "Mock",
                    conseils: "Mock",
                    critere: "Mock",
                    points: "0/1",
                    preuvesAttendues: "Mock",
                    preuvesObservees: [],
                    verbatim: "Mock",
                },
            ],
            icon: "phone",
            number: 1,
            score: 10,
            status: "À renforcer",
            stepTranscript: {
                end: "00:10",
                lines: [{ speaker: "you", text: "Bonjour" }],
                start: "00:00",
            },
            title: "Ancienne étape",
            total: "10%",
        },
    ],
    transcript: [],
};

describe("evaluation session results", () => {
    it("replaces step criteria with persisted DB results", () => {
        const evaluation = applyEvaluationSessionResults(baseEvaluation, {
            criteria: [
                {
                    advice: "Contextualiser l'accroche.",
                    coachComment: "Critère partiellement observé.",
                    criterionKey: "Accroche contextualisée",
                    criterionOrder: 1,
                    criterionRef: "C1",
                    dimensionItemLabel: "Création d'intérêt immédiat",
                    evidence: "00:01 Apprenant: Bonjour, j'appelle pour un point rentabilité. | Je vous propose 15 minutes.",
                    expectedEvidence: "Motif court et orienté enjeu client.",
                    pointsAwarded: 1.5,
                    pointsMax: 3,
                    scorePercent: 50,
                    scorecardStepId: "step-1",
                    skillName: "Présentation structurée",
                    verbatim: "Je vous appelle au sujet de votre enjeu prioritaire.",
                },
                {
                    advice: null,
                    coachComment: "Critère validé.",
                    criterionKey: "Identité annoncée",
                    criterionOrder: 2,
                    criterionRef: "C2",
                    dimensionItemLabel: null,
                    evidence: "Alexandre Vita d'AlexTech.",
                    expectedEvidence: "Nom, société et fonction.",
                    pointsAwarded: 2,
                    pointsMax: 2,
                    scorePercent: 100,
                    scorecardStepId: "step-1",
                    skillName: "Présentation structurée",
                    verbatim: "Bonjour, je suis [Nom] de [Société].",
                },
            ],
            steps: [
                {
                    coachComment: "Ouverture à renforcer.",
                    pointsAwarded: 3.5,
                    pointsMax: 5,
                    scorePercent: 70,
                    scorecardStepId: "step-1",
                    stepOrder: 1,
                    title: "Démarrer l'appel",
                },
            ],
        });

        expect(evaluation.steps).toHaveLength(1);
        expect(evaluation.steps[0]).toMatchObject({
            commentaireCoach: "Ouverture à renforcer.",
            criteresAAmeliorer: ["Accroche contextualisée"],
            criteresReussis: ["Identité annoncée"],
            score: 70,
            status: "À consolider",
            title: "Démarrer l'appel",
            total: "3.5/5",
        });
        expect(evaluation.steps[0].stepTranscript).toEqual(baseEvaluation.steps[0].stepTranscript);
        expect(evaluation.steps[0].criteria).toEqual([
            {
                analyse: "Critère partiellement observé.",
                competence: "Présentation structurée",
                conseils: "Contextualiser l'accroche.",
                critere: "Accroche contextualisée",
                points: "1.5/3",
                preuvesAttendues: "Motif court et orienté enjeu client.",
                preuvesObservees: [
                    { quote: "Bonjour, j'appelle pour un point rentabilité.", speaker: "Apprenant", time: "00:01" },
                    { quote: "Je vous propose 15 minutes.", speaker: "Apprenant", time: "" },
                ],
                verbatim: "Je vous appelle au sujet de votre enjeu prioritaire.",
            },
            {
                analyse: "Critère validé.",
                competence: "Présentation structurée",
                conseils: "-",
                critere: "Identité annoncée",
                points: "2/2",
                preuvesAttendues: "Nom, société et fonction.",
                preuvesObservees: [{ quote: "Alexandre Vita d'AlexTech.", speaker: "Apprenant", time: "" }],
                verbatim: "-",
            },
        ]);
    });

    it("keeps the notation JSON criteria when legacy foreign keys are missing", () => {
        const evaluation = applyEvaluationSessionResults(baseEvaluation, {
            criteria: [],
            steps: [{
                coachComment: "Commentaire normalisé.",
                pointsAwarded: 1,
                pointsMax: 2,
                scorePercent: 50,
                scorecardStepId: null,
                stepOrder: 1,
                title: "Ancienne étape",
            }],
        });

        expect(evaluation.steps[0].criteria).toEqual(baseEvaluation.steps[0].criteria);
        expect(evaluation.steps[0].commentaireCoach).toBe("Commentaire normalisé.");
    });

    it("hides the recommended verbatim when a criterion has all available points", () => {
        const evaluation = applyEvaluationSessionResults(baseEvaluation, {
            criteria: [
                {
                    advice: null,
                    coachComment: null,
                    criterionKey: "Critère 1 point",
                    criterionOrder: 1,
                    criterionRef: "C1",
                    dimensionItemLabel: null,
                    evidence: null,
                    expectedEvidence: null,
                    pointsAwarded: 1,
                    pointsMax: 1,
                    scorePercent: 100,
                    scorecardStepId: "step-1",
                    skillName: null,
                    verbatim: "Verbatim 1/1",
                },
                {
                    advice: null,
                    coachComment: null,
                    criterionKey: "Critère 2 points",
                    criterionOrder: 2,
                    criterionRef: "C2",
                    dimensionItemLabel: null,
                    evidence: null,
                    expectedEvidence: null,
                    pointsAwarded: 2,
                    pointsMax: 2,
                    scorePercent: 100,
                    scorecardStepId: "step-1",
                    skillName: null,
                    verbatim: "Verbatim 2/2",
                },
                {
                    advice: null,
                    coachComment: null,
                    criterionKey: "Critère 3 points",
                    criterionOrder: 3,
                    criterionRef: "C3",
                    dimensionItemLabel: null,
                    evidence: null,
                    expectedEvidence: null,
                    pointsAwarded: 3,
                    pointsMax: 3,
                    scorePercent: 100,
                    scorecardStepId: "step-1",
                    skillName: null,
                    verbatim: "Verbatim 3/3",
                },
                {
                    advice: null,
                    coachComment: null,
                    criterionKey: "Critère partiel",
                    criterionOrder: 4,
                    criterionRef: "C4",
                    dimensionItemLabel: null,
                    evidence: null,
                    expectedEvidence: null,
                    pointsAwarded: 2,
                    pointsMax: 3,
                    scorePercent: 67,
                    scorecardStepId: "step-1",
                    skillName: null,
                    verbatim: "Verbatim utile",
                },
            ],
            steps: [{
                coachComment: null,
                pointsAwarded: 8,
                pointsMax: 9,
                scorePercent: 89,
                scorecardStepId: "step-1",
                stepOrder: 1,
                title: "Étape test",
            }],
        });

        expect(evaluation.steps[0].criteria.map((criterion) => criterion.verbatim)).toEqual([
            "-",
            "-",
            "-",
            "Verbatim utile",
        ]);
    });
});
