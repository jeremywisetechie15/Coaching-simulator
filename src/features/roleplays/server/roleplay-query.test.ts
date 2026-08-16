import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { fetchRoleplayList } from "./roleplay-query";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: mocks.createAdminClient,
}));

function createRoleplayListClient() {
    const returns = vi.fn().mockResolvedValue({ data: [], error: null });
    const order = vi.fn().mockReturnValue({ returns });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq, order });
    const from = vi.fn().mockReturnValue({ select });

    return {
        client: { from } as unknown as SupabaseClient,
        eq,
        order,
    };
}

describe("fetchRoleplayList", () => {
    it("applies the requested publication status in the database query", async () => {
        const { client, eq } = createRoleplayListClient();

        await fetchRoleplayList(client, "learner-1", { status: CONTENT_STATUS.published });

        expect(eq).toHaveBeenCalledWith("status", CONTENT_STATUS.published);
    });

    it("does not exclude archived roleplays from an unrestricted admin query", async () => {
        const { client, eq, order } = createRoleplayListClient();

        await fetchRoleplayList(client, "admin-1");

        expect(eq).not.toHaveBeenCalled();
        expect(order).toHaveBeenCalledWith("updated_at", { ascending: false });
    });
});
