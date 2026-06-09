"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Box, InlineIcon, Text } from "@/lib/ui/atoms";
import { signOutAction } from "@/features/auth/server/sign-out";

interface UserAvatarMenuProps {
    avatarUrl: string | null;
    initials: string;
    fullName?: string;
    email?: string;
}

interface MenuLink {
    label: string;
    icon: LucideIcon;
    href: string;
    danger?: boolean;
}

const menuLinks: MenuLink[] = [
    { label: "Mon Profil", icon: UserRound, href: "/profile" },
    { label: "Paramètres", icon: Settings, href: "/roles-permissions" },
];

export function UserAvatarMenu({ avatarUrl, initials, fullName, email }: UserAvatarMenuProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Fermeture sur clic extérieur ou Échap.
    useEffect(() => {
        if (!open) return;

        function handleClick(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        function handleKey(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                aria-label="Ouvrir le menu utilisateur"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#5B50F5] text-white shadow-[0_10px_24px_rgba(81,64,240,0.22)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2"
            >
                {avatarUrl ? (
                    <Box
                        aria-hidden="true"
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url("${avatarUrl}")` }}
                    />
                ) : (
                    <Text as="span" className="text-[14px] font-bold">
                        {initials}
                    </Text>
                )}
            </button>

            {open && (
                <Box
                    role="menu"
                    className="absolute right-0 top-full z-30 mt-3 w-[260px] overflow-hidden rounded-2xl border border-[#E9E7FB] bg-white shadow-[0_24px_48px_rgba(17,24,39,0.14)]"
                >
                    {(fullName || email) && (
                        <Box className="border-b border-[#EDEEF3] px-4 py-3">
                            {fullName && (
                                <Text className="truncate text-[14px] font-extrabold text-[#111827]">
                                    {fullName}
                                </Text>
                            )}
                            {email && (
                                <Text className="mt-0.5 truncate text-[12px] font-medium text-[#6B7280]">
                                    {email}
                                </Text>
                            )}
                        </Box>
                    )}

                    <Box className="py-1.5">
                        {menuLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                role="menuitem"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold text-[#374151] transition hover:bg-[#F7F7FB]"
                            >
                                <InlineIcon icon={link.icon} className="h-4 w-4 text-[#6B7280]" />
                                {link.label}
                            </Link>
                        ))}
                    </Box>

                    <Box className="border-t border-[#EDEEF3] py-1.5">
                        <form action={signOutAction}>
                            <button
                                type="submit"
                                role="menuitem"
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2]"
                            >
                                <InlineIcon icon={LogOut} className="h-4 w-4" />
                                Déconnexion
                            </button>
                        </form>
                    </Box>
                </Box>
            )}
        </div>
    );
}
