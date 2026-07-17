import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    assignRoleplayToUser: vi.fn(),
    listAssignableRoleplays: vi.fn(),
    listUserAssignedQuizzes: vi.fn(),
    listUserAssignedRoleplays: vi.fn(),
    removeRoleplayUserAssignment: vi.fn(),
}));

vi.mock("@/features/users/server", () => mocks);

import { DELETE, GET, POST } from "./route";

const userId = "11111111-1111-4111-8111-111111111111";
const contentId = "22222222-2222-4222-8222-222222222222";

function context(id = userId) {
    return { params: Promise.resolve({ userId: id }) };
}

function request(method: "DELETE" | "GET" | "POST", body?: Record<string, unknown>) {
    return new NextRequest("http://localhost/api/users/test/assignments/roleplays", {
        body: body ? JSON.stringify(body) : undefined,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        method,
    });
}

describe("user roleplay assignment route", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.listAssignableRoleplays.mockResolvedValue([]);
        mocks.listUserAssignedQuizzes.mockResolvedValue([]);
        mocks.listUserAssignedRoleplays.mockResolvedValue([]);
    });

    it("validates the user UUID before listing candidates", async () => {
        const response = await GET(request("GET"), context("invalid"));

        expect(response.status).toBe(400);
        expect(mocks.listAssignableRoleplays).not.toHaveBeenCalled();
    });

    it("assigns a validated published roleplay and returns refreshed data", async () => {
        const response = await POST(request("POST", { contentId }), context());

        expect(response.status).toBe(201);
        expect(mocks.assignRoleplayToUser).toHaveBeenCalledWith(userId, { contentId });
        expect(mocks.listUserAssignedRoleplays).toHaveBeenCalledWith(userId);
        expect(mocks.listUserAssignedQuizzes).toHaveBeenCalledWith(userId);
    });

    it("removes only the explicit roleplay assignment", async () => {
        const response = await DELETE(request("DELETE", { contentId }), context());

        expect(response.status).toBe(200);
        expect(mocks.removeRoleplayUserAssignment).toHaveBeenCalledWith(userId, { contentId });
    });
});
