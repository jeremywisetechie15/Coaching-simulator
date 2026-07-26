import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
    demoEvaluationKeyMoments,
    evaluation,
    type Evaluation,
    type TranscriptCorrection,
} from "@/features/roleplays/data/evaluation";
import { roleplays } from "@/features/roleplays/data/roleplays";
import { roleplaySessions } from "@/features/roleplays/data/sessions";
import {
    RoleplaySessionReportPrintPage,
    type RoleplaySessionReportMethod,
} from "./RoleplaySessionReportPrintPage";

const learnerCorrection: TranscriptCorrection = {
    criterionRef: "C1",
    original: "parlons de vos priorités",
    reason: "Le cadrage doit annoncer plus clairement l'objectif.",
    suggestion: "Pour bien cadrer notre échange, quelles sont vos priorités ?",
};

const personaCorrection: TranscriptCorrection = {
    criterionRef: "C2",
    original: "je vous écoute",
    reason: "Cette correction ne doit pas être exportée.",
    suggestion: "Cette suggestion persona ne doit pas être exportée.",
};

const reportEvaluation: Evaluation = {
    ...evaluation,
    momentsCles: [demoEvaluationKeyMoments[0]],
    steps: [],
    transcript: [
        {
            corrections: [learnerCorrection],
            speaker: "you",
            text: "Avant de commencer, parlons de vos priorités.",
            time: "00:42",
        },
        {
            corrections: [personaCorrection],
            speaker: "persona",
            text: "Bonjour, je vous écoute.",
            time: "00:50",
        },
    ],
};

const reportMethod: RoleplaySessionReportMethod = {
    challenges: ["Passer le barrage standard sans déclencher un refus réflexe."],
    description: "La méthode DAGO structure la prise de rendez-vous en quatre étapes opérationnelles.",
    name: "Méthode DAGO",
    objectives: ["Augmenter le taux de transformation des appels en rendez-vous qualifiés."],
    steps: [{
        id: "method-step-1",
        shortTitle: "Démarrer",
        summary: "Accéder au bon interlocuteur.",
        takeaway: "Passer le barrage du standard.",
        title: "Démarrer et passer le barrage",
    }],
};

describe("RoleplaySessionReportPrintPage", () => {
    it("exports key moments and learner AI corrections in the transcript", () => {
        const html = renderToStaticMarkup(
            <RoleplaySessionReportPrintPage
                evaluation={reportEvaluation}
                method={reportMethod}
                roleplay={roleplays[0]}
                session={roleplaySessions[0]}
            />,
        );

        expect(html).toContain("Moments clés de l&#x27;échange");
        expect(html).toContain("Clarification immédiate");
        expect(html).toContain("Pourquoi c&#x27;est un moment clé");
        expect(html).toContain("Réponse alternative recommandée");
        expect(html).toContain("Correction IA");
        expect(html).toContain("Verbatim préconisé");
        expect(html).toContain(learnerCorrection.suggestion);
        expect(html).toContain("Le cadrage doit annoncer plus clairement");
        expect(html).toContain(">parlons de vos priorités</mark>");
        expect(html).not.toContain(personaCorrection.suggestion);
        expect(html).not.toContain(personaCorrection.reason);
    });

    it("exports the associated method summary when notation steps are empty", () => {
        const html = renderToStaticMarkup(
            <RoleplaySessionReportPrintPage
                evaluation={reportEvaluation}
                method={reportMethod}
                roleplay={roleplays[0]}
                session={roleplaySessions[0]}
            />,
        );

        expect(reportEvaluation.steps).toHaveLength(0);
        expect(html).toContain("Analyse méthodologique");
        expect(html).toContain("Descriptif de la méthode");
        expect(html).toContain(reportMethod.description);
        expect(html).toContain("À retenir en 30 secondes");
        expect(html).toContain("Passer le barrage du standard.");
        expect(html).toContain("Objectifs");
        expect(html).toContain("Augmenter le taux de transformation");
        expect(html).toContain("Enjeux");
        expect(html).toContain("Passer le barrage standard");
    });
});
