import { redirect } from "next/navigation";
import { SkillsPage } from "@/features/skills/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listSkills } from "@/features/skills/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Compétences | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/skills");
    }

    const skills = await listSkills();

    return <SkillsPage profileValues={toProfileFormValues(profile)} skills={skills} />;
}
