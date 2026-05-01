import { Loader2 } from "lucide-react";
import { InlineIcon, PrimaryButton } from "@/lib/ui/atoms";

interface SubmitButtonProps {
    isSubmitting: boolean;
    label: string;
    loadingLabel: string;
}

export function SubmitButton({ isSubmitting, label, loadingLabel }: SubmitButtonProps) {
    return (
        <PrimaryButton disabled={isSubmitting}>
            {isSubmitting ? (
                <>
                    <InlineIcon icon={Loader2} className="h-5 w-5 animate-spin" />
                    {loadingLabel}
                </>
            ) : (
                label
            )}
        </PrimaryButton>
    );
}
