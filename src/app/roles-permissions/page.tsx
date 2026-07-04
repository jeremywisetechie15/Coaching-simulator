import { redirect } from "next/navigation";
import { UnauthorizedError } from "@/lib/server/errors";
import { RolesPermissionsPage } from "@/features/permissions/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { getCurrentProfile } from "@/features/profile/server";

export const metadata = {
    title: "Rôles & Permissions | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/roles-permissions");
    }

    const profileValues = toProfileFormValues(profile);

    return (
        <RolesPermissionsPage
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            platformRole={profileValues.platformRole}
        />
    );
}
