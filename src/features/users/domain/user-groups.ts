export interface UserAssignedGroup {
    assignedAt: string;
    description: string;
    id: string;
    name: string;
}

export interface UserAvailableGroup {
    description: string;
    id: string;
    name: string;
}

export interface UserGroupsResult {
    availableGroups: UserAvailableGroup[];
    groups: UserAssignedGroup[];
}
