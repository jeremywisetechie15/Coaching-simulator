import { requireAuth } from "@/features/auth/server";
import { CONTENT_STATUS, isSelectableContent } from "@/features/content/domain";
import type {
    MethodListItem,
    MethodSelectionOption,
    MethodSelectionOptionWithSteps,
} from "@/features/methods/domain/method";
import { createClient } from "@/lib/supabase/server";
import { mapMethodRowToListItem, type MethodRow } from "./method.mapper";
import { withMethodOrganizationNames } from "./method-organization-names";
import { METHOD_SELECT } from "./method.persistence";
import { getMethodById } from "./get-method-by-id";

interface ListMethodSelectionOptionsParams {
    includeUnavailableIds?: readonly string[];
}

export async function listMethods(): Promise<MethodListItem[]> {
    await requireAuth();
    const supabase = await createClient();
    const { data: methodRows, error } = await supabase
        .from("methods")
        .select(METHOD_SELECT)
        .neq("status", CONTENT_STATUS.archived)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    const methods = await withMethodOrganizationNames((methodRows ?? []) as MethodRow[]);
    const methodIds = methods.map((method) => method.id);
    const stepCountByMethodId = new Map<string, number>();

    if (methodIds.length > 0) {
        const { data: stepRows, error: stepsError } = await supabase
            .from("method_steps")
            .select("method_id")
            .in("method_id", methodIds);

        if (stepsError) {
            throw stepsError;
        }

        for (const row of stepRows ?? []) {
            const methodId = (row as { method_id?: string | null }).method_id;
            if (!methodId) continue;
            stepCountByMethodId.set(methodId, (stepCountByMethodId.get(methodId) ?? 0) + 1);
        }
    }

    return methods.map((method) => mapMethodRowToListItem(method, stepCountByMethodId.get(method.id) ?? 0));
}

export async function listMethodSelectionOptions({
    includeUnavailableIds = [],
}: ListMethodSelectionOptionsParams = {}): Promise<MethodSelectionOption[]> {
    const methods = await listMethods();
    const methodById = new Map(methods.map((method) => [method.id, method]));
    const missingCurrentIds = [...new Set(includeUnavailableIds)]
        .filter((methodId) => methodId && !methodById.has(methodId));

    if (missingCurrentIds.length > 0) {
        const currentMethods = await Promise.all(missingCurrentIds.map((methodId) => getMethodById(methodId)));
        currentMethods.forEach((method) => methodById.set(method.id, method));
    }

    return [...methodById.values()]
        .filter((method) =>
            isSelectableContent(method.status) || includeUnavailableIds.includes(method.id)
        )
        .map((method) => ({
            id: method.id,
            isSelectable: isSelectableContent(method.status),
            name: method.name,
        }))
        .sort((first, second) => first.name.localeCompare(second.name, "fr-FR"));
}

interface MethodSelectionStepRow {
    id: string;
    method_id: string;
    step_order: number;
    title: string;
    weight: number | string | null;
}

function toNullableSelectionStepWeight(value: number | string | null | undefined) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

export async function listMethodSelectionOptionsWithSteps(
    params: ListMethodSelectionOptionsParams = {},
): Promise<MethodSelectionOptionWithSteps[]> {
    const methods = await listMethodSelectionOptions(params);
    if (methods.length === 0) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("method_steps")
        .select("id, method_id, title, step_order, weight")
        .in("method_id", methods.map((method) => method.id))
        .order("step_order", { ascending: true })
        .returns<MethodSelectionStepRow[]>();

    if (error) throw error;

    const stepsByMethodId = new Map<string, MethodSelectionOptionWithSteps["steps"]>();
    for (const step of data ?? []) {
        const current = stepsByMethodId.get(step.method_id) ?? [];
        current.push({
            id: step.id,
            order: step.step_order,
            title: step.title,
            weight: toNullableSelectionStepWeight(step.weight),
        });
        stepsByMethodId.set(step.method_id, current);
    }

    return methods.map((method) => ({
        ...method,
        steps: stepsByMethodId.get(method.id) ?? [],
    }));
}
