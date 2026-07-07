import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuizAttemptDetail } from "@/features/evaluations/domain";
import {
    mapQuizAttemptRowsToDetail,
    type QuizAttemptAnswerChoiceRow,
    type QuizAttemptAnswerRow,
    type QuizAttemptRow,
    type QuizAttemptStepScoreRow,
} from "./quiz-attempt.mapper";

export const QUIZ_ATTEMPT_SELECT =
    "id, quiz_id, user_id, status, attempt_number, started_at, completed_at, score_percent, earned_points, max_points, passed";

export const QUIZ_ATTEMPT_ANSWER_SELECT = "id, attempt_id, question_id";

export const QUIZ_ATTEMPT_ANSWER_CHOICE_SELECT = "answer_id, choice_id";

export const QUIZ_ATTEMPT_STEP_SCORE_SELECT =
    "attempt_id, quiz_step_id, score_percent, earned_points, max_points, weight";

export async function fetchQuizAttemptDetail(
    supabase: SupabaseClient,
    attemptRow: QuizAttemptRow,
): Promise<QuizAttemptDetail> {
    const { data: answerRows, error: answerError } = await supabase
        .from("quiz_attempt_answers")
        .select(QUIZ_ATTEMPT_ANSWER_SELECT)
        .eq("attempt_id", attemptRow.id);

    if (answerError) throw answerError;

    const answers = (answerRows ?? []) as QuizAttemptAnswerRow[];
    const answerIds = answers.map((answer) => answer.id);

    const [
        { data: choiceRows, error: choiceError },
        { data: stepScoreRows, error: stepScoreError },
    ] = await Promise.all([
        answerIds.length > 0
            ? supabase
                  .from("quiz_attempt_answer_choices")
                  .select(QUIZ_ATTEMPT_ANSWER_CHOICE_SELECT)
                  .in("answer_id", answerIds)
            : Promise.resolve({ data: [], error: null }),
        supabase
            .from("quiz_attempt_step_scores")
            .select(QUIZ_ATTEMPT_STEP_SCORE_SELECT)
            .eq("attempt_id", attemptRow.id),
    ]);

    if (choiceError) throw choiceError;
    if (stepScoreError) throw stepScoreError;

    return mapQuizAttemptRowsToDetail(
        attemptRow,
        answers,
        (choiceRows ?? []) as QuizAttemptAnswerChoiceRow[],
        (stepScoreRows ?? []) as QuizAttemptStepScoreRow[],
    );
}
