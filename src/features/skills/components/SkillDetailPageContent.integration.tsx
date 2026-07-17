import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import type { SkillDetail } from "@/features/skills/domain/skills";
import { SkillDetailPageContent } from "./SkillDetailPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/skills/gestion-conflits",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

const skill: SkillDetail = {
    assignedUserId: null,
    category: "Gestion des conflits",
    description: "Prévenir et résoudre un désaccord.",
    dimensionItems: [],
    domain: "Communication",
    groupId: null,
    id: "gestion-conflits",
    isActive: true,
    name: "Gestion des conflits",
    organizationId: null,
    scope: CONTENT_VISIBILITY_SCOPE.public,
    status: CONTENT_STATUS.published,
    type: "Comportementale",
};

describe("SkillDetailPageContent", () => {
    it("displays the shared taxonomy and no functions section", () => {
        const html = renderToStaticMarkup(
            <SkillDetailPageContent canManage skill={skill} />,
        );

        expect(html).toContain("Type · Comportementale");
        expect(html).toContain("Domaine · Communication");
        expect(html).toContain("Catégorie · Gestion des conflits");
        expect(html).not.toContain("Fonctions associées");
    });
});
