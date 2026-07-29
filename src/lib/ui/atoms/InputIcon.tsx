import type { LucideIcon } from "lucide-react";
import { uiTokens } from "@/lib/ui/tokens";

interface InputIconProps {
    icon: LucideIcon;
    variant?: keyof typeof uiTokens.inputIcon;
}

export function InputIcon({ icon: Icon, variant = "default" }: InputIconProps) {
    return <Icon className={uiTokens.inputIcon[variant]} />;
}
