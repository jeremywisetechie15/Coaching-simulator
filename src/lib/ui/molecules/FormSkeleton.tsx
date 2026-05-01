import { SkeletonBlock, Stack } from "@/lib/ui/atoms";

export function FormSkeleton() {
    return (
        <Stack className="space-y-4">
            <SkeletonBlock />
            <SkeletonBlock />
            <SkeletonBlock />
        </Stack>
    );
}
