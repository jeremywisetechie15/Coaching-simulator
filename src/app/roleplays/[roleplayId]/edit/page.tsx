import { notFound, redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreateRoleplayPage } from "@/features/roleplays/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import {
    getRoleplayEditorById,
    listRoleplayCoachOptions,
    listRoleplayGroupOptions,
    listRoleplayMethodOptions,
    listRoleplayOrganizationOptions,
    listRoleplayPersonaOptions,
    listRoleplayQuizOptions,
    listRoleplayScorecardOptions,
    listRoleplayUserOptions,
} from "@/features/roleplays/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{ roleplayId: string }>;
    searchParams?: Promise<{ returnTo?: string }>;
}

export const metadata = {
    title: "Modifier le scénario | MaiaCoach",
};

export default async function Page({ params, searchParams }: PageProps) {
    const { roleplayId } = await params;
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;
    let roleplay;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(buildAuthRedirectHref(withReturnTo(`/roleplays/${roleplayId}/edit`, returnTo)));
        }

        throw error;
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

    try {
        roleplay = await getRoleplayEditorById(roleplayId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
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
            initialRoleplay={roleplay}
            methodOptions={methodOptions}
            organizationOptions={organizationOptions}
            personaOptions={personaOptions}
            profileValues={profileValues}
            quizOptions={quizOptions}
            roleplayId={roleplayId}
            scorecardOptions={scorecardOptions}
            userOptions={userOptions}
        />
    );
}
