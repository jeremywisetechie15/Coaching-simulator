import type { PropsWithChildren } from "react";
import { CardSurface, CenteredContainer, PageSurface } from "@/lib/ui/atoms";

interface CenteredCardFrameProps extends PropsWithChildren {
    cardClassName?: string;
    containerClassName?: string;
    surfaceClassName?: string;
}

export function CenteredCardFrame({
    children,
    cardClassName,
    containerClassName,
    surfaceClassName,
}: CenteredCardFrameProps) {
    return (
        <PageSurface className={surfaceClassName}>
            <CenteredContainer className={containerClassName}>
                <CardSurface className={cardClassName}>{children}</CardSurface>
            </CenteredContainer>
        </PageSurface>
    );
}
