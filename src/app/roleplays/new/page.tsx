import { redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreateRoleplayPage } from "@/features/roleplays/components";
import {
    listRoleplayCoachOptions,
    listRoleplayMethodOptions,
    listRoleplayPersonaOptions,
    listRoleplayQuizOptions,
    listRoleplayScorecardOptions,
    listRoleplayTargetOptions,
} from "@/features/roleplays/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{ returnTo?: string }>;
}

export const metadata = {
    title: "Créer un scénario | MaiaCoach",
};

export default async function Page({ searchParams }: PageProps) {
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(buildAuthRedirectHref(withReturnTo("/roleplays/new", returnTo)));
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
        targetOptions,
    ] = await Promise.all([
        listRoleplayPersonaOptions(),
        listRoleplayCoachOptions(),
        listRoleplayMethodOptions(),
        listRoleplayQuizOptions(),
        listRoleplayScorecardOptions(),
        listRoleplayTargetOptions(),
    ]);

    return (
        <CreateRoleplayPage
            coachOptions={coachOptions}
            groupOptions={targetOptions.groups}
            methodOptions={methodOptions}
            organizationOptions={targetOptions.organizations}
            personaOptions={personaOptions}
            profileValues={profileValues}
            quizOptions={quizOptions}
            scorecardOptions={scorecardOptions}
            userOptions={targetOptions.users}
        />
    );
}
