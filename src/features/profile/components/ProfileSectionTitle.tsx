import { Box, Text } from "@/lib/ui/atoms";

interface ProfileSectionTitleProps {
    title: string;
}

export function ProfileSectionTitle({ title }: ProfileSectionTitleProps) {
    return (
        <Box className="border-b border-[#E4E6EC] pb-4">
            <Text as="h1" className="text-[22px] font-extrabold tracking-[-0.01em] text-[#171B2A]">
                {title}
            </Text>
        </Box>
    );
}
