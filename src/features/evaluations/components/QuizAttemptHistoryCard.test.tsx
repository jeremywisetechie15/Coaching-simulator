import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { QuizAttemptHistoryItem } from "@/features/evaluations/server";
import { QuizAttemptHistoryCard } from "./QuizAttemptHistoryCard";

const item: QuizAttemptHistoryItem = {
    attempt: {
        activeDurationSeconds: 95,
        id: "attempt-1",
        number: 1,
        passed: true,
        score: 82,
    },
    occurredAt: "2026-07-30T10:00:00.000Z",
    quiz: {
        categories: ["Vente"],
        difficulty: "Moyen",
        domain: "Commercial",
        id: "quiz-1",
        status: CONTENT_STATUS.archived,
        title: "Quiz historique",
        type: "knowledge",
        typeLabel: "Connaissances",
        validationThreshold: 80,
    },
};

describe("QuizAttemptHistoryCard", () => {
    it("identifies an archived quiz and preserves its score without a broken result link", () => {
        const html = renderToStaticMarkup(<QuizAttemptHistoryCard item={item} />);

        expect(html).toContain("Quiz historique");
        expect(html).toContain("82%");
        expect(html).toContain("Archivé");
        expect(html).toContain("Résultat conservé");
        expect(html).not.toContain("Voir les résultats");
    });
});
