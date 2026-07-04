import type { SupabaseClient } from "@supabase/supabase-js";

interface QuizAttemptSkillRow {
    completed_at: string | null;
    created_at: string | null;
    id: string;
    quiz_id: string;
}

interface QuizStepSkillRow {
    id: string;
    method_step_id: string | null;
    quiz_id: string;
}

interface QuizQuestionSkillRow {
    competence_id: string | null;
    dimension: string;
    dimension_item_id: string | null;
    id: string;
    points: number | string | null;
    step_id: string;
}

interface QuizChoiceSkillRow {
    id: string;
    is_correct: boolean | null;
    question_id: string;
}

interface QuizAttemptAnswerSkillRow {
    attempt_id: string;
    id: string;
    question_id: string;
}

interface QuizAttemptAnswerChoiceSkillRow {
    answer_id: string;
    choice_id: string;
}

export interface QuizSkillCriterion {
    createdAt: string | null;
    dimension: string;
    dimensionItemId: string | null;
    methodStepId: string | null;
    pointsAwarded: number;
    pointsMax: number;
    quizId: string;
    scorePercent: number;
    skillId: string | null;
    sourceId: string;
}

interface BuildQuizSkillCriteriaInput {
    answerChoices: QuizAttemptAnswerChoiceSkillRow[];
    answers: QuizAttemptAnswerSkillRow[];
    attempts: QuizAttemptSkillRow[];
    choices: QuizChoiceSkillRow[];
    questions: QuizQuestionSkillRow[];
    steps: QuizStepSkillRow[];
}

interface FetchCompletedQuizSkillCriteriaParams {
    quizIds?: string[];
    userId: string;
}

function groupBy<T>(items: T[], keyOf: (item: T) => string) {
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const key = keyOf(item);
        groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return groups;
}

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function normalizeDimension(value: string | null | undefined) {
    if (value === "savoir_faire" || value === "savoir-faire") return "savoir_faire";
    if (value === "savoir_etre" || value === "savoir-être") return "savoir_etre";
    return "savoir";
}

function questionPoints(value: number | string | null | undefined) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function isQuestionCorrect(selectedChoiceIds: string[], correctChoiceIds: string[]) {
    return selectedChoiceIds.length === correctChoiceIds.length &&
        correctChoiceIds.every((choiceId) => selectedChoiceIds.includes(choiceId));
}

export function buildQuizSkillCriteria({
    answerChoices,
    answers,
    attempts,
    choices,
    questions,
    steps,
}: BuildQuizSkillCriteriaInput): QuizSkillCriterion[] {
    const stepById = new Map(steps.map((step) => [step.id, step]));
    const questionsByQuizId = groupBy(
        questions.filter((question) => question.competence_id || question.dimension_item_id),
        (question) => stepById.get(question.step_id)?.quiz_id ?? "",
    );
    const choicesByQuestionId = groupBy(choices, (choice) => choice.question_id);
    const answersByAttemptQuestion = new Map(
        answers.map((answer) => [`${answer.attempt_id}:${answer.question_id}`, answer]),
    );
    const selectedChoiceIdsByAnswerId = groupBy(answerChoices, (choice) => choice.answer_id);

    return attempts.flatMap((attempt) => {
        const attemptQuestions = questionsByQuizId.get(attempt.quiz_id) ?? [];

        return attemptQuestions.flatMap((question) => {
            const maxPoints = questionPoints(question.points);
            if (maxPoints <= 0) return [];

            const answer = answersByAttemptQuestion.get(`${attempt.id}:${question.id}`);
            const selectedChoiceIds = answer
                ? (selectedChoiceIdsByAnswerId.get(answer.id) ?? []).map((choice) => choice.choice_id)
                : [];
            const correctChoiceIds = (choicesByQuestionId.get(question.id) ?? [])
                .filter((choice) => Boolean(choice.is_correct))
                .map((choice) => choice.id);
            const earnedPoints = isQuestionCorrect(selectedChoiceIds, correctChoiceIds) ? maxPoints : 0;
            const step = stepById.get(question.step_id);

            return [{
                createdAt: attempt.completed_at ?? attempt.created_at,
                dimension: normalizeDimension(question.dimension),
                dimensionItemId: question.dimension_item_id,
                methodStepId: step?.method_step_id ?? null,
                pointsAwarded: earnedPoints,
                pointsMax: maxPoints,
                quizId: attempt.quiz_id,
                scorePercent: maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0,
                skillId: question.competence_id,
                sourceId: attempt.id,
            }];
        });
    });
}

