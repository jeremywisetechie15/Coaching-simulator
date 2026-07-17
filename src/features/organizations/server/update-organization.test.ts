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

import { updateOrganization } from "./update-organization";

function createUpdateClient() {
    const query = {
        eq: vi.fn(),
        maybeSingle: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
    };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({
        data: {
            contact_email: "contact@example.com",
            created_at: "2026-07-17T08:00:00.000Z",
            id: "organization-a",
            industry: "Conseil",
            name: "Organisation mise à jour",
            phone: "+33123456789",
            region: "Île-de-France",
            status: "active",
        },
        error: null,
    });

    return {
        client: { from: vi.fn().mockReturnValue(query) },
        query,
    };
}

describe("updateOrganization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    });

    it("returns the existing counters after updating organization fields", async () => {
        const { client } = createUpdateClient();
        mocks.createAdminClient.mockReturnValue(client);
        mocks.listOrganizationContentScope.mockResolvedValue({
            countsByOrganizationId: new Map([
                ["organization-a", { groupCount: 3, quizCount: 5, roleplayCount: 8, userCount: 21 }],
            ]),
        });

        await expect(updateOrganization("organization-a", {
            contactEmail: "contact@example.com",
            industry: "Conseil",
            name: "Organisation mise à jour",
            phone: "+33123456789",
            region: "Île-de-France",
            status: "active",
        })).resolves.toEqual(expect.objectContaining({
            groupCount: 3,
            id: "organization-a",
            name: "Organisation mise à jour",
            programCount: 8,
            userCount: 21,
        }));

        expect(mocks.listOrganizationContentScope).toHaveBeenCalledWith(client, ["organization-a"]);
    });

    it("does not access Supabase when the actor is not an admin", async () => {
        mocks.requireAdmin.mockRejectedValueOnce(new Error("forbidden"));

        await expect(updateOrganization("organization-a", {
            contactEmail: "",
            industry: "",
            name: "Organisation",
            phone: "",
            region: "",
            status: "active",
        })).rejects.toThrow("forbidden");

        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });
});
