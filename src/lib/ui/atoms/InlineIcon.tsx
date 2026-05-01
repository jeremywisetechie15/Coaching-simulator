import type { LucideIcon } from "lucide-react";

interface InlineIconProps {
    icon: LucideIcon;
    className?: string;
}

export function InlineIcon({ icon: Icon, className }: InlineIconProps) {
    return <Icon className={className} />;
}
