import React, { useState, useEffect } from 'react';
import { DashboardConfig, AccessControl, UserAccount, CleanseLog } from '../types';
import { THEME_STYLES } from '../data';
import {
  Shield,
  Key,
  Sliders,
  Timer,
  EyeOff,
  Eye,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Play,
  Square,
  Settings,
  Database,
  Trash2,
  Plus,
  CheckCircle,
  FileSpreadsheet,
  Users
} from 'lucide-react';

interface AdminPanelProps {
  config: DashboardConfig;
  onUpdateConfig: (updated: DashboardConfig) => void;
  access: AccessControl;
  onUpdateAccess: (updated: AccessControl) => void;
  users: UserAccount[];
  onUpdateUsers: (updated: UserAccount[]) => void;
  onTriggerDefaultReset: () => void;
  onTriggerClearData: () => void;
}

export default function AdminPanel({
  config,
  onUpdateConfig,
  access,
  onUpdateAccess,
  users,
  onUpdateUsers,
  onTriggerDefaultReset,
  onTriggerClearData
}: AdminPanelProps) {
  // Access and countdown settings
  const [minutesInput, setMinutesInput] = useState('5');
  const [timerActionType, setTimerActionType] = useState<'open' | 'close'>('close');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // New user account form state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Pengguna'>('Pengguna');

  const styles = THEME_STYLES[config.themeColor] || THEME_STYLES.indigo;

  // Live monitor of structural countdown end timer
  useEffect(() => {
    if (!access.timerEndTime) {
      setTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = Math.max(0, Math.ceil((access.timerEndTime! - now) / 1000));
      setTimeRemaining(difference);
    }, 1000);

    return () => clearInterval(interval);
  }, [access.timerEndTime]);

  // Handle Manual Toggle of Data Visibility
  const toggleVisibilityManual = () => {
    onUpdateAccess({
      ...access,
      isDataVisible: !access.isDataVisible,
      timerEndTime: null, // cancel active timer when manual change is made
      timerAction: null
    });
  };

  // Begin a countdown timer
  const startCountdown = () => {
    const mins = parseFloat(minutesInput);
    if (isNaN(mins) || mins <= 0) {
      alert('Masukkan durasi hitung mundur yang valid (> 0)');
      return;
    }

    const seconds = Math.round(mins * 60);
    const endTime = Date.now() + seconds * 1020; // buffer a little for state cycles

    onUpdateAccess({
      ...access,
      timerEndTime: endTime,
      timerAction: timerActionType,
      timerDurationSeconds: seconds
    });
  };

  // Cancel/Reset any active countdown timer
  const stopCountdown = () => {
    onUpdateAccess({
      ...access,
      timerEndTime: null,
      timerAction: null,
      timerDurationSeconds: 0
    });
  };

  // Update KKM limits
  const updateKkmValue = (newKkm: number) => {
    const validKkm = isNaN(newKkm) ? 0 : Math.min(100, Math.max(1, newKkm));
    onUpdateConfig({ ...config, kkm: validKkm });
  };

  // Manage creating other user accounts
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim() || !newPassword.trim()) {
      alert('Harap isi semua kolom data untuk membuat akun baru!');
      return;
    }

    const sanitizedUser = newUsername.trim().toLowerCase();
    
    // Check duplication
    if (users.some(u => u.username.toLowerCase() === sanitizedUser)) {
      alert('Username tersebut sudah digunakan oleh akun lain!');
      return;
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      username: sanitizedUser,
      fullName: newFullName.trim(),
      password: newPassword,
      role: newRole
    };

    onUpdateUsers([...users, newUser]);
    setNewUsername('');
    setNewFullName('');
    setNewPassword('');
    alert(`Berhasil mendaftarkan pengguna baru "${newUser.fullName}" dengan peran ${newUser.role}.`);
  };

  // Manage deleting user account
  const handleDeleteUser = (userId: string) => {
    const selected = users.find(u => u.id === userId);
    if (!selected) return;

    if (selected.username === 'admin') {
      alert('Akun administrator sistem dasar "admin" tidak diperbolehkan dihapus demi alasan keamanan.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun "${selected.fullName}"?`)) {
      onUpdateUsers(users.filter(u => u.id !== userId));
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div id="admin-panel-authenticated" className="space-y-6">
      
      {/* Active banner for authenticated admin */}
      <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-lg shadow-indigo-600/25">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-black font-mono tracking-wider uppercase text-slate-400">Pusat Otoritas Pengelola</h4>
            <h3 className="text-base font-extrabold text-white">Super-User Console • {config.title}</h3>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide">
            Koneksi database aman
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Access Controllers & Auto release count down */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs" id="admin-access-timer-card">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Timer className={`h-5 w-5 ${styles.text}`} />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pengatur Otoritas & Jadwal Penutupan Nilai</h4>
          </div>
          <p className="text-xs text-slate-450 leading-relaxed">
            Atur visibilitas data agar tidak bisa diakses oleh <strong>Siswa atau Orangtua</strong> di luar masa rilis nilai resmi. Anda bisa menutup/membuka secara instan atau memasang hitung mundur otomatis.
          </p>

          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            access.isDataVisible 
              ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50/70 border-rose-100 text-rose-850'
          }`}>
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase opacity-65 tracking-wider">Akses Publik Laporan Nilai</span>
              <h5 className="text-xs font-bold flex items-center space-x-2">
                {access.isDataVisible ? (
                  <>
                    <Eye className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>Terbuka Untuk Umum (Unlocked)</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4.5 w-4.5 text-rose-600 shrink-0 select-none animate-pulse" />
                    <span>Tertutup (Locked bagi Siswa/Ortu)</span>
                  </>
                )}
              </h5>
            </div>

            <button
              onClick={toggleVisibilityManual}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                access.isDataVisible 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              Ubah Manual
            </button>
          </div>

          {/* Hitung mundur timer scheduler */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3.5">
            <h5 className="text-xs font-bold text-slate-700">Jadwal Penutupan Nilai Otomatis (Countdown Opsi Mundur)</h5>
            
            {access.timerEndTime ? (
              <div className="space-y-3 text-center py-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Menghitung Mundur Tersisa</span>
                <span className="text-3xl font-black font-mono tracking-widest text-indigo-600 block animate-pulse">
                  {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                </span>
                <p className="text-[11px] text-slate-505">
                  Sistem akan otomatis mengeksekusi <strong className="uppercase font-mono text-indigo-600">{access.timerAction === 'close' ? 'Penutupan' : 'Pembukaan'}</strong> akses publik setelah timer di atas mencapai nol.
                </p>
                <button
                  onClick={stopCountdown}
                  className="px-4 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 mx-auto transition-all cursor-pointer"
                >
                  <Square className="h-3 w-3 fill-rose-750" />
                  <span>Batalkan Penutupan Mundur</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Durasi Mundur (Menit)</label>
                    <input
                      type="number"
                      value={minutesInput}
                      onChange={(e) => setMinutesInput(e.target.value)}
                      placeholder="5"
                      min="0.1"
                      step="0.1"
                      className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-mono font-semibold focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Aksi Setelah Selesai</label>
                    <select
                      value={timerActionType}
                      onChange={(e) => setTimerActionType(e.target.value as 'open' | 'close')}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                    >
                      <option value="close">Tutup Akses Nilai</option>
                      <option value="open">Buka Akses Nilai</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={startCountdown}
                  className={`w-full py-1.5 ${styles.primary} ${styles.primaryHover} text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer`}
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Mulai Jadwal Mundur</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Visual parameters and config theme styles selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs" id="admin-config-variables-card">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sliders className={`h-5 w-5 ${styles.text}`} />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Konfigurasi Visual & Parameter Sekolah</h4>
          </div>
          <p className="text-xs text-slate-450 leading-relaxed">
            Sesuaikan indeks KKM (Kriteria Ketuntasan Minimal) kelulusan siswa, modifikasi judul portal tertera, dan atur aksentuasi corak warna dasar dashboard.
          </p>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">KKM Minimal Kelulusan</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={config.kkm}
                    onChange={(e) => updateKkmValue(parseInt(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-400 py-1.5 font-bold">Poin</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Judul Tertera Portal</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => onUpdateConfig({ ...config, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Corak Warna Identitas</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.keys(THEME_STYLES).map((col) => {
                    const styl = THEME_STYLES[col as keyof typeof THEME_STYLES];
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => onUpdateConfig({ ...config, themeColor: col as any })}
                        className={`py-1.5 rounded-lg text-center border transition-all cursor-pointer ${
                          config.themeColor === col 
                            ? `${styl.primary} text-white border-transparent font-bold scale-102` 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={`Tema ${col}`}
                      >
                        <span className="text-[10px] capitalize font-semibold">{col.substring(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Jenis Grafik Dashboard</label>
                <select
                  value={config.chartType}
                  onChange={(e) => onUpdateConfig({ ...config, chartType: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="bar">Bar Chart (Bilah Mandiri)</option>
                  <option value="line">Line Chart (Garis Sebaran)</option>
                  <option value="composed">Composed Area & Bar (Gabungan)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-semibold">Tersesat mengedit atau ingin memulai dari awal?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh data kelas dan siswa? Semua nilai yang tersimpan akan dihapus.')) {
                      onTriggerClearData();
                    }
                  }}
                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Kosongkan Semua Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Ulangi basis data spreadsheet ke kondisi awal/default? Semua versi data saat ini akan terhapus.')) {
                      onTriggerDefaultReset();
                    }
                  }}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2.5 Student Display Configuration Panel (SD Style) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm" id="admin-student-display-config">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Settings className={`h-5 w-5 ${styles.text}`} />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Kontrol & Batasan Informasi Siswa (Ramah Anak SD)</h4>
          </div>
          <span className="bg-gradient-to-r from-amber-400 to-indigo-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-sm">
            ⚙️ AKTIFKAN FITUR REKOMENDASI SD
          </span>
        </div>
        
        <p className="text-xs text-slate-550 leading-relaxed">
          Sebagai administrator, Anda dapat membatasi atau menyembunyikan data nilai TKA (Tes Kemampuan Akademik) mana saja yang dapat dilihat oleh siswa maupun orang tua di modul pencarian. Cocok untuk menyederhanakan tampilan hasil TKA agar ramah anak SD.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          
          {/* Toggle 1: Show stars */}
          <div className={`p-4 rounded-xl border transition-all ${config.showStarsToStudent ? 'bg-amber-50/70 border-amber-300 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
            <label className="flex flex-col h-full justify-between cursor-pointer">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">⭐</span>
                  <input
                    type="checkbox"
                    checked={!!config.showStarsToStudent}
                    onChange={(e) => onUpdateConfig({ ...config, showStarsToStudent: e.target.checked })}
                    className="h-4.5 w-4.5 rounded-full border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
                <h5 className="text-xs font-bold text-slate-800 mt-2">Bintang Prestasi</h5>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">Memberikan bintang lucu 1 s/d 5 berdasarkan standar rata-rata nilai siswa.</p>
              </div>
              <span className={`text-[10px] font-bold mt-4 block ${config.showStarsToStudent ? 'text-amber-600' : 'text-slate-400'}`}>
                {config.showStarsToStudent ? '● Aktif (Menarik) ⭐️' : '○ Disembunyikan'}
              </span>
            </label>
          </div>

          {/* Toggle 2: Show Quotes (Motivations) */}
          <div className={`p-4 rounded-xl border transition-all ${config.showQuotesToStudent ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
            <label className="flex flex-col h-full justify-between cursor-pointer">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🌈</span>
                  <input
                    type="checkbox"
                    checked={!!config.showQuotesToStudent}
                    onChange={(e) => onUpdateConfig({ ...config, showQuotesToStudent: e.target.checked })}
                    className="h-4.5 w-4.5 rounded-full border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                <h5 className="text-xs font-bold text-slate-800 mt-2">Pemberi Semangat</h5>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">Kalimat penyemangat belajar yang ceria serta dinamis agar anak gembira.</p>
              </div>
              <span className={`text-[10px] font-bold mt-4 block ${config.showQuotesToStudent ? 'text-emerald-600' : 'text-slate-400'}`}>
                {config.showQuotesToStudent ? '● Aktif (Ceria) 🌸' : '○ Disembunyikan'}
              </span>
            </label>
          </div>

          {/* Toggle 3: Show Average Score */}
          <div className={`p-4 rounded-xl border transition-all ${config.showAverageToStudent ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
            <label className="flex flex-col h-full justify-between cursor-pointer">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">📊</span>
                  <input
                    type="checkbox"
                    checked={!!config.showAverageToStudent}
                    onChange={(e) => onUpdateConfig({ ...config, showAverageToStudent: e.target.checked })}
                    className="h-4.5 w-4.5 rounded-full border-slate-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                <h5 className="text-xs font-bold text-slate-800 mt-2">Nilai Rata-rata</h5>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">Menampilkan angka rata-rata TKA (Tes Kemampuan Akademik) gabungan pada dashboard depan siswa.</p>
              </div>
              <span className={`text-[10px] font-bold mt-4 block ${config.showAverageToStudent ? 'text-indigo-600' : 'text-slate-400'}`}>
                {config.showAverageToStudent ? '● Aktif (Angka)' : '○ Disembunyikan'}
              </span>
            </label>
          </div>

          {/* Toggle 4: Show status (lulus / remedial) */}
          <div className={`p-4 rounded-xl border transition-all ${config.showRankToStudent ? 'bg-sky-50/70 border-sky-300 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
            <label className="flex flex-col h-full justify-between cursor-pointer">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🎯</span>
                  <input
                    type="checkbox"
                    checked={!!config.showRankToStudent}
                    onChange={(e) => onUpdateConfig({ ...config, showRankToStudent: e.target.checked })}
                    className="h-4.5 w-4.5 rounded-full border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                  />
                </div>
                <h5 className="text-xs font-bold text-slate-800 mt-2">Status Tuntas</h5>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">Label tuntas/belum tuntas berdasarkan ketetapan KKM ({config.kkm}) sekolah.</p>
              </div>
              <span className={`text-[10px] font-bold mt-4 block ${config.showRankToStudent ? 'text-sky-600' : 'text-slate-400'}`}>
                {config.showRankToStudent ? '● Aktif' : '○ Disembunyikan'}
              </span>
            </label>
          </div>

          {/* Toggle 5: Show detailed scores */}
          <div className={`p-4 rounded-xl border transition-all ${config.showDetailsToStudent ? 'bg-purple-50/70 border-purple-300 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
            <label className="flex flex-col h-full justify-between cursor-pointer">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">📚</span>
                  <input
                    type="checkbox"
                    checked={!!config.showDetailsToStudent}
                    onChange={(e) => onUpdateConfig({ ...config, showDetailsToStudent: e.target.checked })}
                    className="h-4.5 w-4.5 rounded-full border-slate-300 text-purple-500 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
                <h5 className="text-xs font-bold text-slate-800 mt-2">Nilai Detail</h5>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">Hasil TKA (Tes Kemampuan Akademik) lengkap sebaran tiap-tiap mata pelajaran dalam tabel accordion.</p>
              </div>
              <span className={`text-[10px] font-bold mt-4 block ${config.showDetailsToStudent ? 'text-purple-600' : 'text-slate-400'}`}>
                {config.showDetailsToStudent ? '● Aktif' : '○ Disembunyikan'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Real-Time User Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs" id="admin-user-management">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Users className={`h-5 w-5 ${styles.text}`} />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pengelolaan Pengguna Sekolah (User Accounts)</h4>
        </div>
        <p className="text-xs text-slate-450 leading-relaxed">
          Tambahkan, periksa, atau bersihkan akun pengguna terdaftar yang berhak mengamati portal. Siswa/Wali dapat diatur dengan peran <strong>Pengguna</strong>, sedangkan pihak kurikulum sebagai <strong>Admin</strong>.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create User Form */}
          <form onSubmit={handleCreateUser} className="bg-slate-50 p-4 rounded-xl border border-slate-200/65 space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Daftarkan Akun Baru</span>
            
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500">Username Akun (Login)</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Contoh: siswa_baru"
                className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500">Nama Lengkap</label>
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Contoh: Muhammad Jaka"
                className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500">Kata Sandi</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Konstruksi kata sandi..."
                className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500">Hak Tingkat Peran (Role)</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="Pengguna">Pengguna (Siswa/Profil Publik)</option>
                <option value="Admin">Admin (Otoritas Penuh)</option>
              </select>
            </div>

            <button
              type="submit"
              className={`w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs mt-2 transition-colors cursor-pointer flex items-center justify-center space-x-1 shadow-2xs`}
            >
              <Plus className="h-4 w-4" />
              <span>Daftarkan Pengguna</span>
            </button>
          </form>

          {/* User List Grid */}
          <div className="lg:col-span-2 space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-width text-slate-400">Daftar Akun Terdaftar ({users.length})</span>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-450 border-b border-slate-250 font-black">
                  <tr>
                    <th className="px-3 py-2.5">Nama Pengguna</th>
                    <th className="px-3 py-2.5">Username</th>
                    <th className="px-3 py-2.5">Sandi</th>
                    <th className="px-3 py-2.5">Hak Peran (Role)</th>
                    <th className="px-3 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-bold text-slate-800 truncate max-w-[130px]">{item.fullName}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-500 text-[11px]">{item.username}</td>
                      <td className="px-3 py-2.5 text-[10px] font-mono text-slate-400">{item.password}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          item.role === 'Admin' 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteUser(item.id)}
                          disabled={item.username === 'admin'}
                          className={`text-slate-400 hover:text-rose-600 transition-colors ${
                            item.username === 'admin' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          title="Hapus akun pengguna"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
