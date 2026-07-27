import type { SupabaseClient } from "@supabase/supabase-js";
import { hasRoleplaySessionsForScenarioDependency } from "@/features/content/server";
import {
    METHOD_USAGE_EDIT_RESTRICTION_MESSAGE,
    type MethodDetail,
    type MethodResource,
} from "@/features/methods/domain/method";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";
import { ConflictError } from "@/lib/server/errors";
import { fetchMethodDetail } from "./method-query";

interface MethodUsageEditOptions {
    hasUploads?: boolean;
}

interface LockedMethodResource {
    deliveryType: "file" | "url";
    id: string | null;
    resourceType: string;
    storageBucket: string | null;
    storagePath: string | null;
}

interface LockedMethodStep {
    bestPracticeCount: number;
    code: string;
    icon: string;
    id: string | null;
    objectiveCount: number;
    pitfallCount: number;
    postureCount: number;
    resources: LockedMethodResource[];
    stepKey: string;
    verbatimCount: number;
}

interface LockedMethodConfiguration {
    category: string | null;
    challengeCount: number;
    domain: string | null;
    objectiveCount: number;
    organizationId: string | null;
    quizId: string | null;
    resources: LockedMethodResource[];
    scope: string;
    steps: LockedMethodStep[];
}

function nullableText(value: string | null | undefined) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
}

function sortResources(resources: LockedMethodResource[]) {
    return resources.slice().sort((first, second) =>
        JSON.stringify(first).localeCompare(JSON.stringify(second)),
    );
}

function currentResource(resource: MethodResource): LockedMethodResource {
    return {
        deliveryType: resource.storagePath ? "file" : "url",
        id: resource.id,
        resourceType: resource.resourceType,
        storageBucket: nullableText(resource.storageBucket),
        storagePath: nullableText(resource.storagePath),
    };
}

function nextResource(
    resource: SaveMethodDto["resources"][number],
): LockedMethodResource {
    return {
        deliveryType: resource.clientFileId || resource.storagePath ? "file" : "url",
        id: resource.id ?? null,
        resourceType: resource.resourceType,
        storageBucket: nullableText(resource.storageBucket),
        storagePath: nullableText(resource.storagePath),
    };
}

function currentConfiguration(
    method: MethodDetail,
    quizId: string | null,
): LockedMethodConfiguration {
    return {
        category: nullableText(method.category),
        challengeCount: method.challenges.length,
        domain: nullableText(method.domain),
        objectiveCount: method.objectives.length,
        organizationId: method.scope === "organization" ? method.organizationId : null,
        quizId,
        resources: sortResources(method.resources.map(currentResource)),
        scope: method.scope,
        steps: method.steps.map((step) => ({
            bestPracticeCount: step.bestPractices.length,
            code: step.code,
            icon: step.icon,
            id: step.id,
            objectiveCount: step.objectives.length,
            pitfallCount: step.pitfalls.length,
            postureCount: step.posture.length,
            resources: sortResources(step.resources.map(currentResource)),
            stepKey: step.stepKey,
            verbatimCount: step.verbatims.length,
        })),
    };
}

function nextConfiguration(input: SaveMethodDto): LockedMethodConfiguration {
    return {
        category: nullableText(input.category),
        challengeCount: input.challenges.length,
        domain: nullableText(input.domain),
        objectiveCount: input.objectives.length,
        organizationId: input.scope === "organization" ? input.organizationId : null,
        quizId: input.quizId,
        resources: sortResources(input.resources.map(nextResource)),
        scope: input.scope,
        steps: input.steps.map((step) => ({
            bestPracticeCount: step.bestPractices.length,
            code: step.code,
            icon: step.icon,
            id: step.id ?? null,
            objectiveCount: step.objectives.length,
            pitfallCount: step.pitfalls.length,
            postureCount: step.posture.length,
            resources: sortResources(step.resources.map(nextResource)),
            stepKey: step.stepKey,
            verbatimCount: step.verbatims.length,
        })),
    };
}

async function getAssociatedQuizId(
    supabase: SupabaseClient,
    methodId: string,
) {
    const { data, error } = await supabase
        .from("quizzes")
        .select("id")
        .eq("method_id", methodId)
        .eq("quiz_kind", "method_knowledge")
        .maybeSingle<{ id: string }>();

    if (error) throw error;

    return data?.id ?? null;
}

async function hasAssociatedQuizAttempts(
    supabase: SupabaseClient,
    methodId: string,
) {
    const { count, error } = await supabase
        .from("quiz_attempts")
        .select("id, quizzes!inner(id)", { count: "exact", head: true })
        .eq("quizzes.method_id", methodId);

    if (error) throw error;

    return (count ?? 0) > 0;
}

export async function hasMethodUsage(
    supabase: SupabaseClient,
    methodId: string,
) {
    const [hasSessions, hasQuizAttempts] = await Promise.all([
        hasRoleplaySessionsForScenarioDependency(supabase, "method_id", methodId),
        hasAssociatedQuizAttempts(supabase, methodId),
    ]);

    return hasSessions || hasQuizAttempts;
}

export async function assertMethodUsageEditPolicy(
    supabase: SupabaseClient,
    methodId: string,
    input: SaveMethodDto,
    { hasUploads = false }: MethodUsageEditOptions = {},
) {
    if (!(await hasMethodUsage(supabase, methodId))) return;

    const [currentMethod, currentQuizId] = await Promise.all([
        fetchMethodDetail(supabase, methodId),
        getAssociatedQuizId(supabase, methodId),
    ]);
    const configurationChanged =
        JSON.stringify(currentConfiguration(currentMethod, currentQuizId)) !==
        JSON.stringify(nextConfiguration(input));

    if (configurationChanged || hasUploads) {
        throw new ConflictError(METHOD_USAGE_EDIT_RESTRICTION_MESSAGE);
    }
}
