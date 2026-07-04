import { redirect } from "next/navigation";
import { SessionsHistoryPage } from "@/features/roleplays/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { requireAuth } from "@/features/auth/server";
import { ROLEPLAY_ROUTES } from "@/features/roleplays/domain";
import { listRoleplaySessionHistory } from "@/features/roleplays/server";
import { UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    searchParams?: Promise<{ scenario_id?: string }>;
}

export const metadata = {
    title: "Historique des sessions | MaiaCoach",
};

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams;
    const scenarioId = params?.scenario_id?.trim() || null;
    let profile;
    let context;

    try {
        context = await requireAuth();
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=${encodeURIComponent(scenarioId ? ROLEPLAY_ROUTES.app.historyForRoleplay(scenarioId) : ROLEPLAY_ROUTES.app.history)}`);
    }

    const sessions = await listRoleplaySessionHistory({
        scenarioId,
        userId: context.userId,
    });

    return (
        <SessionsHistoryPage
            backHref={scenarioId ? ROLEPLAY_ROUTES.app.detail(scenarioId) : ROLEPLAY_ROUTES.app.collection}
            profileValues={toProfileFormValues(profile)}
            sessions={sessions}
        />
    );
}
