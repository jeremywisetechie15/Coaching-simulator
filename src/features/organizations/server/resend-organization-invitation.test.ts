import { beforeEach, describe, expect, it, vi } from "vitest";
import { ORGANIZATION_INVITATION_RESEND_MESSAGES } from "@/features/organizations/domain/organization-invitation";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { resendOrganizationInvitation } from "./resend-organization-invitation";

interface QueryResult {
    data: unknown;
    error: unknown;
}

function createQuery(result: QueryResult) {
    const query = {
        eq: vi.fn(),
        is: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue(result),
        select: vi.fn(),
        then: (
            resolve: (value: QueryResult) => unknown,
            reject?: (reason: unknown) => unknown,
        ) => Promise.resolve(result).then(resolve, reject),
        update: vi.fn(),
    };

    query.eq.mockReturnValue(query);
    query.is.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.update.mockReturnValue(query);

    return query;
}

function createClient({
    authEmail = "learner@example.com",
    authError = null,
    membership = {
        invitation_sent_at: "2026-07-20T10:00:00.000Z",
        status: "invited",
    },
    membershipError = null,
    reservation = {
        invitation_sent_at: "2026-07-24T12:00:00.000Z",
        status: "invited",
    },
    reservationError = null,
    sendError = null,
}: {
    authEmail?: string | null;
    authError?: unknown;
    membership?: unknown;
    membershipError?: unknown;
    reservation?: unknown;
    reservationError?: unknown;
    sendError?: unknown;
} = {}) {
    const membershipQuery = createQuery({ data: membership, error: membershipError });
    const reservationQuery = createQuery({ data: reservation, error: reservationError });
    const rollbackQuery = createQuery({ data: null, error: null });
    const from = vi.fn()
        .mockReturnValueOnce(membershipQuery)
        .mockReturnValueOnce(reservationQuery)
        .mockReturnValueOnce(rollbackQuery);
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: sendError });
    const getUserById = vi.fn().mockResolvedValue({
        data: {
            user: authEmail === null ? null : { email: authEmail },
        },
        error: authError,
    });

    return {
        client: {
            auth: {
                admin: { getUserById },
                resetPasswordForEmail,
            },
            from,
        },
        from,
        getUserById,
        membershipQuery,
        reservationQuery,
        resetPasswordForEmail,
        rollbackQuery,
    };
}

describe("resendOrganizationInvitation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    });

    it("reserves the send and emails a recovery link to the Auth address", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-07-24T12:00:00.000Z"));
        const testClient = createClient();
        mocks.createAdminClient.mockReturnValue(testClient.client);

        await expect(resendOrganizationInvitation(
            "organization-1",
            "user-1",
            "https://app.maiacoach.fr/auth/callback?flow=recovery",
        )).resolves.toEqual({
            email: "learner@example.com",
            invitationSentAt: "2026-07-24T12:00:00.000Z",
            organizationId: "organization-1",
            userId: "user-1",
        });

        expect(testClient.getUserById).toHaveBeenCalledWith("user-1");
        expect(testClient.reservationQuery.update).toHaveBeenCalledWith({
            invitation_sent_at: "2026-07-24T12:00:00.000Z",
        });
        expect(testClient.resetPasswordForEmail).toHaveBeenCalledWith(
            "learner@example.com",
            {
                redirectTo: "https://app.maiacoach.fr/auth/callback?flow=recovery",
            },
        );
        expect(testClient.rollbackQuery.update).not.toHaveBeenCalled();
    });

    it("does not expose the operation before the admin check", async () => {
        mocks.requireAdmin.mockRejectedValueOnce(new Error("forbidden"));

        await expect(resendOrganizationInvitation(
            "organization-1",
            "user-1",
            "https://app.maiacoach.fr/auth/callback?flow=recovery",
        )).rejects.toThrow("forbidden");

        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });

    it("rejects a resend when the membership is already active", async () => {
        const testClient = createClient({
            membership: {
                invitation_sent_at: "2026-07-20T10:00:00.000Z",
                status: "active",
            },
        });
        mocks.createAdminClient.mockReturnValue(testClient.client);

        await expect(resendOrganizationInvitation(
            "organization-1",
            "user-1",
            "https://app.maiacoach.fr/auth/callback?flow=recovery",
        )).rejects.toMatchObject({
            message: ORGANIZATION_INVITATION_RESEND_MESSAGES.conflict,
            status: 409,
        });

        expect(testClient.getUserById).not.toHaveBeenCalled();
        expect(testClient.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it("rejects a resend during the one-minute cooldown", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-07-24T12:00:30.000Z"));
        const testClient = createClient({
            membership: {
                invitation_sent_at: "2026-07-24T12:00:00.000Z",
                status: "invited",
            },
        });
        mocks.createAdminClient.mockReturnValue(testClient.client);

        await expect(resendOrganizationInvitation(
            "organization-1",
            "user-1",
            "https://app.maiacoach.fr/auth/callback?flow=recovery",
        )).rejects.toMatchObject({
            code: "INVITATION_RESEND_RATE_LIMITED",
            status: 429,
        });

        expect(testClient.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it("uses the Auth email rather than a client-provided address", async () => {
        const testClient = createClient({ authEmail: null });
        mocks.createAdminClient.mockReturnValue(testClient.client);

        await expect(resendOrganizationInvitation(
            "organization-1",
            "user-1",
            "https://app.maiacoach.fr/auth/callback?flow=recovery",
        )).rejects.toMatchObject({
            message: ORGANIZATION_INVITATION_RESEND_MESSAGES.emailMissing,
            status: 409,
        });

        expect(testClient.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it("releases its reservation when Supabase refuses the email send", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-07-24T12:00:00.000Z"));
        const testClient = createClient({ sendError: { status: 429 } });
        mocks.createAdminClient.mockReturnValue(testClient.client);

        await expect(resendOrganizationInvitation(
            "organization-1",
            "user-1",
            "https://app.maiacoach.fr/auth/callback?flow=recovery",
        )).rejects.toMatchObject({
            code: "INVITATION_RESEND_RATE_LIMITED",
            status: 429,
        });

        expect(testClient.rollbackQuery.update).toHaveBeenCalledWith({
            invitation_sent_at: "2026-07-20T10:00:00.000Z",
        });
        expect(testClient.rollbackQuery.eq).toHaveBeenCalledWith(
            "invitation_sent_at",
            "2026-07-24T12:00:00.000Z",
        );
    });
});
