import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: mocks.revalidatePath,
}));

import { revalidateQuizConsumers } from "./revalidate-quiz-consumers";

describe("revalidateQuizConsumers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("invalidates every page that can display quiz data", () => {
        revalidateQuizConsumers();

        expect(mocks.revalidatePath).toHaveBeenCalledOnce();
        expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    });
});
