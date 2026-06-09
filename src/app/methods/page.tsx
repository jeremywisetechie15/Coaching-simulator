import { redirect } from "next/navigation";
import { MethodsPage } from "@/features/methods/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Méthodes et Playbooks | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/methods");
    }

    return <MethodsPage profileValues={toProfileFormValues(profile)} />;
}
