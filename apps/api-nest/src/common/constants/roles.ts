export enum Role {
  Admin = 'admin',
  Manager = 'manager',
  Operator = 'operator',
  Viewer = 'viewer',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.Admin]: 4,
  [Role.Manager]: 3,
  [Role.Operator]: 2,
  [Role.Viewer]: 1,
};

export function hasMinimumRole(userRole: Role, required: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}
