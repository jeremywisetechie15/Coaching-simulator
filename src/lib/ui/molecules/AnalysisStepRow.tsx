import { CheckCircle2, Circle } from "lucide-react";
import { Box, InlineIcon, Spinner, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export type AnalysisStepStatus = "active" | "done" | "pending";

const rowClasses: Record<AnalysisStepStatus, string> = {
    active: uiTokens.analysisLoader.rowActive,
    done: uiTokens.analysisLoader.rowDone,
    pending: uiTokens.analysisLoader.rowPending,
};

/** Ligne d'étape d'analyse avec son état (fait / en cours / en attente). */
export function AnalysisStepRow({ label, status }: { label: string; status: AnalysisStepStatus }) {
    return (
        <Box className={cn(uiTokens.analysisLoader.row, rowClasses[status])}>
            {status === "done" && <InlineIcon icon={CheckCircle2} className={uiTokens.analysisLoader.iconDone} />}
            {status === "active" && <Spinner className={uiTokens.analysisLoader.iconActive} />}
            {status === "pending" && <InlineIcon icon={Circle} className={uiTokens.analysisLoader.iconPending} />}
            <Text as="span">{label}</Text>
        </Box>
    );
}
