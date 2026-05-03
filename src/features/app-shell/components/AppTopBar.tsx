import { Bell, Menu, Search } from "lucide-react";
import { Box, Button, InlineIcon, Text, TextInput } from "@/lib/ui/atoms";

interface AppTopBarProps {
    avatarUrl: string | null;
    initials: string;
    searchPlaceholder?: string;
}

export function AppTopBar({ avatarUrl, initials, searchPlaceholder }: AppTopBarProps) {
    return (
        <Box
            as="header"
            className="sticky top-0 z-20 flex h-[76px] items-center justify-between bg-[#FAFAFB]/95 px-5 backdrop-blur md:px-9 lg:px-14"
        >
            <Button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8EAF1] bg-white text-[#384153] lg:hidden">
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
                <Box className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#5B50F5] text-white shadow-[0_10px_24px_rgba(81,64,240,0.22)]">
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
                </Box>
            </Box>
        </Box>
    );
}
