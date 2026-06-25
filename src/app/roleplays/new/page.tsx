import { redirect } from "next/navigation";
import { CreateRoleplayPage } from "@/features/roleplays/components";
import {
    listRoleplayCoachOptions,
    listRoleplayGroupOptions,
    listRoleplayMethodOptions,
    listRoleplayOrganizationOptions,
    listRoleplayPersonaOptions,
    listRoleplayQuizOptions,
    listRoleplayScorecardOptions,
    listRoleplaySkillOptions,
    listRoleplayUserOptions,
} from "@/features/roleplays/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Créer un scénario | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/roleplays/new");
    }

    const [
        personaOptions,
        coachOptions,
        methodOptions,
        quizOptions,
        scorecardOptions,
        skillOptions,
        organizationOptions,
        groupOptions,
        userOptions,
    ] = await Promise.all([
        listRoleplayPersonaOptions(),
        listRoleplayCoachOptions(),
        listRoleplayMethodOptions(),
        listRoleplayQuizOptions(),
        listRoleplayScorecardOptions(),
        listRoleplaySkillOptions(),
        listRoleplayOrganizationOptions(),
        listRoleplayGroupOptions(),
        listRoleplayUserOptions(),
    ]);

    return (
        <CreateRoleplayPage
            coachOptions={coachOptions}
            groupOptions={groupOptions}
            methodOptions={methodOptions}
            organizationOptions={organizationOptions}
            personaOptions={personaOptions}
            profileValues={toProfileFormValues(profile)}
            quizOptions={quizOptions}
            scorecardOptions={scorecardOptions}
            skillOptions={skillOptions}
            userOptions={userOptions}
        />
    );
}
