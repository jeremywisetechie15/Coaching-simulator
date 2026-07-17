import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ORGANIZATION_USER_REMOVAL_HISTORY_MESSAGE } from "@/features/organizations/domain/organization-user-removal";
import { ConflictError, NotFoundError } from "@/lib/server/errors";

const mocks = vi.hoisted(() => ({
    removeOrganizationUser: vi.fn(),
}));

vi.mock("@/features/organizations/server", () => mocks);

import { DELETE } from "./route";

const context = {
    params: Promise.resolve({
        organizationId: "organization-1",
        userId: "user-1",
    }),
};

describe("DELETE /api/organizations/[organizationId]/users/[userId]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("removes only the organization membership", async () => {
        mocks.removeOrganizationUser.mockResolvedValue({
            organizationId: "organization-1",
            userId: "user-1",
        });

        const response = await DELETE(
            new NextRequest("http://localhost/api/organizations/organization-1/users/user-1", {
                method: "DELETE",
            }),
            context,
        );

        expect(mocks.removeOrganizationUser).toHaveBeenCalledWith("organization-1", "user-1");
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            membership: {
                organizationId: "organization-1",
                userId: "user-1",
            },
            success: true,
        });
    });

    it("returns the session-history conflict", async () => {
        mocks.removeOrganizationUser.mockRejectedValue(
            new ConflictError(ORGANIZATION_USER_REMOVAL_HISTORY_MESSAGE),
        );

        const response = await DELETE(
            new NextRequest("http://localhost/api/organizations/organization-1/users/user-1", {
                method: "DELETE",
            }),
            context,
        );

        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({
            code: "CONFLICT",
            error: ORGANIZATION_USER_REMOVAL_HISTORY_MESSAGE,
        });
    });

    it("returns not found when the membership does not exist", async () => {
        mocks.removeOrganizationUser.mockRejectedValue(
            new NotFoundError("Rattachement utilisateur introuvable."),
        );

        const response = await DELETE(
            new NextRequest("http://localhost/api/organizations/organization-1/users/user-1", {
                method: "DELETE",
            }),
            context,
        );

        expect(response.status).toBe(404);
        await expect(response.json()).resolves.toEqual({
            code: "NOT_FOUND",
            error: "Rattachement utilisateur introuvable.",
        });
    });
});
