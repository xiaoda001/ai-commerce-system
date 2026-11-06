import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

export type CustomerUserStatus = 'active' | 'disabled';

@Entity('customer_users')
@Unique('uq_customer_users_email', ['email'])
export class CustomerUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  // 登录查询时才显式读取密码摘要，避免一般查询意外带出敏感字段。
  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: ['active', 'disabled'], default: 'active' })
  status!: CustomerUserStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 6 })
  updatedAt!: Date;
}
