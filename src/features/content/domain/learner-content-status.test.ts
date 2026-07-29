import { describe, expect, it } from "vitest";
import {
    LEARNER_CONTENT_STATUS,
    LEARNER_CONTENT_STATUS_FILTER,
    buildLearnerContentProgressById,
    matchesLearnerContentStatusFilter,
    resolveLearnerContentStatus,
} from "./learner-content-status";

describe("resolveLearnerContentStatus", () => {
    it("keeps content to do until a completed attempt exists", () => {
        expect(
            resolveLearnerContentStatus({
                bestScore: 95,
                hasCompleted: false,
                validationThreshold: 80,
            }),
        ).toBe(LEARNER_CONTENT_STATUS.todo);
    });

    it("marks completed content without a score as completed", () => {
        expect(
            resolveLearnerContentStatus({
                bestScore: null,
                hasCompleted: true,
                validationThreshold: 80,
            }),
        ).toBe(LEARNER_CONTENT_STATUS.completed);
    });

    it("uses the supplied threshold instead of embedding a global value", () => {
        expect(
            resolveLearnerContentStatus({
                bestScore: 75,
                hasCompleted: true,
                validationThreshold: 70,
            }),
        ).toBe(LEARNER_CONTENT_STATUS.validated);
        expect(
            resolveLearnerContentStatus({
                bestScore: 75,
                hasCompleted: true,
                validationThreshold: 80,
            }),
        ).toBe(LEARNER_CONTENT_STATUS.retry);
    });
});

describe("matchesLearnerContentStatusFilter", () => {
    it("treats the completed filter as every completed status", () => {
        expect(
            matchesLearnerContentStatusFilter(
                LEARNER_CONTENT_STATUS.completed,
                LEARNER_CONTENT_STATUS_FILTER.completed,
            ),
        ).toBe(true);
        expect(
            matchesLearnerContentStatusFilter(
                LEARNER_CONTENT_STATUS.validated,
                LEARNER_CONTENT_STATUS_FILTER.completed,
            ),
        ).toBe(true);
        expect(
            matchesLearnerContentStatusFilter(
                LEARNER_CONTENT_STATUS.retry,
                LEARNER_CONTENT_STATUS_FILTER.completed,
            ),
        ).toBe(true);
        expect(
            matchesLearnerContentStatusFilter(
                LEARNER_CONTENT_STATUS.todo,
                LEARNER_CONTENT_STATUS_FILTER.completed,
            ),
        ).toBe(false);
    });

    it("keeps the other filters mutually exclusive", () => {
        expect(
            matchesLearnerContentStatusFilter(
                LEARNER_CONTENT_STATUS.retry,
                LEARNER_CONTENT_STATUS_FILTER.retry,
            ),
        ).toBe(true);
        expect(
            matchesLearnerContentStatusFilter(
                LEARNER_CONTENT_STATUS.validated,
                LEARNER_CONTENT_STATUS_FILTER.retry,
            ),
        ).toBe(false);
    });
});

describe("buildLearnerContentProgressById", () => {
    it("uses the best historical score and each content threshold", () => {
        const progress = buildLearnerContentProgressById(
            [
                { id: "roleplay-1", validationThreshold: 80 },
                { id: "quiz-1", validationThreshold: 70 },
            ],
            [
                { contentId: "roleplay-1", score: 45 },
                { contentId: "roleplay-1", score: 85 },
                { contentId: "quiz-1", score: 72 },
            ],
        );

        expect(progress.get("roleplay-1")).toEqual({
            bestScore: 85,
            completedCount: 2,
            status: LEARNER_CONTENT_STATUS.validated,
        });
        expect(progress.get("quiz-1")?.status).toBe(LEARNER_CONTENT_STATUS.validated);
    });

    it("distinguishes missing scores from missing completed attempts", () => {
        const progress = buildLearnerContentProgressById(
            [
                { id: "completed", validationThreshold: 80 },
                { id: "todo", validationThreshold: 80 },
            ],
            [{ contentId: "completed", score: null }],
        );

        expect(progress.get("completed")?.status).toBe(LEARNER_CONTENT_STATUS.completed);
        expect(progress.get("todo")?.status).toBe(LEARNER_CONTENT_STATUS.todo);
    });
});
