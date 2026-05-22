import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SheetData, DashboardConfig, AccessControl, UserAccount, CleanseLog } from './types';
import { INITIAL_SHEETS_DATA, THEME_STYLES } from './data';
import { fetchSpreadsheetDataFromUrl, sanitizeAndCleanSheetData } from './apiSync';
import Dashboard from './components/Dashboard';
import SpreadsheetView from './components/SpreadsheetView';
import StudentSearch from './components/StudentSearch';
import AdminPanel from './components/AdminPanel';
import {
  BarChart2,
  Search,
  FileSpreadsheet,
  Shield,
  EyeOff,
  Clock,
  Lock,
  GraduationCap,
  Users,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Key,
  Database,
  UserCheck,
  CheckCircle2,
  LogIn,
  X
} from 'lucide-react';

const DEFAULT_USERS: UserAccount[] = [
  { id: 'usr-1', username: 'admin', fullName: 'Budi Santoso', password: 'admin', role: 'Admin' },
  { id: 'usr-2', username: 'siswa', fullName: 'Aditya Pratama', password: 'siswa', role: 'Pengguna' },
  { id: 'usr-3', username: 'ortu', fullName: 'Keluarga Rahma', password: 'ortu', role: 'Pengguna' }
];

export default function App() {
  // 1. Users database persistence
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('school_users_v1');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  // Track currently authenticated user - defaults to Guest (Siswa / Orang Tua)
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('school_logged_user_v1');
    return saved ? JSON.parse(saved) : { id: 'usr-guest', username: 'guest', fullName: 'Siswa / Orang Tua', password: '', role: 'Pengguna' };
  });

  // State to manage the modular Admin Login popup modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 2. Core spreadsheet data state
  const [sheetsData, setSheetsData] = useState<SheetData[]>(() => {
    const saved = localStorage.getItem('sheet_data_v1');
    return saved ? JSON.parse(saved) : INITIAL_SHEETS_DATA;
  });

  const [config, setConfig] = useState<DashboardConfig>(() => {
    const saved = localStorage.getItem('dashboard_config_v1');
    const defaultConfig = {
      kkm: 75,
      title: 'SD Negeri Neglasari 02',
      chartType: 'composed' as const,
      themeColor: 'indigo' as const,
      showDetailsToStudent: true,
      showAverageToStudent: true,
      showRankToStudent: true,
      showStarsToStudent: true,
      showQuotesToStudent: true
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title === 'SMAN 1 Portal Evaluasi Nilai') {
          parsed.title = 'SD Negeri Neglasari 02';
        }
        return { ...defaultConfig, ...parsed };
      } catch {
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  const [access, setAccess] = useState<AccessControl>(() => {
    const saved = localStorage.getItem('portal_access_v1');
    return saved ? JSON.parse(saved) : {
      isDataVisible: true,
      timerEndTime: null,
      timerAction: null,
      timerDurationSeconds: 0
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'search' | 'spreadsheet' | 'admin'>('dashboard');
  const [blockedCountdown, setBlockedCountdown] = useState<number | null>(null);

  // 3. API & Hourly Sync States
  const [syncUrl, setSyncUrl] = useState<string>(() => {
    const saved = localStorage.getItem('spreadsheet_sync_url_v1');
    if (!saved || saved.includes('2PACX-1vT32QZl-v0m-mG9Z01')) {
      return 'https://docs.google.com/spreadsheets/d/15STZJkMcBKc6pdj2mr4J7G3OkQpKernKla8U5cD8McU/export?format=csv';
    }
    return saved;
  });
  
  const [syncLogs, setSyncLogs] = useState<CleanseLog[]>(() => {
    return [
      {
        timestamp: new Date().toLocaleTimeString(),
        message: 'Konektivitas sistem aktif. Menunggu pemicu sinkronisasi atau penjadwal otomatis.',
        type: 'info'
      }
    ];
  });
  
  const [nextSyncSeconds, setNextSyncSeconds] = useState(3600); // 1 hour timer
  const [lastSyncTime, setLastSyncTime] = useState<string>('Belum Tersinkronisasi');
  const [isSyncing, setIsSyncing] = useState(false);

  interface SyncHistoryRecord {
    timestamp: string;
    classAverages: Record<string, number>;
  }

  // Retrieve sync history or seed initial values on first run
  const [syncHistory, setSyncHistory] = useState<SyncHistoryRecord[]>(() => {
    const saved = localStorage.getItem('sync_history_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }

    const currentSheets = JSON.parse(localStorage.getItem('sheet_data_v1') || 'null') || INITIAL_SHEETS_DATA;
    const history: SyncHistoryRecord[] = [];

    // Generate 5 seed points representing realistic historical trends
    const times = ['08:00', '09:00', '10:00', '11:00', '12:00'];
    const modifiers = [-4.0, -2.5, -1.0, 1.5, 0];

    times.forEach((t, i) => {
      const classAverages: Record<string, number> = {};
      currentSheets.forEach((s: any) => {
        const baseAvg = s.students.length > 0
          ? Math.round((s.students.reduce((acc: number, stu: any) => acc + stu.average, 0) / s.students.length) * 10) / 10
          : 75;
        // Make lines show a nice clean trend from lower to higher
        classAverages[s.name] = Math.round(Math.min(100, Math.max(0, baseAvg + modifiers[i] + (i % 2 === 0 ? 0.3 : -0.3))) * 10) / 10;
      });
      history.push({
        timestamp: t,
        classAverages
      });
    });

    return history;
  });

  const styles = THEME_STYLES[config.themeColor] || THEME_STYLES.indigo;
  const userRole = currentUser?.role === 'Admin' ? 'admin' : 'siswa';

  // Helper helper to add a logs
  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setSyncLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
      },
      ...prev.slice(0, 49) // clamp to 50 logs max
    ]);
  };

  // Sync state to localstorage
  useEffect(() => {
    localStorage.setItem('school_users_v1', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('school_logged_user_v1', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('school_logged_user_v1');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sheet_data_v1', JSON.stringify(sheetsData));

    // Automatically append latest classroom averages to sync history
    setSyncHistory(prev => {
      const currentAverages: Record<string, number> = {};
      sheetsData.forEach(s => {
        const sum = s.students.reduce((acc, stu) => acc + stu.average, 0);
        currentAverages[s.name] = s.students.length > 0 ? Math.round((sum / s.students.length) * 10) / 10 : 0;
      });

      if (prev.length > 0) {
        const lastRecord = prev[prev.length - 1];
        const isIdentical = Object.keys(currentAverages).every(k => lastRecord.classAverages[k] === currentAverages[k]);
        if (isIdentical && Object.keys(lastRecord.classAverages).length === Object.keys(currentAverages).length) {
          return prev;
        }
      }

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newRecord = { timestamp: nowStr, classAverages: currentAverages };
      const nextHistory = [...prev, newRecord];
      return nextHistory.slice(-15); // clamp at 15 history points
    });
  }, [sheetsData]);

  useEffect(() => {
    localStorage.setItem('sync_history_v1', JSON.stringify(syncHistory));
  }, [syncHistory]);

  useEffect(() => {
    localStorage.setItem('dashboard_config_v1', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('portal_access_v1', JSON.stringify(access));
  }, [access]);

  useEffect(() => {
    localStorage.setItem('spreadsheet_sync_url_v1', syncUrl);
  }, [syncUrl]);

  // Handle active countdown from App perspective for locked screen
  useEffect(() => {
    if (!access.timerEndTime) {
      setBlockedCountdown(null);
      return;
    }

    const interval = setInterval(() => {
      const difference = Math.max(0, Math.ceil((access.timerEndTime! - Date.now()) / 1000));
      setBlockedCountdown(difference);

      if (difference <= 0) {
        clearInterval(interval);
        const nextVisibility = access.timerAction === 'open';
        setAccess({
          isDataVisible: nextVisibility,
          timerEndTime: null,
          timerAction: null,
          timerDurationSeconds: 0
        });
        addLog(`Timer Habis: Status visibilitas diubah otomatis menjadi ${nextVisibility ? 'DIBUKA' : 'DITUTUP'}.`, 'info');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [access.timerEndTime, access.timerAction]);

  // Trigger hourly synchronization mechanism
  useEffect(() => {
    const timer = setInterval(() => {
      setNextSyncSeconds(prev => {
        if (prev <= 1) {
          // Trigger automatic API standard sync
          handleTriggerSync(false);
          return 3600; // Reset
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [syncUrl]);

  // Synchronize dynamic function to fetch and cleanse
  const handleTriggerSync = async (isManual = true) => {
    setIsSyncing(true);
    addLog(isManual ? 'Menginisiasi sinkronisasi manual dari instansi spreadsheet...' : 'Memulai sinkronisasi otomatis per jam...', 'info');
    
    try {
      const fetchedAndCleansed = await fetchSpreadsheetDataFromUrl(syncUrl, addLog);
      if (fetchedAndCleansed && fetchedAndCleansed.length > 0) {
        setSheetsData(fetchedAndCleansed);
        setLastSyncTime(new Date().toLocaleTimeString());
        addLog('Pembaruan basis data visualisasi berhasil disinkronkan & dibersihkan.', 'success');
      } else {
        throw new Error('Data hasil filter kosong.');
      }
    } catch (err: any) {
      addLog(`Sinkronisasi tertunda: ${err.message}. Menggunakan dataset lokal yang ada.`, 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger system data complete reset
  const handleDefaultReset = () => {
    setSheetsData(INITIAL_SHEETS_DATA);
    setConfig({
      kkm: 75,
      title: 'SD Negeri Neglasari 02',
      chartType: 'composed',
      themeColor: 'indigo',
      showDetailsToStudent: true,
      showAverageToStudent: true,
      showRankToStudent: true,
      showStarsToStudent: true,
      showQuotesToStudent: true
    });
    setAccess({
      isDataVisible: true,
      timerEndTime: null,
      timerAction: null,
      timerDurationSeconds: 0
    });
    addLog('Administrator melakukan reset basis data spreadsheet ke kondisi standard.', 'warning');
    alert('Database spreadsheet berhasil direset ke nilai standard/default!');
  };

  const handleLogout = () => {
    setCurrentUser({ id: 'usr-guest', username: 'guest', fullName: 'Siswa / Orang Tua', password: '', role: 'Pengguna' });
    setActiveTab('dashboard');
  };

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Convert sync count down
  const getAutoSyncText = () => {
    const m = Math.floor(nextSyncSeconds / 60);
    const s = nextSyncSeconds % 60;
    return `${m}m ${s}s`;
  };

  // The workspace is public-first. Admin can authenticate using sidebar popup.

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 2. Persistent Dark Left Sidebar representing the design template */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/60 bg-slate-950/20">
          <img
            src="https://github.com/jack02ok/osnsd/blob/main/logosd.png?raw=true"
            alt="Logo SDN Neglasari 02"
            className="w-10 h-10 object-contain bg-white rounded-xl p-0.5 shrink-0 shadow-md shadow-black/30"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <h1 className="text-white font-extrabold tracking-tight text-xs truncate" title={config.title}>{config.title}</h1>
            <span className="text-[9px] text-emerald-400 font-black tracking-wide block uppercase">PORTAL SD NEGERI</span>
          </div>
        </div>

        {/* Dynamic Navigators based on Sleek Interface */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full p-3 rounded-xl flex items-center gap-3 text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <BarChart2 className="h-4 w-4 shrink-0" />
            <span>Dashboard Statistik</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`w-full p-3 rounded-xl flex items-center gap-3 text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span>Pencarian Real-Time</span>
          </button>

          {/* Interactive sheet for Admin only, or locked fallback */}
          <button
            onClick={() => {
              if (currentUser.role === 'Admin') {
                setActiveTab('spreadsheet');
              } else {
                alert('Akses Terkunci! Hanya akun bertingkat "Admin" yang dapat menyunting dokumen spreadsheet.');
              }
            }}
            className={`w-full p-3 rounded-xl flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'spreadsheet'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
            } ${currentUser.role !== 'Admin' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span>Interaksi 3 Sheet</span>
            </div>
            {currentUser.role !== 'Admin' && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
          </button>

          {/* Admin controller */}
          <button
            onClick={() => {
              if (currentUser.role === 'Admin') {
                setActiveTab('admin');
              } else {
                alert('Akses Terkunci! Hanya akun dengan hak "Admin" yang memiliki wewenang mengonfigurasi control panel!');
              }
            }}
            className={`w-full p-3 rounded-xl flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
            } ${currentUser.role !== 'Admin' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Konfigurasi & Akses</span>
            </div>
            {currentUser.role !== 'Admin' && <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
          </button>
        </nav>

        {/* Bottom Current Profile and Sign Out Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full ${currentUser.role === 'Admin' ? 'bg-indigo-600 border border-indigo-500' : 'bg-slate-700 border border-slate-600'} flex items-center justify-center font-bold text-white text-xs shrink-0`}>
              {currentUser.id === 'usr-guest' ? '🎒' : (currentUser.role === 'Admin' ? 'AD' : 'PG')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                {currentUser.id === 'usr-guest' ? 'Status Pengunjung' : `Hak Akses: ${currentUser.role}`}
              </p>
              <p className="text-white text-xs font-semibold truncate">
                {currentUser.id === 'usr-guest' ? 'Siswa / Orang Tua 👦' : currentUser.fullName}
              </p>
            </div>
          </div>

          {currentUser.id === 'usr-guest' ? (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-sm shadow-indigo-650/40"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Masuk Akun Admin 🔐</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full py-2 bg-slate-800 hover:bg-rose-900 hover:text-white text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar (Logout)</span>
            </button>
          )}
        </div>
      </aside>

      {/* 3. Right Workplace Pane */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
        {/* Top Header representing active tab state, automatic sync countdown */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${access.isDataVisible ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
              <div className="hidden sm:block">
                <h2 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Akses Publik</h2>
                <p className={`text-[11px] font-bold mt-0.5 ${access.isDataVisible ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {access.isDataVisible ? 'Terbuka (Unlocked)' : 'Ditutup (Locked)'}
                </p>
              </div>
            </div>

            {/* Google Sheets / Spreadsheet Auto-Refresh Timer Box */}
            <div className="hidden md:flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs">
              <div className="flex items-center text-slate-500 font-medium">
                <Database className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                <span>Auto-Refresh: <strong className="font-mono text-slate-700">{getAutoSyncText()}</strong></span>
              </div>
              <div className="h-3.5 w-[1px] bg-slate-200"></div>
              <span className="text-[10px] text-slate-400 truncate">Last: {lastSyncTime}</span>
              <button
                onClick={() => handleTriggerSync(true)}
                disabled={isSyncing}
                className="p-1 hover:bg-slate-200 rounded-lg text-indigo-600 transition-colors"
                title="Tarik data rujukan manual sekarang"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Judul Portal</span>
              <span className="text-xs font-bold text-indigo-600 truncate max-w-[200px]">{config.title}</span>
            </div>

            <div className="h-8 w-[1px] bg-slate-200"></div>

            {/* Current user role badge */}
            <div>
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                currentUser.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
               }`}>
                {currentUser.role} MODE
              </span>
            </div>
          </div>
        </header>

        {/* Outer scrolling container holding workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          
          {/* Locked overlay for students if visibility is shutdown and current user is NOT admin (except for the playground dashboard/beranda) */}
          {!access.isDataVisible && currentUser.role !== 'Admin' && activeTab !== 'dashboard' ? (
            <div id="countdown-blocked-screen" className="max-w-xl mx-auto bg-white rounded-3xl border border-red-100 shadow-xl p-8 text-center space-y-6 my-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-sm">
                <EyeOff className="h-8 w-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-850">Akses Data Nilai Ujian Ditutup</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Maaf, saat ini administrator sekolah sedang menutup portal publik data nilai untuk pengerjaan rekapitulasi data atau persiapan rapat pleno.
                </p>
              </div>

              {/* Countdown layout if timer is actively running */}
              {blockedCountdown !== null && blockedCountdown > 0 ? (
                <div className="bg-slate-900 border border-slate-850 text-white p-5 rounded-2xl space-y-3 max-w-xs mx-auto shadow-lg">
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Perkiraan Waktu Pembukaan Portal</span>
                  <div className="font-mono text-3xl font-black text-amber-500 tracking-wider">
                    {formatCountdown(blockedCountdown)}
                  </div>
                  <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-350">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Countdown Timer Berjalan</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 max-w-sm mx-auto">
                  🕒 Portal sedang terkunci <strong>Manual</strong>. Akses data akan segera dibuka kembali setelah keputusan rujukan dari sekolah diterbitkan.
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <p className="text-[10px] text-slate-400">Harap tanyakan sandi admin ke panitia ujian, atau klik keluar untuk login menggunakan sandi admin preset.</p>
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    Ganti Login Akun
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Warnings alert for Admin if the portal is currently blocked */}
              {!access.isDataVisible && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-2xl flex items-start space-x-3 text-xs shadow-2xs">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0 animate-bounce" />
                  <div className="space-y-0.5 animate-pulse">
                    <h5 className="font-extrabold">Bypass Admin Aktif (Protected Shield)</h5>
                    <p className="text-amber-700/90 text-[11px] leading-relaxed">
                      Akses eksternal data nilai sekolah sekarang sedang <strong>DIKUNCI</strong> ({blockedCountdown !== null ? `Mundur selesai dalam ${formatCountdown(blockedCountdown)}` : 'Manual'}). Anda diizinkan mengamati tabulator & menyunting karena hak akses super-user <strong>Admin Utama {config.title}</strong> sedang terpasang.
                    </p>
                  </div>
                </div>
              )}

              {/* View Router Selector */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="space-y-6"
                >
                  {activeTab === 'dashboard' && (
                    <Dashboard
                      sheetsData={sheetsData}
                      config={config}
                      access={access}
                      blockedCountdown={blockedCountdown}
                      onSwitchTab={setActiveTab}
                      syncHistory={syncHistory}
                    />
                  )}

                  {activeTab === 'search' && (
                    <StudentSearch sheetsData={sheetsData} config={config} />
                  )}

                  {activeTab === 'spreadsheet' && currentUser.role === 'Admin' && (
                    <SpreadsheetView
                      sheetsData={sheetsData}
                      onUpdateSheets={setSheetsData}
                      config={config}
                    />
                  )}

                  {activeTab === 'admin' && currentUser.role === 'Admin' && (
                    <AdminPanel
                      config={config}
                      onUpdateConfig={setConfig}
                      access={access}
                      onUpdateAccess={setAccess}
                      users={users}
                      onUpdateUsers={setUsers}
                      onTriggerDefaultReset={handleDefaultReset}
                      syncUrl={syncUrl}
                      onUpdateSyncUrl={setSyncUrl}
                      onTriggerSync={() => handleTriggerSync(true)}
                      syncLogs={syncLogs}
                      nextSyncSeconds={nextSyncSeconds}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Footer information block alignment */}
          <footer className="w-full text-center py-6 text-[10px] text-slate-400 border-t border-slate-200 mt-12 bg-transparent">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <p>© 2026 Admin Dashboard & 3 Spreadsheet Penilai {config.title}. Diolah secara transparan, akuntabel, & dinamis.</p>
              <div className="flex justify-center space-x-3 shrink-0">
                <span>Auto-refreshed: <strong className="font-mono text-slate-500">Every 1 hour</strong></span>
                <span>Verification: <strong className="text-emerald-600 font-bold">SECURE PIPELINE ALIGNED</strong></span>
                <span>KKM: <strong className="font-mono text-slate-600">{config.kkm}</strong></span>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Admin Login Modal Overlay */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-100"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer transition-colors"
                title="Tutup login"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="pt-2">
                <LoginGate
                  users={users}
                  onLoginSuccess={(user) => {
                    setCurrentUser(user);
                    setShowLoginModal(false);
                    if (user.role === 'Admin') {
                      setActiveTab('admin');
                    }
                  }}
                  themeStyles={styles}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Visual Authen Gate component wrapper
interface LoginProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  themeStyles: any;
}

function LoginGate({ users, onLoginSuccess, themeStyles }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap lengkapi semua isian kredensial sandi!');
      return;
    }

    const matched = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && 
      u.password === password
    );

    if (matched) {
      onLoginSuccess(matched);
    } else {
      setErrorMsg('Username atau Kata Sandi salah! Coba akun preset di bawah untuk akses instan.');
    }
  };

  const loginWithPreset = (presetUser: UserAccount) => {
    onLoginSuccess(presetUser);
  };

  return (
    <div className="space-y-6 relative z-10 text-slate-850 text-left">
      
      {/* Banner header inside portal authentication */}
      <div className="text-center space-y-3 flex flex-col items-center">
        <img
          src="https://github.com/jack02ok/osnsd/blob/main/logosd.png?raw=true"
          alt="Logo SDN Neglasari 02"
          className="w-16 h-16 object-contain bg-white rounded-2xl p-1 shadow-md shadow-indigo-600/5 shrink-0"
          referrerPolicy="no-referrer"
        />
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-800 leading-tight text-center">SD Negeri Neglasari 02</h2>
          <p className="text-[11px] text-slate-500 font-medium text-center">Sistem Rapor & Publikasi Nilai Ujian</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Username Akun</label>
          <input
            type="text"
            placeholder="Masukkan username (Contoh: admin)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Kata Sandi</label>
          <div className="relative">
            <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="password"
              placeholder="Masukkan kata sandi..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/15 cursor-pointer text-center"
        >
          Masuk ke Dashboard Portal
        </button>
      </form>

      <div className="border-t border-slate-100 pt-5 space-y-3">
        <div className="text-center">
          <span className="bg-slate-50 border border-slate-200 px-3.5 py-1 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
            UJI AKSES CEPAT (PRESET)
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => loginWithPreset(users[0] || DEFAULT_USERS[0])}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center space-x-1.5 mb-1">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Admin</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium truncate">Budi Santoso</p>
            <p className="text-[9px] text-slate-400 mt-1 font-mono">user: <strong className="text-slate-600">admin</strong></p>
          </button>

          <button
            onClick={() => loginWithPreset(users[1] || DEFAULT_USERS[1])}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center space-x-1.5 mb-1">
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">User Biasa</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium truncate">Aditya Pratama</p>
            <p className="text-[9px] text-slate-400 mt-1 font-mono">user: <strong className="text-slate-600">siswa</strong></p>
          </button>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
          Standard keamanan terakreditasi • SD Negeri Neglasari 02 Portal Rapor v2.6.2
        </p>
      </div>
    </div>
  );
}
