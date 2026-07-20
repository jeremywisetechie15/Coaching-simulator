import {
    QUIZ_DEFAULT_VALIDATION_THRESHOLD,
    type QuizAttemptAnswer,
    type QuizDetail,
} from "@/features/evaluations/domain";
import { AppError } from "@/lib/server/errors";

export interface QuizAttemptScoreStep {
    earnedPoints: number;
    maxPoints: number;
    scorePercent: number;
    stepId: string;
    weight: number;
}

export interface QuizAttemptScore {
    earnedPoints: number;
    maxPoints: number;
    passed: boolean;
    scorePercent: number;
    stepScores: QuizAttemptScoreStep[];
}

export function attemptAnswersToRecord(answers: QuizAttemptAnswer[]) {
    return answers.reduce<Record<string, string[]>>((accumulator, answer) => {
        accumulator[answer.questionId] = answer.choiceIds;
        return accumulator;
    }, {});
}

export function normalizeQuizAttemptAnswers(
    quiz: Pick<QuizDetail, "steps">,
    answers: QuizAttemptAnswer[],
): QuizAttemptAnswer[] {
    const questionById = new Map(quiz.steps.flatMap((step) => step.questions.map((question) => [question.id, question])));
    const normalizedByQuestionId = new Map<string, QuizAttemptAnswer>();

    for (const answer of answers) {
        const question = questionById.get(answer.questionId);
        if (!question) {
            throw new AppError("Une réponse ne correspond pas à ce quiz.", 400, "INVALID_QUIZ_ATTEMPT_ANSWER");
        }

        const validChoiceIds = new Set(question.choices.map((choice) => choice.id));
        const choiceIds = Array.from(new Set(answer.choiceIds.filter(Boolean)));

        if (question.type === "QCU" && choiceIds.length > 1) {
            throw new AppError("Une question QCU accepte une seule réponse.", 400, "INVALID_QUIZ_ATTEMPT_ANSWER");
        }

        for (const choiceId of choiceIds) {
            if (!validChoiceIds.has(choiceId)) {
                throw new AppError("Une réponse ne correspond pas à cette question.", 400, "INVALID_QUIZ_ATTEMPT_ANSWER");
            }
        }

        if (choiceIds.length > 0) {
            normalizedByQuestionId.set(answer.questionId, {
                choiceIds,
                questionId: answer.questionId,
            });
        }
    }

    return Array.from(normalizedByQuestionId.values());
}

export function scoreQuizAttempt(
    quiz: Pick<QuizDetail, "steps" | "validationThreshold">,
    answers: QuizAttemptAnswer[],
): QuizAttemptScore {
    const selectedChoiceIdsByQuestionId = attemptAnswersToRecord(answers);
    const stepScores = quiz.steps.map((step) => {
        const maxPoints = step.questions.reduce((sum, question) => sum + question.points, 0);
        const earnedPoints = step.questions.reduce((sum, question) => {
            const selectedChoiceIds = selectedChoiceIdsByQuestionId[question.id] ?? [];
            const correctChoiceIds = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);
            const isCorrect =
                selectedChoiceIds.length === correctChoiceIds.length &&
                correctChoiceIds.every((choiceId) => selectedChoiceIds.includes(choiceId));

            return sum + (isCorrect ? question.points : 0);
        }, 0);

        return {
            earnedPoints,
            maxPoints,
            scorePercent: maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0,
            stepId: step.id,
            weight: step.weight,
        };
    });

    const totalWeight = stepScores.reduce((sum, step) => sum + step.weight, 0);
    const maxPoints = stepScores.reduce((sum, step) => sum + step.maxPoints, 0);
    const earnedPoints = stepScores.reduce((sum, step) => sum + step.earnedPoints, 0);
    const scorePercent =
        totalWeight > 0
            ? Math.round(stepScores.reduce((sum, step) => sum + step.scorePercent * step.weight, 0) / totalWeight)
            : maxPoints > 0
              ? Math.round((earnedPoints / maxPoints) * 100)
              : 0;

    return {
        earnedPoints,
        maxPoints,
        passed: scorePercent >= (quiz.validationThreshold ?? QUIZ_DEFAULT_VALIDATION_THRESHOLD),
        scorePercent,
        stepScores,
    };
}

export function createQuizAttemptStepScoreRows(attemptId: string, score: QuizAttemptScore) {
    return score.stepScores.map((stepScore) => ({
        attempt_id: attemptId,
        earned_points: stepScore.earnedPoints,
        max_points: stepScore.maxPoints,
        quiz_step_id: stepScore.stepId,
        score_percent: stepScore.scorePercent,
        weight: stepScore.weight,
    }));
}
