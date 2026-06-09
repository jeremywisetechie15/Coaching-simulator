import { redirect } from "next/navigation";
import { CreateSkillPage } from "@/features/skills/components";
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

    return <CreateSkillPage profileValues={toProfileFormValues(profile)} />;
}
