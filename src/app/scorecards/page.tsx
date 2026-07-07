import { redirect } from "next/navigation";
import { ScorecardsPage } from "@/features/scorecards/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listScorecards } from "@/features/scorecards/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Scorecards | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/scorecards");
    }

    const scorecards = await listScorecards();

    return <ScorecardsPage profileValues={toProfileFormValues(profile)} scorecards={scorecards} />;
}
