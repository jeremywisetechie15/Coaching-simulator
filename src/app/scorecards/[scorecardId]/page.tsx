import { notFound, redirect } from "next/navigation";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { ScorecardDetailPage } from "@/features/scorecards/components";
import { mapScorecardDetailToView, SCORECARD_ROUTES } from "@/features/scorecards/domain";
import { getScorecardById } from "@/features/scorecards/server";
import { listSkillOptions } from "@/features/skills/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ scorecardId: string }>;
}

export const metadata = {
    title: "Scorecard | MaiaCoach",
};

export default async function Page({ params }: PageProps) {
    const { scorecardId } = await params;
    let profile;
    let scorecard;
    let skillOptions;

    try {
        [profile, scorecard, skillOptions] = await Promise.all([
            getCurrentProfile(),
            getScorecardById(scorecardId),
            listSkillOptions(),
        ]);
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=${SCORECARD_ROUTES.app.detail(scorecardId)}`);
        }

        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    }

    return (
        <ScorecardDetailPage
            profileValues={toProfileFormValues(profile)}
            scorecard={mapScorecardDetailToView(scorecard, skillOptions)}
        />
    );
}
