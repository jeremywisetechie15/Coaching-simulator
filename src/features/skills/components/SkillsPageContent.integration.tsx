import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { SkillsPageContent } from "./SkillsPageContent";

const mocks = vi.hoisted(() => ({
    searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
    usePathname: () => "/skills",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => mocks.searchParams,
}));

const emptyMethodFilterData = {
    methodIdsBySkillId: {},
    methodOptions: [],
};

beforeEach(() => {
    mocks.searchParams = new URLSearchParams();
});

describe("SkillsPageContent", () => {
    it("displays type, domain and category without legacy functions", () => {
        const html = renderToStaticMarkup(
            <SkillsPageContent
                canManage={false}
                methodFilterData={emptyMethodFilterData}
                skills={[{
                    assignedUserId: null,
                    category: "Gestion des conflits et médiation",
                    description: "Prévenir et résoudre un désaccord.",
                    domain: "Communication et efficacité relationnelle",
                    groupId: null,
                    id: "gestion-conflits",
                    isActive: true,
                    name: "Gestion des conflits",
                    organizationId: null,
                    scope: CONTENT_VISIBILITY_SCOPE.public,
                    status: CONTENT_STATUS.published,
                    type: "Comportementale",
                }]}
            />,
        );

        expect(html).toContain("Type · Comportementale");
        expect(html).toContain("Publié");
        expect(html).toContain("Domaine · Communication");
        expect(html).toContain("Catégorie · Gestion des conflits");
        expect(html).not.toContain("Fonctions");
    });

    it("displays the draft badge on a draft skill card", () => {
        const html = renderToStaticMarkup(
            <SkillsPageContent
                canManage
                methodFilterData={emptyMethodFilterData}
                skills={[{
                    assignedUserId: null,
                    category: null,
                    description: "",
                    domain: null,
                    groupId: null,
                    id: "draft-skill",
                    isActive: true,
                    name: "Compétence à finaliser",
                    organizationId: null,
                    scope: CONTENT_VISIBILITY_SCOPE.public,
                    status: CONTENT_STATUS.draft,
                    type: "Métier",
                }]}
            />,
        );

        expect(html).toContain("Brouillon");
    });

    it("explains the empty assigned state to a learner", () => {
        const html = renderToStaticMarkup(
            <SkillsPageContent
                canManage={false}
                methodFilterData={emptyMethodFilterData}
                skills={[]}
            />,
        );

        expect(html).toContain("Aucune compétence assignée");
        expect(html).toContain("via un roleplay ou un quiz");
    });

    it("filters skills by an associated method", () => {
        mocks.searchParams = new URLSearchParams({ method: "method-1" });

        const html = renderToStaticMarkup(
            <SkillsPageContent
                canManage={false}
                methodFilterData={{
                    methodIdsBySkillId: {
                        "skill-1": ["method-1"],
                        "skill-2": ["method-2"],
                    },
                    methodOptions: [
                        { id: "method-1", name: "Méthode 1" },
                        { id: "method-2", name: "Méthode 2" },
                    ],
                }}
                skills={[
                    {
                        assignedUserId: null,
                        category: "Prospection",
                        description: "Compétence associée à la première méthode.",
                        domain: "Commerce et développement commercial",
                        groupId: null,
                        id: "skill-1",
                        isActive: true,
                        name: "Compétence visible",
                        organizationId: null,
                        scope: CONTENT_VISIBILITY_SCOPE.public,
                        status: CONTENT_STATUS.published,
                        type: "Métier",
                    },
                    {
                        assignedUserId: null,
                        category: "Prospection",
                        description: "Compétence associée à la seconde méthode.",
                        domain: "Commerce et développement commercial",
                        groupId: null,
                        id: "skill-2",
                        isActive: true,
                        name: "Compétence masquée",
                        organizationId: null,
                        scope: CONTENT_VISIBILITY_SCOPE.public,
                        status: CONTENT_STATUS.published,
                        type: "Métier",
                    },
                ]}
            />,
        );

        expect(html).toContain("Compétence visible");
        expect(html).not.toContain("Compétence masquée");
        expect(html).toContain("Toutes les catégories");
        expect(html).toContain("Méthode 1");
    });

    it("filters skills by category", () => {
        mocks.searchParams = new URLSearchParams({ category: "Prospection" });

        const html = renderToStaticMarkup(
            <SkillsPageContent
                canManage={false}
                methodFilterData={emptyMethodFilterData}
                skills={[
                    {
                        assignedUserId: null,
                        category: "Prospection",
                        description: "Préparer une prise de contact.",
                        domain: "Commerce et développement commercial",
                        groupId: null,
                        id: "prospection",
                        isActive: true,
                        name: "Prospecter efficacement",
                        organizationId: null,
                        scope: CONTENT_VISIBILITY_SCOPE.public,
                        status: CONTENT_STATUS.published,
                        type: "Métier",
                    },
                    {
                        assignedUserId: null,
                        category: "Négociation commerciale",
                        description: "Conclure un accord.",
                        domain: "Commerce et développement commercial",
                        groupId: null,
                        id: "negociation",
                        isActive: true,
                        name: "Négocier efficacement",
                        organizationId: null,
                        scope: CONTENT_VISIBILITY_SCOPE.public,
                        status: CONTENT_STATUS.published,
                        type: "Métier",
                    },
                ]}
            />,
        );

        expect(html).toContain("Prospecter efficacement");
        expect(html).not.toContain("Négocier efficacement");
    });
});
