import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('casbin_rule')
export class CasbinRule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  ptype!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  v0!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  v1!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  v2!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  v3!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  v4!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  v5!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  v6!: string | null;
}