export async function fetchCompletedQuizSkillCriteria(
    supabase: SupabaseClient,
    { quizIds, userId }: FetchCompletedQuizSkillCriteriaParams,
): Promise<QuizSkillCriterion[]> {
    if (quizIds && quizIds.length === 0) return [];

    let attemptsQuery = supabase
        .from("quiz_attempts")
        .select("id, quiz_id, completed_at, created_at")
        .eq("user_id", userId)
        .eq("status", "completed");

    if (quizIds && quizIds.length > 0) {
        attemptsQuery = attemptsQuery.in("quiz_id", quizIds);
    }

    const { data: attempts, error: attemptsError } = await attemptsQuery.returns<QuizAttemptSkillRow[]>();

    if (attemptsError) throw attemptsError;

    const attemptRows = attempts ?? [];
    const attemptIds = attemptRows.map((attempt) => attempt.id);
    const resolvedQuizIds = uniqueValues(attemptRows.map((attempt) => attempt.quiz_id));
    if (attemptIds.length === 0 || resolvedQuizIds.length === 0) return [];

    const { data: steps, error: stepsError } = await supabase
        .from("quiz_steps")
        .select("id, quiz_id, method_step_id")
        .in("quiz_id", resolvedQuizIds)
        .returns<QuizStepSkillRow[]>();

    if (stepsError) throw stepsError;

    const stepRows = steps ?? [];
    const stepIds = stepRows.map((step) => step.id);
    if (stepIds.length === 0) return [];

    const { data: questions, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("id, step_id, competence_id, dimension, dimension_item_id, points")
        .in("step_id", stepIds)
        .returns<QuizQuestionSkillRow[]>();

    if (questionsError) throw questionsError;

    const questionRows = (questions ?? []).filter((question) => question.competence_id || question.dimension_item_id);
    const questionIds = questionRows.map((question) => question.id);
    if (questionIds.length === 0) return [];

    const [
        { data: choices, error: choicesError },
        { data: answers, error: answersError },
    ] = await Promise.all([
        supabase
            .from("quiz_question_choices")
            .select("id, question_id, is_correct")
            .in("question_id", questionIds)
            .returns<QuizChoiceSkillRow[]>(),
        supabase
            .from("quiz_attempt_answers")
            .select("id, attempt_id, question_id")
            .in("attempt_id", attemptIds)
            .returns<QuizAttemptAnswerSkillRow[]>(),
    ]);

    if (choicesError) throw choicesError;
    if (answersError) throw answersError;

    const answerRows = answers ?? [];
    const answerIds = answerRows.map((answer) => answer.id);
    const { data: answerChoices, error: answerChoicesError } = answerIds.length > 0
        ? await supabase
              .from("quiz_attempt_answer_choices")
              .select("answer_id, choice_id")
              .in("answer_id", answerIds)
              .returns<QuizAttemptAnswerChoiceSkillRow[]>()
        : { data: [] as QuizAttemptAnswerChoiceSkillRow[], error: null };

    if (answerChoicesError) throw answerChoicesError;

    return buildQuizSkillCriteria({
        answerChoices: answerChoices ?? [],
        answers: answerRows,
        attempts: attemptRows,
        choices: choices ?? [],
        questions: questionRows,
        steps: stepRows,
    });
}
