"use client";

import type { LucideIcon } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export interface SegmentedControlOption<Value extends string> {
    icon?: LucideIcon;
    label: string;
    value: Value;
}

interface SegmentedControlProps<Value extends string> {
    ariaLabel: string;
    disabled?: boolean;
    onChange: (value: Value) => void;
    options: readonly SegmentedControlOption<Value>[];
    value: Value;
}

export function SegmentedControl<Value extends string>({
    ariaLabel,
    disabled,
    onChange,
    options,
    value,
}: SegmentedControlProps<Value>) {
    return (
        <Box aria-label={ariaLabel} role="group" className={uiTokens.segmentedControl.root}>
            {options.map((option) => {
                const isActive = option.value === value;

                return (
                    <Button
                        key={option.value}
                        aria-pressed={isActive}
                        disabled={disabled}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            uiTokens.segmentedControl.option,
                            isActive
                                ? uiTokens.segmentedControl.optionActive
                                : uiTokens.segmentedControl.optionIdle,
                            disabled && uiTokens.segmentedControl.optionDisabled,
                        )}
                    >
                        {option.icon && (
                            <InlineIcon icon={option.icon} className={uiTokens.segmentedControl.icon} />
                        )}
                        <Text as="span" className={uiTokens.segmentedControl.label}>
                            {option.label}
                        </Text>
                    </Button>
                );
            })}
        </Box>
    );
}
