"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { Box } from "@/lib/ui/atoms";
import type { PlatformRole } from "@/features/users/domain/users";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { FloatingSupportButton } from "./FloatingSupportButton";

interface AppShellProps extends PropsWithChildren {
    activeAccountItem?: string;
    activePrimaryItem?: string;
    avatarUrl: string | null;
    initials: string;
    platformRole: PlatformRole;
    searchPlaceholder?: string;
    /** Nom complet affiché en en-tête du menu utilisateur. */
    fullName?: string;
    /** Email affiché en en-tête du menu utilisateur. */
    email?: string;
}

export function AppShell({
    activeAccountItem,
    activePrimaryItem,
    avatarUrl,
    children,
    initials,
    platformRole,
    searchPlaceholder,
    fullName,
    email,
}: AppShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isMobileMenuOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsMobileMenuOpen(false);
            }
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMobileMenuOpen]);

    return (
        <Box className="min-h-screen bg-[#FAFAFB] text-[#171B2A]">
            <AppSidebar
                activeAccountItem={activeAccountItem}
                activePrimaryItem={activePrimaryItem}
                isMobileOpen={isMobileMenuOpen}
                onMobileClose={() => setIsMobileMenuOpen(false)}
                platformRole={platformRole}
            />
            <Box className="min-h-screen lg:pl-[256px]">
                <AppTopBar
                    avatarUrl={avatarUrl}
                    initials={initials}
                    searchPlaceholder={searchPlaceholder}
                    fullName={fullName}
                    email={email}
                    onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                />
                {children}
            </Box>
            <FloatingSupportButton />
        </Box>
    );
}
