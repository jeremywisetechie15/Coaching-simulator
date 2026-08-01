import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import type { SkillDetail } from "@/features/skills/domain/skills";
import { SKILL_USAGE_EDIT_RESTRICTION_MESSAGE } from "@/features/skills/domain/skill-usage-edit-policy";
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
        expect(html).toContain("Deux parcours, un même formulaire");
        expect(html).toContain("Importer un fichier JSON");
        expect(html).toContain("Créer manuellement");
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

    it("locks structural controls and keeps the description editable after protected usage", () => {
        const html = renderToStaticMarkup(
            <CreateSkillPageContent
                groupOptions={[]}
                initialSkill={{
                    ...editedSkill,
                    dimensionItems: [
                        {
                            dimension: "savoir",
                            id: "11111111-1111-4111-8111-111111111111",
                            isActive: true,
                            label: "Identifier les signaux",
                            order: 1,
                            skillId: editedSkill.id,
                        },
                    ],
                    hasProtectedUsage: true,
                    status: CONTENT_STATUS.published,
                }}
                organizationOptions={[]}
                userOptions={[]}
            />,
        );
        const inputs = html.match(/<input[^>]*>/g) ?? [];
        const textarea = html.match(/<textarea[^>]*>[\s\S]*?<\/textarea>/)?.[0] ?? "";

        expect(html).toContain(SKILL_USAGE_EDIT_RESTRICTION_MESSAGE);
        expect(html).toContain("Dupliquer pour tout modifier");
        expect(
            inputs.some(
                (input) =>
                    input.includes('value="Gestion des conflits"') &&
                    input.includes('disabled=""'),
            ),
        ).toBe(true);
        expect(
            inputs.some(
                (input) =>
                    input.includes('value="Identifier les signaux"') &&
                    input.includes('disabled=""'),
            ),
        ).toBe(true);
        expect(textarea).not.toContain('disabled=""');
        expect(textarea).toContain(
            "Prévenir et résoudre un désaccord.",
        );
    });
});
