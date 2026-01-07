import IframeClient from "./IframeClient";
import { AlertCircle, Loader2 } from "lucide-react";

// Force dynamic rendering to ensure searchParams work correctly
export const dynamic = 'force-dynamic';

export default async function IframePage({
    searchParams,
}: {
    searchParams: Promise<{ scenario_id?: string; mode?: string; ref_session_id?: string; model?: string; coach_id?: string }>;
}) {
    // Await the searchParams on the server
    const params = await searchParams;

    console.log("🔍 Server: searchParams received:", params);

    // Validate scenario_id (only required for standard mode)
    const isCoachMode = params.mode === "coach";
    if (!isCoachMode && !params.scenario_id) {
        return (
            <div className="h-screen w-full bg-[#E8EEFF] flex flex-col items-center justify-center gap-4 p-6">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <p className="text-red-500 text-center">Paramètre manquant : scenario_id</p>
                <code className="text-xs text-gray-500 bg-white px-3 py-2 rounded border border-gray-200">
                    ?scenario_id=UUID (mode standard) ou ?mode=coach (mode coach)
                </code>
            </div>
        );
    }

    return (
        <IframeClient
            scenarioId={params.scenario_id}
            mode={params.mode || "standard"}
            refSessionId={params.ref_session_id}
            model={params.model || "gpt-realtime"}
            coachId={params.coach_id}
        />
    );
}

