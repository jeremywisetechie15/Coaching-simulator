import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/lib/server/errors";

const mocks = vi.hoisted(() => ({
    archiveQuiz: vi.fn(),
    getQuizById: vi.fn(),
    parseSaveQuizRequest: vi.fn(),
    revalidateQuizConsumers: vi.fn(),
    updateQuiz: vi.fn(),
}));

vi.mock("@/features/evaluations/server", () => mocks);

import { PATCH } from "./route";

describe("PATCH /api/quizzes/[quizId]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.parseSaveQuizRequest.mockResolvedValue({
            input: { title: "Nouveau titre du quiz" },
            uploadFilesByClientId: new Map(),
        });
        mocks.updateQuiz.mockResolvedValue({
            id: "quiz-1",
            title: "Nouveau titre du quiz",
        });
    });

    it("invalidates every quiz title consumer after a successful rename", async () => {
        const response = await PATCH(
            new NextRequest("http://localhost/api/quizzes/quiz-1", { method: "PATCH" }),
            { params: Promise.resolve({ quizId: "quiz-1" }) },
        );

        expect(mocks.updateQuiz).toHaveBeenCalledWith(
            "quiz-1",
            { title: "Nouveau titre du quiz" },
            expect.any(Map),
        );
        expect(mocks.revalidateQuizConsumers).toHaveBeenCalledOnce();
        await expect(response.json()).resolves.toEqual({
            quiz: { id: "quiz-1", title: "Nouveau titre du quiz" },
        });
    });

    it("keeps cached pages intact when the rename fails", async () => {
        mocks.updateQuiz.mockRejectedValueOnce(new ConflictError("Modification refusée."));

        const response = await PATCH(
            new NextRequest("http://localhost/api/quizzes/quiz-1", { method: "PATCH" }),
            { params: Promise.resolve({ quizId: "quiz-1" }) },
        );

        expect(response.status).toBe(409);
        expect(mocks.revalidateQuizConsumers).not.toHaveBeenCalled();
    });
});
