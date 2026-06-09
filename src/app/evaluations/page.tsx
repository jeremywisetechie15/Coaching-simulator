import { redirect } from "next/navigation";
import { EvaluationsPage } from "@/features/evaluations/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Évaluations | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/evaluations");
    }

    return <EvaluationsPage profileValues={toProfileFormValues(profile)} />;
}
