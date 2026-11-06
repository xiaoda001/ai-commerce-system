import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from './permissions';

export const REQUIRED_PERMISSION = 'required_permission';
export const RequirePermission = (permission: PermissionCode) => SetMetadata(REQUIRED_PERMISSION, permission);
