import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import type { SkillListItem } from "@/features/skills/domain/skills";
import { SkillCardActions } from "./SkillCardActions";

const skill: SkillListItem = {
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
};

describe("SkillCardActions", () => {
    it("exposes the canonical modify, duplicate and archive actions", () => {
        const html = renderToStaticMarkup(
            <SkillCardActions
                busy={false}
                currentHref="/skills"
                isMenuOpen
                onArchive={vi.fn()}
                onDuplicate={vi.fn()}
                onToggleMenu={vi.fn()}
                skill={skill}
            />,
        );

        expect(html).toContain("Modifier");
        expect(html).toContain("Dupliquer");
        expect(html).toContain("Archiver");
        expect(html).not.toContain("Supprimer");
        expect(html).toContain("/skills/gestion-conflits/edit?returnTo=%2Fskills");
        expect(html).toContain("z-40");
    });
});
