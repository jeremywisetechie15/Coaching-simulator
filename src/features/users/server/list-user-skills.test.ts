import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildQuizSkillCriteria } from "@/features/evaluations/server/quiz-skill-criteria";
import { MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS } from "@/features/roleplays/domain";
import { buildUserSkillProgresses, listUserSkillProgresses } from "./list-user-skills";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    fetchCompletedQuizSkillCriteria: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/features/evaluations/server/quiz-skill-criteria", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/features/evaluations/server/quiz-skill-criteria")>()),
    fetchCompletedQuizSkillCriteria: mocks.fetchCompletedQuizSkillCriteria,
}));

beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    mocks.fetchCompletedQuizSkillCriteria.mockResolvedValue([]);
});

describe("listUserSkillProgresses", () => {
    it("excludes roleplay sessions below the shared minimum evaluation duration", async () => {
        const returns = vi.fn().mockResolvedValue({ data: [], error: null });
        const gte = vi.fn().mockReturnValue({ returns });
        const eq = vi.fn().mockReturnValue({ gte });
        const select = vi.fn().mockReturnValue({ eq });
        const from = vi.fn().mockReturnValue({ select });
        mocks.createAdminClient.mockReturnValue({ from });

        await expect(listUserSkillProgresses("user-1")).resolves.toEqual([]);

        expect(from).toHaveBeenCalledWith("roleplay_session_criterion_results");
        expect(select).toHaveBeenCalledWith(expect.stringContaining("sessions!inner(duration_seconds)"));
        expect(eq).toHaveBeenCalledWith("user_id", "user-1");
        expect(gte).toHaveBeenCalledWith(
            "sessions.duration_seconds",
            MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
        );
    });
});

