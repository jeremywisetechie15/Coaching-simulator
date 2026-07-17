import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import { CONTENT_STATUS } from "@/features/content/domain";
import { METHOD_SCOPE, type MethodDetail } from "@/features/methods/domain/method";
import { mapMethodResourcesToModalDocuments, MethodDetailPageContent } from "./MethodDetailPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/methods/method-1",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

const method: MethodDetail = {
    category: "Gestion des conflits",
    challenges: [],
    code: "dago",
    description: "Méthode commerciale.",
    domain: "Communication",
    id: "11111111-1111-4111-8111-111111111100",
    name: "Méthode DAGO",
    notationMethodId: null,
    objectives: [],
    organizationId: null,
    organizationName: null,
    readingTimeLabel: "10 min",
    readingTimeMinutes: 10,
    resources: [],
    scope: METHOD_SCOPE.public,
    status: CONTENT_STATUS.published,
    stepCount: 0,
    steps: [],
    subtitle: "",
    tag: "",
    version: "v1",
};

describe("MethodDetailPageContent", () => {
    it("links knowledge checks to the associated quiz", () => {
        const html = renderToStaticMarkup(
            <MethodDetailPageContent
                associatedQuiz={{
                    id: "22222222-2222-4222-8222-222222222222",
                    kind: QUIZ_KIND.methodKnowledge,
                    methodId: method.id,
                    questionCount: 3,
                    title: "Quiz DAGO",
                }}
                mastery={{
                    completedAt: "2026-07-09T15:25:38.909Z",
                    delta: 12,
                    scorePercent: 72,
                    trend: "up",
                }}
                method={method}
            />,
        );

        expect(html).toContain(
            "/evaluations/22222222-2222-4222-8222-222222222222/quiz?returnTo=%2Fmethods%2Fmethod-1",
        );
        expect(html).toContain("Vérifier mes connaissances");
        expect(html).toContain("72%");
        expect(html).toContain("09/07/2026");
        expect(html).toContain("Progression de 12 points depuis le quiz précédent");
        expect(html).toContain("Domaine · Communication");
        expect(html).toContain("Catégorie · Gestion des conflits");
        expect(html).not.toContain("Non testée");
        expect(html).not.toContain("Prêt à passer à l&#x27;action ?");
    });

    it("hides knowledge-check actions when the method has no associated quiz", () => {
        const html = renderToStaticMarkup(
            <MethodDetailPageContent
                associatedQuiz={null}
                method={method}
            />,
        );

        expect(html).not.toContain("Vérifier mes connaissances");
    });

    it("maps complementary method resources to the document modal", () => {
        const documents = mapMethodResourcesToModalDocuments({
            ...method,
            resources: [
                {
                    durationSeconds: null,
                    externalUrl: "",
                    id: "33333333-3333-4333-8333-333333333333",
                    label: "Guide DAGO",
                    notationFileId: null,
                    resourceType: "document",
                    sortOrder: 1,
                    stepId: null,
                    storageBucket: "notation_pdf",
                    storagePath: "methods/method-1/resources/resource-1/guide-dago.pdf",
                },
                {
                    durationSeconds: null,
                    externalUrl: "https://example.com/checklist",
                    id: "44444444-4444-4444-8444-444444444444",
                    label: "Checklist",
                    notationFileId: null,
                    resourceType: "link",
                    sortOrder: 2,
                    stepId: null,
                    storageBucket: null,
                    storagePath: null,
                },
                {
                    durationSeconds: null,
                    externalUrl: "",
                    id: "55555555-5555-4555-8555-555555555555",
                    label: "Capsule étape",
                    notationFileId: null,
                    resourceType: "video",
                    sortOrder: 3,
                    stepId: "66666666-6666-4666-8666-666666666666",
                    storageBucket: "notation_pdf",
                    storagePath: "methods/method-1/steps/step-1/resources/resource-2/video.mp4",
                },
            ],
        });

        expect(documents).toEqual([
            {
                id: "33333333-3333-4333-8333-333333333333",
                kind: "pdf",
                meta: "guide-dago.pdf",
                title: "Guide DAGO",
                url: "/api/methods/11111111-1111-4111-8111-111111111100/resources/33333333-3333-4333-8333-333333333333",
            },
            {
                id: "44444444-4444-4444-8444-444444444444",
                kind: "document",
                meta: "URL",
                title: "Checklist",
                url: "https://example.com/checklist",
            },
        ]);
    });
});
