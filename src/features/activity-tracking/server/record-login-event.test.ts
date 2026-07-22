import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    insert: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { recordLoginEvent } from "./record-login-event";

describe("recordLoginEvent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createAdminClient.mockReturnValue({
            from: vi.fn(() => ({ insert: mocks.insert })),
        });
        mocks.insert.mockResolvedValue({ error: null });
    });

    it("records only learner authentication events with their organization snapshot", async () => {
        mocks.requireAuth.mockResolvedValue({
            activeOrganizationId: "org-a",
            platformRole: "user",
            userId: "user-a",
        });

        await expect(recordLoginEvent("mobile_web")).resolves.toEqual({ recorded: true });
        expect(mocks.insert).toHaveBeenCalledWith({
            organization_id: "org-a",
            source: "mobile_web",
            user_id: "user-a",
        });
    });

    it("does not count an administrator as a learner connection", async () => {
        mocks.requireAuth.mockResolvedValue({
            activeOrganizationId: null,
            platformRole: "admin",
            userId: "admin-a",
        });

        await expect(recordLoginEvent("web")).resolves.toEqual({ recorded: false });
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });
});
