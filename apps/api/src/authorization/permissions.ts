export const PERMISSIONS = {
  'admin.role.manage': { object: 'admin.role.manage', action: 'manage' },
  'admin.account.manage': { object: 'admin.account.manage', action: 'manage' },
  'product.read': { object: 'product.read', action: 'read' },
  'product.manage': { object: 'product.manage', action: 'manage' },
  'order.read': { object: 'order.read', action: 'read' },
  'order.manage': { object: 'order.manage', action: 'manage' },
} as const;

export type PermissionCode = keyof typeof PERMISSIONS;
