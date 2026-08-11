import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ScanEvent } from '../scans/scan-event.entity';
import { Tag } from '../tags/tag.entity';

export type QrStyle = 'classic' | 'dots' | 'rounded';

@Entity('qr_codes')
export class QRCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u: User) => u.qrCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  title: string;

  @Column()
  targetUrl: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: '#16181D' })
  foregroundColor: string;

  @Column({ default: '#FFFFFF' })
  backgroundColor: string;

  @Column({ default: 'classic' })
  style: QrStyle;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  scanCount: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => ScanEvent, (s: ScanEvent) => s.qrCode)
  scans: ScanEvent[];

  @ManyToMany(() => Tag, (t: Tag) => t.qrCodes)
  @JoinTable({
    name: 'qr_code_tags',
    joinColumn: { name: 'qrCodeId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
