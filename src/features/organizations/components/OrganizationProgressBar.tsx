import { Box, Text } from "@/lib/ui/atoms";

interface OrganizationProgressBarProps {
    color?: "green" | "orange" | "purple" | "yellow";
    size?: "default" | "sm";
    progress: number;
    showValue?: boolean;
}

const progressColors = {
    green: "bg-[#4CC762]",
    orange: "bg-[#F46E12]",
    purple: "bg-[#5140F0]",
    yellow: "bg-[#F9C80E]",
};

export function OrganizationProgressBar({
    color = "purple",
    progress,
    size = "default",
    showValue = true,
}: OrganizationProgressBarProps) {
    const isSmall = size === "sm";

    return (
        <Box className={`flex items-center ${isSmall ? "gap-3" : "gap-4"}`}>
            <Box
                className={`${isSmall ? "h-1 w-[56px]" : "h-2 w-[110px]"} overflow-hidden rounded-full bg-[#E4E6EC]`}
            >
                <Box className={`h-full rounded-full ${progressColors[color]}`} style={{ width: `${progress}%` }} />
            </Box>
            {showValue && (
                <Text
                    as="span"
                    className={`${isSmall ? "min-w-7 text-[11px]" : "min-w-10 text-[14px]"} font-bold text-[#4F5868]`}
                >
                    {progress}%
                </Text>
            )}
        </Box>
    );
}
