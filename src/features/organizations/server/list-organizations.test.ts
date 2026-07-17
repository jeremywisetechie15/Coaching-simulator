import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    listOrganizationContentScope: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("./list-organization-content-scope", () => ({
    listOrganizationContentScope: mocks.listOrganizationContentScope,
}));

import { listOrganizations } from "./list-organizations";

function createOrganizationsClient() {
    const query = {
        order: vi.fn(),
        returns: vi.fn(),
        select: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.returns.mockResolvedValue({
        data: [
            {
                created_at: "2026-07-17T08:00:00.000Z",
                id: "organization-a",
                name: "Organisation A",
                status: "active",
            },
        ],
        error: null,
    });

    return {
        client: { from: vi.fn().mockReturnValue(query) },
        query,
    };
}

describe("listOrganizations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    });

    it("maps the shared organization scope counters instead of fallback zeros", async () => {
        const { client } = createOrganizationsClient();
        mocks.createAdminClient.mockReturnValue(client);
        mocks.listOrganizationContentScope.mockResolvedValue({
            countsByOrganizationId: new Map([
                ["organization-a", { groupCount: 2, quizCount: 4, roleplayCount: 7, userCount: 12 }],
            ]),
        });

        await expect(listOrganizations()).resolves.toEqual([
            expect.objectContaining({
                groupCount: 2,
                id: "organization-a",
                quizCount: 4,
                roleplayCount: 7,
                userCount: 12,
            }),
        ]);

        expect(mocks.requireAdmin).toHaveBeenCalledOnce();
        expect(mocks.listOrganizationContentScope).toHaveBeenCalledWith(client, ["organization-a"]);
    });
});
