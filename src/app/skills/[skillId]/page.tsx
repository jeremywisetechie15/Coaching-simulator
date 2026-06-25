import { notFound, redirect } from "next/navigation";
import { SkillDetailPage } from "@/features/skills/components";
import { getSkillById } from "@/features/skills/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ skillId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { skillId } = await params;

    try {
        const skill = await getSkillById(skillId);

        return {
            title: `${skill.name} | MaiaCoach`,
        };
    } catch {
        return {
            title: "Compétence | MaiaCoach",
        };
    }
}

export default async function Page({ params }: PageProps) {
    const { skillId } = await params;
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/skills/${skillId}`);
    }

    let skill;

    try {
        skill = await getSkillById(skillId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    }

    return <SkillDetailPage profileValues={toProfileFormValues(profile)} skill={skill} />;
}
