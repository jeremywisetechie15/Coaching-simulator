import IframeClient from "./IframeClient";
import CoachHeygenClient from "./coach-full-mode/CoachHeygenClient";
import { AlertCircle } from "lucide-react";
import { isRoleplayCoachMode } from "@/features/roleplays/domain";

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
        coach_mode?: string;
        coach_session_id?: string;
        step?: string;        // "1" | "2" | "3" | "4"
        variant?: string;     // "coach" (pour mode persona avec coaching)
        coach_provider?: string;
    }>;
}) {
    // Await the searchParams on the server
    const params = await searchParams;

    console.log("🔍 Server: searchParams received:", params);

    // Validate parameters
    const isCoachMode = params.mode === "coach";
    const coachMode = isRoleplayCoachMode(params.coach_mode) ? params.coach_mode : undefined;
    const isCoachWithScenarioMode = isCoachMode && Boolean(coachMode);
    const isPersonaCoachVariant = params.variant === "coach" && params.scenario_id;

    // scenario_id is required for:
    // - standard mode (persona)
    // - coach mode with an explicit roleplay coach mode
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

    // Every explicit roleplay coach mode requires scenario_id.
    if (isCoachWithScenarioMode && !params.scenario_id) {
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

    const shouldUseCoachHeygen = isCoachMode && params.coach_provider === "heygen";

    if (shouldUseCoachHeygen) {
        return (
            <CoachHeygenClient
                scenarioId={params.scenario_id}
                mode={params.mode || "coach"}
                refSessionId={params.ref_session_id}
                model={params.model || "gpt-realtime-1.5"}
                coachId={params.coach_id}
                coachMode={coachMode}
                coachSessionId={params.coach_session_id}
                step={params.step ? parseInt(params.step, 10) : undefined}
            />
        );
    }

    return (
        <IframeClient
            scenarioId={params.scenario_id}
            mode={params.mode || "standard"}
            refSessionId={params.ref_session_id}
            model={params.model || "gpt-realtime-1.5"}
            coachId={params.coach_id}
            coachMode={coachMode}
            coachSessionId={params.coach_session_id}
            step={params.step ? parseInt(params.step, 10) : undefined}
            variant={params.variant as "coach" | undefined}
        />
    );
}
