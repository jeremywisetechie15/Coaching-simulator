import { describe, expect, it, vi } from "vitest";
import { USERS_QUERY_KEY } from "@/features/users/domain/user-query";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
import { refreshUserViews } from "./user-detail-refresh";

describe("refreshUserViews", () => {
    it("invalidates the global users table and refreshes server-provided user details", async () => {
        const invalidateQueries = vi.fn().mockResolvedValue(undefined);
        const refresh = vi.fn();

        await refreshUserViews({ invalidateQueries }, { refresh });

        expect(invalidateQueries).toHaveBeenNthCalledWith(1, { queryKey: USERS_QUERY_KEY });
        expect(invalidateQueries).toHaveBeenNthCalledWith(2, { queryKey: ORGANIZATIONS_QUERY_KEY });
        expect(refresh).toHaveBeenCalledOnce();
    });
});
