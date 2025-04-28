const workspaceMemberPermissions = [
  'addEmployee',
  'deleteEmployee',
  'editRole',
  'deleteWorkspace',
  'editWorkspace',
] as const;
export type BranchOperatorWMemberPermissions =
  (typeof workspaceMemberPermissions)[number];

export const workspaceOwnerPermissions = [...workspaceMemberPermissions];
export const workspaceAdminPermissions = [
  'addEmployee',
  'deleteEmployee',
  'editWorkspace',
];

export const assignablePermissions = ['addEmployee', 'deleteEmployee'];
export type BranchOperatorAssignablePermissions =
  (typeof assignablePermissions)[number];

// roles should be in this exact order, from higher to lower
export const workspaceRoles = ['owner', 'admin', 'employee', 'guest'] as const;
export type BranchOperatorWMemberRole = (typeof workspaceRoles)[number];
