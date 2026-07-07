import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";

export const METHOD_SELECT =
    "id, code, name, version, description, is_active, is_default, created_at, updated_at, subtitle, category, domain, tag, reading_time_minutes, objectives, challenges, organization_id, scope, created_by, notation_method_id, status";

export const METHOD_STEP_SELECT =
    "id, method_id, step_order, step_key, code, title, weight, aliases, summary, icon, takeaway, objectives, best_practices, pitfalls, posture, verbatims, notation_step_id, short_title";

export const METHOD_RESOURCE_SELECT =
    "id, method_id, step_id, bucket, path, label, resource_type, external_url, duration_seconds, sort_order, is_active, notation_file_id";

export function slugifyMethodValue(value: string, fallback: string) {
    const slug = value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return slug || fallback;
}

export function nullableText(value: string | null | undefined) {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
}

function createMethodBasePayload(input: SaveMethodDto) {
    return {
        category: nullableText(input.category),
        challenges: input.challenges,
        description: nullableText(input.description),
        domain: nullableText(input.domain),
        name: input.name,
        objectives: input.objectives,
        organization_id: input.scope === "organization" ? input.organizationId : null,
        reading_time_minutes: input.readingTimeMinutes,
        scope: input.scope,
        status: input.status,
        subtitle: nullableText(input.subtitle),
        tag: nullableText(input.tag),
    };
}

export function createMethodInsert(input: SaveMethodDto, code: string, createdBy: string) {
    const now = new Date().toISOString();

    return {
        ...createMethodBasePayload(input),
        code,
        created_at: now,
        created_by: createdBy,
        is_active: true,
        updated_at: now,
        version: "v1",
    };
}

export function createMethodUpdate(input: SaveMethodDto) {
    return {
        ...createMethodBasePayload(input),
        updated_at: new Date().toISOString(),
    };
}

export function createStepRows(methodId: string, input: SaveMethodDto) {
    return input.steps.map((step, index) => {
        const stepOrder = index + 1;
        const shortTitle = nullableText(step.shortTitle);
        const stepKey = step.stepKey || `${slugifyMethodValue(shortTitle ?? step.title, `step-${stepOrder}`)}-${stepOrder}`;

        return {
            best_practices: step.bestPractices,
            code: nullableText(step.code),
            icon: step.icon,
            method_id: methodId,
            objectives: step.objectives,
            pitfalls: step.pitfalls,
            posture: step.posture,
            short_title: shortTitle,
            step_key: stepKey,
            step_order: stepOrder,
            summary: nullableText(step.summary),
            takeaway: nullableText(step.takeaway),
            title: step.title,
            verbatims: step.verbatims,
            weight: null,
        };
    });
}

function hasResourceLocation(resource: SaveMethodDto["resources"][number]) {
    return (
        resource.externalUrl.trim().length > 0 ||
        (resource.storageBucket.trim().length > 0 && resource.storagePath.trim().length > 0)
    );
}

function createResourceRow(
    methodId: string,
    resource: SaveMethodDto["resources"][number],
    sortOrder: number,
    stepId: string | null,
) {
    const externalUrl = nullableText(resource.externalUrl);
    const storageBucket = nullableText(resource.storageBucket);
    const storagePath = nullableText(resource.storagePath);
    const label = resource.label || externalUrl || storagePath || "";

    return {
        bucket: storageBucket,
        external_url: externalUrl,
        ...(resource.id ? { id: resource.id } : {}),
        is_active: true,
        label,
        method_id: methodId,
        path: storagePath,
        resource_type: resource.resourceType || "link",
        sort_order: sortOrder,
        step_id: stepId,
    };
}

export function createResourceRows(
    methodId: string,
    input: SaveMethodDto,
    stepIdsByOrder: Map<number, string>,
) {
    let sortOrder = 1;
    const methodResources = input.resources
        .filter(hasResourceLocation)
        .map((resource) => createResourceRow(methodId, resource, sortOrder++, null));

    const stepResources = input.steps.flatMap((step, index) => {
        const stepId = stepIdsByOrder.get(index + 1);
        if (!stepId) return [];

        return step.resources
            .filter(hasResourceLocation)
            .map((resource) => createResourceRow(methodId, resource, sortOrder++, stepId));
    });

    return [...methodResources, ...stepResources];
}

export async function createUniqueMethodCode(
    supabase: SupabaseClient,
    name: string,
    version = "v1",
) {
    const baseCode = slugifyMethodValue(name.replace(/^methode\s+/i, "").replace(/^méthode\s+/i, ""), "method");
    const { data, error } = await supabase
        .from("methods")
        .select("code")
        .eq("version", version)
        .like("code", `${baseCode}%`);

    if (error) {
        throw error;
    }

    const existingCodes = new Set((data ?? []).map((row: { code?: string | null }) => row.code).filter(Boolean));

    if (!existingCodes.has(baseCode)) {
        return baseCode;
    }

    for (let suffix = 2; suffix < 1000; suffix += 1) {
        const candidate = `${baseCode}-${suffix}`;
        if (!existingCodes.has(candidate)) {
            return candidate;
        }
    }

    return `${baseCode}-${Date.now().toString(36)}`;
}
