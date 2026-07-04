import type {
    QuizAttemptDetail,
    QuizAttemptStatus,
    QuizAttemptStepScore,
} from "@/features/evaluations/domain";

export interface QuizAttemptRow {
    attempt_number: number;
    completed_at?: string | null;
    earned_points?: number | null;
    id: string;
    max_points?: number | null;
    passed?: boolean | null;
    quiz_id: string;
    score_percent?: number | null;
    started_at: string;
    status: QuizAttemptStatus | string;
    user_id: string;
}

export interface QuizAttemptAnswerRow {
    attempt_id: string;
    id: string;
    question_id: string;
}

export interface QuizAttemptAnswerChoiceRow {
    answer_id: string;
    choice_id: string;
}

export interface QuizAttemptStepScoreRow {
    attempt_id: string;
    earned_points?: number | null;
    max_points?: number | null;
    quiz_step_id: string;
    score_percent?: number | null;
    weight?: number | null;
}

function normalizeStatus(value: string): QuizAttemptStatus {
    return value === "completed" ? "completed" : "in_progress";
}

export function mapQuizAttemptRowsToDetail(
    row: QuizAttemptRow,
    answerRows: QuizAttemptAnswerRow[] = [],
    choiceRows: QuizAttemptAnswerChoiceRow[] = [],
    stepScoreRows: QuizAttemptStepScoreRow[] = [],
): QuizAttemptDetail {
    const choiceIdsByAnswerId = new Map<string, string[]>();
    for (const choice of choiceRows) {
        const current = choiceIdsByAnswerId.get(choice.answer_id) ?? [];
        current.push(choice.choice_id);
        choiceIdsByAnswerId.set(choice.answer_id, current);
    }

    const stepScores: QuizAttemptStepScore[] = stepScoreRows.map((score) => ({
        earnedPoints: score.earned_points ?? 0,
        maxPoints: score.max_points ?? 0,
        scorePercent: score.score_percent ?? 0,
        stepId: score.quiz_step_id,
        weight: score.weight ?? 0,
    }));

    return {
        answers: answerRows.map((answer) => ({
            choiceIds: choiceIdsByAnswerId.get(answer.id) ?? [],
            questionId: answer.question_id,
        })),
        attemptNumber: row.attempt_number,
        completedAt: row.completed_at ?? null,
        earnedPoints: row.earned_points ?? 0,
        id: row.id,
        maxPoints: row.max_points ?? 0,
        passed: row.passed ?? null,
        quizId: row.quiz_id,
        scorePercent: row.score_percent ?? null,
        startedAt: row.started_at,
        status: normalizeStatus(row.status),
        stepScores,
        userId: row.user_id,
    };
}
