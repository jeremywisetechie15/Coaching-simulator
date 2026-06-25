import { redirect } from "next/navigation";
import { CreateScorecardPage } from "@/features/scorecards/components";
import { listScorecardMethodOptions, listScorecardOrganizationOptions } from "@/features/scorecards/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listSkillOptions } from "@/features/skills/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Ajouter une scorecard | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/scorecards/new");
    }

    const [methodOptions, organizationOptions, skillOptions] = await Promise.all([
        listScorecardMethodOptions(),
        listScorecardOrganizationOptions(),
        listSkillOptions(),
    ]);

    return (
        <CreateScorecardPage
            methodOptions={methodOptions}
            organizationOptions={organizationOptions}
            profileValues={toProfileFormValues(profile)}
            skillOptions={skillOptions}
        />
    );
}
