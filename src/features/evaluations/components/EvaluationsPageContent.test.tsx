import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
    ContentStatusBadge,
    LearnerContentStatusBadge,
} from "@/features/content/components";
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
import { EvaluationsPageContent } from "./EvaluationsPageContent";
import { uiTokens } from "@/lib/ui/tokens";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@tanstack/react-query", () => ({
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/features/app-shell/components", () => ({
    ContextualLink: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
    useCurrentAppHref: () => "/evaluations",
}));

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
        attemptCount: 1,
        bestScore: 88,
        currentScore: 88,
        indexResultCount: 1,
        indexScore: null,
    },
    learnerStatus: LEARNER_CONTENT_STATUS.validated,
    maxAttempts: 3,
    methodId: "method-1",
    methodName: "Méthode DAGO",
    participation: QUIZ_PARTICIPATION.mandatory,
    questionCount: 10,
    scope: QUIZ_VISIBILITY_SCOPE.public,
    status: CONTENT_STATUS.published,
    tags: [],
    title: "Quiz commercial",
    type: QUIZ_TYPE.knowledge,
    updatedAt: null,
    validationThreshold: 80,
};

describe("EvaluationsPageContent publication visibility", () => {
    it("shows publication controls and status to administrators", () => {
        const html = renderToStaticMarkup(
            <EvaluationsPageContent canManage quizzes={[quiz]} />,
        );
        const publicationBadgeHtml = renderToStaticMarkup(
            <ContentStatusBadge
                className={uiTokens.quizLibraryCard.badge}
                status={CONTENT_STATUS.published}
            />,
        );

        expect(html).toContain('aria-label="Filtrer par statut de publication"');
        expect(html).toContain("Tous les statuts de publication");
        expect(html).toContain(publicationBadgeHtml);
        expect(html).not.toContain('aria-label="Filtrer par progression"');
    });

    it("keeps publication controls hidden from learners", () => {
        const html = renderToStaticMarkup(
            <EvaluationsPageContent canManage={false} quizzes={[quiz]} />,
        );
        const learnerBadgeHtml = renderToStaticMarkup(
            <LearnerContentStatusBadge
                className={uiTokens.quizLibraryCard.badge}
                status={LEARNER_CONTENT_STATUS.validated}
            />,
        );

        expect(html).toContain('aria-label="Filtrer par progression"');
        expect(html).toContain(learnerBadgeHtml);
        expect(html).not.toContain("Tous les statuts de publication");
        expect(html).not.toContain('aria-label="Filtrer par statut de publication"');
    });
});
