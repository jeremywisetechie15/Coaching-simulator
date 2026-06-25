import { CONTENT_STATUS, normalizeContentStatus } from "@/features/content/domain";
import {
    METHOD_SCOPE,
    METHOD_RESOURCE_TYPES,
    METHOD_STEP_ICONS,
    type MethodDetail,
    type MethodListItem,
    type MethodResource,
    type MethodResourceType,
    type MethodScope,
    type MethodStepIcon,
    type MethodStepItem,
} from "@/features/methods/domain/method";

export interface MethodRow {
    business_objective?: string | null;
    category?: string | null;
    challenges?: string[] | null;
    code?: string | null;
    created_at?: string | null;
    description?: string | null;
    domain?: string | null;
    id: string;
    is_active?: boolean | null;
    name: string;
    notation_method_id?: string | null;
    objectives?: string[] | null;
    organization_id?: string | null;
    organization_name?: string | null;
    reading_time_minutes?: number | null;
    scope?: string | null;
    status?: string | null;
    subtitle?: string | null;
    tag?: string | null;
    version?: string | null;
}

export interface MethodStepRow {
    aliases?: string[] | null;
    best_practices?: string[] | null;
    code?: string | null;
    icon?: string | null;
    id: string;
    method_id: string;
    objectives?: string[] | null;
    pitfalls?: string[] | null;
    posture?: string[] | null;
    short_title?: string | null;
    step_key?: string | null;
    step_order: number;
    summary?: string | null;
    takeaway?: string | null;
    title: string;
    verbatims?: string[] | null;
    weight?: number | string | null;
}

export interface MethodResourceRow {
    bucket?: string | null;
    duration_seconds?: number | null;
    external_url?: string | null;
    id: string;
    label?: string | null;
    notation_file_id?: string | null;
    path?: string | null;
    resource_type?: string | null;
    sort_order?: number | null;
    step_id?: string | null;
}

function cleanArray(value: string[] | null | undefined) {
    return Array.isArray(value) ? value.filter((item) => item.trim().length > 0) : [];
}

function normalizeScope(value: string | null | undefined): MethodScope {
    return value === METHOD_SCOPE.organization ? METHOD_SCOPE.organization : METHOD_SCOPE.public;
}

function normalizeStepIcon(value: string | null | undefined): MethodStepIcon {
    return METHOD_STEP_ICONS.includes(value as MethodStepIcon) ? (value as MethodStepIcon) : "phone";
}

function normalizeResourceType(value: string | null | undefined): MethodResourceType {
    if (value === "pdf" || value === "file") {
        return "document";
    }

    return METHOD_RESOURCE_TYPES.includes(value as MethodResourceType) ? (value as MethodResourceType) : "link";
}

function toNumber(value: number | string | null | undefined): number | null {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function readingTimeLabel(minutes: number | null | undefined) {
    if (!minutes || minutes <= 0) {
        return "Non renseigné";
    }

    return `${minutes} min`;
}

export function mapMethodRowToListItem(row: MethodRow, stepCount = 0): MethodListItem {
    const readingTimeMinutes = row.reading_time_minutes ?? null;

    return {
        category: row.category ?? "",
        code: row.code ?? "",
        description: row.description ?? "",
        domain: row.domain ?? "",
        id: row.id,
        name: row.name,
        organizationId: row.organization_id ?? null,
        organizationName: row.organization_name ?? null,
        readingTimeLabel: readingTimeLabel(readingTimeMinutes),
        readingTimeMinutes,
        scope: normalizeScope(row.scope),
        status: normalizeContentStatus(row.status, CONTENT_STATUS.draft),
        stepCount,
        subtitle: row.subtitle ?? "",
        tag: row.tag ?? "",
        version: row.version ?? "v1",
    };
}

export function mapMethodResourceRow(row: MethodResourceRow): MethodResource {
    return {
        durationSeconds: row.duration_seconds ?? null,
        externalUrl: row.external_url ?? "",
        id: row.id,
        label: row.label ?? "",
        notationFileId: row.notation_file_id ?? null,
        resourceType: normalizeResourceType(row.resource_type),
        sortOrder: row.sort_order ?? 1,
        stepId: row.step_id ?? null,
        storageBucket: row.bucket ?? null,
        storagePath: row.path ?? null,
    };
}

export function mapMethodStepRow(row: MethodStepRow, resources: MethodResource[] = []): MethodStepItem {
    return {
        bestPractices: cleanArray(row.best_practices),
        code: row.code ?? "",
        icon: normalizeStepIcon(row.icon),
        id: row.id,
        objectives: cleanArray(row.objectives),
        order: row.step_order,
        pitfalls: cleanArray(row.pitfalls),
        posture: cleanArray(row.posture),
        resources,
        shortTitle: row.short_title ?? "",
        stepKey: row.step_key ?? "",
        summary: row.summary ?? "",
        takeaway: row.takeaway ?? "",
        title: row.title,
        verbatims: cleanArray(row.verbatims),
        weight: toNumber(row.weight),
    };
}

export function mapMethodRowsToDetail(
    row: MethodRow,
    steps: MethodStepRow[],
    resources: MethodResourceRow[],
): MethodDetail {
    const resourcesByStepId = new Map<string, MethodResource[]>();
    const methodResources: MethodResource[] = [];

    for (const resource of resources.map(mapMethodResourceRow)) {
        if (!resource.stepId) {
            methodResources.push(resource);
            continue;
        }

        const current = resourcesByStepId.get(resource.stepId) ?? [];
        current.push(resource);
        resourcesByStepId.set(resource.stepId, current);
    }

    const orderedSteps = steps
        .slice()
        .sort((a, b) => a.step_order - b.step_order)
        .map((step) => mapMethodStepRow(step, resourcesByStepId.get(step.id) ?? []));

    return {
        ...mapMethodRowToListItem(row, orderedSteps.length),
        businessObjective: row.business_objective ?? "",
        challenges: cleanArray(row.challenges),
        notationMethodId: row.notation_method_id ?? null,
        objectives: cleanArray(row.objectives),
        resources: methodResources.sort((a, b) => a.sortOrder - b.sortOrder),
        steps: orderedSteps,
    };
}
