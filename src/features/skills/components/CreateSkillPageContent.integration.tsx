import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import type { SkillDetail } from "@/features/skills/domain/skills";
import { CreateSkillPageContent } from "./CreateSkillPageContent";

vi.mock("next/navigation", () => ({
    usePathname: () => "/skills/new",
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

const editedSkill: SkillDetail = {
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
    status: CONTENT_STATUS.draft,
    type: "Comportementale",
};

describe("CreateSkillPageContent", () => {
    it("uses the shared type, domain and category fields without legacy functions", () => {
        const html = renderToStaticMarkup(
            <CreateSkillPageContent
                groupOptions={[]}
                organizationOptions={[]}
                userOptions={[]}
            />,
        );

        expect(html).toContain("Type de compétence");
        expect(html).toContain("Domaine de compétence");
        expect(html).toContain("Catégorie de compétence");
        expect(html).toContain("Sélectionnez d&#x27;abord un domaine");
        expect(html).not.toContain("Fonctions");
    });

    it("hydrates the domain and category when editing a skill", () => {
        const html = renderToStaticMarkup(
            <CreateSkillPageContent
                groupOptions={[]}
                initialSkill={editedSkill}
                organizationOptions={[]}
                userOptions={[]}
            />,
        );

        expect(html).toContain("Comportementale");
        expect(html).toContain("Communication");
        expect(html).toContain("Gestion des conflits");
        expect(html).not.toContain("Fonctions");
    });
});
