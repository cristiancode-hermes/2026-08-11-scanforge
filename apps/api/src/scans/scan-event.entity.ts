import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QRCode } from '../qr-codes/qr-code.entity';

@Entity('scan_events')
export class ScanEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  qrCodeId: string;

  @ManyToOne(() => QRCode, (qr: QRCode) => qr.scans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'qrCodeId' })
  qrCode: QRCode;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  scannedAt: Date;

  @Column({ type: 'text', nullable: true })
  referrer: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'text', nullable: true })
  deviceType: string | null;

  @Column({ type: 'text', nullable: true })
  locale: string | null;

  @Column({ type: 'text', nullable: true })
  ipHash: string | null;

  @Column({ type: 'simple-json', default: {} })
  metadata: Record<string, unknown>;
}
