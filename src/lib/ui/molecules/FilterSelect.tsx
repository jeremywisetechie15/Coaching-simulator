"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export type FilterSelectOption = string | { label: string; value: string };

function getOptionValue(option: FilterSelectOption) {
    return typeof option === "string" ? option : option.value;
}

function getOptionLabel(option: FilterSelectOption) {
    return typeof option === "string" ? option : option.label;
}

interface FilterSelectProps {
    ariaLabel: string;
    onChange: (value: string) => void;
    options: readonly FilterSelectOption[];
    value: string;
}

export function FilterSelect({ ariaLabel, onChange, options, value }: FilterSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedOption = options.find((option) => getOptionValue(option) === value);
    const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : value;

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    return (
        <div ref={ref} className={uiTokens.filterSelect.container}>
            <Button
                aria-label={ariaLabel}
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
                className={uiTokens.filterSelect.trigger}
            >
                <Text as="span" className={uiTokens.filterSelect.triggerLabel}>
                    {selectedLabel}
                </Text>
                <InlineIcon
                    icon={ChevronDown}
                    className={cn(uiTokens.filterSelect.chevron, open && "rotate-180")}
                />
            </Button>

            {open && (
                <CardSurface className={uiTokens.filterSelect.menu}>
                    {options.map((option) => {
                        const optionValue = getOptionValue(option);
                        const optionLabel = getOptionLabel(option);
                        const isSelected = optionValue === value;

                        return (
                            <Button
                                key={optionValue}
                                onClick={() => {
                                    onChange(optionValue);
                                    setOpen(false);
                                }}
                                className={cn(
                                    uiTokens.filterSelect.option,
                                    isSelected
                                        ? uiTokens.filterSelect.optionActive
                                        : uiTokens.filterSelect.optionIdle,
                                )}
                            >
                                <Text as="span" className={uiTokens.filterSelect.optionLabel}>
                                    {optionLabel}
                                </Text>
                                {isSelected && (
                                    <InlineIcon icon={Check} className={uiTokens.filterSelect.check} />
                                )}
                            </Button>
                        );
                    })}
                </CardSurface>
            )}
        </div>
    );
}
