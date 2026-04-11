import { prepareHeygenTestSession } from "./actions";
import HeygenTestClient from "./HeygenTestClient";

export const metadata = {
    title: "Test LiveAvatar — Coaching Simulator",
    description: "Page de test d'intégration LiveAvatar (HeyGen) avec OpenAI comme LLM",
};

interface PageProps {
    searchParams: Promise<{ scenario_id?: string; mode?: string; coach_mode?: string }>;
}

export default async function HeygenTestPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const result = await prepareHeygenTestSession({
        scenarioId: params.scenario_id,
        mode: params.mode,
        coachMode: params.coach_mode as "before_training" | "after_training" | "notation" | undefined,
    });

    if (!result.success || !result.data) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#0f0f1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "system-ui",
                color: "white",
                flexDirection: "column",
                gap: "12px",
            }}>
                <p style={{ color: "#ef4444", fontSize: "16px" }}>
                    ❌ Erreur de configuration
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                    {result.error || "Impossible de préparer la session"}
                </p>
            </div>
        );
    }

    return (
        <HeygenTestClient
            systemInstructions={result.data.systemInstructions}
            scenarioTitle={result.data.scenarioTitle}
            coachName={result.data.coachName}
        />
    );
}
