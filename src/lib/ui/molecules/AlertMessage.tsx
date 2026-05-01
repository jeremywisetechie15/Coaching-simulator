import { AlertCircle } from "lucide-react";
import { AlertSurface, AlertText, InlineIcon } from "@/lib/ui/atoms";

interface AlertMessageProps {
    message: string;
}

export function AlertMessage({ message }: AlertMessageProps) {
    return (
        <AlertSurface>
            <InlineIcon icon={AlertCircle} className="mt-0.5 h-4 w-4 flex-none" />
            <AlertText>{message}</AlertText>
        </AlertSurface>
    );
}
