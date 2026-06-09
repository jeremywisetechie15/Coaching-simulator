import { notFound, redirect } from "next/navigation";
import { RoleplayStepsPage } from "@/features/roleplays/components";
import { getRoleplayMethod, roleplays } from "@/features/roleplays/data/roleplays";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ roleplayId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { roleplayId } = await params;
    const roleplay = roleplays.find((item) => item.id === roleplayId);

    return {
        title: roleplay
            ? `Étapes — ${roleplay.name} | Roleplays | MaiaCoach`
            : "Étapes | Roleplays | MaiaCoach",
    };
}

export default async function Page({ params }: PageProps) {
    const { roleplayId } = await params;
    const roleplay = roleplays.find((item) => item.id === roleplayId);

    if (!roleplay) {
        notFound();
    }

    const method = getRoleplayMethod(roleplay);

    if (!method) {
        notFound();
    }

    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/roleplays/${roleplayId}/steps`);
    }

    return (
        <RoleplayStepsPage
            profileValues={toProfileFormValues(profile)}
            roleplay={roleplay}
            method={method}
        />
    );
}
