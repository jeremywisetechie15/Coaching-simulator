import { CheckCircle2, Info } from "lucide-react";
import { InlineIcon } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface StatusMessageProps {
    message: string;
    tone?: "info" | "success";
}

export function StatusMessage({ message, tone = "info" }: StatusMessageProps) {
    const Icon = tone === "success" ? CheckCircle2 : Info;

    return (
        <div
            role="status"
            className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
                uiTokens.tone[tone].soft,
            )}
        >
            <InlineIcon icon={Icon} className="mt-0.5 h-4 w-4 flex-none" />
            <span>{message}</span>
        </div>
    );
}
