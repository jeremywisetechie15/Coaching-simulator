import { notFound, redirect } from "next/navigation";
import { RoleplayStepCoachPage } from "@/features/roleplays/components";
import { getRoleplayMethod, roleplays } from "@/features/roleplays/data/roleplays";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ roleplayId: string; stepIndex: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { roleplayId, stepIndex } = await params;
    const roleplay = roleplays.find((item) => item.id === roleplayId);
    const method = roleplay ? getRoleplayMethod(roleplay) : null;
    const step = method?.steps[Number(stepIndex) - 1];

    return {
        title: step
            ? `${step.title} — Coach IA | MaiaCoach`
            : "Coach IA | Roleplays | MaiaCoach",
    };
}

export default async function Page({ params }: PageProps) {
    const { roleplayId, stepIndex } = await params;
    const roleplay = roleplays.find((item) => item.id === roleplayId);

    if (!roleplay) {
        notFound();
    }

    const method = getRoleplayMethod(roleplay);

    if (!method) {
        notFound();
    }

    const stepNumber = Number(stepIndex);
    const step = Number.isInteger(stepNumber) ? method.steps[stepNumber - 1] : undefined;

    if (!step) {
        notFound();
    }

    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/roleplays/${roleplayId}/steps/${stepIndex}`);
    }

    return (
        <RoleplayStepCoachPage
            profileValues={toProfileFormValues(profile)}
            roleplay={roleplay}
            method={method}
            step={step}
            stepNumber={stepNumber}
        />
    );
}
