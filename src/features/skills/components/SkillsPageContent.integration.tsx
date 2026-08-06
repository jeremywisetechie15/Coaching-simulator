import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { SkillsPageContent } from "./SkillsPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/skills",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

describe("SkillsPageContent", () => {
    it("displays type, domain and category without legacy functions", () => {
        const html = renderToStaticMarkup(
            <SkillsPageContent
                canManage={false}
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
            <SkillsPageContent canManage={false} skills={[]} />,
        );

        expect(html).toContain("Aucune compétence assignée");
        expect(html).toContain("via un roleplay ou un quiz");
    });
});
