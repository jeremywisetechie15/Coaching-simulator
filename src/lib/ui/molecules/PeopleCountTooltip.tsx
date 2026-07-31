import { Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface PeopleCountTooltipProps {
    count: number;
    names: readonly string[];
    pluralLabel: string;
    singularLabel: string;
    variant?: "detail" | "table";
}

export function PeopleCountTooltip({
    count,
    names,
    pluralLabel,
    singularLabel,
    variant = "table",
}: PeopleCountTooltipProps) {
    const countLabel = `${count} ${count === 1 ? singularLabel : pluralLabel}`;
    const tooltipContent = names.join("\n");

    return (
        <Tooltip content={tooltipContent} disabled={names.length === 0}>
            <Text
                as="span"
                aria-label={names.length > 0 ? `${countLabel}. Afficher la liste des noms.` : countLabel}
                className={cn(
                    uiTokens.peopleCountTooltip.base,
                    uiTokens.peopleCountTooltip[variant],
                    names.length > 0 && uiTokens.peopleCountTooltip.interactive,
                )}
                tabIndex={names.length > 0 ? 0 : undefined}
            >
                {countLabel}
            </Text>
        </Tooltip>
    );
}
