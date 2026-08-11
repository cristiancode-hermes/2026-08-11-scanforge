import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QRCode } from '../qr-codes/qr-code.entity';
import { Tag } from '../tags/tag.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @OneToMany(() => QRCode, (qr: QRCode) => qr.user)
  qrCodes: QRCode[];

  @OneToMany(() => Tag, (tag: Tag) => tag.user)
  tags: Tag[];
}
