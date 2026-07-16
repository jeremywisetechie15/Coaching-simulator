import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveScorecardDto } from "@/features/scorecards/dto";
import { AppError } from "@/lib/server/errors";

export async function assertMethodStepsBelongToMethod(supabase: SupabaseClient, input: SaveScorecardDto) {
    const methodStepIds = Array.from(new Set(input.steps.map((step) => step.methodStepId)));
    if (methodStepIds.length === 0) return;

    const { data, error } = await supabase
        .from("method_steps")
        .select("id")
        .eq("method_id", input.methodId)
        .in("id", methodStepIds);

    if (error) throw error;

    const validMethodStepIds = new Set((data ?? []).map((row: { id?: string | null }) => row.id).filter(Boolean));
    if (methodStepIds.some((methodStepId) => !validMethodStepIds.has(methodStepId))) {
        throw new AppError(
            "Une étape ne correspond pas à la méthode sélectionnée.",
            400,
            "SCORECARD_METHOD_STEP_MISMATCH",
        );
    }
}
