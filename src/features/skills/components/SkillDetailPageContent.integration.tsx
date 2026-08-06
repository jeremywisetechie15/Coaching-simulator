import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import type { SkillDetail } from "@/features/skills/domain/skills";
import type { UserSkillProgress } from "@/features/users/domain/users";
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
    category: "Gestion des conflits et médiation",
    description: "Prévenir et résoudre un désaccord.",
    dimensionItems: [],
    domain: "Communication et efficacité relationnelle",
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
    it("displays the shared taxonomy without invented progress", () => {
        const html = renderToStaticMarkup(
            <SkillDetailPageContent canManage skill={skill} />,
        );

        expect(html).toContain("Type · Comportementale");
        expect(html).toContain("Publié");
        expect(html).toContain("Domaine · Communication");
        expect(html).toContain("Catégorie · Gestion des conflits");
        expect(html).toContain("Non évalué");
        expect(html).not.toContain("Fonctions associées");
        expect(html).not.toContain("+8%");
    });

    it("displays the draft badge on the skill detail page", () => {
        const html = renderToStaticMarkup(
            <SkillDetailPageContent
                canManage
                skill={{ ...skill, status: CONTENT_STATUS.draft }}
            />,
        );

        expect(html).toContain("Brouillon");
    });

    it("keeps a real zero score distinct from an unevaluated skill", () => {
        const progress: UserSkillProgress = {
            delta: 0,
            dimensions: [
                { itemCount: 0, key: "savoir", label: "Savoir", score: 0 },
                { itemCount: 0, key: "savoir_faire", label: "Savoir-faire", score: null },
                { itemCount: 0, key: "savoir_etre", label: "Savoir-être", score: null },
            ],
            id: skill.id,
            initialScore: 0,
            items: [],
            label: skill.name,
            score: 0,
        };
        const html = renderToStaticMarkup(
            <SkillDetailPageContent progress={progress} skill={skill} />,
        );

        expect(html).toContain("0%");
        expect(html).toContain("Faible");
        expect(html).not.toContain("Non évalué");
    });
});
