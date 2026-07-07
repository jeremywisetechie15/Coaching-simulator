import { redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreateRoleplayPage } from "@/features/roleplays/components";
import {
    listRoleplayCoachOptions,
    listRoleplayGroupOptions,
    listRoleplayMethodOptions,
    listRoleplayOrganizationOptions,
    listRoleplayPersonaOptions,
    listRoleplayQuizOptions,
    listRoleplayScorecardOptions,
    listRoleplayUserOptions,
} from "@/features/roleplays/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Créer un scénario | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/roleplays/new");
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.roleplays)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Roleplays"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    const [
        personaOptions,
        coachOptions,
        methodOptions,
        quizOptions,
        scorecardOptions,
        organizationOptions,
        groupOptions,
        userOptions,
    ] = await Promise.all([
        listRoleplayPersonaOptions(),
        listRoleplayCoachOptions(),
        listRoleplayMethodOptions(),
        listRoleplayQuizOptions(),
        listRoleplayScorecardOptions(),
        listRoleplayOrganizationOptions(),
        listRoleplayGroupOptions(),
        listRoleplayUserOptions(),
    ]);

    return (
        <CreateRoleplayPage
            coachOptions={coachOptions}
            groupOptions={groupOptions}
            methodOptions={methodOptions}
            organizationOptions={organizationOptions}
            personaOptions={personaOptions}
            profileValues={profileValues}
            quizOptions={quizOptions}
            scorecardOptions={scorecardOptions}
            userOptions={userOptions}
        />
    );
}
