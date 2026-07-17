import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ORGANIZATION_MEMBERS_REMOVAL_MESSAGE } from "@/features/organizations/domain/organization-deletion";
import { ConflictError } from "@/lib/server/errors";

const mocks = vi.hoisted(() => ({
    removeOrganization: vi.fn(),
    updateOrganization: vi.fn(),
}));

vi.mock("@/features/organizations/server", () => mocks);

import { DELETE } from "./route";

describe("DELETE /api/organizations/[organizationId]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns a clear conflict when organization members must be removed first", async () => {
        mocks.removeOrganization.mockRejectedValueOnce(
            new ConflictError(ORGANIZATION_MEMBERS_REMOVAL_MESSAGE),
        );

        const response = await DELETE(
            new NextRequest("http://localhost/api/organizations/organization-1", { method: "DELETE" }),
            { params: Promise.resolve({ organizationId: "organization-1" }) },
        );

        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({
            code: "CONFLICT",
            error: ORGANIZATION_MEMBERS_REMOVAL_MESSAGE,
        });
    });
});
