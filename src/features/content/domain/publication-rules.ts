import { CONTENT_STATUS, isPublishedContent, type ContentStatus } from "./content-status";

export interface ScenarioPublicationDependencies {
    coachStatus?: ContentStatus | null;
    methodStatus?: ContentStatus | null;
    notationMethodStatus?: ContentStatus | null;
    outputSchemaStatuses?: ContentStatus[];
    personaStatus: ContentStatus;
    promptStatuses?: ContentStatus[];
}

export interface DependencyUnpublishInput {
    publishedScenarioCount: number;
}

export function getScenarioPublicationBlocks(input: ScenarioPublicationDependencies): string[] {
    const blocks: string[] = [];

    addBlockWhenUnpublished(blocks, "persona", input.personaStatus);
    addBlockWhenUnpublished(blocks, "coach", input.coachStatus);
    addBlockWhenUnpublished(blocks, "methode", input.methodStatus);
    addBlockWhenUnpublished(blocks, "methode de notation", input.notationMethodStatus);

    input.promptStatuses?.forEach((status, index) => {
        addBlockWhenUnpublished(blocks, `prompt ${index + 1}`, status);
    });

    input.outputSchemaStatuses?.forEach((status, index) => {
        addBlockWhenUnpublished(blocks, `schema JSON ${index + 1}`, status);
    });

    return blocks;
}

export function canPublishScenario(input: ScenarioPublicationDependencies) {
    return getScenarioPublicationBlocks(input).length === 0;
}

export function canUnpublishDependency(input: DependencyUnpublishInput) {
    return input.publishedScenarioCount === 0;
}

function addBlockWhenUnpublished(blocks: string[], label: string, status: ContentStatus | null | undefined) {
    if (status && !isPublishedContent(status)) {
        blocks.push(`${label}: ${status}`);
    }
}

export const PUBLISHED_CONTENT_STATUS = CONTENT_STATUS.published;
