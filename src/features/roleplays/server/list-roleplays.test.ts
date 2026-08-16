import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { listRoleplays } from "./list-roleplays";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    fetchRoleplayList: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("./roleplay-query", () => ({ fetchRoleplayList: mocks.fetchRoleplayList }));

describe("listRoleplays", () => {
    const supabase = { name: "authenticated-client" };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createClient.mockResolvedValue(supabase);
        mocks.fetchRoleplayList.mockResolvedValue([]);
    });

    it("lets administrators list every publication status", async () => {
        mocks.requireAuth.mockResolvedValue({ platformRole: "admin", userId: "admin-1" });

        await listRoleplays();

        expect(mocks.fetchRoleplayList).toHaveBeenCalledWith(supabase, "admin-1", {});
    });

    it("explicitly restricts learners to published roleplays", async () => {
        mocks.requireAuth.mockResolvedValue({ platformRole: "user", userId: "learner-1" });

        await listRoleplays();

        expect(mocks.fetchRoleplayList).toHaveBeenCalledWith(
            supabase,
            "learner-1",
            { status: CONTENT_STATUS.published },
        );
    });
});
