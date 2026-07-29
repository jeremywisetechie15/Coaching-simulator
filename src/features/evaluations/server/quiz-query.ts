import type { SupabaseClient } from "@supabase/supabase-js";
import {
    LEARNER_CONTENT_STATUS,
    resolveLearnerContentStatus,
    type LearnerContentStatus,
} from "@/features/content/domain";
import {
    QUIZ_ATTEMPT_STATUS,
    QUIZ_DEFAULT_VALIDATION_THRESHOLD,
    buildQuizLearnerStats,
    type QuizAttemptStatus,
    type QuizDetail,
    type QuizLearnerStats,
    type QuizListItem,
} from "@/features/evaluations/domain/quiz";
import { NotFoundError } from "@/lib/server/errors";
import {
    mapQuizRowsToDetail,
    mapQuizRowToListItem,
    type QuizAttachmentRow,
    type QuizChoiceRow,
    type QuizQuestionRow,
    type QuizRow,
    type QuizStepCompetencyRow,
    type QuizStepRow,
} from "./quiz.mapper";
import {
    QUIZ_ATTACHMENT_SELECT,
    QUIZ_CHOICE_SELECT,
    QUIZ_QUESTION_SELECT,
    QUIZ_SELECT,
    QUIZ_STEP_COMPETENCY_SELECT,
    QUIZ_STEP_SELECT,
} from "./quiz.persistence";
import { fetchQuizQuestionCounts } from "./quiz-question-counts";

interface QuizAttemptProgressRow {
    attempt_number: number;
    quiz_id: string;
    score_percent: number | string | null;
    status: QuizAttemptStatus;
}

export interface QuizLearnerProgress {
    hasInProgress: boolean;
    stats: QuizLearnerStats;
    status: LearnerContentStatus;
}

function normalizeScore(value: number | string | null) {
    const score = typeof value === "string" ? Number(value) : value;
    if (typeof score !== "number" || !Number.isFinite(score)) return null;

    return Math.max(0, Math.min(100, score));
}

export async function fetchQuizLearnerProgress(
    supabase: SupabaseClient,
    quizzes: Array<Pick<QuizListItem, "id" | "validationThreshold">>,
    userId?: string | null,
) {
    if (!userId || quizzes.length === 0) {
        return new Map<string, QuizLearnerProgress>();
    }

    const { data, error } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, attempt_number, score_percent, status")
        .in("quiz_id", quizzes.map((quiz) => quiz.id))
        .eq("user_id", userId)
        .order("attempt_number", { ascending: false })
        .returns<QuizAttemptProgressRow[]>();

    if (error) throw error;

    const attemptsByQuizId = new Map<string, QuizAttemptProgressRow[]>();
    for (const attempt of data ?? []) {
        const current = attemptsByQuizId.get(attempt.quiz_id) ?? [];
        current.push(attempt);
        attemptsByQuizId.set(attempt.quiz_id, current);
    }

    return new Map<string, QuizLearnerProgress>(
        quizzes.map((quiz) => {
            const attempts = attemptsByQuizId.get(quiz.id) ?? [];
            const completedAttempts = attempts.filter(
                (attempt) => attempt.status === QUIZ_ATTEMPT_STATUS.completed,
            );
            const stats = buildQuizLearnerStats(
                completedAttempts.map((attempt) => ({
                    attemptNumber: attempt.attempt_number,
                    score: normalizeScore(attempt.score_percent),
                })),
            );

            return [
                quiz.id,
                {
                    hasInProgress: attempts.some(
                        (attempt) => attempt.status === QUIZ_ATTEMPT_STATUS.inProgress,
                    ),
                    stats,
                    status: resolveLearnerContentStatus({
                        bestScore: stats.bestScore,
                        hasCompleted: stats.attemptCount > 0,
                        validationThreshold:
                            quiz.validationThreshold ?? QUIZ_DEFAULT_VALIDATION_THRESHOLD,
                    }),
                },
            ];
        }),
    );
}

async function withQuizLearnerProgress<T extends QuizDetail>(
    supabase: SupabaseClient,
    quiz: T,
    userId?: string | null,
): Promise<T> {
    const progress = await fetchQuizLearnerProgress(supabase, [quiz], userId);
    const learnerProgress = progress.get(quiz.id);

    return {
        ...quiz,
        learnerStats: learnerProgress?.stats ?? quiz.learnerStats,
        learnerStatus: learnerProgress?.status ?? LEARNER_CONTENT_STATUS.todo,
    };
}

