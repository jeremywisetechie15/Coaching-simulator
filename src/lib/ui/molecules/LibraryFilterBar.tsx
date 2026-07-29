import type { ReactNode } from "react";
import { Search } from "lucide-react";
import {
    Box,
    CardSurface,
    InputIcon,
    InputShell,
    TextInput,
} from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface LibraryFilterBarProps {
    children: ReactNode;
    className?: string;
}

export function LibraryFilterBar({
    children,
    className,
}: LibraryFilterBarProps) {
    return (
        <CardSurface className={cn(uiTokens.filterBar.librarySurface, className)}>
            <Box className={uiTokens.filterBar.libraryControls}>{children}</Box>
        </CardSurface>
    );
}

interface LibrarySearchFieldProps {
    ariaLabel: string;
    className?: string;
    onChange: (value: string) => void;
    placeholder: string;
    value: string;
}

export function LibrarySearchField({
    ariaLabel,
    className,
    onChange,
    placeholder,
    value,
}: LibrarySearchFieldProps) {
    return (
        <Box className={cn(uiTokens.filterBar.librarySearch, className)}>
            <InputShell>
                <InputIcon icon={Search} variant="library" />
                <TextInput
                    aria-label={ariaLabel}
                    className={uiTokens.filterBar.librarySearchInput}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    type="search"
                    value={value}
                />
            </InputShell>
        </Box>
    );
}
