import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    verifyOtp: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: mocks.createClient,
}));

import { GET } from "./route";

function request(search: string) {
    return new NextRequest(`https://app.maiacoach.fr/auth/callback?${search}`);
}

describe("GET /auth/callback", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createClient.mockResolvedValue({
            auth: {
                exchangeCodeForSession: mocks.exchangeCodeForSession,
                verifyOtp: mocks.verifyOtp,
            },
        });
        mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
        mocks.verifyOtp.mockResolvedValue({ error: null });
    });

    it("exchanges a recovery token hash without depending on the requesting device", async () => {
        const response = await GET(request(
            "flow=recovery&token_hash=secure-token&type=recovery&redirect=%2Fevaluations",
        ));

        expect(mocks.verifyOtp).toHaveBeenCalledWith({
            token_hash: "secure-token",
            type: "recovery",
        });
        expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
        expect(response.headers.get("location")).toBe(
            "https://app.maiacoach.fr/auth/reset-password?redirect=%2Fevaluations&status=recovery",
        );
        expect(response.headers.get("location")).not.toContain("secure-token");
        expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
        expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    });

    it("keeps accepting previously sent PKCE recovery links", async () => {
        const response = await GET(request("flow=recovery&code=pkce-code"));

        expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
        expect(mocks.verifyOtp).not.toHaveBeenCalled();
        expect(response.headers.get("location")).toBe(
            "https://app.maiacoach.fr/auth/reset-password?status=recovery",
        );
        expect(response.headers.get("location")).not.toContain("pkce-code");
    });

    it("rejects a token hash for any non-recovery email action", async () => {
        const response = await GET(request(
            "token_hash=secure-token&type=invite&code=pkce-code&flow=recovery",
        ));

        expect(mocks.createClient).not.toHaveBeenCalled();
        expect(response.headers.get("location")).toBe(
            "https://app.maiacoach.fr/auth/reset-password?status=invalid",
        );
    });

    it("returns an invalid state when Supabase rejects the token hash", async () => {
        mocks.verifyOtp.mockResolvedValueOnce({ error: new Error("expired") });

        const response = await GET(request("token_hash=expired-token&type=recovery"));

        expect(response.headers.get("location")).toBe(
            "https://app.maiacoach.fr/auth/reset-password?status=invalid",
        );
    });

    it("returns an invalid state when Supabase rejects an old PKCE code", async () => {
        mocks.exchangeCodeForSession.mockResolvedValueOnce({ error: new Error("expired") });

        const response = await GET(request("code=expired-code&flow=recovery"));

        expect(response.headers.get("location")).toBe(
            "https://app.maiacoach.fr/auth/reset-password?status=invalid",
        );
    });

    it("rejects a callback without a recovery credential", async () => {
        const response = await GET(request("flow=recovery"));

        expect(mocks.createClient).not.toHaveBeenCalled();
        expect(response.headers.get("location")).toBe(
            "https://app.maiacoach.fr/auth/reset-password?status=invalid",
        );
    });

    it.each([
        "type=recovery&code=pkce-code&flow=recovery",
        "token_hash=&type=recovery&code=pkce-code&flow=recovery",
        "token_hash=secure-token",
    ])("rejects incomplete token-hash parameters without a PKCE fallback: %s", async (search) => {
        const response = await GET(request(search));

        expect(mocks.createClient).not.toHaveBeenCalled();
        expect(response.headers.get("location")).toBe(
            "https://app.maiacoach.fr/auth/reset-password?status=invalid",
        );
    });

    it("does not propagate an external post-reset redirect", async () => {
        const response = await GET(request(
            "token_hash=secure-token&type=recovery&redirect=https%3A%2F%2Fmalicious.example",
        ));

        expect(response.headers.get("location")).toBe(
            "https://app.maiacoach.fr/auth/reset-password?status=recovery",
        );
    });
});
