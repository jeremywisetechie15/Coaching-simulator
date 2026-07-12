import { redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreateQuizPage } from "@/features/evaluations/components";
import {
    listQuizGroupOptions,
    listQuizMethodOptions,
    listQuizOrganizationOptions,
    listQuizUserOptions,
} from "@/features/evaluations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listSkillOptions } from "@/features/skills/server";
import { UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{ returnTo?: string }>;
}

export const metadata = {
    title: "Créer un quiz | MaiaCoach",
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

        redirect(buildAuthRedirectHref(withReturnTo("/evaluations/new", returnTo)));
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.evaluations)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Évaluations"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    const [methodOptions, organizationOptions, groupOptions, userOptions, skillOptions] = await Promise.all([
        listQuizMethodOptions(),
        listQuizOrganizationOptions(),
        listQuizGroupOptions(),
        listQuizUserOptions(),
        listSkillOptions(),
    ]);

    return (
        <CreateQuizPage
            groupOptions={groupOptions}
            methodOptions={methodOptions}
            organizationOptions={organizationOptions}
            profileValues={profileValues}
            skillOptions={skillOptions}
            userOptions={userOptions}
        />
    );
}
