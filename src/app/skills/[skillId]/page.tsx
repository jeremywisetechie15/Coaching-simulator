import { notFound, redirect } from "next/navigation";
import { SkillDetailPage } from "@/features/skills/components";
import { getSkillById } from "@/features/skills/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{ skillId: string }>;
    searchParams?: Promise<{ returnTo?: string }>;
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

export default async function Page({ params, searchParams }: PageProps) {
    const { skillId } = await params;
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(buildAuthRedirectHref(withReturnTo(`/skills/${skillId}`, returnTo)));
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
