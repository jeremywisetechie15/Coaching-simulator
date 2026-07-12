import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import { METHOD_SCOPE, type MethodDetail } from "@/features/methods/domain/method";
import { CreateMethodPageContent } from "./CreateMethodPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/methods/new",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

describe("CreateMethodPageContent", () => {
    it("exposes the Figma quiz association control on method create/edit", () => {
        const html = renderToStaticMarkup(
            <CreateMethodPageContent
                organizationOptions={[]}
                quizOptions={[
                    {
                        id: "11111111-1111-4111-8111-111111111199",
                        kind: QUIZ_KIND.contextual,
                        methodId: null,
                        questionCount: 3,
                        title: "Quiz DEEPMARK",
                    },
                ]}
            />,
        );

        expect(html).toContain("Quiz associé");
        expect(html).toContain("Aucun quiz associé");
        expect(html).not.toContain("Un quiz associé est requis pour publier une nouvelle méthode.");
        expect(html).toContain("Ressources complémentaires");
        expect(html).toContain("Document 1");
        expect(html).toContain("Type de document");
        expect(html).toContain("Fichier du document");
        expect(html).toContain("Choisir un fichier");
    });

    it("renders existing method-level resources as separate documents", () => {
        const initialMethod: MethodDetail = {
            category: "",
            challenges: [],
            code: "dago",
            description: "",
            domain: "",
            id: "11111111-1111-4111-8111-111111111100",
            name: "Méthode DAGO",
            notationMethodId: null,
            objectives: [],
            organizationId: null,
            organizationName: null,
            readingTimeLabel: "Non renseigné",
            readingTimeMinutes: null,
            resources: [
                {
                    durationSeconds: null,
                    externalUrl: "https://example.com/guide.pdf",
                    id: "11111111-1111-4111-8111-111111111101",
                    label: "Guide DAGO",
                    notationFileId: null,
                    resourceType: "document",
                    sortOrder: 1,
                    stepId: null,
                    storageBucket: null,
                    storagePath: null,
                },
                {
                    durationSeconds: null,
                    externalUrl: "https://example.com/checklist",
                    id: "11111111-1111-4111-8111-111111111102",
                    label: "Checklist",
                    notationFileId: null,
                    resourceType: "link",
                    sortOrder: 2,
                    stepId: null,
                    storageBucket: null,
                    storagePath: null,
                },
            ],
            scope: METHOD_SCOPE.public,
            status: CONTENT_STATUS.draft,
            stepCount: 0,
            steps: [],
            subtitle: "",
            tag: "",
            version: "v1",
        };

        const html = renderToStaticMarkup(
            <CreateMethodPageContent
                initialMethod={initialMethod}
                organizationOptions={[]}
                quizOptions={[]}
            />,
        );

        expect(html).toContain("Document 1");
        expect(html).toContain("Document 2");
        expect(html).toContain("Guide DAGO");
        expect(html).toContain("Checklist");
    });

    it("preselects the quiz already linked to the edited method", () => {
        const initialMethod: MethodDetail = {
            category: "",
            challenges: [],
            code: "dago",
            description: "",
            domain: "",
            id: "11111111-1111-4111-8111-111111111100",
            name: "Méthode DAGO",
            notationMethodId: null,
            objectives: [],
            organizationId: null,
            organizationName: null,
            readingTimeLabel: "Non renseigné",
            readingTimeMinutes: null,
            resources: [],
            scope: METHOD_SCOPE.public,
            status: CONTENT_STATUS.draft,
            stepCount: 0,
            steps: [],
            subtitle: "",
            tag: "",
            version: "v1",
        };

        const html = renderToStaticMarkup(
            <CreateMethodPageContent
                initialMethod={initialMethod}
                organizationOptions={[]}
                quizOptions={[
                    {
                        id: "11111111-1111-4111-8111-111111111199",
                        kind: QUIZ_KIND.methodKnowledge,
                        methodId: initialMethod.id,
                        questionCount: 3,
                        title: "Quiz DAGO",
                    },
                    {
                        id: "11111111-1111-4111-8111-111111111188",
                        kind: QUIZ_KIND.methodKnowledge,
                        methodId: "22222222-2222-4222-8222-222222222222",
                        questionCount: 5,
                        title: "Quiz autre méthode",
                    },
                ]}
            />,
        );

        expect(html).toContain("Quiz DAGO (3 questions)");
        expect(html).not.toContain("Quiz autre méthode");
    });
});
