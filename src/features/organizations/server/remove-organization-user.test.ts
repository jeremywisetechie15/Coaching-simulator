import { beforeEach, describe, expect, it, vi } from "vitest";
import { ORGANIZATION_USER_REMOVAL_HISTORY_MESSAGE } from "@/features/organizations/domain/organization-user-removal";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { removeOrganizationUser } from "./remove-organization-user";

function createClient(result: { data: unknown; error: unknown }) {
    const query = {
        delete: vi.fn(),
        eq: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue(result),
        select: vi.fn(),
    };
    query.delete.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);

    return {
        client: { from: vi.fn().mockReturnValue(query) },
        query,
    };
}

describe("removeOrganizationUser", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    });

    it("deletes only the selected organization membership", async () => {
        const { client, query } = createClient({
            data: {
                organization_id: "organization-1",
                user_id: "user-1",
            },
            error: null,
        });
        mocks.createAdminClient.mockReturnValue(client);

        await expect(removeOrganizationUser("organization-1", "user-1")).resolves.toEqual({
            organizationId: "organization-1",
            userId: "user-1",
        });

        expect(mocks.requireAdmin).toHaveBeenCalledOnce();
        expect(client.from).toHaveBeenCalledOnce();
        expect(client.from).toHaveBeenCalledWith("organization_members");
        expect(query.delete).toHaveBeenCalledOnce();
        expect(query.eq).toHaveBeenNthCalledWith(1, "organization_id", "organization-1");
        expect(query.eq).toHaveBeenNthCalledWith(2, "user_id", "user-1");
    });

    it("does not access the database when the actor is not an admin", async () => {
        mocks.requireAdmin.mockRejectedValueOnce(new Error("forbidden"));

        await expect(removeOrganizationUser("organization-1", "user-1")).rejects.toThrow("forbidden");

        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });

    it("maps retained session history to a clear conflict", async () => {
        const { client } = createClient({
            data: null,
            error: { code: "23503", constraint: "sessions_user_organization_fk" },
        });
        mocks.createAdminClient.mockReturnValue(client);

        await expect(removeOrganizationUser("organization-1", "user-1")).rejects.toMatchObject({
            code: "CONFLICT",
            message: ORGANIZATION_USER_REMOVAL_HISTORY_MESSAGE,
            status: 409,
        });
    });

    it("returns not found when the user is not attached to the organization", async () => {
        const { client } = createClient({ data: null, error: null });
        mocks.createAdminClient.mockReturnValue(client);

        await expect(removeOrganizationUser("organization-1", "user-1")).rejects.toMatchObject({
            code: "NOT_FOUND",
            status: 404,
        });
    });
});
