import { Bell, Menu, Search } from "lucide-react";
import { Box, Button, InlineIcon, Text, TextInput } from "@/lib/ui/atoms";
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
                <Button className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#273044] transition hover:bg-white">
                    <InlineIcon icon={Bell} className="h-5 w-5" />
                    <Text
                        as="span"
                        className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF4E68] px-1 text-[10px] font-bold leading-none text-white"
                    >
                        2
                    </Text>
                </Button>
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
