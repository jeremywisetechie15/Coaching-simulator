import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SaveSkillDto } from "@/features/skills/dto";

const mocks = vi.hoisted(() => ({
    assertActiveContentTarget: vi.fn(),
    assertContentStatusTransition: vi.fn(),
    assertSkillUsageEditPolicy: vi.fn(),
    fetchSkillDetail: vi.fn(),
    rpc: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ userId: "admin-1" }),
}));
vi.mock("@/features/content/server", () => ({
    assertActiveContentTarget: mocks.assertActiveContentTarget,
    assertContentStatusTransition: mocks.assertContentStatusTransition,
}));
vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: () => ({
        from: () => {
            const query = {
                eq: () => query,
                maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "acces-decideur", status: "published" },
                    error: null,
                }),
                select: () => query,
            };
            return query;
        },
        rpc: mocks.rpc,
    }),
}));
vi.mock("./skill-query", () => ({
    fetchSkillDetail: mocks.fetchSkillDetail,
}));
vi.mock("./skill-usage-edit-policy", () => ({
    assertSkillUsageEditPolicy: mocks.assertSkillUsageEditPolicy,
}));

import { updateSkill } from "./update-skill";

const itemId = "11111111-1111-4111-8111-111111111111";

function skillInput(): SaveSkillDto {
    return {
        assignedUserId: null,
        category: "Prospection",
        description: "Description clarifiée",
        dimensionItems: {
            savoir: [{ id: itemId, label: "Identifier le décideur" }],
            savoir_etre: [],
            savoir_faire: [],
        },
        domain: "Commercial",
        groupId: null,
        id: "",
        name: "Accès au décideur",
        organizationId: null,
        scope: "public",
        status: "published",
        type: "Métier",
    };
}

describe("updateSkill", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.rpc.mockResolvedValue({ error: null });
        mocks.fetchSkillDetail.mockResolvedValue({ id: "acces-decideur" });
    });

    it("checks the usage policy before calling the aggregate RPC", async () => {
        const input = skillInput();

        await updateSkill("acces-decideur", input);

        expect(mocks.assertSkillUsageEditPolicy).toHaveBeenCalledWith(
            expect.anything(),
            "acces-decideur",
            input,
        );
        expect(mocks.rpc).toHaveBeenCalledWith(
            "admin_update_skill_aggregate",
            expect.objectContaining({
                p_items: [
                    expect.objectContaining({
                        id: itemId,
                        skill_id: "acces-decideur",
                    }),
                ],
                p_skill_id: "acces-decideur",
            }),
        );
        expect(
            mocks.assertSkillUsageEditPolicy.mock.invocationCallOrder[0],
        ).toBeLessThan(mocks.rpc.mock.invocationCallOrder[0]!);
    });
});
