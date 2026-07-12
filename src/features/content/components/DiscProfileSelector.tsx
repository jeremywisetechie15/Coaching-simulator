import type { DiscProfileValue } from "@/features/content/domain";
import { getDiscProfileTone } from "@/features/content/domain";
import { Box, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface DiscProfileOption<T extends DiscProfileValue> {
    description: string;
    label: T;
    value: T;
}

interface DiscProfileSelectorProps<T extends DiscProfileValue> {
    className?: string;
    disabled?: boolean;
    onChange: (value: T) => void;
    options: readonly DiscProfileOption<T>[];
    value: T;
}

export function DiscProfileSelector<T extends DiscProfileValue>({
    className,
    disabled = false,
    onChange,
    options,
    value,
}: DiscProfileSelectorProps<T>) {
    return (
        <Box
            aria-label="Profil DISC"
            role="group"
            className={cn(uiTokens.discProfile.grid, className)}
        >
            {options.map((option) => {
                const isSelected = value === option.value;
                const tone = getDiscProfileTone(option.value);

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={disabled}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            uiTokens.discProfile.option,
                            isSelected
                                ? uiTokens.discProfile.selected[tone]
                                : uiTokens.discProfile.optionIdle,
                            disabled && "cursor-not-allowed opacity-60",
                        )}
                    >
                        <Text as="span" className="block text-[14px] font-extrabold">
                            {option.label}
                        </Text>
                        <Text as="span" className="mt-2 block text-[12px] font-bold opacity-70">
                            {option.description}
                        </Text>
                    </button>
                );
            })}
        </Box>
    );
}
