import { requireAdmin } from "@/features/auth/server";
import { resolveDuplicateName } from "@/features/content/server";
import type { SaveQuizDto } from "@/features/evaluations/dto/save-quiz.dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createQuiz } from "./create-quiz";
import { getQuizById } from "./get-quiz-by-id";

export async function duplicateQuiz(quizId: string) {
    await requireAdmin();
    const source = await getQuizById(quizId);
    const duplicateTitle = await resolveDuplicateName(createAdminClient(), {
        column: "title",
        maxLength: 180,
        sourceName: source.title,
        table: "quizzes",
    });
    const input: SaveQuizDto = {
        assignedUserId: null,
        category: source.category,
        description: source.description,
        domain: source.domain,
        durationMinutes: source.durationMinutes,
        groupId: null,
        maxAttempts: source.maxAttempts,
        methodId: null,
        organizationId: null,
        participation: source.participation,
        quizKind: "contextual",
        quizType: source.type,
        scope: "public",
        status: "draft",
        tags: source.tags,
        title: duplicateTitle,
        validationThreshold: source.validationThreshold,
        steps: source.steps.map((step) => ({
            competenceIds: step.competenceIds,
            methodStepId: null,
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

    return createQuiz(input);
}
