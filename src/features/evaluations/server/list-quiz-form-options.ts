import type { QuizMethodOption, QuizOrganizationOption } from "@/features/evaluations/domain/quiz";
import { listMethods } from "@/features/methods/server";
import { listOrganizations } from "@/features/organizations/server";
import { createClient } from "@/lib/supabase/server";

interface MethodStepOptionRow {
    id: string;
    method_id: string;
    step_order: number;
    title: string;
    weight: number | string | null;
}

function toNullableNumber(value: number | string | null | undefined) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

async function listMethodStepsByMethodId(methodIds: string[]) {
    if (methodIds.length === 0) return new Map<string, QuizMethodOption["steps"]>();

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("method_steps")
        .select("id, method_id, title, step_order, weight")
        .in("method_id", methodIds)
        .order("step_order", { ascending: true })
        .returns<MethodStepOptionRow[]>();

    if (error) throw error;

    const stepsByMethodId = new Map<string, QuizMethodOption["steps"]>();

    for (const step of data ?? []) {
        const current = stepsByMethodId.get(step.method_id) ?? [];
        current.push({
            id: step.id,
            order: step.step_order,
            title: step.title,
            weight: toNullableNumber(step.weight),
        });
        stepsByMethodId.set(step.method_id, current);
    }

    return stepsByMethodId;
}

export async function listQuizMethodOptions(): Promise<QuizMethodOption[]> {
    const methods = await listMethods();
    const stepsByMethodId = await listMethodStepsByMethodId(methods.map((method) => method.id));

    return methods.map((method) => ({
        id: method.id,
        name: method.name,
        steps: stepsByMethodId.get(method.id) ?? [],
    }));
}

export async function listQuizOrganizationOptions(): Promise<QuizOrganizationOption[]> {
    const organizations = await listOrganizations();

    return organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
    }));
}
