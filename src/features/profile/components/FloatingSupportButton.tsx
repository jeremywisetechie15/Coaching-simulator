import { MessageCircle } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";

export function FloatingSupportButton() {
    return (
        <Box className="fixed bottom-7 right-7 z-40">
            <Button className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#C64BD8] text-white shadow-[0_18px_30px_rgba(198,75,216,0.32)] transition hover:scale-[1.03]">
                <InlineIcon icon={MessageCircle} className="h-8 w-8" />
                <Text
                    as="span"
                    className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF4E68] text-[14px] font-bold text-white"
                >
                    !
                </Text>
            </Button>
        </Box>
    );
}
