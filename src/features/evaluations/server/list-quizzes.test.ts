import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { listQuizzes } from "./list-quizzes";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    fetchQuizList: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("./quiz-query", () => ({ fetchQuizList: mocks.fetchQuizList }));

describe("listQuizzes", () => {
    const supabase = { name: "authenticated-client" };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createClient.mockResolvedValue(supabase);
        mocks.fetchQuizList.mockResolvedValue([]);
    });

    it("lets administrators list every publication status", async () => {
        mocks.requireAuth.mockResolvedValue({ platformRole: "admin", userId: "admin-1" });

        await listQuizzes();

        expect(mocks.fetchQuizList).toHaveBeenCalledWith(supabase, "admin-1", {});
    });

    it("explicitly restricts learners to published quizzes", async () => {
        mocks.requireAuth.mockResolvedValue({ platformRole: "user", userId: "learner-1" });

        await listQuizzes();

        expect(mocks.fetchQuizList).toHaveBeenCalledWith(
            supabase,
            "learner-1",
            { status: CONTENT_STATUS.published },
        );
    });
});
