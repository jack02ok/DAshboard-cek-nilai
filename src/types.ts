export interface SubjectScore {
  name: string;
  score: number;
  category: string; // 'Sains' | 'Sosial' | 'Bahasa' | 'Kejuruan'
}

export interface Student {
  id: string;
  name: string;
  scores: Record<string, number>; // e.g. { "Matematika": 80, "Fisika": 75, "Sejarah": 88 }
  totalScore: number;
  average: number;
  nisn?: string;
  nomorPeserta?: string;
  ttl?: string;
  predikatNumerasi?: string;
  predikatLiterasi?: string;
}

export interface SheetData {
  id: string; // 'sheet-1' | 'sheet-2' | 'sheet-3'
  name: string; // e.g., 'Kelas 10 - IPA', 'Kelas 11 - IPS', 'Kelas 12 - Bahasa'
  subjects: { name: string; category: string }[]; // subjects included in this sheet
  students: Student[];
}

export interface DashboardConfig {
  kkm: number; // Kriteria Ketuntasan Minimal, e.g., 75
  title: string;
  chartType: 'bar' | 'line' | 'radar' | 'composed';
  themeColor: 'indigo' | 'teal' | 'amber' | 'emerald';
  showDetailsToStudent?: boolean; // Tampilkan nilai detail per mata pelajaran
  showAverageToStudent?: boolean; // Tampilkan nilai rata-rata siswa
  showRankToStudent?: boolean; // Tampilkan status kelulusan/remedial
  showStarsToStudent?: boolean; // Tampilkan bintang prestasi lucu (ciri khas SD)
  showQuotesToStudent?: boolean; // Tampilkan kalimat motivasi ramah anak
  disableKkm?: boolean; // Menonaktifkan Kriteria Ketuntasan Minimal (KKM)
}

export interface UserSession {
  isAdmin: boolean;
  username: string;
}

export interface AccessControl {
  isDataVisible: boolean; // boolean if scores can be accessed by public
  timerEndTime: number | null; // Date.now() timestamp when timer finishes
  timerAction: 'open' | 'close' | null; // action callback when timer finishes
  timerDurationSeconds: number; // initial set duration in seconds
}

export interface SimulatedUser {
  id: string;
  name: string;
  role: 'Guru' | 'Siswa' | 'Orang Tua' | 'Kurikulum';
  allowedSheets: string[]; // Sheet ID list allowed
}

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  role: 'Admin' | 'Pengguna';
  password?: string;
}

export interface CleanseLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
