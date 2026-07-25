import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/lib/server/errors";

const mocks = vi.hoisted(() => ({
    resendOrganizationInvitation: vi.fn(),
}));

vi.mock("@/features/organizations/server", () => mocks);

import { POST } from "./route";

const organizationId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const context = {
    params: Promise.resolve({ organizationId, userId }),
};

describe("POST /api/organizations/[organizationId]/users/[userId]/resend-invitation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("builds the invitation recovery callback and delegates to the use case", async () => {
        mocks.resendOrganizationInvitation.mockResolvedValue({
            email: "learner@example.com",
            invitationSentAt: "2026-07-24T12:00:00.000Z",
            organizationId,
            userId,
        });

        const response = await POST(
            new NextRequest(
                `https://app.maiacoach.fr/api/organizations/${organizationId}/users/${userId}/resend-invitation`,
                { method: "POST" },
            ),
            context,
        );

        expect(mocks.resendOrganizationInvitation).toHaveBeenCalledOnce();
        const [receivedOrganizationId, receivedUserId, redirectTo] =
            mocks.resendOrganizationInvitation.mock.calls[0];
        const redirectUrl = new URL(redirectTo);

        expect(receivedOrganizationId).toBe(organizationId);
        expect(receivedUserId).toBe(userId);
        expect(redirectUrl.origin).toBe("https://app.maiacoach.fr");
        expect(redirectUrl.pathname).toBe("/auth/callback");
        expect(redirectUrl.searchParams.get("flow")).toBe("recovery");
        expect(redirectUrl.searchParams.get("purpose")).toBe("invitation");
        expect(redirectUrl.searchParams.get("organization_id")).toBe(organizationId);
        expect(response.status).toBe(200);
    });

    it("returns a conflict when the membership is no longer invited", async () => {
        mocks.resendOrganizationInvitation.mockRejectedValue(
            new ConflictError("L’utilisateur est déjà actif."),
        );

        const response = await POST(
            new NextRequest(
                `https://app.maiacoach.fr/api/organizations/${organizationId}/users/${userId}/resend-invitation`,
                { method: "POST" },
            ),
            context,
        );

        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({
            code: "CONFLICT",
            error: "L’utilisateur est déjà actif.",
        });
    });

    it("rejects malformed path identifiers before calling the use case", async () => {
        const response = await POST(
            new NextRequest(
                "https://app.maiacoach.fr/api/organizations/invalid/users/invalid/resend-invitation",
                { method: "POST" },
            ),
            {
                params: Promise.resolve({
                    organizationId: "invalid",
                    userId: "invalid",
                }),
            },
        );

        expect(response.status).toBe(400);
        expect(mocks.resendOrganizationInvitation).not.toHaveBeenCalled();
    });
});
