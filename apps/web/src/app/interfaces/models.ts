export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  qrCount?: number;
}

export type QrStyle = 'classic' | 'dots' | 'rounded';

export interface QRCode {
  id: string;
  userId: string;
  title: string;
  targetUrl: string;
  slug: string;
  foregroundColor: string;
  backgroundColor: string;
  style: QrStyle;
  isActive: boolean;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface QrListResponse {
  items: QRCode[];
  total: number;
  page: number;
}

export interface ScanEventItem {
  id: string;
  qrCodeId: string;
  scannedAt: string;
  referrer: string | null;
  userAgent: string | null;
  deviceType: string | null;
  locale: string | null;
  ipHash: string | null;
  metadata: Record<string, unknown>;
}

export interface DayBucket {
  date: string;
  scans: number;
}

export interface QrStats {
  total: number;
  perDay: DayBucket[];
  topReferrers: { referrer: string; scans: number }[];
  byDevice: { device: string; scans: number }[];
  byLocale: { locale: string; scans: number }[];
}

export interface DashboardStats {
  totalCodes: number;
  totalScans: number;
  scansLast7d: number;
  avgPerDay7d: number;
  topCodes: { id: string; title: string; slug: string; scans: number }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
