import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { listUserPendingOrganizationInvitations } from "./list-user-pending-organization-invitations";

function createQuery(result: { data: unknown[] | null; error: unknown }) {
    const query = {
        eq: vi.fn(),
        in: vi.fn(),
        returns: vi.fn(),
        select: vi.fn(),
    };

    query.eq.mockReturnValue(query);
    query.in.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.returns.mockResolvedValue(result);

    return query;
}

describe("listUserPendingOrganizationInvitations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    });

    it("returns every invited organization sorted by name", async () => {
        const membershipsQuery = createQuery({
            data: [
                { organization_id: "organization-b" },
                { organization_id: "organization-a" },
                { organization_id: "organization-a" },
            ],
            error: null,
        });
        const organizationsQuery = createQuery({
            data: [
                { id: "organization-b", name: "Zeta" },
                { id: "organization-a", name: "Alpha" },
            ],
            error: null,
        });
        const client = {
            from: vi.fn((table: string) =>
                table === "organization_members" ? membershipsQuery : organizationsQuery
            ),
        };

        mocks.createAdminClient.mockReturnValue(client);

        await expect(listUserPendingOrganizationInvitations("user-1")).resolves.toEqual([
            { organizationId: "organization-a", organizationName: "Alpha" },
            { organizationId: "organization-b", organizationName: "Zeta" },
        ]);
        expect(membershipsQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
        expect(membershipsQuery.eq).toHaveBeenCalledWith("status", "invited");
        expect(organizationsQuery.in).toHaveBeenCalledWith(
            "id",
            ["organization-b", "organization-a"],
        );
    });

    it("does not query organizations when the user has no pending invitation", async () => {
        const membershipsQuery = createQuery({ data: [], error: null });
        const client = { from: vi.fn().mockReturnValue(membershipsQuery) };

        mocks.createAdminClient.mockReturnValue(client);

        await expect(listUserPendingOrganizationInvitations("user-1")).resolves.toEqual([]);
        expect(client.from).toHaveBeenCalledTimes(1);
    });
});
