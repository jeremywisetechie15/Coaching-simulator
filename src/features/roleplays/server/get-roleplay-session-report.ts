import type { Evaluation } from "@/features/roleplays/data/evaluation";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import { getRoleplaySessionEvaluation } from "./get-roleplay-session-evaluation";

export interface RoleplaySessionReport {
    evaluation: Evaluation;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

export async function getRoleplaySessionReport(sessionId: string, userId?: string): Promise<RoleplaySessionReport> {
    const view = await getRoleplaySessionEvaluation(sessionId, userId);

    return view;
}