async function withMethodNames(supabase: SupabaseClient, rows: QuizRow[]) {
    const methodIds = Array.from(
        new Set(rows.map((row) => row.method_id).filter((id): id is string => Boolean(id))),
    );

    if (methodIds.length === 0) {
        return rows;
    }

    const { data, error } = await supabase
        .from("methods")
        .select("id, name")
        .in("id", methodIds);

    if (error) {
        throw error;
    }

    const methodNameById = new Map(
        ((data ?? []) as Array<{ id: string; name?: string | null }>).map((method) => [
            method.id,
            method.name ?? null,
        ]),
    );

    return rows.map((row) => ({
        ...row,
        method_name: row.method_id ? methodNameById.get(row.method_id) ?? null : null,
    }));
}

export async function fetchQuizList(
    supabase: SupabaseClient,
    userId?: string | null,
): Promise<QuizListItem[]> {
    const { data: rows, error } = await supabase
        .from("quizzes")
        .select(QUIZ_SELECT)
        .neq("status", "archived")
        .order("updated_at", { ascending: false });

    if (error) {
        throw error;
    }

    const quizRows = await withMethodNames(supabase, (rows ?? []) as QuizRow[]);
    const quizIds = quizRows.map((row) => row.id);
    const quizzes = quizRows.map((row) => mapQuizRowToListItem(row));
    const [questionCountByQuizId, learnerProgressByQuizId] = await Promise.all([
        fetchQuizQuestionCounts(supabase, quizIds),
        fetchQuizLearnerProgress(supabase, quizzes, userId),
    ]);

    return quizzes.map((quiz) => ({
        ...quiz,
        questionCount: questionCountByQuizId.get(quiz.id) ?? 0,
        learnerStats:
            learnerProgressByQuizId.get(quiz.id)?.stats ?? quiz.learnerStats,
        learnerStatus:
            learnerProgressByQuizId.get(quiz.id)?.status ?? LEARNER_CONTENT_STATUS.todo,
    }));
}

export async function fetchQuizDetail(
    supabase: SupabaseClient,
    quizId: string,
    userId?: string | null,
): Promise<QuizDetail> {
    const { data: row, error } = await supabase
        .from("quizzes")
        .select(QUIZ_SELECT)
        .eq("id", quizId)
        .maybeSingle<QuizRow>();

    if (error) {
        throw error;
    }

    if (!row) {
        throw new NotFoundError("Quiz introuvable.");
    }

    const [rowWithMethodName] = await withMethodNames(supabase, [row]);

    const { data: stepRows, error: stepsError } = await supabase
        .from("quiz_steps")
        .select(QUIZ_STEP_SELECT)
        .eq("quiz_id", quizId)
        .order("step_order", { ascending: true });

    if (stepsError) {
        throw stepsError;
    }

    const steps = (stepRows ?? []) as QuizStepRow[];
    const stepIds = steps.map((step) => step.id);

    if (stepIds.length === 0) {
        return withQuizLearnerProgress(
            supabase,
            mapQuizRowsToDetail(rowWithMethodName, [], [], [], [], []),
            userId,
        );
    }

    const [
        { data: competencyRows, error: competenciesError },
        { data: questionRows, error: questionsError },
    ] = await Promise.all([
        supabase
            .from("quiz_step_competencies")
            .select(QUIZ_STEP_COMPETENCY_SELECT)
            .in("step_id", stepIds),
        supabase
            .from("quiz_questions")
            .select(QUIZ_QUESTION_SELECT)
            .in("step_id", stepIds)
            .order("question_order", { ascending: true }),
    ]);

    if (competenciesError) {
        throw competenciesError;
    }

    if (questionsError) {
        throw questionsError;
    }

    const questions = (questionRows ?? []) as QuizQuestionRow[];
    const questionIds = questions.map((question) => question.id);

    if (questionIds.length === 0) {
        return withQuizLearnerProgress(
            supabase,
            mapQuizRowsToDetail(
                rowWithMethodName,
                steps,
                (competencyRows ?? []) as QuizStepCompetencyRow[],
                [],
                [],
                [],
            ),
            userId,
        );
    }

    const [
        { data: choiceRows, error: choicesError },
        { data: attachmentRows, error: attachmentsError },
    ] = await Promise.all([
        supabase
            .from("quiz_question_choices")
            .select(QUIZ_CHOICE_SELECT)
            .in("question_id", questionIds)
            .order("choice_order", { ascending: true }),
        supabase
            .from("quiz_question_attachments")
            .select(QUIZ_ATTACHMENT_SELECT)
            .in("question_id", questionIds)
            .order("attachment_order", { ascending: true }),
    ]);

    if (choicesError) {
        throw choicesError;
    }

    if (attachmentsError) {
        throw attachmentsError;
    }

    return withQuizLearnerProgress(
        supabase,
        mapQuizRowsToDetail(
            rowWithMethodName,
            steps,
            (competencyRows ?? []) as QuizStepCompetencyRow[],
            questions,
            (choiceRows ?? []) as QuizChoiceRow[],
            (attachmentRows ?? []) as QuizAttachmentRow[],
        ),
        userId,
    );
}
