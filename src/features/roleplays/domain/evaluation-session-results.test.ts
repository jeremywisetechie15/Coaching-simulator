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
                verbatim: "Bonjour, je suis [Nom] de [Société].",
            },
        ]);
    });
});
