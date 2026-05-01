import type { LucideIcon } from "lucide-react";

interface InputIconProps {
    icon: LucideIcon;
}

export function InputIcon({ icon: Icon }: InputIconProps) {
    return (
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    );
}
