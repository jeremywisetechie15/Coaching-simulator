import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserDashboard } = vi.hoisted(() => ({
    getCurrentUserDashboard: vi.fn(),
}));

vi.mock("@/features/dashboard/server", () => ({
    getCurrentUserDashboard,
}));

import { GET } from "./route";

describe("GET /api/dashboard", () => {
    beforeEach(() => {
        getCurrentUserDashboard.mockReset();
    });

    it("loads the selected period for the authenticated user service", async () => {
        getCurrentUserDashboard.mockResolvedValue({ periodDays: 7 });

        const response = await GET(new NextRequest("http://localhost/api/dashboard?period=7"));

        expect(response.status).toBe(200);
        expect(getCurrentUserDashboard).toHaveBeenCalledWith(7);
        await expect(response.json()).resolves.toEqual({ dashboard: { periodDays: 7 } });
    });

    it("rejects unsupported periods before querying Supabase", async () => {
        const response = await GET(new NextRequest("http://localhost/api/dashboard?period=365"));

        expect(response.status).toBe(400);
        expect(getCurrentUserDashboard).not.toHaveBeenCalled();
    });
});
