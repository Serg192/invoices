import {
  BranchOperatorWMemberRole,
  workspaceAdminPermissions,
  workspaceOwnerPermissions,
  workspaceRoles,
} from 'src/_config/workspace';

export const getDefaultPermissions = (role: BranchOperatorWMemberRole) => {
  switch (role) {
    case 'owner':
      return workspaceOwnerPermissions;
    case 'admin':
      return workspaceAdminPermissions;
    default:
      return [];
  }
};

export const getDefaultRoleFeature = (role: BranchOperatorWMemberRole) => {
  switch (role) {
    case 'owner':
      return 'has all permissions';
    case 'admin':
      return 'user management';
    default:
      return '';
  }
};

export const hasHigherWorkspaceRole = (
  requestorRole: string,
  employeeRole: string,
): boolean => {
  const requestorRolePriority = workspaceRoles.findIndex(
    (role) => role === requestorRole,
  );
  const employeeRolePriority = workspaceRoles.findIndex(
    (role) => role === employeeRole,
  );

  // lower index higher priority
  return requestorRolePriority <= employeeRolePriority;
};
