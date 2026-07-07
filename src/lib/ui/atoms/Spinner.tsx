import { Loader2 } from "lucide-react";
import { InlineIcon } from "./InlineIcon";
import { cn } from "@/lib/ui/utils/cn";

/** Indicateur de chargement animé (atome réutilisable). */
export function Spinner({ className }: { className?: string }) {
    return <InlineIcon icon={Loader2} className={cn("animate-spin", className)} />;
}
