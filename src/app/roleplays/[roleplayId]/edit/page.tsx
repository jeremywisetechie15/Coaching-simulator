import { notFound, redirect } from "next/navigation";
import { CreateRoleplayPage } from "@/features/roleplays/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import {
    getRoleplayById,
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
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ roleplayId: string }>;
}

export const metadata = {
    title: "Modifier le scénario | MaiaCoach",
};

export default async function Page({ params }: PageProps) {
    const { roleplayId } = await params;
    let profile;
    let roleplay;

    try {
        [profile, roleplay] = await Promise.all([getCurrentProfile(), getRoleplayById(roleplayId)]);
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/roleplays/${roleplayId}/edit`);
        }

        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
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
            initialRoleplay={roleplay}
            methodOptions={methodOptions}
            organizationOptions={organizationOptions}
            personaOptions={personaOptions}
            profileValues={toProfileFormValues(profile)}
            quizOptions={quizOptions}
            roleplayId={roleplayId}
            scorecardOptions={scorecardOptions}
            skillOptions={skillOptions}
            userOptions={userOptions}
        />
    );
}
