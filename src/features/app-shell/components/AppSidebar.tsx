"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { canViewAppNavigationResource } from "@/features/auth/domain/access-control";
import type { PlatformRole } from "@/features/users/domain/users";
import { accountNavigation, logoutNavigation, primaryNavigation } from "./appNavigation";

interface AppSidebarProps {
    activeAccountItem?: string;
    activePrimaryItem?: string;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
    platformRole: PlatformRole;
}

function navItemClasses(isActive: boolean) {
    return [
        "flex h-9 w-full items-center gap-3 rounded-xl px-4 text-left text-[14px] font-medium leading-5 transition",
        isActive
            ? "bg-[#EEF0FF] text-[#5140F0]"
            : "text-[#0A0A0A] hover:bg-[#F4F5FF] hover:text-[#5140F0]",
    ].join(" ");
}

function accountItemClasses(isActive: boolean) {
    return [
        "flex h-9 w-full items-center rounded-xl px-4 text-left text-[14px] font-medium leading-5 transition",
        isActive ? "bg-[#EEF0FF] text-[#5140F0]" : "text-[#0A0A0A] hover:bg-[#F7F7FB]",
    ].join(" ");
}

interface SidebarContentProps {
    activeAccountItem?: string;
    activePrimaryItem?: string;
    onNavigate?: () => void;
    platformRole: PlatformRole;
}

function SidebarContent({ activeAccountItem, activePrimaryItem, onNavigate, platformRole }: SidebarContentProps) {
    const [isAccountOpen, setIsAccountOpen] = useState(true);
    const visiblePrimaryNavigation = primaryNavigation.filter(
        (item) => canViewAppNavigationResource(platformRole, item.resource),
    );

    return (
        <>
            <Box className="flex h-20 items-center border-b border-[#EEF0F5] px-6">
                <Text className="text-[24px] font-black tracking-[-0.02em] text-[#5140F0]">MaiaCoach</Text>
            </Box>

            <Box as="nav" className="flex-1 space-y-1 overflow-y-auto px-4 pb-6 pt-4">
                {visiblePrimaryNavigation.map((item) => {
                    const isActive = activePrimaryItem === item.label;
                    const content = (
                        <>
                            <InlineIcon icon={item.icon} className="h-5 w-5 shrink-0" />
                            <Text as="span">{item.label}</Text>
                        </>
                    );

                    if (item.href) {
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={onNavigate}
                                className={navItemClasses(isActive)}
                            >
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <Button key={item.label} className={navItemClasses(isActive)}>
                            {content}
                        </Button>
                    );
                })}

                <Box className="pt-1">
                    <Button
                        onClick={() => setIsAccountOpen((value) => !value)}
                        aria-expanded={isAccountOpen}
                        className="flex h-9 w-full items-center gap-3 rounded-xl px-4 text-left text-[14px] font-medium leading-5 text-[#0A0A0A]"
                    >
                        <InlineIcon icon={accountNavigation.icon} className="h-5 w-5 shrink-0" />
                        <Text as="span">{accountNavigation.label}</Text>
                        <InlineIcon
                            icon={accountNavigation.trailingIcon}
                            className={`ml-auto h-4 w-4 transition-transform ${isAccountOpen ? "rotate-180" : ""}`}
                        />
                    </Button>

                    {isAccountOpen && (
                        <Box className="ml-8 mt-2 space-y-1">
                            {accountNavigation.items.map((item) => {
                                const isActive = activeAccountItem === item.label;

                                if (item.href) {
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={onNavigate}
                                            className={accountItemClasses(isActive)}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                }

                                return (
                                    <Button key={item.label} className={accountItemClasses(isActive)}>
                                        {item.label}
                                    </Button>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Box>

            <Box className="border-t border-[#EEF0F5] px-5 py-3">
                <Button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[14px] font-normal leading-5 text-[#0A0A0A] transition hover:bg-[#F7F7FB] hover:text-[#5140F0]">
                    <InlineIcon icon={logoutNavigation.icon} className="h-5 w-5 shrink-0" />
                    <Text as="span">{logoutNavigation.label}</Text>
                </Button>
            </Box>
        </>
    );
}

export function AppSidebar({
    activeAccountItem,
    activePrimaryItem,
    isMobileOpen = false,
    onMobileClose,
    platformRole,
}: AppSidebarProps) {
    return (
        <>
            <Box
                as="aside"
                className="fixed left-0 top-0 z-30 hidden h-screen w-[256px] border-r border-[#E6E8EF] bg-white lg:flex lg:flex-col"
            >
                <SidebarContent
                    activeAccountItem={activeAccountItem}
                    activePrimaryItem={activePrimaryItem}
                    platformRole={platformRole}
                />
            </Box>

            <Box
                aria-hidden={!isMobileOpen}
                className={[
                    "fixed inset-0 z-40 lg:hidden",
                    isMobileOpen ? "pointer-events-auto" : "pointer-events-none",
                ].join(" ")}
            >
                <Box
                    className={[
                        "absolute inset-0 bg-[#111827]/35 transition-opacity duration-300",
                        isMobileOpen ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                    onClick={onMobileClose}
                />
                <Box
                    id="mobile-navigation-drawer"
                    as="aside"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation principale"
                    className={[
                        "absolute left-0 top-0 flex h-full w-[280px] max-w-[86vw] flex-col border-r border-[#E6E8EF] bg-white shadow-[18px_0_48px_rgba(17,24,39,0.20)] transition-transform duration-300 ease-out",
                        isMobileOpen ? "translate-x-0" : "-translate-x-full",
                    ].join(" ")}
                >
                    <Button
                        aria-label="Fermer la navigation"
                        onClick={onMobileClose}
                        className="absolute right-4 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-[#6B7280] transition hover:bg-[#F4F5FF] hover:text-[#5140F0]"
                    >
                        <InlineIcon icon={X} className="h-5 w-5" />
                    </Button>
                    <SidebarContent
                        activeAccountItem={activeAccountItem}
                        activePrimaryItem={activePrimaryItem}
                        onNavigate={onMobileClose}
                        platformRole={platformRole}
                    />
                </Box>
            </Box>
        </>
    );
}
