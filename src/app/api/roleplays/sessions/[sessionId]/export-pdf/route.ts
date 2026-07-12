import { NextRequest } from "next/server";
import { requireAuth } from "@/features/auth/server";
import { ROLEPLAY_ROUTES, parseRoleplayPdfTemplate } from "@/features/roleplays/domain";
import { launchPdfBrowser } from "@/lib/pdf/launch-pdf-browser";

interface RouteContext {
    params: Promise<{ sessionId: string }>;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function reportFileName(sessionId: string, template: string) {
    return `maia-coach-${template}-${sessionId.replace(/[^a-zA-Z0-9_-]/g, "")}.pdf`;
}

export async function GET(request: NextRequest, context: RouteContext) {
    const { sessionId } = await context.params;
    await requireAuth();

    const template = parseRoleplayPdfTemplate(request.nextUrl.searchParams.get("template"));
    const printUrl = new URL(ROLEPLAY_ROUTES.app.sessionHistoryPrint(sessionId, template), request.url);
    const cookieHeader = request.headers.get("cookie");
    let browser;

    try {
        browser = await launchPdfBrowser();
        const page = await browser.newPage();
        await page.setViewport({ height: 1600, width: 1280 });
        if (cookieHeader) await page.setExtraHTTPHeaders({ cookie: cookieHeader });

        const response = await page.goto(printUrl.href, {
            timeout: 60_000,
            waitUntil: "networkidle2",
        });

        if (!response?.ok() || page.url().includes("/auth")) {
            return Response.json({ error: "Impossible de générer le PDF de cette session." }, { status: 500 });
        }

        const pdf = await page.pdf({
            format: "A4",
            margin: {
                bottom: "0",
                left: "0",
                right: "0",
                top: "0",
            },
            preferCSSPageSize: true,
            printBackground: true,
        });

        return new Response(new Uint8Array(pdf), {
            headers: {
                "Cache-Control": "no-store",
                "Content-Disposition": `attachment; filename="${reportFileName(sessionId, template)}"`,
                "Content-Type": "application/pdf",
            },
        });
    } catch (error) {
        console.error("PDF generation failed:", error);
        return Response.json({ error: "Impossible de générer le PDF de cette session." }, { status: 500 });
    } finally {
        await browser?.close();
    }
}