describe("buildUserSkillProgresses", () => {
    it("aggregates user progression by skill, dimension, and item", () => {
        const skills = buildUserSkillProgresses({
            criteria: [
                {
                    dimension: "savoir",
                    dimension_item_id: "item-savoir",
                    points_awarded: 8,
                    points_max: 10,
                    score_percent: null,
                    skill_id: "skill-1",
                },
                {
                    dimension: "savoir_faire",
                    dimension_item_id: "item-faire",
                    points_awarded: 3,
                    points_max: 5,
                    score_percent: null,
                    skill_id: "skill-1",
                },
            ],
            dimensionItems: [
                {
                    dimension: "savoir",
                    id: "item-savoir",
                    item_order: 1,
                    label: "Connaitre les etapes",
                    skill_id: "skill-1",
                },
                {
                    dimension: "savoir_faire",
                    id: "item-faire",
                    item_order: 1,
                    label: "Appliquer la methode",
                    skill_id: "skill-1",
                },
                {
                    dimension: "savoir_etre",
                    id: "item-etre",
                    item_order: 1,
                    label: "Adapter sa posture",
                    skill_id: "skill-1",
                },
            ],
            skillNamesById: new Map([["skill-1", "Prise de rendez-vous"]]),
        });

        expect(skills).toEqual([
            {
                delta: 0,
                dimensions: [
                    { itemCount: 1, key: "savoir", label: "Savoir", score: 80 },
                    { itemCount: 1, key: "savoir_faire", label: "Savoir-faire", score: 60 },
                    { itemCount: 1, key: "savoir_etre", label: "Savoir-être", score: null },
                ],
                id: "skill-1",
                initialScore: 73,
                items: [
                    { dimension: "savoir", id: "item-savoir", label: "Connaitre les etapes", score: 80 },
                    { dimension: "savoir_faire", id: "item-faire", label: "Appliquer la methode", score: 60 },
                    { dimension: "savoir_etre", id: "item-etre", label: "Adapter sa posture", score: null },
                ],
                label: "Prise de rendez-vous",
                score: 73,
            },
        ]);
    });

    it("resolves the skill from the dimension item when criterion skill_id is missing", () => {
        const skills = buildUserSkillProgresses({
            criteria: [
                {
                    dimension: "savoir",
                    dimension_item_id: "item-savoir",
                    points_awarded: null,
                    points_max: null,
                    score_percent: 55,
                    skill_id: null,
                },
            ],
            dimensionItems: [
                {
                    dimension: "savoir",
                    id: "item-savoir",
                    item_order: 1,
                    label: "Identifier le decideur",
                    skill_id: "skill-2",
                },
            ],
            skillNamesById: new Map([["skill-2", "Acces au decideur"]]),
        });

        expect(skills[0]).toMatchObject({
            id: "skill-2",
            items: [{ dimension: "savoir", id: "item-savoir", label: "Identifier le decideur", score: 55 }],
            label: "Acces au decideur",
        });
        expect(skills[0]?.dimensions[0]).toEqual({
            itemCount: 1,
            key: "savoir",
            label: "Savoir",
            score: 55,
        });
    });

    it("keeps the best session score for progression", () => {
        const skills = buildUserSkillProgresses({
            criteria: [
                {
                    created_at: "2026-01-01T00:00:00.000Z",
                    dimension: "savoir",
                    dimension_item_id: "item-savoir",
                    points_awarded: 2,
                    points_max: 10,
                    score_percent: null,
                    session_id: "session-low",
                    skill_id: "skill-1",
                },
                {
                    created_at: "2026-01-02T00:00:00.000Z",
                    dimension: "savoir",
                    dimension_item_id: "item-savoir",
                    points_awarded: 9,
                    points_max: 10,
                    score_percent: null,
                    session_id: "session-high",
                    skill_id: "skill-1",
                },
            ],
            dimensionItems: [
                {
                    dimension: "savoir",
                    id: "item-savoir",
                    item_order: 1,
                    label: "Connaitre les etapes",
                    skill_id: "skill-1",
                },
            ],
            skillNamesById: new Map([["skill-1", "Prise de rendez-vous"]]),
        });

        expect(skills[0]?.initialScore).toBe(20);
        expect(skills[0]?.score).toBe(90);
        expect(skills[0]?.delta).toBe(70);
        expect(skills[0]?.dimensions[0]?.score).toBe(90);
        expect(skills[0]?.items[0]?.score).toBe(90);
    });

    it("converts completed quiz answers into savoir skill progression", () => {
        const quizCriteria = buildQuizSkillCriteria({
            answerChoices: [{ answer_id: "answer-1", choice_id: "choice-correct" }],
            answers: [{ attempt_id: "attempt-1", id: "answer-1", question_id: "question-1" }],
            attempts: [
                {
                    completed_at: "2026-01-03T00:00:00.000Z",
                    created_at: "2026-01-03T00:00:00.000Z",
                    id: "attempt-1",
                    quiz_id: "quiz-1",
                },
            ],
            choices: [
                { id: "choice-correct", is_correct: true, question_id: "question-1" },
                { id: "choice-wrong", is_correct: false, question_id: "question-1" },
            ],
            questions: [
                {
                    competence_id: "skill-1",
                    dimension: "savoir",
                    dimension_item_id: "item-savoir",
                    id: "question-1",
                    points: 2,
                    step_id: "step-1",
                },
            ],
            steps: [{ id: "step-1", method_step_id: null, quiz_id: "quiz-1" }],
        });
        const skills = buildUserSkillProgresses({
            criteria: quizCriteria.map((criterion) => ({
                created_at: criterion.createdAt,
                dimension: criterion.dimension,
                dimension_item_id: criterion.dimensionItemId,
                points_awarded: criterion.pointsAwarded,
                points_max: criterion.pointsMax,
                score_percent: criterion.scorePercent,
                session_id: criterion.sourceId,
                skill_id: criterion.skillId,
            })),
            dimensionItems: [
                {
                    dimension: "savoir",
                    id: "item-savoir",
                    item_order: 1,
                    label: "Connaitre les etapes",
                    skill_id: "skill-1",
                },
            ],
            skillNamesById: new Map([["skill-1", "Prise de rendez-vous"]]),
        });

        expect(skills[0]?.dimensions).toContainEqual({
            itemCount: 1,
            key: "savoir",
            label: "Savoir",
            score: 100,
        });
        expect(skills[0]?.items[0]).toEqual({
            dimension: "savoir",
            id: "item-savoir",
            label: "Connaitre les etapes",
            score: 100,
        });
    });
});
