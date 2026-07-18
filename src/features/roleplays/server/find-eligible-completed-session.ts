import type { createClient } from "@/lib/supabase/server";
import { MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS } from "@/features/roleplays/domain/roleplay-session-eligibility";

export interface EligibleCompletedRoleplaySession {
    id: string;
    notation_json: unknown;
}

/**
 * Sélection SSOT d'une session terminée admissible à l'évaluation.
 * Le filtre utilisateur reste optionnel afin de préserver les contrats d'accès existants.
 */
export async function findEligibleCompletedRoleplaySession(
    supabase: Awaited<ReturnType<typeof createClient>>,
    input: {
        refSessionId?: string;
        scenarioId: string;
        userId?: string | null;
    },
) {
    let query = supabase
        .from("sessions")
        .select("id, notation_json")
        .eq("scenario_id", input.scenarioId)
        .eq("status", "completed")
        .gte("duration_seconds", MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS);

    if (input.refSessionId) {
        query = query.eq("id", input.refSessionId);
    } else {
        query = query.order("created_at", { ascending: false }).limit(1);
    }

    if (input.userId) {
        query = query.eq("user_id", input.userId);
    }

    return query.maybeSingle<EligibleCompletedRoleplaySession>();
}
