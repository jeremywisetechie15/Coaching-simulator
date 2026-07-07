import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface RouteStatusAction {
    href: string;
    label: string;
}

interface RouteStatusStateProps {
    description: string;
    icon: LucideIcon;
    primaryAction?: RouteStatusAction;
    secondaryAction?: RouteStatusAction;
    title: string;
}

export function RouteStatusState({
    description,
    icon,
    primaryAction,
    secondaryAction,
    title,
}: RouteStatusStateProps) {
    return (
        <Box className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-12 md:px-9">
            <CardSurface className={uiTokens.routeStatus.card}>
                <Box className={uiTokens.routeStatus.iconBox}>
                    <InlineIcon icon={icon} className="h-7 w-7" />
                </Box>
                <Text as="h1" className={cn("mt-5 text-[26px] font-extrabold leading-tight", uiTokens.text.heading)}>
                    {title}
                </Text>
                <Text className={cn("mt-3 text-[15px] font-medium leading-7", uiTokens.text.muted)}>
                    {description}
                </Text>

                {(primaryAction || secondaryAction) && (
                    <Box className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                        {primaryAction && (
                            <Link
                                href={primaryAction.href}
                                className={cn(
                                    "flex h-11 items-center justify-center rounded-xl px-5 text-[14px] font-bold text-white transition",
                                    uiTokens.action.primaryButton,
                                )}
                            >
                                {primaryAction.label}
                            </Link>
                        )}
                        {secondaryAction && (
                            <Link href={secondaryAction.href} className={uiTokens.action.secondaryButton}>
                                {secondaryAction.label}
                            </Link>
                        )}
                    </Box>
                )}
            </CardSurface>
        </Box>
    );
}
