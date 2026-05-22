import React, { useState } from 'react';
import { SheetData, Student, DashboardConfig } from '../types';
import { calculateStudentStats, THEME_STYLES } from '../data';
import { Plus, Trash, FileSpreadsheet, RotateCcw, AlertCircle, FilePlus, Download } from 'lucide-react';

interface SpreadsheetViewProps {
  sheetsData: SheetData[];
  onUpdateSheets: (updated: SheetData[]) => void;
  config: DashboardConfig;
}

export default function SpreadsheetView({ sheetsData, onUpdateSheets, config }: SpreadsheetViewProps) {
  const [activeTab, setActiveTab] = useState<string>('sheet-1');
  const [editingCell, setEditingCell] = useState<{ studentId: string; subject: string } | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCategory, setNewSubjectCategory] = useState('Sains');
  const [csvText, setCsvText] = useState('');
  const [showCsvBox, setShowCsvBox] = useState(false);

  const activeSheet = sheetsData.find(s => s.id === activeTab) || sheetsData[0];
  const styles = THEME_STYLES[config.themeColor] || THEME_STYLES.indigo;

  // Handles updating individual cell score
  const handleScoreChange = (studentId: string, subject: string, valStr: string) => {
    const rawVal = parseInt(valStr);
    const val = isNaN(rawVal) ? 0 : Math.min(100, Math.max(0, rawVal));

    const updated = sheetsData.map((sheet) => {
      if (sheet.id === activeSheet.id) {
        const updatedStudents = sheet.students.map((stu) => {
          if (stu.id === studentId) {
            const updatedScores = { ...stu.scores, [subject]: val };
            const { totalScore, average } = calculateStudentStats(updatedScores);
            return {
              ...stu,
              scores: updatedScores,
              totalScore,
              average
            };
          }
          return stu;
        });
        return { ...sheet, students: updatedStudents };
      }
      return sheet;
    });

    onUpdateSheets(updated);
  };

  // Handles student rename
  const handleStudentNameChange = (studentId: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = sheetsData.map((sheet) => {
      if (sheet.id === activeSheet.id) {
        const updatedStudents = sheet.students.map((stu) => {
          if (stu.id === studentId) {
            return { ...stu, name: newName };
          }
          return stu;
        });
        return { ...sheet, students: updatedStudents };
      }
      return sheet;
    });
    onUpdateSheets(updated);
  };

  // Handles sheet/classroom name edit
  const handleSheetNameChange = (sheetId: string, newSheetName: string) => {
    if (!newSheetName.trim()) return;
    const updated = sheetsData.map((sheet) => {
      if (sheet.id === sheetId) {
        return { ...sheet, name: newSheetName.trim() };
      }
      return sheet;
    });
    onUpdateSheets(updated);
  };

  // Adds a new student to active sheet
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    // Build default score of 0 for all subjects in active sheet
    const defaultScores: Record<string, number> = {};
    activeSheet.subjects.forEach((sub) => {
      defaultScores[sub.name] = 75; // Pre-populate with typical passing score as starting point
    });

    const { totalScore, average } = calculateStudentStats(defaultScores);

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      name: newStudentName.trim(),
      scores: defaultScores,
      totalScore,
      average
    };

    const updated = sheetsData.map((sheet) => {
      if (sheet.id === activeSheet.id) {
        return {
          ...sheet,
          students: [...sheet.students, newStudent]
        };
      }
      return sheet;
    });

    onUpdateSheets(updated);
    setNewStudentName('');
  };

  // Deletes student from active sheet
  const handleDeleteStudent = (studentId: string) => {
    const updated = sheetsData.map((sheet) => {
      if (sheet.id === activeSheet.id) {
        return {
          ...sheet,
          students: sheet.students.filter(stu => stu.id !== studentId)
        };
      }
      return sheet;
    });
    onUpdateSheets(updated);
  };

  // Adds a new subject to the sheet
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const subjName = newSubjectName.trim();
    // Check if subject already exists
    if (activeSheet.subjects.some(s => s.name.toLowerCase() === subjName.toLowerCase())) {
      alert('Mata pelajaran ini sudah ada di sheet ini.');
      return;
    }

    const updated = sheetsData.map((sheet) => {
      if (sheet.id === activeSheet.id) {
        // Add subject to definitions
        const updatedSubjects = [...sheet.subjects, { name: subjName, category: newSubjectCategory }];
        // Add score of 0 for this subject to all students in current sheet
        const updatedStudents = sheet.students.map((stu) => {
          const updatedScores = { ...stu.scores, [subjName]: 0 };
          const { totalScore, average } = calculateStudentStats(updatedScores);
          return {
            ...stu,
            scores: updatedScores,
            totalScore,
            average
          };
        });
        return {
          ...sheet,
          subjects: updatedSubjects,
          students: updatedStudents
        };
      }
      return sheet;
    });

    onUpdateSheets(updated);
    setNewSubjectName('');
  };

  // Deletes subject from active sheet
  const handleDeleteSubject = (subjName: string) => {
    if (activeSheet.subjects.length <= 1) {
      alert('Setidaknya harus menyisakan 1 mata pelajaran.');
      return;
    }

    if (!confirm(`Hapus mata pelajaran "${subjName}" dari sheet ini? Nilai semua siswa untuk pelajaran ini juga akan dihapus.`)) {
      return;
    }

    const updated = sheetsData.map((sheet) => {
      if (sheet.id === activeSheet.id) {
        const updatedSubjects = sheet.subjects.filter(s => s.name !== subjName);
        const updatedStudents = sheet.students.map((stu) => {
          const updatedScores = { ...stu.scores };
          delete updatedScores[subjName];
          const { totalScore, average } = calculateStudentStats(updatedScores);
          return {
            ...stu,
            scores: updatedScores,
            totalScore,
            average
          };
        });
        return {
          ...sheet,
          subjects: updatedSubjects,
          students: updatedStudents
        };
      }
      return sheet;
    });

    onUpdateSheets(updated);
  };

  // Import mock structure via pasting tab separated rows
  const handleCsvImport = () => {
    if (!csvText.trim()) return;

    try {
      const rows = csvText.trim().split('\n');
      if (rows.length < 2) throw new Error('Format salah. Maksimal baris kurang.');

      const headers = rows[0].split('\t');
      if (headers.length < 2 || headers[0] !== 'Nama') {
        alert('Baris pertama harus berupa header, kolom pertama harus "Nama", diikuti oleh nama mata pelajaran dipisah dengan TAB/koma.');
        return;
      }

      const parsedSubjects = headers.slice(1).map(h => ({ name: h.trim(), category: 'Sains' }));
      const parsedStudents: Student[] = [];

      for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split('\t');
        if (columns.length < 1 || !columns[0]) continue;

        const name = columns[0].trim();
        const scores: Record<string, number> = {};

        parsedSubjects.forEach((sub, subIdx) => {
          const val = columns[subIdx + 1] ? parseInt(columns[subIdx + 1].trim()) : 0;
          scores[sub.name] = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
        });

        const { totalScore, average } = calculateStudentStats(scores);

        parsedStudents.push({
          id: `std-imported-${Date.now()}-${i}`,
          name,
          scores,
          totalScore,
          average
        });
      }

      if (parsedStudents.length === 0) {
        alert('Gagal mendeteksi siswa.');
        return;
      }

      const updated = sheetsData.map((sheet) => {
        if (sheet.id === activeSheet.id) {
          return {
            ...sheet,
            subjects: parsedSubjects,
            students: parsedStudents
          };
        }
        return sheet;
      });

      onUpdateSheets(updated);
      setShowCsvBox(false);
      setCsvText('');
    } catch (err) {
      alert('Gagal memproses teks spreadsheet. Pastikan Anda mengkopi langsung dari Excel/Google Sheets dan melakukan paste di sini.');
    }
  };

  // Export current active sheet as raw copyable block
  const getShareableData = () => {
    const headers = ['Nama', ...activeSheet.subjects.map(s => s.name)].join('\t');
    const rows = activeSheet.students.map((stu) => {
      const scoresRow = activeSheet.subjects.map(s => stu.scores[s.name] || 0).join('\t');
      return `${stu.name}\t${scoresRow}`;
    }).join('\n');
    return `${headers}\n${rows}`;
  };

  return (
    <div id="spreadsheet-container" className="space-y-4">
      {/* Tab sheets toolbar header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5" id="spreadsheet-sheet-tabs">
          {sheetsData.map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => setActiveTab(sheet.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all duration-150 flex items-center space-x-1.5 border ${
                activeTab === sheet.id
                  ? `${styles.light} ${styles.text} ${styles.border} border-b-white z-10 -mb-2.5`
                  : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{sheet.name}</span>
              <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0">
                {sheet.students.length}
              </span>
            </button>
          ))}

          {/* Inline Edit Nama Kelas/Sheet */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg ml-2 transition-colors">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Edit Nama Kelas Active:</span>
            <input
              type="text"
              value={activeSheet.name}
              onChange={(e) => handleSheetNameChange(activeSheet.id, e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-hidden border-b border-transparent focus:border-indigo-600 w-32 pb-0.5"
              title="Ketik di sini untuk mengubah nama kelas ini"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const text = getShareableData();
              navigator.clipboard.writeText(text);
              alert('Data Sheet berhasil dikopi ke clipboard dalam format TAB separated! Anda bisa langsung mem-pastenya ke Excel atau Google Sheets.');
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
            title="Export ke Google Sheets / Excel format"
          >
            <Download className="h-3 w-3" />
            <span>Salin Form Sheets</span>
          </button>
          <button
            onClick={() => setShowCsvBox(!showCsvBox)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
              showCsvBox ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            <FilePlus className="h-3 w-3" />
            <span>{showCsvBox ? 'Sembunyikan Impor' : 'Impor dari Spreadsheet'}</span>
          </button>
        </div>
      </div>

      {showCsvBox && (
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 text-xs space-y-3">
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-amber-800">Petunjuk Impor Cepat Spreadsheet</h5>
              <p className="text-slate-600 mt-0.5">
                Kopi kolom dari Excel/Sheets (misal: Kolom Nama dan nilai mata pelajaran) lalu paste ke kolom di bawah. Kolom pertama harus "Nama". Pisahkan antar kolom menggunakan tabulasi (tab).
              </p>
            </div>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"Nama\tMatematika\tFisika\tBahasa Inggris\nJaka Perkasa\t85\t90\t88\nSanti Wijaya\t75\t82\t91"}
            rows={4}
            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:ring-1 focus:ring-amber-500"
          ></textarea>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowCsvBox(false)}
              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
            >
              Batal
            </button>
            <button
              onClick={handleCsvImport}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
            >
              Injeksi Data Baru
            </button>
          </div>
        </div>
      )}

      {/* Main spreadsheet core layout */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-left text-slate-500 font-bold border-r border-slate-100 w-12">No</th>
              <th scope="col" className="px-4 py-2.5 text-left text-slate-700 font-bold border-r border-slate-100 w-48">Nama Siswa</th>
              {activeSheet.subjects.map((sub) => (
                <th key={sub.name} scope="col" className="px-2 py-2.5 text-center text-slate-600 font-bold border-r border-[#e2e8f0] relative group w-28">
                  <div className="flex flex-col items-center">
                    <span>{sub.name}</span>
                    <span className="text-[8px] font-normal text-slate-400 capitalize">{sub.category}</span>
                  </div>
                  {/* Subject Delete utility */}
                  <button
                    onClick={() => handleDeleteSubject(sub.name)}
                    className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                    title="Hapus mata pelajaran"
                  >
                    <Trash className="h-2.5 w-2.5" />
                  </button>
                </th>
              ))}
              <th scope="col" className="px-3 py-2.5 text-center text-slate-600 font-bold border-r border-slate-100 w-20 bg-slate-50">Total</th>
              <th scope="col" className="px-3 py-2.5 text-center text-slate-800 font-bold border-r border-slate-100 w-20 bg-slate-50">Rerata</th>
              <th scope="col" className="px-3 py-2.5 text-center text-slate-600 font-bold w-24">Status</th>
              <th scope="col" className="px-2 py-2.5 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {activeSheet.students.map((student, idx) => (
              <tr key={student.id} className="hover:bg-slate-50/50">
                <td className="px-3 py-2 border-r border-slate-100 font-mono text-slate-400 text-center">{idx + 1}</td>
                <td className="px-4 py-2 border-r border-slate-100 font-medium text-slate-800">
                  <input
                    type="text"
                    value={student.name}
                    onChange={(e) => handleStudentNameChange(student.id, e.target.value)}
                    className="w-full bg-transparent border-b border-transparent focus:border-indigo-400 focus:outline-hidden font-bold"
                  />
                </td>
                {activeSheet.subjects.map((sub) => {
                  const val = student.scores[sub.name] !== undefined ? student.scores[sub.name] : 0;
                  const isEditing = editingCell?.studentId === student.id && editingCell?.subject === sub.name;

                  return (
                    <td
                      key={sub.name}
                      onClick={() => setEditingCell({ studentId: student.id, subject: sub.name })}
                      className={`px-1 py-1 text-center border-r border-slate-100 font-mono text-xs cursor-pointer select-none transition-colors ${
                        val < config.kkm ? 'text-red-500 bg-red-50/10' : 'text-slate-700'
                      }`}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          value={val || ''}
                          autoFocus
                          onBlur={() => setEditingCell(null)}
                          onChange={(e) => handleScoreChange(student.id, sub.name, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-16 text-center border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden py-0.5 px-1 bg-white"
                          min={0}
                          max={100}
                        />
                      ) : (
                        <span className="font-bold underline decoration-slate-200 decoration-dotted">{val}</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 border-r border-slate-100 text-center font-mono font-bold text-slate-600 bg-slate-50/40">{student.totalScore}</td>
                <td className="px-3 py-2 border-r border-slate-100 text-center font-mono font-bold text-slate-800 bg-slate-50/40">{student.average}</td>
                <td className="px-3 py-2 border-r border-slate-100 text-center font-sans font-semibold">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    student.average >= config.kkm
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {student.average >= config.kkm ? 'TUNTAS' : 'REMEDIAL'}
                  </span>
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Hapus siswa"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {activeSheet.students.length === 0 && (
              <tr>
                <td colSpan={6 + activeSheet.subjects.length} className="px-4 py-8 text-center text-slate-400 italic">
                  Belum ada data siswa di sheet ini. Tambahkan siswa di bawah.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet grid editing toolbars (Add student, Add subject) */}
      <div id="spreadsheet-utilities" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form Tambah Siswa */}
        <form onSubmit={handleAddStudent} className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2.5">
          <h5 className="text-xs font-bold text-slate-700 flex items-center space-x-1">
            <Plus className="h-3.5 w-3.5 text-indigo-500" />
            <span>Tambah Data Siswa Baru</span>
          </h5>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Masukkan nama lengkap siswa..."
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
            <button
              type="submit"
              className={`px-4 py-1.5 ${styles.primary} ${styles.primaryHover} text-white font-bold rounded-lg text-xs shrink-0`}
            >
              Tambah Siswa
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Siswa baru akan ditambahkan ke <strong>{activeSheet.name}</strong> dengan nilai KKM default di setiap mata pelajaran yang ada.
          </p>
        </form>

        {/* Form Tambah Mata Pelajaran */}
        <form onSubmit={handleAddSubject} className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2.5">
          <h5 className="text-xs font-bold text-slate-700 flex items-center space-x-1">
            <Plus className="h-3.5 w-3.5 text-emerald-500" />
            <span>Tambah Komponen Mata Pelajaran baru</span>
          </h5>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nama mapel (mis: Kimia)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
            <select
              value={newSubjectCategory}
              onChange={(e) => setNewSubjectCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="Sains">Sains / Eksak</option>
              <option value="Sosial">Sosial / Sosiologi</option>
              <option value="Bahasa">Bahasa & Seni</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs"
          >
            Insert Mata Pelajaran
          </button>
        </form>
      </div>
    </div>
  );
}
