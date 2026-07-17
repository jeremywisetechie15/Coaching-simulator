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
                    category: "Gestion des conflits",
                    description: "Prévenir et résoudre un désaccord.",
                    domain: "Communication",
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
        expect(html).toContain("Domaine · Communication");
        expect(html).toContain("Catégorie · Gestion des conflits");
        expect(html).not.toContain("Fonctions");
    });
});
