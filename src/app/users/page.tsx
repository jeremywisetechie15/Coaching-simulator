import { redirect } from "next/navigation";
import { UnauthorizedError } from "@/lib/server/errors";
import { UsersPage } from "@/features/users/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { getCurrentProfile } from "@/features/profile/server";

export const metadata = {
    title: "Utilisateurs | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/users");
    }

    const profileValues = toProfileFormValues(profile);

    return (
        <UsersPage
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
        />
    );
}
