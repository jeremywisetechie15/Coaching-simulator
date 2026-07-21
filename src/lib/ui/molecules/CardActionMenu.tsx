import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Box, Button, InlineIcon } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface CardActionMenuProps {
    children: ReactNode;
}

export function CardActionMenu({ children }: CardActionMenuProps) {
    return (
        <Box className={cn(
            "absolute right-0 top-9 w-[168px] overflow-hidden p-1.5",
            uiTokens.action.menuPanel,
            uiTokens.action.menuPopover,
        )}>
            {children}
        </Box>
    );
}

interface CardActionMenuLinkProps {
    href: string;
    icon: LucideIcon;
    label: string;
}

export function CardActionMenuLink({ href, icon, label }: CardActionMenuLinkProps) {
    return (
        <Link href={href} className={cn(uiTokens.action.menuItem, uiTokens.text.subtle)}>
            <InlineIcon icon={icon} className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
        </Link>
    );
}

interface CardActionMenuButtonProps {
    danger?: boolean;
    disabled?: boolean;
    icon: LucideIcon;
    label: string;
    onClick: () => void;
}

export function CardActionMenuButton({
    danger,
    disabled,
    icon,
    label,
    onClick,
}: CardActionMenuButtonProps) {
    return (
        <Button
            disabled={disabled}
            onClick={onClick}
            className={cn(
                uiTokens.action.menuItem,
                "text-left disabled:cursor-not-allowed disabled:opacity-60",
                danger ? uiTokens.text.danger : uiTokens.text.subtle,
            )}
        >
            <InlineIcon icon={icon} className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
        </Button>
    );
}
