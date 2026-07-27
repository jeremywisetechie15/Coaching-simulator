import type { SupabaseClient } from "@supabase/supabase-js";
import {
    hasQuizAttemptLockedConfigurationChanged,
    QUIZ_ATTEMPT_EDIT_RESTRICTION_MESSAGE,
    type QuizAttemptLockedConfiguration,
} from "@/features/evaluations/domain";
import type { QuizDetail } from "@/features/evaluations/domain";
import type { SaveQuizDto } from "@/features/evaluations/dto";
import { ConflictError } from "@/lib/server/errors";
import { fetchQuizDetail } from "./quiz-query";

interface QuizAttemptEditOptions {
    hasUploads?: boolean;
}

function nullableText(value: string | null | undefined) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
}

function sorted(values: readonly string[]) {
    return [...values].sort((first, second) => first.localeCompare(second));
}

function currentConfiguration(quiz: QuizDetail): QuizAttemptLockedConfiguration {
    return {
        assignedUserId: quiz.scope === "user" ? quiz.assignedUserId : null,
        categories: sorted(quiz.categories),
        domain: nullableText(quiz.domain),
        groupId: quiz.scope === "group" ? quiz.groupId : null,
        hasAttemptLimit: quiz.maxAttempts !== null,
        methodId: quiz.methodId,
        organizationId:
            quiz.scope === "organization" || quiz.scope === "group"
                ? quiz.organizationId
                : null,
        participation: quiz.participation,
        quizKind: quiz.kind,
        quizType: quiz.type,
        scope: quiz.scope,
        steps: quiz.steps.map((step) => ({
            competenceIds: sorted(step.competenceIds),
            id: step.id,
            methodStepId: step.methodStepId,
            questions: step.questions.map((question) => ({
                attachments: question.attachments.map((attachment) => ({
                    deliveryType: attachment.storagePath ? "file" : "url",
                    id: attachment.id,
                    storageBucket: nullableText(attachment.storageBucket),
                    storagePath: nullableText(attachment.storagePath),
                    type: attachment.type,
                })),
                choices: question.choices.map((choice) => ({
                    id: choice.id,
                    isCorrect: choice.isCorrect,
                })),
                competenceId: nullableText(question.competenceId),
                dimension: question.dimension,
                dimensionItem: nullableText(question.dimensionItem),
                dimensionItemId: question.dimensionItemId,
                id: question.id,
                type: question.type,
            })),
        })),
    };
}

function nextConfiguration(input: SaveQuizDto): QuizAttemptLockedConfiguration {
    return {
        assignedUserId: input.scope === "user" ? input.assignedUserId : null,
        categories: sorted(input.categories),
        domain: nullableText(input.domain),
        groupId: input.scope === "group" ? input.groupId : null,
        hasAttemptLimit: input.maxAttempts !== null,
        methodId: input.methodId,
        organizationId:
            input.scope === "organization" || input.scope === "group"
                ? input.organizationId
                : null,
        participation: input.participation,
        quizKind: input.quizKind,
        quizType: input.quizType,
        scope: input.scope,
        steps: input.steps.map((step) => ({
            competenceIds: sorted(step.competenceIds),
            id: step.id ?? null,
            methodStepId: step.methodStepId,
            questions: step.questions.map((question) => ({
                attachments: question.attachments.map((attachment) => ({
                    deliveryType:
                        attachment.clientFileId || attachment.storagePath ? "file" : "url",
                    id: attachment.id ?? null,
                    storageBucket: nullableText(attachment.storageBucket),
                    storagePath: nullableText(attachment.storagePath),
                    type: attachment.type,
                })),
                choices: question.choices.map((choice) => ({
                    id: choice.id ?? null,
                    isCorrect: choice.isCorrect,
                })),
                competenceId: nullableText(question.competenceId),
                dimension: question.dimension,
                dimensionItem: nullableText(question.dimensionItem),
                dimensionItemId: question.dimensionItemId,
                id: question.id ?? null,
                type: question.type,
            })),
        })),
    };
}

export async function hasQuizAttempts(
    supabase: SupabaseClient,
    quizId: string,
) {
    const { count, error } = await supabase
        .from("quiz_attempts")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", quizId);

    if (error) throw error;

    return (count ?? 0) > 0;
}

export async function assertQuizAttemptEditPolicy(
    supabase: SupabaseClient,
    quizId: string,
    input: SaveQuizDto,
    { hasUploads = false }: QuizAttemptEditOptions = {},
) {
    if (!(await hasQuizAttempts(supabase, quizId))) return;

    const currentQuiz = await fetchQuizDetail(supabase, quizId);
    const configurationChanged = hasQuizAttemptLockedConfigurationChanged(
        currentConfiguration(currentQuiz),
        nextConfiguration(input),
    );

    if (configurationChanged || hasUploads) {
        throw new ConflictError(QUIZ_ATTEMPT_EDIT_RESTRICTION_MESSAGE);
    }
}
