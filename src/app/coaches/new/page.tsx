import { redirect } from "next/navigation";
import { CreateCoachPage } from "@/features/coaches/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Créer un coach IA | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/coaches/new");
    }

    return <CreateCoachPage profileValues={toProfileFormValues(profile)} />;
}
