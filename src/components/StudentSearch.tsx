import { useState, useMemo } from 'react';
import { SheetData, Student, DashboardConfig } from '../types';
import { getSubjectCategory, THEME_STYLES } from '../data';
import { Search, Filter, BookOpen, Star, AlertCircle, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

interface StudentSearchProps {
  sheetsData: SheetData[];
  config: DashboardConfig;
}

export default function StudentSearch({ sheetsData, config }: StudentSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSheetId, setSelectedSheetId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'lulus' | 'remedial'
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const styles = THEME_STYLES[config.themeColor] || THEME_STYLES.indigo;

  // Get all unique subjects across all classes
  const allSubjects = useMemo(() => {
    const subjectsSet = new Set<string>();
    sheetsData.forEach((sheet) => {
      sheet.subjects.forEach((sub) => {
        if (sub.name) {
          subjectsSet.add(sub.name);
        }
      });
    });
    return Array.from(subjectsSet).sort();
  }, [sheetsData]);

  // Flatten students and append source sheet info, then filter in real-time
  const filteredStudents = useMemo(() => {
    const list: (Student & { 
      sheetName: string; 
      sheetId: string; 
      categoryStats: { total: number; average: number; count: number };
      subjectScore: number | null;
    })[] = [];

    sheetsData.forEach((sheet) => {
      sheet.students.forEach((student) => {
        // Collect scores belonging to selected category
        let categoryTotal = 0;
        let categoryCount = 0;
        
        Object.entries(student.scores).forEach(([subj, score]) => {
          const category = getSubjectCategory(subj);
          if (selectedCategory === 'all' || category === selectedCategory) {
            categoryTotal += score;
            categoryCount++;
          }
        });

        const categoryAverage = categoryCount > 0 ? Math.round((categoryTotal / categoryCount) * 10) / 10 : 0;
        const subjectScore = selectedSubject !== 'all' ? (student.scores[selectedSubject] !== undefined ? student.scores[selectedSubject] : null) : null;

        list.push({
          ...student,
          sheetName: sheet.name,
          sheetId: sheet.id,
          categoryStats: {
            total: categoryTotal,
            average: categoryAverage,
            count: categoryCount
          },
          subjectScore
        });
      });
    });

    // Apply textual and selection filters
    return list.filter((std) => {
      const matchName = std.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = selectedSheetId === 'all' || std.sheetId === selectedSheetId;
      const matchCategory = selectedCategory === 'all' || std.categoryStats.count > 0;
      const matchSubject = selectedSubject === 'all' || std.subjectScore !== null;
      
      // Determine pass/fail status based on chosen filter
      let relevantAvg = 0;
      if (selectedSubject !== 'all') {
        relevantAvg = std.subjectScore !== null ? std.subjectScore : 0;
      } else if (selectedCategory === 'all') {
        relevantAvg = std.average;
      } else {
        relevantAvg = std.categoryStats.average;
      }
      
      const isPassed = relevantAvg >= config.kkm;
      const matchStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'lulus' && isPassed) || 
                         (selectedStatus === 'remedial' && !isPassed);

      return matchName && matchLevel && matchCategory && matchSubject && matchStatus;
    });
  }, [sheetsData, searchTerm, selectedSheetId, selectedCategory, selectedSubject, selectedStatus, config.kkm]);

  // Quick action to toggle card expansion
  const toggleStudentExpand = (id: string) => {
    setExpandedStudentId(expandedStudentId === id ? null : id);
  };

  return (
    <div id="student-search-container" className="space-y-4">
      {/* Real-time search and filter dashboard control panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Quick Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa berdasarkan nama secara real-time..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Sheet/Kelas Filter */}
            <div className="flex items-center space-x-1 border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs text-slate-600">
              <span className="font-medium text-slate-400">Kelas:</span>
              <select
                value={selectedSheetId}
                onChange={(e) => setSelectedSheetId(e.target.value)}
                className="bg-transparent border-0 py-0.5 focus:ring-0 focus:outline-hidden"
              >
                <option value="all">Semua Kelas ({sheetsData.length})</option>
                {sheetsData.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Subject Category filter */}
            <div className="flex items-center space-x-1 border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs text-slate-600">
              <span className="font-medium text-slate-400">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-0 py-0.5 focus:ring-0 focus:outline-hidden"
              >
                <option value="all">Semua Kategori</option>
                <option value="Sains">Sains & Eksak</option>
                <option value="Sosial">Sosial Humaniora</option>
                <option value="Bahasa">Bahasa & Seni</option>
              </select>
            </div>

            {/* Individual Subject filter */}
            <div className="flex items-center space-x-1 border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs text-slate-600">
              <span className="font-medium text-slate-400">Mapel:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-transparent border-0 py-0.5 focus:ring-0 focus:outline-hidden font-bold text-slate-700"
              >
                <option value="all">Semua Mapel</option>
                {allSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Status kelulusan filter */}
            <div className="flex items-center space-x-1 border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs text-slate-600">
              <span className="font-medium text-slate-400">Status KKM:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent border-0 py-0.5 focus:ring-0 focus:outline-hidden"
              >
                <option value="all">Semua Status</option>
                <option value="lulus">Lulus (≥ {config.kkm})</option>
                <option value="remedial">Remedial (&lt; {config.kkm})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display meta feedback of statistics */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center space-x-1 font-medium">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Hasil Pencarian: <strong>{filteredStudents.length} siswa</strong> kecocokan ditemukan.</span>
          </div>
          {selectedSubject !== 'all' ? (
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-medium border border-indigo-100 italic">
              * Menampilkan fokus nilai individu mata pelajaran: <strong>{selectedSubject}</strong>
            </span>
          ) : selectedCategory !== 'all' ? (
            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-medium border border-amber-100 italic">
              * Rerata disesuaikan menampilkan nilai rumpun mata pelajaran {selectedCategory} saja
            </span>
          ) : null}
        </div>
      </div>      {/* Grid of student progress cards */}
      <div id="filtered-students-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStudents.map((std) => {
          const displayedAverage = selectedSubject !== 'all'
            ? (std.subjectScore !== null ? std.subjectScore : 0)
            : (selectedCategory === 'all' ? std.average : std.categoryStats.average);
          const isPassed = displayedAverage >= config.kkm;
          const isExpanded = expandedStudentId === std.id;

          // Kid avatar
          const getStudentAvatar = (id: string, name: string) => {
            const avatars = ['👦', '👧', '🦁', '🦒', '🦉', '🐱', '🐼', '🦊', '🐨', '🦖'];
            // basic hash
            let hash = 0;
            const combined = id + name;
            for (let i = 0; i < combined.length; i++) {
              hash += combined.charCodeAt(i);
            }
            return avatars[hash % avatars.length];
          };

          const avatarEmoji = getStudentAvatar(std.id, std.name);

          // Get feedback and rating info (SD style)
          const getKidFeedback = (avg: number) => {
            if (avg >= 90) {
              return {
                stars: 5,
                emoji: '🥳',
                title: 'Hebat Hebat Hebat! ⭐⭐⭐⭐⭐',
                message: 'Nilai kamu luar biasa sekali! Terus dipertahankan dan rajin membaca ya, kamu juara!',
                color: 'bg-amber-50 text-amber-900 border-amber-200',
                starColor: 'text-amber-500 font-bold'
              };
            } else if (avg >= 80) {
              return {
                stars: 4,
                emoji: '🚀',
                title: 'Pintar & Keren! ⭐⭐⭐⭐',
                message: 'Paten sekali nilaimu! Ibu dan Bapak Guru sangat bangga padamu. Teruskan!',
                color: 'bg-emerald-50 text-emerald-900 border-emerald-250',
                starColor: 'text-amber-500 font-bold'
              };
            } else if (avg >= 70) {
              return {
                stars: 3,
                emoji: '📚',
                title: 'Bagus & Rajin! ⭐⭐⭐',
                message: 'Kerja kerasmu bagus! Tingkatkan belajarmu sedikit lagi biar makin keren ya!',
                color: 'bg-sky-50/70 text-sky-950 border-sky-205',
                starColor: 'text-amber-500 font-bold'
              };
            } else if (avg >= 60) {
              return {
                stars: 2,
                emoji: '🌈',
                title: 'Semangat Belajar! ⭐⭐',
                message: 'Kamu anak rajin dan baik! Yuk belajar lebih giat agar semua nilaimu meluncur ke atas!',
                color: 'bg-indigo-50/75 text-indigo-900 border-indigo-200',
                starColor: 'text-amber-500 font-bold'
              };
            } else {
              return {
                stars: 1,
                emoji: '🧸',
                title: 'Jangan Menyerah! ⭐',
                message: 'Setiap anak punya bakat istimewa! Yuk, belajar pelan-pelan bareng teman dan guru ya.',
                color: 'bg-rose-50/80 text-rose-950 border-rose-200',
                starColor: 'text-amber-500 font-bold'
              };
            }
          };

          const kidFeedback = getKidFeedback(displayedAverage);

          return (
            <div
              key={std.id}
              className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                isExpanded ? `border-indigo-300 ring-4 ring-indigo-50` : 'border-slate-100 hover:border-indigo-200 hover:shadow-md'
              }`}
            >
              {/* Card Header with Playful Avatar and SD student name */}
              <div className="p-4 flex justify-between items-start bg-slate-50/40 relative">
                {/* Visual subtle cute pattern elements */}
                <div className="absolute top-1 right-2 opacity-15 text-2xl select-none font-bold text-rose-300">SD</div>
                
                <div className="flex items-center space-x-3">
                  {/* Dynamic Playful Avatars */}
                  <div className="text-3xl bg-white p-2 text-center rounded-2xl border shadow-xs select-none shrink-0" title="Karakter Lucu">
                    {avatarEmoji}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[9px] font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.2 rounded font-bold uppercase">{std.id.replace('std-', 'ID#')}</span>
                      <span className="text-[10px] font-black text-rose-500 bg-rose-55/10 px-1.5 py-0.2 rounded font-sans">{std.sheetName}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 font-sans tracking-tight">{std.name}</h4>
                  </div>
                </div>

                {/* Average Score displayed according to configuration options */}
                <div className="text-right">
                  {config.showAverageToStudent !== false ? (
                    <>
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                        {selectedSubject !== 'all' ? `Nilai ${selectedSubject}` : selectedCategory !== 'all' ? `Rerata ${selectedCategory}` : 'Rata-Rata Nilai'}
                      </p>
                      <p className={`text-xl font-black font-mono leading-none ${isPassed ? 'text-emerald-650' : 'text-rose-500'}`}>
                        {displayedAverage}
                      </p>
                    </>
                  ) : (
                    <div className="text-slate-400 text-[10px] italic font-semibold">
                      Hasil Ujian
                    </div>
                  )}

                  {config.showRankToStudent !== false ? (
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                      isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {isPassed ? '🎉 Lulus Tuntas' : '📚 Belum Tuntas'}
                    </span>
                  ) : (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-105">
                      🎒 Belajar Bersama
                    </span>
                  )}
                </div>
              </div>

              {/* Progress visual line */}
              {config.showAverageToStudent !== false && (
                <div className="px-4 pb-3 pt-1">
                  <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400 mb-1">
                    <span>Mulai Belajar (0)</span>
                    <span>Point KKM ({config.kkm})</span>
                    <span>Nilai Maksimal (100)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, displayedAverage)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* SD Cute Achievement and Motivation Card Area */}
              {config.showStarsToStudent !== false && (
                <div className="px-4 pb-2">
                  <div className={`p-3 rounded-xl border-2 flex items-start space-x-2.5 ${kidFeedback.color}`}>
                    <span className="text-2xl pt-0.5">{kidFeedback.emoji}</span>
                    <div className="space-y-0.5">
                      <h5 className="text-[11px] font-black tracking-tight">{kidFeedback.title}</h5>
                      {config.showQuotesToStudent !== false && (
                        <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">
                          "{kidFeedback.message}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Accordion view button to expand subject card details */}
              <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50 flex justify-between items-center text-xs">
                {config.showDetailsToStudent !== false ? (
                  <button
                    onClick={() => toggleStudentExpand(std.id)}
                    className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 transition-colors"
                  >
                    <span>{isExpanded ? '🙈 Sembunyikan Nilai' : '📝 Tampilkan Nilai Detail'}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold italic flex items-center space-x-1">
                    <span>🔒 Detail nilai rincian tersimpan aman</span>
                  </span>
                )}

                <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  🎒 {Object.keys(std.scores).length} Pelajaran
                </span>
              </div>

              {/* Advanced detailed list view */}
              {isExpanded && config.showDetailsToStudent !== false && (
                <div className="border-t border-slate-100 p-4 bg-white/50 space-y-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                    <span>📚 Hasil Ujian Sekolah Per Pelajaran</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(std.scores).map(([subject, val]) => {
                      const score = Number(val);
                      const category = getSubjectCategory(subject);
                      const isCatActive = selectedCategory === 'all' || category === selectedCategory;
                      const isSubjActive = selectedSubject === 'all' || subject === selectedSubject;

                      return (
                        <div
                          key={subject}
                          className={`p-2.5 rounded-xl border-2 flex justify-between items-center transition-all ${
                            selectedSubject !== 'all'
                              ? isSubjActive
                                ? 'bg-indigo-50 border-indigo-500 scale-102 ring-2 ring-indigo-500/10 shadow-xs opacity-100'
                                : 'bg-slate-50/20 border-slate-200/40 opacity-40'
                              : isCatActive 
                                ? score >= config.kkm 
                                  ? 'bg-emerald-50/40 border-emerald-200 opacity-100' 
                                  : 'bg-rose-50/40 border-rose-200 opacity-100'
                                : 'bg-slate-50/30 border-slate-200/50 opacity-40'
                          }`}
                        >
                          <div className="truncate pr-1">
                            <p className="font-extrabold text-slate-800 truncate flex items-center gap-1">
                              {isSubjActive && selectedSubject !== 'all' && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                              <span>{subject}</span>
                            </p>
                            <p className="text-[8px] text-slate-400 capitalize bg-slate-100 px-1 py-0.2 rounded inline-block font-mono mt-0.5">{category}</p>
                          </div>
                          <span className={`font-mono font-black px-2 py-1 rounded-lg text-[12px] ${
                            score >= config.kkm 
                              ? isSubjActive && selectedSubject !== 'all' ? 'text-indigo-700 bg-indigo-150 font-bold' : 'text-emerald-700 bg-emerald-100/60' 
                              : 'text-rose-700 bg-rose-100/60'
                          }`}>
                            {score}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {selectedSubject !== 'all' && (
                    <div className="p-2.5 bg-indigo-50 rounded-xl text-[10px] text-indigo-850 flex items-start space-x-2 border border-indigo-200">
                      <AlertCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <p className="leading-normal">
                        Fokus visual menampilkan mata pelajaran <strong>{selectedSubject}</strong> dengan pencapaian skor <strong>{displayedAverage}</strong>. Status Kelulusan: <strong>{isPassed ? 'TUNTAS (LULUS)' : 'BELUM TUNTAS (REMEDIAL)'}</strong>.
                      </p>
                    </div>
                  )}

                  {selectedCategory !== 'all' && selectedSubject === 'all' && (
                    <div className="p-2.5 bg-amber-50 rounded-xl text-[10px] text-amber-850 flex items-start space-x-2 border border-amber-200">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="leading-normal">
                        Menampilkan rata-rata kelompok <strong>{selectedCategory}</strong> dengan total nilai <strong>{std.categoryStats.total}</strong> dari <strong>{std.categoryStats.count}</strong> mata pelajaran rujukan.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredStudents.length === 0 && (
          <div className="col-span-1 md:col-span-2 py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <SlidersHorizontal className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-xs font-semibold">Tidak ada siswa yang cocok dengan filter pencarian Anda.</p>
            <p className="text-slate-400 text-[10px] mt-0.5">Cobalah mengubah istilah pencarian atau filter yang terpasang.</p>
          </div>
        )}
      </div>
    </div>
  );
}
