import { redirect } from "next/navigation";
import { CreateQuizPage } from "@/features/evaluations/components";
import {
    listQuizGroupOptions,
    listQuizMethodOptions,
    listQuizOrganizationOptions,
    listQuizUserOptions,
} from "@/features/evaluations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listSkillOptions } from "@/features/skills/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Créer un quiz | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/evaluations/new");
    }

    const [methodOptions, organizationOptions, groupOptions, userOptions, skillOptions] = await Promise.all([
        listQuizMethodOptions(),
        listQuizOrganizationOptions(),
        listQuizGroupOptions(),
        listQuizUserOptions(),
        listSkillOptions(),
    ]);

    return (
        <CreateQuizPage
            groupOptions={groupOptions}
            methodOptions={methodOptions}
            organizationOptions={organizationOptions}
            profileValues={toProfileFormValues(profile)}
            skillOptions={skillOptions}
            userOptions={userOptions}
        />
    );
}
