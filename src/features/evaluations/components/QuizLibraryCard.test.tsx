import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
    CONTENT_STATUS,
    LEARNER_CONTENT_STATUS,
} from "@/features/content/domain";
import {
    QUIZ_KIND,
    QUIZ_PARTICIPATION,
    QUIZ_TYPE,
    QUIZ_VISIBILITY_SCOPE,
    type QuizListItem,
} from "@/features/evaluations/domain";
import { QuizLibraryCard } from "./QuizLibraryCard";

const quiz: QuizListItem = {
    categories: ["Accueil et posture relationnelle"],
    description: "Validez vos connaissances commerciales.",
    difficulty: "Moyen",
    domain: "Relation client et expérience client",
    durationMinutes: 20,
    id: "quiz-1",
    isActive: true,
    kind: QUIZ_KIND.methodKnowledge,
    learnerStats: {
        attemptCount: 3,
        bestScore: 88,
        currentScore: 80,
        indexResultCount: 3,
        indexScore: 84,
    },
    learnerStatus: LEARNER_CONTENT_STATUS.validated,
    maxAttempts: 3,
    methodId: "method-1",
    methodName: "Méthode DAGO",
    participation: QUIZ_PARTICIPATION.mandatory,
    questionCount: 16,
    scope: QUIZ_VISIBILITY_SCOPE.public,
    status: CONTENT_STATUS.published,
    tags: [],
    title: "Prise de rendez-vous",
    type: QUIZ_TYPE.knowledge,
    updatedAt: null,
    validationThreshold: 80,
};

describe("QuizLibraryCard", () => {
    it("renders only persisted quiz data and learner statistics", () => {
        const html = renderToStaticMarkup(
            <QuizLibraryCard detailHref="/evaluations/quiz-1" quiz={quiz} />,
        );

        expect(html).toContain("Prise de rendez-vous");
        expect(html).toContain("Méthode DAGO");
        expect(html).toContain("16 questions");
        expect(html).toContain("20 min");
        expect(html).toContain("3");
        expect(html).toContain("88%");
        expect(html).toContain("Retenter le quiz");
        expect(html).toContain('aria-label="Nombre de tentatives : 3"');
    });

    it("keeps missing optional data explicit instead of inventing values", () => {
        const html = renderToStaticMarkup(
            <QuizLibraryCard
                detailHref="/evaluations/quiz-1"
                quiz={{
                    ...quiz,
                    learnerStats: {
                        ...quiz.learnerStats,
                        attemptCount: 0,
                        bestScore: null,
                    },
                    methodId: null,
                    methodName: null,
                }}
            />,
        );

        expect(html).toContain("Aucune");
        expect(html).toContain("—");
        expect(html).toContain("Commencer le quiz");
        expect(html).not.toContain("Retenter le quiz");
    });

    it("opens a draft for administration without presenting a start action", () => {
        const html = renderToStaticMarkup(
            <QuizLibraryCard
                detailHref="/evaluations/quiz-1"
                quiz={{ ...quiz, status: CONTENT_STATUS.draft }}
            />,
        );

        expect(html).toContain("Voir le quiz");
        expect(html).not.toContain("Commencer le quiz");
        expect(html).not.toContain("Retenter le quiz");
    });

    it("shows publication status instead of learner progress on administrator cards", () => {
        const html = renderToStaticMarkup(
            <QuizLibraryCard
                detailHref="/evaluations/quiz-1"
                quiz={{ ...quiz, status: CONTENT_STATUS.draft }}
                showPublicationStatus
            />,
        );

        expect(html).toContain("Brouillon");
        expect(html).not.toContain("Validé");
    });

    it("keeps learner progress on learner cards", () => {
        const html = renderToStaticMarkup(
            <QuizLibraryCard detailHref="/evaluations/quiz-1" quiz={quiz} />,
        );

        expect(html).toContain("Validé");
        expect(html).not.toContain(">Publié<");
    });
});
