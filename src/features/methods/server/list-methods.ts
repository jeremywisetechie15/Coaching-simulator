import { requireAuth } from "@/features/auth/server";
import type { MethodListItem } from "@/features/methods/domain/method";
import { createClient } from "@/lib/supabase/server";
import { mapMethodRowToListItem, type MethodRow } from "./method.mapper";
import { withMethodOrganizationNames } from "./method-organization-names";
import { METHOD_SELECT } from "./method.persistence";

export async function listMethods(): Promise<MethodListItem[]> {
    await requireAuth();
    const supabase = await createClient();
    const { data: methodRows, error } = await supabase
        .from("methods")
        .select(METHOD_SELECT)
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
