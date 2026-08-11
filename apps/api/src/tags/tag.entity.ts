import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { QRCode } from '../qr-codes/qr-code.entity';

@Entity('tags')
@Unique(['userId', 'name'])
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u: User) => u.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column({ default: '#0E7490' })
  color: string;

  @ManyToMany(() => QRCode, (qr: QRCode) => qr.tags)
  qrCodes: QRCode[];
}
