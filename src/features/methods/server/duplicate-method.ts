import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { resolveDuplicateName } from "@/features/content/server";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import { duplicateMethodKnowledgeQuiz } from "@/features/evaluations/server/duplicate-quiz";
import type { MethodStepItem } from "@/features/methods/domain/method";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMethod } from "./create-method";
import { getMethodById } from "./get-method-by-id";

interface MethodKnowledgeQuizRow {
    id: string;
}

export function buildDuplicatedMethodStepIdMap(
    sourceSteps: readonly Pick<MethodStepItem, "id" | "order" | "stepKey">[],
    duplicatedSteps: readonly Pick<MethodStepItem, "id" | "order" | "stepKey">[],
) {
    const duplicatedStepByKey = new Map(
        duplicatedSteps
            .filter((step) => step.stepKey.length > 0)
            .map((step) => [step.stepKey, step]),
    );
    const duplicatedStepByOrder = new Map(
        duplicatedSteps.map((step) => [step.order, step]),
    );

    return new Map(sourceSteps.flatMap((sourceStep) => {
        const duplicatedStep = (
            sourceStep.stepKey
                ? duplicatedStepByKey.get(sourceStep.stepKey)
                : undefined
        ) ?? duplicatedStepByOrder.get(sourceStep.order);

        return duplicatedStep ? [[sourceStep.id, duplicatedStep.id] as const] : [];
    }));
}

export async function duplicateMethod(methodId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const source = await getMethodById(methodId);
    const [duplicateName, sourceQuizResult] = await Promise.all([
        resolveDuplicateName(adminSupabase, {
            column: "name",
            maxLength: 180,
            sourceName: source.name,
            table: "methods",
        }),
        adminSupabase
            .from("quizzes")
            .select("id")
            .eq("method_id", source.id)
            .eq("quiz_kind", QUIZ_KIND.methodKnowledge)
            .eq("is_active", true)
            .neq("status", CONTENT_STATUS.archived)
            .maybeSingle<MethodKnowledgeQuizRow>(),
    ]);

    if (sourceQuizResult.error) {
        throw sourceQuizResult.error;
    }

    const input: SaveMethodDto = {
        category: source.category,
        challenges: source.challenges,
        description: source.description,
        domain: source.domain,
        name: duplicateName,
        objectives: source.objectives,
        organizationId: source.organizationId,
        quizId: null,
        readingTimeMinutes: source.readingTimeMinutes,
        resources: source.resources.map((resource) => ({
            clientFileId: "",
            externalUrl: resource.externalUrl,
            label: resource.label,
            resourceType: resource.resourceType,
            storageBucket: resource.storageBucket ?? "",
            storagePath: resource.storagePath ?? "",
        })),
        scope: source.scope,
        status: CONTENT_STATUS.draft,
        steps: source.steps.map((step) => ({
            bestPractices: step.bestPractices,
            code: step.code,
            icon: step.icon,
            objectives: step.objectives,
            pitfalls: step.pitfalls,
            posture: step.posture,
            resources: step.resources.map((resource) => ({
                clientFileId: "",
                externalUrl: resource.externalUrl,
                label: resource.label,
                resourceType: resource.resourceType,
                storageBucket: resource.storageBucket ?? "",
                storagePath: resource.storagePath ?? "",
            })),
            shortTitle: step.shortTitle,
            stepKey: step.stepKey,
            summary: step.summary,
            takeaway: step.takeaway,
            title: step.title,
            verbatims: step.verbatims,
        })),
        subtitle: source.subtitle,
        tag: source.tag,
    };

    const duplicate = await createMethod(input);
    const sourceQuizId = sourceQuizResult.data?.id;

    if (!sourceQuizId) {
        return duplicate;
    }

    try {
        await duplicateMethodKnowledgeQuiz({
            methodId: duplicate.id,
            methodStepIdBySourceId: buildDuplicatedMethodStepIdMap(
                source.steps,
                duplicate.steps,
            ),
            quizId: sourceQuizId,
        });
    } catch (error) {
        const { error: rollbackError } = await adminSupabase
            .from("methods")
            .delete()
            .eq("id", duplicate.id);

        if (rollbackError) {
            throw new AggregateError(
                [error, rollbackError],
                "La duplication du quiz et l’annulation de la méthode ont échoué.",
            );
        }

        throw error;
    }

    return duplicate;
}
