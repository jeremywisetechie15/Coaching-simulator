import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/features/auth/server";
import { RoleplaySessionReportPrintPage } from "@/features/roleplays/components";
import { getRoleplaySessionReport } from "@/features/roleplays/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ sessionId: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Rapport PDF | Évaluation de la simulation | MaiaCoach",
};

export default async function Page({ params }: PageProps) {
    const { sessionId } = await params;
    let userId: string;

    try {
        const context = await requireAuth();
        userId = context.userId;
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/roleplays/history/${sessionId}/print`);
        }

        throw error;
    }

    const report = await getRoleplaySessionReport(sessionId, userId).catch((error: unknown) => {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    });

    return (
        <RoleplaySessionReportPrintPage
            evaluation={report.evaluation}
            roleplay={report.roleplay}
            session={report.session}
        />
    );
}
