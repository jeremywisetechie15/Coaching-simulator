import { Menu } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";

interface ProfileTopBarProps {
    avatarUrl: string | null;
    initials: string;
}

export function ProfileTopBar({ avatarUrl, initials }: ProfileTopBarProps) {
    return (
        <Box
            as="header"
            className="sticky top-0 z-20 flex h-[76px] items-center justify-between bg-[#FAFAFB]/95 px-5 backdrop-blur md:px-9 lg:px-12"
        >
            <Button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8EAF1] bg-white text-[#384153] lg:hidden">
                <InlineIcon icon={Menu} className="h-5 w-5" />
            </Button>

            <Box className="ml-auto flex items-center gap-4">
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
