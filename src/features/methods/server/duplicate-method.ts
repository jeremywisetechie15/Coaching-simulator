import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";
import { createMethod } from "./create-method";
import { getMethodById } from "./get-method-by-id";

export async function duplicateMethod(methodId: string) {
    await requireAdmin();
    const source = await getMethodById(methodId);

    const input: SaveMethodDto = {
        category: source.category,
        challenges: source.challenges,
        description: source.description,
        domain: source.domain,
        name: `Copie de ${source.name}`,
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

    return createMethod(input);
}
