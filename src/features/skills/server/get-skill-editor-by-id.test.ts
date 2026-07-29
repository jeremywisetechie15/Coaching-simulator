import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    fetchSkillDetail: vi.fn(),
    hasSkillProtectedUsage: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({
    requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: mocks.createAdminClient,
}));
vi.mock("./skill-query", () => ({
    fetchSkillDetail: mocks.fetchSkillDetail,
}));
vi.mock("./skill-usage-edit-policy", () => ({
    hasSkillProtectedUsage: mocks.hasSkillProtectedUsage,
}));

import { getSkillEditorById } from "./get-skill-editor-by-id";

describe("getSkillEditorById", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
        mocks.createAdminClient.mockReturnValue({ rpc: vi.fn() });
        mocks.fetchSkillDetail.mockResolvedValue({
            id: "acces-decideur",
            name: "Accès au décideur",
        });
        mocks.hasSkillProtectedUsage.mockResolvedValue(true);
    });

    it("returns the skill and its protected usage state", async () => {
        await expect(
            getSkillEditorById("acces-decideur"),
        ).resolves.toEqual({
            hasProtectedUsage: true,
            id: "acces-decideur",
            name: "Accès au décideur",
        });
        expect(mocks.requireAdmin).toHaveBeenCalledOnce();
        expect(mocks.hasSkillProtectedUsage).toHaveBeenCalledWith(
            expect.anything(),
            "acces-decideur",
        );
    });
});
