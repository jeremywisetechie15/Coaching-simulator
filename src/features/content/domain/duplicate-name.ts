const DUPLICATE_SUFFIX_PATTERN = /\s+\((\d+)\)$/;
const DUPLICATE_SUFFIX_RESERVED_LENGTH = 8;

function stripDuplicateSuffix(name: string) {
    const match = name.match(DUPLICATE_SUFFIX_PATTERN);
    return match && Number(match[1]) >= 2 ? name.slice(0, match.index).trimEnd() : name;
}

export function getDuplicateBaseName(sourceName: string, maxLength: number) {
    return stripDuplicateSuffix(sourceName.trim())
        .slice(0, Math.max(1, maxLength - DUPLICATE_SUFFIX_RESERVED_LENGTH))
        .trimEnd();
}

export function getNextDuplicateName(
    sourceName: string,
    existingNames: readonly string[],
    maxLength: number,
) {
    const baseName = getDuplicateBaseName(sourceName, maxLength);
    const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const numberedNamePattern = new RegExp(`^${escapedBaseName} \\((\\d+)\\)$`);
    let highestIndex = 1;

    for (const existingName of existingNames) {
        const match = existingName.trim().match(numberedNamePattern);
        const index = match ? Number(match[1]) : 0;

        if (index >= 2) highestIndex = Math.max(highestIndex, index);
    }

    return `${baseName} (${highestIndex + 1})`.slice(0, maxLength);
}
