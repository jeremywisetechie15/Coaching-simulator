import type { LucideIcon } from "lucide-react";

interface InlineIconProps {
    icon: LucideIcon;
    className?: string;
    strokeWidth?: number;
}

export function InlineIcon({ icon: Icon, className, strokeWidth }: InlineIconProps) {
    return <Icon className={className} strokeWidth={strokeWidth} />;
}
