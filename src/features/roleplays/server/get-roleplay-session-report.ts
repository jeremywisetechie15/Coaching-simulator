import type { Evaluation } from "@/features/roleplays/data/evaluation";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import type { RoleplayProgress } from "@/features/roleplays/domain";
import { getRoleplayProgress } from "./get-roleplay-progress";
import { getRoleplaySessionEvaluation } from "./get-roleplay-session-evaluation";

export interface RoleplaySessionReport {
    evaluation: Evaluation;
    progress: RoleplayProgress;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

export async function getRoleplaySessionReport(sessionId: string, userId?: string): Promise<RoleplaySessionReport> {
    const view = await getRoleplaySessionEvaluation(sessionId, userId);
    const roleplayId = view.roleplay.scenarioId ?? view.roleplay.id;
    const progress = await getRoleplayProgress(
        roleplayId,
        view.roleplay.description || view.roleplay.detail.context || view.roleplay.name,
        null,
        view.roleplay.methodId,
    );

    return {
        ...view,
        progress,
    };
}
