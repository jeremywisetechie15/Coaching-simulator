import { requireAdmin } from "@/features/auth/server";
import {
    CONTENT_STATUS,
    CONTENT_VISIBILITY_SCOPE,
} from "@/features/content/domain";
import { resolveDuplicateName } from "@/features/content/server";
import {
    QUIZ_KIND,
    type QuizDetail,
    type QuizKind,
} from "@/features/evaluations/domain";
import type { SaveQuizDto } from "@/features/evaluations/dto/save-quiz.dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createQuiz } from "./create-quiz";
import { fetchQuizDetail } from "./quiz-query";

interface BuildDuplicateQuizInputOptions {
    methodId: string | null;
    methodStepIdBySourceId?: ReadonlyMap<string, string>;
    preserveAudience: boolean;
    quizKind: QuizKind;
    title: string;
}

export function buildDuplicateQuizInput(
    source: QuizDetail,
    {
        methodId,
        methodStepIdBySourceId = new Map(),
        preserveAudience,
        quizKind,
        title,
    }: BuildDuplicateQuizInputOptions,
): SaveQuizDto {
    return {
        assignedUserId: preserveAudience ? source.assignedUserId : null,
        categories: source.categories,
        description: source.description,
        difficulty: source.difficulty,
        domain: source.domain,
        durationMinutes: source.durationMinutes,
        groupId: preserveAudience ? source.groupId : null,
        maxAttempts: source.maxAttempts,
        methodId,
        organizationId: preserveAudience ? source.organizationId : null,
        participation: source.participation,
        quizKind,
        quizType: source.type,
        scope: preserveAudience ? source.scope : CONTENT_VISIBILITY_SCOPE.public,
        status: CONTENT_STATUS.draft,
        tags: source.tags,
        title,
        validationThreshold: source.validationThreshold,
        steps: source.steps.map((step) => ({
            competenceIds: step.competenceIds,
            methodStepId: step.methodStepId
                ? methodStepIdBySourceId.get(step.methodStepId) ?? null
                : null,
            name: step.name,
            questions: step.questions.map((question) => ({
                attachments: question.attachments.map((attachment) => ({
                    clientFileId: "",
                    externalUrl: attachment.externalUrl,
                    label: attachment.label,
                    storageBucket: attachment.storageBucket ?? "",
                    storagePath: attachment.storagePath ?? "",
                    type: attachment.type,
                })),
                choices: question.choices.map((choice) => ({
                    isCorrect: choice.isCorrect,
                    label: choice.label,
                })),
                competenceId: question.competenceId,
                dimension: question.dimension,
                dimensionItem: question.dimensionItem,
                dimensionItemId: question.dimensionItemId,
                explanation: question.explanation,
                points: question.points,
                prompt: question.prompt,
                type: question.type,
            })),
            weight: step.weight,
        })),
    };
}

async function resolveQuizDuplicateTitle(source: QuizDetail) {
    return resolveDuplicateName(createAdminClient(), {
        column: "title",
        maxLength: 180,
        sourceName: source.title,
        table: "quizzes",
    });
}

export async function duplicateQuiz(quizId: string) {
    await requireAdmin();
    const source = await fetchQuizDetail(createAdminClient(), quizId);
    const duplicateTitle = await resolveQuizDuplicateTitle(source);
    const input = buildDuplicateQuizInput(source, {
        methodId: null,
        preserveAudience: false,
        quizKind: QUIZ_KIND.contextual,
        title: duplicateTitle,
    });

    return createQuiz(input);
}

export async function duplicateMethodKnowledgeQuiz({
    methodId,
    methodStepIdBySourceId,
    quizId,
}: {
    methodId: string;
    methodStepIdBySourceId: ReadonlyMap<string, string>;
    quizId: string;
}) {
    await requireAdmin();
    const source = await fetchQuizDetail(createAdminClient(), quizId);
    const duplicateTitle = await resolveQuizDuplicateTitle(source);
    const input = buildDuplicateQuizInput(source, {
        methodId,
        methodStepIdBySourceId,
        preserveAudience: true,
        quizKind: QUIZ_KIND.methodKnowledge,
        title: duplicateTitle,
    });

    return createQuiz(input, new Map(), { allowedDraftMethodId: methodId });
}
