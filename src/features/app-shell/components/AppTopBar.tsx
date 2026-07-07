import { Menu, Search } from "lucide-react";
import { Box, Button, InlineIcon, TextInput } from "@/lib/ui/atoms";
import { UserAvatarMenu } from "./UserAvatarMenu";

interface AppTopBarProps {
    avatarUrl: string | null;
    initials: string;
    searchPlaceholder?: string;
    fullName?: string;
    email?: string;
    onOpenMobileMenu: () => void;
}

export function AppTopBar({
    avatarUrl,
    initials,
    searchPlaceholder,
    fullName,
    email,
    onOpenMobileMenu,
}: AppTopBarProps) {
    return (
        <Box
            as="header"
            className="sticky top-0 z-20 flex h-[76px] items-center justify-between bg-[#FAFAFB]/95 px-5 backdrop-blur md:px-9 lg:px-14"
        >
            <Button
                aria-controls="mobile-navigation-drawer"
                aria-label="Ouvrir la navigation"
                onClick={onOpenMobileMenu}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8EAF1] bg-white text-[#384153] transition hover:border-[#D5D7DE] hover:text-[#5140F0] lg:hidden"
            >
                <InlineIcon icon={Menu} className="h-5 w-5" />
            </Button>

            {searchPlaceholder && (
                <Box className="relative hidden w-[296px] md:block">
                    <InlineIcon
                        icon={Search}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#99A1B2]"
                    />
                    <TextInput
                        aria-label="Recherche globale"
                        placeholder={searchPlaceholder}
                        hasLeadingIcon={false}
                        className="h-11 rounded-xl border-0 bg-white pl-12 text-[14px] font-normal text-[#171B2A] shadow-none placeholder:text-[#A3AABA] focus:ring-4 focus:ring-[#5140F0]/10"
                    />
                </Box>
            )}

            <Box className="ml-auto flex items-center gap-4">
                <UserAvatarMenu
                    avatarUrl={avatarUrl}
                    initials={initials}
                    fullName={fullName}
                    email={email}
                />
            </Box>
        </Box>
    );
}
