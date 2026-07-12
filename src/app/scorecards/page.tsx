import { redirect } from "next/navigation";
import { ScorecardsPage } from "@/features/scorecards/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listScorecards } from "@/features/scorecards/server";
import { UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo, withSearchParams } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{ domain?: string; q?: string; returnTo?: string }>;
}

export const metadata = {
    title: "Scorecards | MaiaCoach",
};

export default async function Page({ searchParams }: PageProps) {
    const filters = searchParams ? await searchParams : {};
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(
            buildAuthRedirectHref(
                withReturnTo(
                    withSearchParams("/scorecards", { domain: filters.domain, q: filters.q }),
                    filters.returnTo,
                ),
            ),
        );
    }

    const scorecards = await listScorecards();

    return <ScorecardsPage profileValues={toProfileFormValues(profile)} scorecards={scorecards} />;
}
