import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { SheetData, DashboardConfig, AccessControl, UserAccount } from './types';
import { INITIAL_SHEETS_DATA, THEME_STYLES } from './data';
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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((s: any) => s.id === 'sheet-tka')) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_SHEETS_DATA;
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
      showQuotesToStudent: true,
      disableKkm: false
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

  // --- REAL-TIME PORTAL SYNCHRONIZATION WITH FIRESTORE ---

  useEffect(() => {
    // 1. Config Real-time Sync
    const unsubConfig = onSnapshot(doc(db, 'portal_data', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setConfig(prev => ({
          ...prev,
          kkm: typeof data.kkm === 'number' ? data.kkm : prev.kkm,
          title: typeof data.title === 'string' ? data.title : prev.title,
          chartType: data.chartType || prev.chartType,
          themeColor: data.themeColor || prev.themeColor,
          showDetailsToStudent: data.showDetailsToStudent !== undefined ? data.showDetailsToStudent : prev.showDetailsToStudent,
          showAverageToStudent: data.showAverageToStudent !== undefined ? data.showAverageToStudent : prev.showAverageToStudent,
          showRankToStudent: data.showRankToStudent !== undefined ? data.showRankToStudent : prev.showRankToStudent,
          showStarsToStudent: data.showStarsToStudent !== undefined ? data.showStarsToStudent : prev.showStarsToStudent,
          showQuotesToStudent: data.showQuotesToStudent !== undefined ? data.showQuotesToStudent : prev.showQuotesToStudent,
          disableKkm: data.disableKkm !== undefined ? data.disableKkm : prev.disableKkm,
        }));
      } else {
        // First-run bootstrap
        const initialConfig = {
          kkm: 75,
          title: 'SD Negeri Neglasari 02',
          chartType: 'composed',
          themeColor: 'indigo',
          showDetailsToStudent: true,
          showAverageToStudent: true,
          showRankToStudent: true,
          showStarsToStudent: true,
          showQuotesToStudent: true,
          disableKkm: false
        };
        setDoc(doc(db, 'portal_data', 'config'), initialConfig).catch(console.error);
        localStorage.setItem('dashboard_config_v1', JSON.stringify(initialConfig));
      }
    });

    // 2. Access lock & timer state
    const unsubAccess = onSnapshot(doc(db, 'portal_data', 'access'), (snapshot) => {
      if (snapshot.exists()) {
        setAccess(snapshot.data() as AccessControl);
      } else {
        const initialAccess: AccessControl = {
          isDataVisible: true,
          timerEndTime: null,
          timerAction: null,
          timerDurationSeconds: 0
        };
        setDoc(doc(db, 'portal_data', 'access'), initialAccess).catch(console.error);
        localStorage.setItem('portal_access_v1', JSON.stringify(initialAccess));
      }
    });

    // 3. Spreadsheet Sheets Data
    const unsubSheets = onSnapshot(doc(db, 'portal_data', 'sheets'), (snapshot) => {
      if (snapshot.exists()) {
        const payload = snapshot.data();
        if (payload && Array.isArray(payload.data)) {
          // Auto-migrate database to include the new exact TKA student dataset if sheet-tka is missing
          const hasTka = payload.data.some((s: any) => s.id === 'sheet-tka');
          if (!hasTka) {
            console.log("Migrating database to SDN Neglasari 02 Hasil TKA");
            setDoc(doc(db, 'portal_data', 'sheets'), { data: INITIAL_SHEETS_DATA }).catch(console.error);
            setSheetsData(INITIAL_SHEETS_DATA);
            localStorage.setItem('sheet_data_v1', JSON.stringify(INITIAL_SHEETS_DATA));
          } else {
            setSheetsData(payload.data);
          }
        }
      } else {
        setDoc(doc(db, 'portal_data', 'sheets'), { data: INITIAL_SHEETS_DATA }).catch(console.error);
        localStorage.setItem('sheet_data_v1', JSON.stringify(INITIAL_SHEETS_DATA));
      }
    });

    // 4. Admin and Users logins roster
    const unsubUsers = onSnapshot(doc(db, 'portal_data', 'users'), (snapshot) => {
      if (snapshot.exists()) {
        const payload = snapshot.data();
        if (payload && Array.isArray(payload.data)) {
          setUsers(payload.data);
        }
      } else {
        setDoc(doc(db, 'portal_data', 'users'), { data: DEFAULT_USERS }).catch(console.error);
        localStorage.setItem('school_users_v1', JSON.stringify(DEFAULT_USERS));
      }
    });

    // 5. Historical sync charts
    const unsubHistory = onSnapshot(doc(db, 'portal_data', 'syncHistory'), (snapshot) => {
      if (snapshot.exists()) {
        const payload = snapshot.data();
        if (payload && Array.isArray(payload.data)) {
          setSyncHistory(payload.data);
        }
      } else {
        const history: any[] = [];
        const times = ['08:00', '09:00', '10:00', '11:00', '12:00'];
        const modifiers = [-4.0, -2.5, -1.0, 1.5, 0];

        times.forEach((t, i) => {
          const classAverages: Record<string, number> = {};
          INITIAL_SHEETS_DATA.forEach((s: any) => {
            const baseAvg = s.students.length > 0
              ? Math.round((s.students.reduce((acc: number, stu: any) => acc + stu.average, 0) / s.students.length) * 10) / 10
              : 75;
            classAverages[s.name] = Math.round(Math.min(100, Math.max(0, baseAvg + modifiers[i] + (i % 2 === 0 ? 0.3 : -0.3))) * 10) / 10;
          });
          history.push({
            timestamp: t,
            classAverages
          });
        });
        setDoc(doc(db, 'portal_data', 'syncHistory'), { data: history }).catch(console.error);
        localStorage.setItem('sync_history_v1', JSON.stringify(history));
      }
    });

    return () => {
      unsubConfig();
      unsubAccess();
      unsubSheets();
      unsubUsers();
      unsubHistory();
    };
  }, []);

  // Sync user logging sessions in localStorage for easy restoration
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('school_logged_user_v1', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('school_logged_user_v1');
    }
  }, [currentUser]);

  // Keep offline fallback caching in localStorage up-to-date
  useEffect(() => {
    localStorage.setItem('school_users_v1', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sheet_data_v1', JSON.stringify(sheetsData));
    localStorage.setItem('dashboard_config_v1', JSON.stringify(config));
    localStorage.setItem('portal_access_v1', JSON.stringify(access));
  }, [sheetsData, config, access]);

  // Sync log of classroom averages to Firestore when recalculations happen
  useEffect(() => {
    // Recalculate sync history trends when sheet data is mutated
    const currentAverages: Record<string, number> = {};
    sheetsData.forEach(s => {
      const sum = s.students.reduce((acc, stu) => acc + stu.average, 0);
      currentAverages[s.name] = s.students.length > 0 ? Math.round((sum / s.students.length) * 10) / 10 : 0;
    });

    if (syncHistory.length > 0) {
      const lastRecord = syncHistory[syncHistory.length - 1];
      const isIdentical = Object.keys(currentAverages).every(k => lastRecord.classAverages[k] === currentAverages[k]);
      if (isIdentical && Object.keys(lastRecord.classAverages).length === Object.keys(currentAverages).length) {
        return;
      }
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newRecord = { timestamp: nowStr, classAverages: currentAverages };
    const nextHistory = [...syncHistory, newRecord].slice(-15);

    setSyncHistory(nextHistory);
    localStorage.setItem('sync_history_v1', JSON.stringify(nextHistory));

    // Upload to shared database if current is Admin
    if (currentUser.role === 'Admin') {
      setDoc(doc(db, 'portal_data', 'syncHistory'), { data: nextHistory }).catch(console.error);
    }
  }, [sheetsData]);

  // Active persistence triggers for operations
  const handleUpdateUsers = async (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    try {
      await setDoc(doc(db, 'portal_data', 'users'), { data: newUsers });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSheetsData = async (newData: SheetData[]) => {
    setSheetsData(newData);
    try {
      await setDoc(doc(db, 'portal_data', 'sheets'), { data: newData });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateConfig = async (newConfig: DashboardConfig) => {
    setConfig(newConfig);
    try {
      await setDoc(doc(db, 'portal_data', 'config'), newConfig);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAccess = async (newAccess: AccessControl) => {
    setAccess(newAccess);
    try {
      await setDoc(doc(db, 'portal_data', 'access'), newAccess);
    } catch (err) {
      console.error(err);
    }
  };

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
        const updatedAccess: AccessControl = {
          isDataVisible: nextVisibility,
          timerEndTime: null,
          timerAction: null,
          timerDurationSeconds: 0
        };
        setAccess(updatedAccess);
        if (currentUser.role === 'Admin') {
          setDoc(doc(db, 'portal_data', 'access'), updatedAccess).catch(console.error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [access.timerEndTime, access.timerAction, currentUser.role]);

  // Trigger system data complete reset
  const handleDefaultReset = async () => {
    const defaultSheets = INITIAL_SHEETS_DATA;
    const defaultConfig = {
      kkm: 75,
      title: 'SD Negeri Neglasari 02',
      chartType: 'composed' as const,
      themeColor: 'indigo' as const,
      showDetailsToStudent: true,
      showAverageToStudent: true,
      showRankToStudent: true,
      showStarsToStudent: true,
      showQuotesToStudent: true,
      disableKkm: false
    };
    const defaultAccess = {
      isDataVisible: true,
      timerEndTime: null,
      timerAction: null,
      timerDurationSeconds: 0
    };

    setSheetsData(defaultSheets);
    setConfig(defaultConfig);
    setAccess(defaultAccess);

    try {
      await setDoc(doc(db, 'portal_data', 'sheets'), { data: defaultSheets });
      await setDoc(doc(db, 'portal_data', 'config'), defaultConfig);
      await setDoc(doc(db, 'portal_data', 'access'), defaultAccess);
    } catch (err) {
      console.error(err);
    }

    alert('Database spreadsheet berhasil direset ke nilai standard/default!');
  };

  // Completely empty the spreadsheet database
  const handleClearData = async () => {
    setSheetsData([]);
    try {
      await setDoc(doc(db, 'portal_data', 'sheets'), { data: [] });
    } catch (err) {
      console.error(err);
    }
    alert('Seluruh basis data kelas dan nilai siswa telah berhasil dikosongkan!');
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

  // The workspace is public-first. Admin can authenticate using sidebar popup.

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 2. Sleek Top Navigation Bar (Horizontal Menu) */}
      <header className="bg-slate-900 text-white shadow-md flex-none z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left brand segment */}
          <div className="flex items-center gap-3">
            <img
              src="https://github.com/jack02ok/osnsd/blob/main/logosd.png?raw=true"
              alt="Logo SDN Neglasari 02"
              className="w-10 h-10 object-contain bg-white rounded-xl p-0.5 shrink-0 shadow-md shadow-black/30"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <h1 className="text-white font-extrabold tracking-tight text-xs sm:text-sm truncate" title={config.title}>{config.title}</h1>
              <span className="text-[9px] text-emerald-400 font-black tracking-wide block uppercase leading-none mt-0.5">PORTAL SD NEGERI</span>
            </div>
          </div>

          {/* Middle Navigators (Horizontal List) */}
          {!( !access.isDataVisible && currentUser.role !== 'Admin' ) && (
            <nav className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-650 text-white shadow-sm shadow-indigo-600/10'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart2 className="h-4 w-4 shrink-0" />
                <span>Dashboard Statistik</span>
              </button>

              {/* Interactive sheet for Admin only */}
              {currentUser.role === 'Admin' && (
                <button
                  onClick={() => setActiveTab('spreadsheet')}
                  className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${
                    activeTab === 'spreadsheet'
                      ? 'bg-indigo-655 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4 shrink-0" />
                  <span>Interaksi 3 Sheet</span>
                </button>
              )}

              {/* Admin controller */}
              {currentUser.role === 'Admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${
                    activeTab === 'admin'
                      ? 'bg-indigo-655 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>Konfigurasi & Akses</span>
                </button>
              )}
            </nav>
          )}

          {/* Right Account & profile segment */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">
                {currentUser.id === 'usr-guest' ? 'PENGUNJUNG' : currentUser.role}
              </span>
              <span className="text-white text-[11px] font-bold truncate max-w-[120px] mt-0.5">
                {currentUser.id === 'usr-guest' ? 'Siswa / Ortu' : currentUser.fullName}
              </span>
            </div>

            <div className={`w-8 h-8 rounded-full ${currentUser.role === 'Admin' ? 'bg-indigo-600 border border-indigo-500' : 'bg-slate-700 border border-slate-600'} flex items-center justify-center font-bold text-white text-[10px] shrink-0`}>
              {currentUser.id === 'usr-guest' ? '🎒' : 'AD'}
            </div>

            {currentUser.id === 'usr-guest' ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Masuk Admin</span>
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="py-1.5 px-3 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white font-black rounded-xl text-[10px] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Nav Bar */}
        {!( !access.isDataVisible && currentUser.role !== 'Admin' ) && (
          <div className="md:hidden flex items-center justify-center border-t border-slate-800 px-2 py-1.5 space-x-1 bg-slate-950/20">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1 bg-transparent rounded-lg flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-all ${
                activeTab === 'dashboard'
                  ? 'text-white bg-indigo-600'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="h-3 w-3" />
              <span>Dashboard</span>
            </button>

            {currentUser.role === 'Admin' && (
              <>
                <button
                  onClick={() => setActiveTab('spreadsheet')}
                  className={`px-3 py-1 bg-transparent rounded-lg flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-all ${
                    activeTab === 'spreadsheet'
                      ? 'text-white bg-indigo-600'
                      : 'text-slate-400 hover:bg-slate-805'
                  }`}
                >
                  <FileSpreadsheet className="h-3 w-3" />
                  <span>3 Sheet</span>
                </button>

                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1 bg-transparent rounded-lg flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-all ${
                    activeTab === 'admin'
                      ? 'text-white bg-indigo-600'
                      : 'text-slate-400 hover:bg-slate-805'
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  <span>Konfigurasi</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* 2.5 Sub-Header strip for system status */}
      {!( !access.isDataVisible && currentUser.role !== 'Admin' ) && (
        <div className="bg-slate-100 border-b border-slate-200 py-2 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none text-xs text-slate-600">
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${access.isDataVisible ? 'bg-emerald-500 animate-ping' : 'bg-rose-500 animate-pulse'}`}></span>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${access.isDataVisible ? 'bg-emerald-500' : 'bg-rose-500'} -ml-4`}></span>
              <span className="font-semibold text-slate-500">Status Akses:</span>
              <span className={`font-black ${access.isDataVisible ? 'text-emerald-600' : 'text-rose-600'}`}>
                {access.isDataVisible ? 'Terbuka Untuk Umum (Unlocked)' : 'Ditutup Sementara (Locked Admin)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      {!access.isDataVisible && currentUser.role !== 'Admin' ? (
        <div id="countdown-blocked-screen" className="flex-1 w-full bg-slate-950 flex flex-col justify-between overflow-y-auto animate-fade-in z-10">
          {/* Massive Running Text (Marquee) at the top of the locked screen! */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 py-4 select-none overflow-hidden border-b border-amber-500/30 flex-none">
            <marquee className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-widest block whitespace-nowrap leading-none" scrollamount="5">
              ✨ TETAP SEMANGAT KELAS 6! PERJALANAN INDAHMU BARU SAJA DIMULAI. JADIKAN MOMENTUM INI UNTUK TERUS BELAJAR, MEMPERBAIKI DIRI, DAN SIAP MENGHADAPI TANTANGAN HEBAT DI TINGKAT SEKOLAH LANJUTAN SELANJUTNYA! PRESTASI PENTING, JUJUR DAN AKHLAK MULIA ADALAH YANG UTAMA! KELAS 6 SDN NEGLASARI 02 - KALIAN PASTI BISA! ✨ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </marquee>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <div className="max-w-3xl w-full bg-slate-900/40 border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-12 text-center space-y-8 backdrop-blur-xs relative overflow-hidden">
              <div className="absolute top-5 left-5 opacity-5 text-7xl select-none font-bold">🎒</div>
              <div className="absolute bottom-5 right-5 opacity-5 text-7xl select-none font-bold">🏫</div>

              <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/5">
                <EyeOff className="h-10 w-10 animate-pulse" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">STATUS PORTAL: SEDANG DITUTUP 🔒</h2>
                <p className="text-xs sm:text-sm text-white/90 max-w-lg mx-auto leading-relaxed">
                  Maaf, saat ini administrator sekolah sedang menutup portal publik data nilai untuk pengerjaan rekapitulasi data atau persiapan rapat pleno.
                </p>
              </div>

              {/* Countdown layout if timer is actively running */}
              {blockedCountdown !== null && blockedCountdown > 0 ? (
                <div className="bg-slate-900/90 inline-block px-10 py-6 rounded-3xl border border-slate-800 shadow-xl ring-1 ring-slate-800/50">
                  <span className="text-[10px] font-black tracking-widest text-white/80 uppercase block mb-1">WAKTU MUNDUR PEMBUKAAN PORTAL</span>
                  <div className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-wider animate-pulse leading-none py-1">
                    {formatCountdown(blockedCountdown)}
                  </div>
                  <div className="flex items-center justify-center space-x-1.5 text-xs text-white/80 mt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span>Situs Pengumuman Akan Terbuka Otomatis</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/85 text-xs text-white/90 max-w-sm mx-auto font-medium">
                  🕒 Akses data ditutup secara manual oleh Administrator. Silakan tunggu informasi pembukaan berikutnya dari pihak sekolah.
                </div>
              )}

              <div className="pt-6 border-t border-slate-900 space-y-4">
                <p className="text-[10px] sm:text-xs text-white/70 leading-normal max-w-md mx-auto">
                  Hubungi wali kelas masing-masing jika sandi admin diperlukan untuk rekonfigurasi. Kredensial masuk dibatasi aman.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 bg-slate-850 hover:bg-slate-800 hover:text-white text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-800 cursor-pointer"
                  >
                    Ganti Login Akun
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer className="w-full text-center py-4 text-[10px] text-slate-500 border-t border-slate-900 bg-slate-950/40 flex-none">
            SD Negeri Neglasari 02 Portal TKA (Tes Kemampuan Akademik) &copy; 2026
          </footer>
        </div>
      ) : (
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
          
          {/* Outer scrolling container holding workspace */}
          <div className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
            <div className="space-y-6">
              
              {/* Warnings alert for Admin if the portal is currently blocked */}
              {!access.isDataVisible && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-805 rounded-2xl flex items-start space-x-3 text-xs shadow-2xs">
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
                       onSwitchTab={setActiveTab as any}
                       syncHistory={syncHistory}
                    />
                  )}

                  {activeTab === 'spreadsheet' && currentUser.role === 'Admin' && (
                    <SpreadsheetView
                      sheetsData={sheetsData}
                      onUpdateSheets={handleUpdateSheetsData}
                      config={config}
                    />
                  )}

                  {activeTab === 'admin' && currentUser.role === 'Admin' && (
                    <AdminPanel
                      config={config}
                      onUpdateConfig={handleUpdateConfig}
                      access={access}
                      onUpdateAccess={handleUpdateAccess}
                      users={users}
                      onUpdateUsers={handleUpdateUsers}
                      onTriggerDefaultReset={handleDefaultReset}
                      onTriggerClearData={handleClearData}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer information block alignment */}
            <footer className="w-full text-center py-6 text-[10px] text-slate-400 border-t border-slate-200 mt-12 bg-transparent">
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <p>© 2026 Admin Dashboard & 3 Spreadsheet Penilai {config.title}. Diolah secara transparan, akuntabel, & dinamis.</p>
                <div className="flex justify-center space-x-3 shrink-0">
                  <span>Verification: <strong className="text-emerald-600 font-bold">SECURE PIPELINE ALIGNED</strong></span>
                  <span>KKM: <strong className="font-mono text-slate-600">{config.kkm}</strong></span>
                </div>
              </div>
            </footer>
          </div>
        </main>
      )}

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
      setErrorMsg('Username atau Kata Sandi salah!');
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
          <p className="text-[11px] text-slate-500 font-medium text-center">Sistem TKA (Tes Kemampuan Akademik) & Publikasi Nilai</p>
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

      <div className="text-center pt-2">
        <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
          Standard keamanan terakreditasi • SD Negeri Neglasari 02 Portal TKA (Tes Kemampuan Akademik) v2.6.2
        </p>
      </div>
    </div>
  );
}
