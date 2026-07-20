import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getCurrentUserContext: vi.fn(),
}));

vi.mock("./get-current-user-context", () => ({
    getCurrentUserContext: mocks.getCurrentUserContext,
}));

import { requirePlatformUser } from "./require-auth";

const context = {
    activeOrganizationId: null,
    activeOrganizationRole: null,
    email: "learner@example.com",
    memberships: [],
    platformRole: "user" as const,
    userId: "learner-1",
};

describe("requirePlatformUser", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns the authenticated learner context", async () => {
        mocks.getCurrentUserContext.mockResolvedValue(context);

        await expect(requirePlatformUser()).resolves.toEqual(context);
    });

    it("rejects a platform admin", async () => {
        mocks.getCurrentUserContext.mockResolvedValue({
            ...context,
            platformRole: "admin",
        });

        await expect(requirePlatformUser()).rejects.toMatchObject({
            code: "FORBIDDEN",
            message: "Accès utilisateur requis.",
            status: 403,
        });
    });
});
