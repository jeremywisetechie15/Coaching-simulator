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
import { listSkillSelectionOptions } from "@/features/skills/server";
import { UnauthorizedError } from "@/lib/server/errors";
import { APP_NAVIGATION_LABEL, buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{ returnTo?: string }>;
}

export const metadata = {
    title: "Ajouter une scorecard | MaiaCoach",
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

        redirect(buildAuthRedirectHref(withReturnTo(SCORECARD_ROUTES.app.create, returnTo)));
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.scorecards)) {
        return (
            <AccessDeniedPage
                activePrimaryItem={APP_NAVIGATION_LABEL.scorecards}
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    const [methodOptions, organizationOptions, skillOptions] = await Promise.all([
        listScorecardMethodOptions(),
        listScorecardOrganizationOptions(),
        listSkillSelectionOptions(),
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
