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

export const metadata = {
    title: "Ajouter une méthode | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/methods/new");
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
