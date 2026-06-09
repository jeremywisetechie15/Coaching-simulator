import { redirect } from "next/navigation";
import { CreateMethodPage } from "@/features/methods/components";
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

    return <CreateMethodPage profileValues={toProfileFormValues(profile)} />;
}
