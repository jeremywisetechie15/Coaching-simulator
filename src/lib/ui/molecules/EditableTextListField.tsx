import { Plus, X } from "lucide-react";
import { Box, Button, InlineIcon, Text, TextInput } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface EditableTextListFieldProps {
    addLabel?: string;
    items: string[];
    label: string;
    onAdd: () => void;
    onChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    placeholder: string;
    showAddLabel?: boolean;
    structureLocked?: boolean;
}

export function EditableTextListField({
    addLabel = "Ajouter",
    items,
    label,
    onAdd,
    onChange,
    onRemove,
    placeholder,
    showAddLabel,
    structureLocked,
}: EditableTextListFieldProps) {
    return (
        <Box>
            <Box className="flex items-center justify-between">
                <Text as="span" className={cn("text-[13px] font-bold", uiTokens.text.subtle)}>
                    {label}
                </Text>
                {showAddLabel ? (
                    <Button
                        disabled={structureLocked}
                        onClick={onAdd}
                        className={cn(
                            uiTokens.action.addButton,
                            "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                    >
                        <InlineIcon icon={Plus} className="h-3.5 w-3.5" />
                        {addLabel}
                    </Button>
                ) : (
                    <Button
                        disabled={structureLocked}
                        onClick={onAdd}
                        aria-label={`Ajouter - ${label}`}
                        className={cn(
                            uiTokens.action.iconButton,
                            "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                    >
                        <InlineIcon icon={Plus} className="h-4 w-4" />
                    </Button>
                )}
            </Box>
            <Box className="mt-2 space-y-2">
                {items.map((item, index) => (
                    <Box key={index} className="flex items-center gap-2.5">
                        <Box className={uiTokens.surface.bullet} />
                        <TextInput
                            value={item}
                            onChange={(event) => onChange(index, event.target.value)}
                            placeholder={placeholder}
                            hasLeadingIcon={false}
                            className={uiTokens.form.controlWhite}
                        />
                        {items.length > 1 && (
                            <Button
                                aria-label="Retirer"
                                disabled={structureLocked}
                                onClick={() => onRemove(index)}
                                className={cn(
                                    uiTokens.action.listRemoveButton,
                                    "disabled:cursor-not-allowed disabled:opacity-50",
                                )}
                            >
                                <InlineIcon icon={X} className="h-4 w-4" />
                            </Button>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
