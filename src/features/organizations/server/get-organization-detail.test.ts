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

import { getOrganizationDetail } from "./get-organization-detail";

function createOrganizationDetailClient() {
    const query = {
        eq: vi.fn(),
        maybeSingle: vi.fn(),
        select: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({
        data: {
            contact_email: "contact@example.com",
            created_at: "2026-07-17T08:00:00.000Z",
            id: "organization-a",
            industry: "Conseil",
            name: "Organisation A",
            phone: "+33123456789",
            region: "Île-de-France",
            status: "active",
        },
        error: null,
    });

    return { client: { from: vi.fn().mockReturnValue(query) } };
}

describe("getOrganizationDetail", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    });

    it("uses the shared organization scope counters", async () => {
        const { client } = createOrganizationDetailClient();
        mocks.createAdminClient.mockReturnValue(client);
        mocks.listOrganizationContentScope.mockResolvedValue({
            countsByOrganizationId: new Map([
                ["organization-a", { groupCount: 2, quizCount: 4, roleplayCount: 7, userCount: 12 }],
            ]),
        });

        await expect(getOrganizationDetail("organization-a")).resolves.toEqual(
            expect.objectContaining({
                groupCount: 2,
                id: "organization-a",
                programCount: 7,
                userCount: 12,
            }),
        );

        expect(mocks.listOrganizationContentScope).toHaveBeenCalledWith(client, ["organization-a"]);
    });
});
