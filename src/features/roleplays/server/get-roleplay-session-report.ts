import type { MethodDetail } from "@/features/methods/domain/method";
import { getMethodById } from "@/features/methods/server";
import type { Evaluation } from "@/features/roleplays/data/evaluation";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import { NotFoundError } from "@/lib/server/errors";
import { getRoleplaySessionEvaluation } from "./get-roleplay-session-evaluation";

export interface RoleplaySessionReport {
    evaluation: Evaluation;
    method: MethodDetail | null;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

export async function getRoleplaySessionReport(sessionId: string, userId?: string): Promise<RoleplaySessionReport> {
    const view = await getRoleplaySessionEvaluation(sessionId, userId);
    let method: MethodDetail | null = null;

    if (view.roleplay.methodId) {
        try {
            method = await getMethodById(view.roleplay.methodId);
        } catch (error) {
            if (!(error instanceof NotFoundError)) {
                throw error;
            }
        }
    }

    return {
        ...view,
        method,
    };
}
