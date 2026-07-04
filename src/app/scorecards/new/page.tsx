import { redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreateScorecardPage } from "@/features/scorecards/components";
import { SCORECARD_ROUTES } from "@/features/scorecards/domain";
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

        redirect(`/auth?redirect=${SCORECARD_ROUTES.app.create}`);
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.scorecards)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Scorecards"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
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
            profileValues={profileValues}
            skillOptions={skillOptions}
        />
    );
}
