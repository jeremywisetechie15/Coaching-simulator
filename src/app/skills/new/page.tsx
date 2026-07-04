import { redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreateSkillPage } from "@/features/skills/components";
import { listSkillGroupOptions, listSkillOrganizationOptions, listSkillUserOptions } from "@/features/skills/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Ajouter une compétence | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/skills/new");
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.skills)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Compétences"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    const [organizationOptions, groupOptions, userOptions] = await Promise.all([
        listSkillOrganizationOptions(),
        listSkillGroupOptions(),
        listSkillUserOptions(),
    ]);

    return (
        <CreateSkillPage
            groupOptions={groupOptions}
            organizationOptions={organizationOptions}
            profileValues={profileValues}
            userOptions={userOptions}
        />
    );
}
