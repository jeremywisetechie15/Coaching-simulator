import { Stack, Text } from "@/lib/ui/atoms";

interface FormHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
    className?: string;
    eyebrowClassName?: string;
    titleClassName?: string;
    descriptionClassName?: string;
}

export function FormHeader({
    eyebrow,
    title,
    description,
    className,
    eyebrowClassName,
    titleClassName,
    descriptionClassName,
}: FormHeaderProps) {
    return (
        <Stack className={className}>
            {eyebrow && <Text className={eyebrowClassName}>{eyebrow}</Text>}
            <Text as="h1" className={titleClassName}>
                {title}
            </Text>
            {description && <Text className={descriptionClassName}>{description}</Text>}
        </Stack>
    );
}
