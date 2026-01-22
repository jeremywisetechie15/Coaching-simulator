import IframeClient from "./IframeClient";
import { AlertCircle } from "lucide-react";

// Force dynamic rendering to ensure searchParams work correctly
export const dynamic = 'force-dynamic';

export default async function IframePage({
    searchParams,
}: {
    searchParams: Promise<{
        scenario_id?: string;
        mode?: string;
        ref_session_id?: string;
        model?: string;
        coach_id?: string;
        coach_mode?: string;  // "before_training" | "after_training" | "notation"
        step?: string;        // "1" | "2" | "3" | "4"
        variant?: string;     // "coach" (pour mode persona avec coaching)
    }>;
}) {
    // Await the searchParams on the server
    const params = await searchParams;

    console.log("🔍 Server: searchParams received:", params);

    // Validate parameters
    const isCoachMode = params.mode === "coach";
    const isCoachWithTrainingMode = isCoachMode && (params.coach_mode === "before_training" || params.coach_mode === "after_training" || params.coach_mode === "notation");
    const isPersonaCoachVariant = params.variant === "coach" && params.scenario_id;

    // scenario_id is required for:
    // - standard mode (persona)
    // - coach mode with before_training or after_training or notation
    // - variant=coach
    if (!isCoachMode && !isPersonaCoachVariant && !params.scenario_id) {
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

    // For coach mode with before_training, after_training, or notation, scenario_id is required
    if (isCoachWithTrainingMode && !params.scenario_id) {
        return (
            <div className="h-screen w-full bg-[#E8EEFF] flex flex-col items-center justify-center gap-4 p-6">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <p className="text-red-500 text-center">Paramètre manquant : scenario_id</p>
                <code className="text-xs text-gray-500 bg-white px-3 py-2 rounded border border-gray-200">
                    ?mode=coach&coach_mode={params.coach_mode}&scenario_id=UUID
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
            coachMode={params.coach_mode as "before_training" | "after_training" | "notation" | undefined}
            step={params.step ? parseInt(params.step, 10) : undefined}
            variant={params.variant as "coach" | undefined}
        />
    );
}

