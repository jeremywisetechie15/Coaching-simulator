import type { PropsWithChildren } from "react";
import { Box } from "@/lib/ui/atoms";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { FloatingSupportButton } from "./FloatingSupportButton";

interface AppShellProps extends PropsWithChildren {
    activeAccountItem?: string;
    activePrimaryItem?: string;
    avatarUrl: string | null;
    initials: string;
    searchPlaceholder?: string;
}

export function AppShell({
    activeAccountItem,
    activePrimaryItem,
    avatarUrl,
    children,
    initials,
    searchPlaceholder,
}: AppShellProps) {
    return (
        <Box className="min-h-screen bg-[#FAFAFB] text-[#171B2A]">
            <AppSidebar activeAccountItem={activeAccountItem} activePrimaryItem={activePrimaryItem} />
            <Box className="min-h-screen lg:pl-[256px]">
                <AppTopBar
                    avatarUrl={avatarUrl}
                    initials={initials}
                    searchPlaceholder={searchPlaceholder}
                />
                {children}
            </Box>
            <FloatingSupportButton />
        </Box>
    );
}
