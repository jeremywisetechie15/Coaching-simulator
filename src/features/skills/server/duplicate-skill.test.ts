import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    createSkill: vi.fn(),
    fetchSkillDetail: vi.fn(),
    requireAdmin: vi.fn(),
    resolveDuplicateName: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/features/content/server", () => ({ resolveDuplicateName: mocks.resolveDuplicateName }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("./create-skill", () => ({ createSkill: mocks.createSkill }));
vi.mock("./skill-query", () => ({ fetchSkillDetail: mocks.fetchSkillDetail }));

import { duplicateSkill } from "./duplicate-skill";

describe("duplicateSkill", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ platformRole: "admin", userId: "admin-1" });
        mocks.createAdminClient.mockReturnValue({ from: vi.fn() });
        mocks.resolveDuplicateName.mockResolvedValue("Gestion des conflits - copie");
        mocks.createSkill.mockResolvedValue({ id: "gestion-des-conflits-copie" });
        mocks.fetchSkillDetail.mockResolvedValue({
            assignedUserId: null,
            category: "Gestion des conflits",
            description: "Prévenir et résoudre un désaccord.",
            dimensionItems: [
                { dimension: "savoir_faire", id: "item-2", isActive: true, label: "Reformuler", order: 2, skillId: "source" },
                { dimension: "savoir", id: "item-1", isActive: true, label: "Identifier le conflit", order: 1, skillId: "source" },
                { dimension: "savoir_faire", id: "item-3", isActive: true, label: "Questionner", order: 1, skillId: "source" },
                { dimension: "savoir_etre", id: "item-4", isActive: false, label: "Ancien item", order: 1, skillId: "source" },
            ],
            domain: "Communication",
            groupId: null,
            id: "source",
            isActive: true,
            name: "Gestion des conflits",
            organizationId: null,
            scope: "public",
            status: "published",
            type: "Comportementale",
        });
    });

    it("creates an admin-only draft copy with active dimensions in canonical order", async () => {
        await duplicateSkill("source");

        expect(mocks.requireAdmin).toHaveBeenCalledOnce();
        expect(mocks.createSkill).toHaveBeenCalledWith(expect.objectContaining({
            dimensionItems: {
                savoir: [{ label: "Identifier le conflit" }],
                savoir_etre: [],
                savoir_faire: [{ label: "Questionner" }, { label: "Reformuler" }],
            },
            name: "Gestion des conflits - copie",
            status: "draft",
        }));
    });
});
