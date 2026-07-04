import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/features/auth/server";
import {
    RoleplaySessionEvaluationPrintPage,
    RoleplaySessionReportPrintPage,
} from "@/features/roleplays/components";
import { ROLEPLAY_PDF_TEMPLATES, parseRoleplayPdfTemplate } from "@/features/roleplays/domain";
import { getRoleplaySessionReport } from "@/features/roleplays/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ sessionId: string }>;
    searchParams: Promise<{ template?: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Rapport PDF | Évaluation de la simulation | MaiaCoach",
};

export default async function Page({ params, searchParams }: PageProps) {
    const { sessionId } = await params;
    const { template: templateParam } = await searchParams;
    const template = parseRoleplayPdfTemplate(templateParam);
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

    if (template === ROLEPLAY_PDF_TEMPLATES.evaluation) {
        return (
            <RoleplaySessionEvaluationPrintPage
                evaluation={report.evaluation}
                roleplay={report.roleplay}
                session={report.session}
            />
        );
    }

    return (
        <RoleplaySessionReportPrintPage
            evaluation={report.evaluation}
            progress={report.progress}
            roleplay={report.roleplay}
            session={report.session}
        />
    );
}
