import { Check, Save } from "lucide-react";
import { Button, InlineIcon } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface ContentEditorSubmitActionsProps {
    canSaveDraft?: boolean;
    canSubmit?: boolean;
    isDraft: boolean;
    isPending: boolean;
    publishLabel: string;
    submitLabel: string;
}

export function ContentEditorSubmitActions({
    canSaveDraft = true,
    canSubmit = true,
    isDraft,
    isPending,
    publishLabel,
    submitLabel,
}: ContentEditorSubmitActionsProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row">
            {isDraft && (
                <Button
                    type="submit"
                    name="contentEditorAction"
                    value="save-draft"
                    disabled={isPending || !canSaveDraft}
                    className={cn(
                        uiTokens.action.secondaryButton,
                        "h-11 flex-1 gap-2 disabled:cursor-not-allowed disabled:opacity-70",
                    )}
                >
                    <InlineIcon icon={Save} className="h-4 w-4" />
                    {isPending ? "Enregistrement..." : "Enregistrer le brouillon"}
                </Button>
            )}
            <Button
                type="submit"
                name="contentEditorAction"
                value={isDraft ? "publish" : "save"}
                disabled={isPending || !canSubmit}
                className={cn(
                    uiTokens.action.primaryButton,
                    "flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-[13px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-70",
                )}
            >
                <InlineIcon icon={Check} className="h-4 w-4" />
                {isPending ? "Enregistrement..." : isDraft ? publishLabel : submitLabel}
            </Button>
        </div>
    );
}
