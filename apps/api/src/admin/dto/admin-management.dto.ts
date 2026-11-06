import { IsEmail, IsIn, IsString, Length, MaxLength } from 'class-validator';
import { PERMISSIONS, type PermissionCode } from '../../authorization/permissions';

export class CreateRoleDto {
  @IsString() @Length(2, 64) code!: string;
  @IsString() @Length(1, 120) name!: string;
  @IsString() @MaxLength(255) description = '';
}

export class GrantRolePermissionDto {
  @IsIn(['US', 'CN']) market!: 'US' | 'CN';
  @IsIn(Object.keys(PERMISSIONS)) permission!: PermissionCode;
}

export class CreateAdminDto {
  @IsEmail() @MaxLength(320) email!: string;
  @IsString() @Length(8, 128) password!: string;
}

export class BindAdminRoleDto {
  @IsString() @Length(2, 64) roleCode!: string;
  @IsIn(['US', 'CN']) market!: 'US' | 'CN';
}
