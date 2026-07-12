import { redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { listQuizOptions } from "@/features/evaluations/server";
import { CreateMethodPage } from "@/features/methods/components";
import { listOrganizations } from "@/features/organizations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{ returnTo?: string }>;
}

export const metadata = {
    title: "Ajouter une méthode | MaiaCoach",
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

        redirect(buildAuthRedirectHref(withReturnTo("/methods/new", returnTo)));
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.methods)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Méthodes et Playbook"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    const [organizations, quizOptions] = await Promise.all([
        listOrganizations(),
        listQuizOptions({ unassignedOnly: true }),
    ]);
    const organizationOptions = organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
    }));

    return (
        <CreateMethodPage
            organizationOptions={organizationOptions}
            profileValues={profileValues}
            quizOptions={quizOptions}
        />
    );
}
