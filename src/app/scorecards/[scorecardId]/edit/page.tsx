import { notFound, redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { CreateScorecardPage } from "@/features/scorecards/components";
import { SCORECARD_ROUTES } from "@/features/scorecards/domain";
import {
    getScorecardEditorById,
    listScorecardMethodOptions,
    listScorecardOrganizationOptions,
} from "@/features/scorecards/server";
import { listSkillSelectionOptions } from "@/features/skills/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { APP_NAVIGATION_LABEL, buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{ scorecardId: string }>;
    searchParams?: Promise<{ returnTo?: string }>;
}

export const metadata = {
    title: "Modifier une scorecard | MaiaCoach",
};

export default async function Page({ params, searchParams }: PageProps) {
    const { scorecardId } = await params;
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;
    let scorecard;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(buildAuthRedirectHref(withReturnTo(SCORECARD_ROUTES.app.edit(scorecardId), returnTo)));
        }

        throw error;
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

    try {
        scorecard = await getScorecardEditorById(scorecardId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    }

    const currentSkillIds = [...new Set(scorecard.steps.flatMap((step) =>
        step.criteria.flatMap((criterion) => criterion.competenceId ? [criterion.competenceId] : [])
    ))];
    const [methodOptions, organizationOptions, skillOptions] = await Promise.all([
        listScorecardMethodOptions({ includeUnavailableIds: [scorecard.methodId] }),
        listScorecardOrganizationOptions({
            includeUnavailableIds: scorecard.organizationId ? [scorecard.organizationId] : [],
        }),
        listSkillSelectionOptions({ includeUnavailableIds: currentSkillIds }),
    ]);

    return (
        <CreateScorecardPage
            initialScorecard={scorecard}
            methodOptions={methodOptions}
            organizationOptions={organizationOptions}
            profileValues={profileValues}
            scorecardId={scorecardId}
            skillOptions={skillOptions}
        />
    );
}
