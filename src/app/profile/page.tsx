import { redirect } from "next/navigation";
import { UnauthorizedError } from "@/lib/server/errors";
import { ProfilePage } from "@/features/profile/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";

export const metadata = {
    title: "Mon Profil | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/profile");
    }

    return <ProfilePage initialProfileValues={toProfileFormValues(profile)} />;
}
