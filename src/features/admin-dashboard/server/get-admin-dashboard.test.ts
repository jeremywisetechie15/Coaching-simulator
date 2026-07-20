import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { getAdminDashboard } from "./get-admin-dashboard";

describe("getAdminDashboard", () => {
    it("checks the platform admin role before creating the privileged Supabase client", async () => {
        mocks.requireAdmin.mockRejectedValueOnce(new Error("forbidden"));

        await expect(getAdminDashboard({ organization: "all", period: 30 })).rejects.toThrow("forbidden");
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });
});
