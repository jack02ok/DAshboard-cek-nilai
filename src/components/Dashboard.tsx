import { useState, useMemo } from 'react';
import { SheetData, DashboardConfig, Student } from '../types';
import { getSubjectCategory, THEME_STYLES } from '../data';
import {
  Award,
  GraduationCap,
  Users,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Search,
  Filter,
  X,
  Clock,
  Lock,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  Star
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
  RadarController,
} from 'chart.js';
import { Chart, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
  RadarController
);

interface DashboardProps {
  sheetsData: SheetData[];
  config: DashboardConfig;
  access?: any;
  blockedCountdown?: number | null;
  onSwitchTab?: (tab: 'dashboard' | 'search' | 'spreadsheet' | 'admin') => void;
  syncHistory?: { timestamp: string; classAverages: Record<string, number> }[];
}

export default function Dashboard({ sheetsData, config, access, blockedCountdown, onSwitchTab, syncHistory }: DashboardProps) {
  const styles = THEME_STYLES[config.themeColor] || THEME_STYLES.indigo;

  // State for search filters
  const [studentSearch, setStudentSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // New states for student name auto-suggestions (Beranda)
  const [suggestionSearch, setSuggestionSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<(Student & { sheetName: string }) | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedStudentDetails, setExpandedStudentDetails] = useState(true);

  // 1. Filter sheet data based on filters in real-time
  const filteredSheetsData = useMemo(() => {
    return sheetsData.map((sheet) => {
      // Filter students by name
      const filteredStudents = sheet.students
        .filter((stu) => stu.name.toLowerCase().includes(studentSearch.toLowerCase()))
        .map((stu) => {
          // Re-calculate stats only based on the selected category if not 'Semua'
          const matchingScores: Record<string, number> = {};
          let totalScore = 0;
          let count = 0;

          Object.entries(stu.scores).forEach(([subj, score]) => {
            const cat = getSubjectCategory(subj);
            if (categoryFilter === 'Semua' || cat === categoryFilter) {
              matchingScores[subj] = score;
              totalScore += score;
              count++;
            }
          });

          const average = count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0;

          return {
            ...stu,
            scores: matchingScores,
            totalScore,
            average
          };
        });

      // Filter local subjects shown
      const filteredSubjects = categoryFilter === 'Semua'
        ? sheet.subjects
        : sheet.subjects.filter(s => getSubjectCategory(s.name) === categoryFilter);

      return {
        ...sheet,
        subjects: filteredSubjects,
        students: filteredStudents
      };
    });
  }, [sheetsData, studentSearch, categoryFilter]);

  // 2. Calculate general stats on filtered data
  const stats = useMemo(() => {
    let totalStudents = 0;
    let sumOfAverages = 0;
    let totalSubjectsSet = new Set<string>();
    let studentsPassed = 0;
    let highestStudent = { name: '', score: 0, class: '' };
    let lowestStudent = { name: '', score: 101, class: '' };

    filteredSheetsData.forEach((sheet) => {
      totalStudents += sheet.students.length;
      sheet.subjects.forEach(s => totalSubjectsSet.add(s.name));

      sheet.students.forEach((stu) => {
        sumOfAverages += stu.average;
        if (stu.average >= config.kkm) {
          studentsPassed++;
        }

        if (stu.average > highestStudent.score) {
          highestStudent = { name: stu.name, score: stu.average, class: sheet.name };
        }
        if (stu.average < lowestStudent.score && stu.average > 0) {
          lowestStudent = { name: stu.name, score: stu.average, class: sheet.name };
        }
      });
    });

    const averageScore = totalStudents > 0 ? Math.round((sumOfAverages / totalStudents) * 10) / 10 : 0;
    const passingPercentage = totalStudents > 0 ? Math.round((studentsPassed / totalStudents) * 100) : 0;

    return {
      totalStudents,
      averageScore,
      totalSubjects: totalSubjectsSet.size,
      passingPercentage,
      highestStudent: highestStudent.score > 0 ? highestStudent : null,
      lowestStudent: lowestStudent.score <= 100 ? lowestStudent : null
    };
  }, [filteredSheetsData, config.kkm]);

  // 3. Prepare visual data for "Rata-rata Nilai Per Kelas (Sheet)"
  const classAveragesData = useMemo(() => {
    return filteredSheetsData.map((sheet) => {
      const studentCount = sheet.students.length;
      const averageArr = sheet.students.map(s => s.average);
      const totalAverage = averageArr.reduce((sum, val) => sum + val, 0);
      const avg = studentCount > 0 ? Math.round((totalAverage / studentCount) * 10) / 10 : 0;

      // Calculate passes for this sheet
      const passed = sheet.students.filter(s => s.average >= config.kkm).length;
      const passRate = studentCount > 0 ? Math.round((passed / studentCount) * 100) : 0;

      return {
        name: sheet.name,
        'Rata-rata': avg,
        'Kelulusan': passRate,
        'Jumlah Siswa': studentCount,
      };
    });
  }, [filteredSheetsData, config.kkm]);

  // 4. Prepare visual data for "Rata-rata Per Mata Pelajaran"
  const subjectsAveragesData = useMemo(() => {
    const subjectMap: Record<string, { total: number; count: number; category: string }> = {};

    filteredSheetsData.forEach((sheet) => {
      sheet.students.forEach((stu) => {
        Object.entries(stu.scores).forEach(([subj, score]) => {
          if (!subjectMap[subj]) {
            subjectMap[subj] = { total: 0, count: 0, category: getSubjectCategory(subj) };
          }
          subjectMap[subj].total += Number(score);
          subjectMap[subj].count += 1;
        });
      });
    });

    return Object.entries(subjectMap).map(([name, data]) => {
      return {
        name,
        'Nilai Rata-rata': Math.round((data.total / data.count) * 10) / 10,
        'Kategori': data.category
      };
    }).sort((a, b) => b['Nilai Rata-rata'] - a['Nilai Rata-rata']);
  }, [filteredSheetsData]);

  // 5. Prepare category averages for Radar Chart (Sains, Sosial, Bahasa)
  const categoryAveragesData = useMemo(() => {
    const catMap: Record<string, { total: number; count: number }> = {
      'Sains': { total: 0, count: 0 },
      'Sosial': { total: 0, count: 0 },
      'Bahasa': { total: 0, count: 0 },
    };

    filteredSheetsData.forEach((sheet) => {
      sheet.students.forEach((stu) => {
        Object.entries(stu.scores).forEach(([subj, score]) => {
          const category = getSubjectCategory(subj);
          if (catMap[category] !== undefined) {
            catMap[category].total += Number(score);
            catMap[category].count += 1;
          }
        });
      });
    });

    return Object.entries(catMap).map(([name, data]) => {
      return {
        subject: name,
        'Nilai': data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
        fullMark: 100,
      };
    });
  }, [filteredSheetsData]);

  // 5A. Live Student Suggester for general search suggestions
  const studentSuggestions = useMemo(() => {
    if (!suggestionSearch.trim()) return [];
    const list: (Student & { sheetName: string })[] = [];
    sheetsData.forEach((sheet) => {
      sheet.students.forEach((stu) => {
        if (stu.name.toLowerCase().includes(suggestionSearch.toLowerCase())) {
          list.push({
            ...stu,
            sheetName: sheet.name
          });
        }
      });
    });
    return list.slice(0, 5); // Limit to top 5 suggestions for speedy UI
  }, [sheetsData, suggestionSearch]);

  // 5B. Overall Subject Stats (Highest, Lowest, Average)
  const subjectOverallStats = useMemo(() => {
    const map: Record<string, { scores: number[]; name: string; category: string }> = {};

    sheetsData.forEach((sheet) => {
      sheet.subjects.forEach((sub) => {
        if (!map[sub.name]) {
          map[sub.name] = { scores: [], name: sub.name, category: sub.category };
        }
      });

      sheet.students.forEach((stu) => {
        Object.entries(stu.scores).forEach(([subName, score]) => {
          if (!map[subName]) {
            map[subName] = { scores: [], name: subName, category: getSubjectCategory(subName) };
          }
          map[subName].scores.push(score);
        });
      });
    });

    return Object.entries(map).map(([name, item]) => {
      const scores = item.scores;
      const count = scores.length;
      const highest = count > 0 ? Math.max(...scores) : 0;
      const lowest = count > 0 ? Math.min(...scores) : 0;
      const total = scores.reduce((sum, val) => sum + val, 0);
      const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

      return {
        name,
        category: item.category,
        highest,
        lowest,
        average,
        studentCount: count
      };
    }).sort((a, b) => b.average - a.average);
  }, [sheetsData]);

  // 5C. Overall Subject Chart Dataset (Highest, Average, Lowest)
  const subjectOverallChartData = useMemo(() => {
    const labels = subjectOverallStats.map((item) => item.name);
    const highestData = subjectOverallStats.map((item) => item.highest);
    const averageData = subjectOverallStats.map((item) => item.average);
    const lowestData = subjectOverallStats.map((item) => item.lowest);

    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Nilai Tertinggi 🏆',
          data: highestData,
          backgroundColor: '#10b981CC', // nice opacity
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: '#10b981',
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 2,
        },
        {
          type: 'bar' as const,
          label: 'Nilai Rata-rata 👦👧',
          data: averageData,
          backgroundColor: styles.hex + 'CC',
          borderColor: styles.hex,
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: styles.hex,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 2,
        },
        {
          type: 'bar' as const,
          label: 'Nilai Terendah 📉',
          data: lowestData,
          backgroundColor: '#ef4444CC',
          borderColor: '#ef4444',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: '#ef4444',
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 2,
        }
      ]
    };
  }, [subjectOverallStats, styles.hex]);

  const subjectOverallChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'easeOutElastic' as const,
      },
      hover: {
        mode: 'index' as const,
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            font: { family: 'Inter', size: 11, weight: 'bold' as any },
            color: '#1e293b',
            boxWidth: 14,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: '#0f172af2',
          titleFont: { family: 'Inter', size: 12, weight: 'bold' as any },
          bodyFont: { family: 'Inter', size: 11, weight: 'semibold' as any },
          padding: 12,
          cornerRadius: 12,
          boxPadding: 6,
          usePointStyle: true,
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            font: { family: 'Inter', size: 10, weight: 'bold' as any },
            color: '#64748b'
          },
          grid: {
            color: '#f1f5f9'
          }
        },
        x: {
          ticks: {
            font: { family: 'Inter', size: 10, weight: 'bold' as any },
            color: '#475569'
          },
          grid: {
            display: false
          }
        }
      }
    };
  }, []);

  // Compute classroom averages trends historical data for Line Chart
  const syncHistoryChartData = useMemo(() => {
    if (!syncHistory || syncHistory.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = syncHistory.map(item => item.timestamp);
    const classKeysSet = new Set<string>();
    syncHistory.forEach(item => {
      Object.keys(item.classAverages).forEach(k => classKeysSet.add(k));
    });
    const classKeys = Array.from(classKeysSet);

    const colors = [
      '#4f46e5', // indigo
      '#0d9488', // teal
      '#f59e0b', // amber
      '#10b981', // emerald
      '#ec4899', // pink
      '#8b5cf6', // violet
    ];

    const datasets = classKeys.map((clsName, idx) => {
      const color = colors[idx % colors.length];
      const dataPoints = syncHistory.map(item => item.classAverages[clsName] !== undefined ? item.classAverages[clsName] : null);

      return {
        label: clsName,
        data: dataPoints,
        borderColor: color,
        backgroundColor: `${color}15`,
        borderWidth: 3,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: false,
        spanGaps: true // seamlessly bridge missing keys if a class name is renamed midway
      };
    });

    return {
      labels,
      datasets
    };
  }, [syncHistory]);

  const syncHistoryChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            font: {
              family: 'Inter',
              size: 11,
              weight: 'bold'
            },
            color: '#475569',
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Inter', size: 11, weight: 'bold' },
          bodyFont: { family: 'Inter', size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(context: any) {
              return ` ${context.dataset.label}: ${context.raw} Rerata`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 9,
              family: 'monospace'
              
            }
          }
        },
        y: {
          grid: {
            color: '#f1f5f9'
          },
          min: 0,
          max: 100,
          ticks: {
            color: '#64748b',
            font: {
              size: 10
            },
            stepSize: 10
          }
        }
      }
    };
  }, []);

  // Smart insights
  const insights = useMemo(() => {
    const list = [];
    if (stats.totalStudents === 0) {
      list.push({
        type: 'info',
        text: 'Silakan sesuaikan filter pencarian untuk memunculkan ringkasan rekomendasi.'
      });
      return list;
    }

    if (stats.passingPercentage < 75) {
      list.push({
        type: 'warning',
        text: `Tingkat kelulusan keseluruhan hanya ${stats.passingPercentage}%. Beberapa kelas mungkin memerlukan bimbingan tambahan karena berada di bawah target KKM (${config.kkm}).`
      });
    } else {
      list.push({
        type: 'success',
        text: `Tingkat kelulusan sangat baik mencapai ${stats.passingPercentage}% (target KKM: ${config.kkm}).`
      });
    }

    // Find toughest subject
    const sortedSubjects = [...subjectsAveragesData];
    if (sortedSubjects.length > 0) {
      const worstSubj = sortedSubjects[sortedSubjects.length - 1];
      const bestSubj = sortedSubjects[0];
      list.push({
        type: 'info',
        text: `Mata pelajaran terunggul adalah ${bestSubj.name} dengan rata-rata ${bestSubj['Nilai Rata-rata']}.`
      });
      if (worstSubj && worstSubj !== bestSubj) {
        list.push({
          type: 'danger',
          text: `Mata pelajaran ${worstSubj.name} memiliki rata-rata terendah (${worstSubj['Nilai Rata-rata']}). Direkomendasikan jam belajar intensif tambahan.`
        });
      }
    }

    return list;
  }, [stats, subjectsAveragesData, config.kkm]);

  // Chart.js Class Averages Datasets Configuration
  const mainChartData = useMemo(() => {
    const labels = classAveragesData.map((sheet) => sheet.name.split(' (')[0]);
    const averages = classAveragesData.map((sheet) => sheet['Rata-rata']);
    const passRate = classAveragesData.map((sheet) => sheet['Kelulusan']);

    return {
      labels,
      datasets: [
        {
          type: config.chartType === 'line' ? ('line' as const) : ('bar' as const),
          label: 'Nilai Rata-rata 👦👧',
          data: averages,
          backgroundColor: styles.hex + 'B3', // 70% opacity
          borderColor: styles.hex,
          borderWidth: 3,
          borderRadius: config.chartType === 'line' ? 0 : 12,
          tension: 0.4,
          fill: config.chartType === 'line',
          pointStyle: 'circle',
          pointRadius: 6,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointBackgroundColor: styles.hex,
          pointHoverRadius: 10,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: styles.hex,
          pointHoverBorderWidth: 3,
          hoverBackgroundColor: styles.hex,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3,
          yAxisID: 'y'
        },
        {
          type: config.chartType === 'bar' ? ('bar' as const) : ('line' as const),
          label: 'Persentase Kelulusan mencapai KKM (%) 🏆',
          data: passRate,
          backgroundColor: '#f59e0bB3',
          borderColor: '#f59e0b',
          borderWidth: 3,
          borderRadius: config.chartType === 'bar' ? 12 : 0,
          tension: 0.4,
          fill: config.chartType === 'bar',
          pointStyle: 'star',
          pointRadius: 8,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointBackgroundColor: '#f59e0b',
          pointHoverRadius: 12,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#f59e0b',
          pointHoverBorderWidth: 3,
          hoverBackgroundColor: '#f59e0b',
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3,
          yAxisID: 'y'
        }
      ]
    };
  }, [classAveragesData, config.chartType, styles.hex]);

  const mainChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1800,
        easing: 'easeOutElastic' as const, // Delightful elastic bouncing effects on loading or filtering!
      },
      transitions: {
        active: {
          animation: {
            duration: 400 // snappy, tactile feel on hover!
          }
        }
      },
      hover: {
        mode: 'index' as const,
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            font: { family: 'Inter', size: 11, weight: 'bold' as any },
            color: '#1e293b',
            boxWidth: 14,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: '#0f172af2',
          titleFont: { family: 'Inter', size: 12, weight: 'bold' as any },
          bodyFont: { family: 'Inter', size: 11, weight: 'medium' as any },
          padding: 12,
          cornerRadius: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              if (label) {
                // strip emoji if needed or just keep it simple
                label = label.split(' ')[0] + ' ' + label.split(' ')[1] || label;
              }
              if (context.parsed.y !== null) {
                label += ': ' + context.parsed.y;
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            font: { family: 'Inter', size: 10, weight: 'bold' as any },
            color: '#64748b'
          },
          grid: {
            color: '#f1f5f9'
          }
        },
        x: {
          ticks: {
            font: { family: 'Inter', size: 10, weight: 'bold' as any },
            color: '#475569'
          },
          grid: {
            display: false
          }
        }
      }
    };
  }, []);

  // Chart.js Radar Chart Configuration
  const radarChartData = useMemo(() => {
    return {
      labels: categoryAveragesData.map(c => {
        const emojis: Record<string, string> = {
          'Sains': '🧪 Sains & mtk',
          'Sosial': '🌍 Sosial',
          'Bahasa': '🗣️ Bahasa'
        };
        return emojis[c.subject] || c.subject;
      }),
      datasets: [
        {
          label: 'Indeks Penguasaan Bidang',
          data: categoryAveragesData.map(c => c['Nilai']),
          backgroundColor: styles.hex + '2F', // enhanced 18% opacity
          borderColor: styles.hex,
          borderWidth: 3,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: styles.hex,
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 10,
          pointHoverBackgroundColor: styles.hex,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3,
          hoverBackgroundColor: styles.hex,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 2
        }
      ]
    };
  }, [categoryAveragesData, styles.hex]);

  const radarChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'easeOutElastic' as const, // Playful bouncy behavior for kids!
      },
      transitions: {
        active: {
          animation: {
            duration: 400
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172af2',
          titleFont: { family: 'Inter', size: 11, weight: 'bold' as any },
          bodyFont: { family: 'Inter', size: 11 },
          padding: 10,
          cornerRadius: 12,
          usePointStyle: true
        }
      },
      scales: {
        r: {
          angleLines: { color: '#e2e8f0' },
          grid: { color: '#e2e8f0' },
          pointLabels: {
            font: { family: 'Inter', size: 11, weight: 'black' as any },
            color: '#334155'
          },
          ticks: {
            display: false,
            stepSize: 20
          },
          min: 0,
          max: 100
        }
      }
    };
  }, []);

  // Kid avatar
  const getStudentAvatar = (id: string, name: string) => {
    const avatars = ['👦', '👧', '🦁', '🦒', '🦉', '🐱', '🐼', '🦊', '🐨', '🦖'];
    let hash = 0;
    const combined = id + name;
    for (let i = 0; i < combined.length; i++) {
      hash += combined.charCodeAt(i);
    }
    return avatars[hash % avatars.length];
  };

  const getKidFeedback = (avg: number) => {
    if (avg >= 90) {
      return {
        stars: 5,
        emoji: '🥳',
        title: 'Hebat Hebat Hebat! ⭐⭐⭐⭐⭐',
        message: 'Nilai kamu luar biasa sekali! Terus dipertahankan dan rajin membaca ya, kamu juara!',
        color: 'bg-amber-50 text-amber-955 border-amber-200',
        starColor: 'text-amber-500 font-bold'
      };
    } else if (avg >= 80) {
      return {
        stars: 4,
        emoji: '🚀',
        title: 'Pintar & Keren! ⭐⭐⭐⭐',
        message: 'Paten sekali nilaimu! Ibu dan Bapak Guru sangat bangga padamu. Teruskan!',
        color: 'bg-emerald-50 text-emerald-950 border-emerald-250',
        starColor: 'text-amber-500 font-bold'
      };
    } else if (avg >= 70) {
      return {
        stars: 3,
        emoji: '📚',
        title: 'Bagus & Rajin! ⭐⭐⭐',
        message: 'Kerja kerasmu bagus! Tingkatkan belajarmu sedikit lagi biar makin keren ya!',
        color: 'bg-sky-50 text-sky-950 border-sky-200',
        starColor: 'text-amber-500 font-bold'
      };
    } else if (avg >= 60) {
      return {
        stars: 2,
        emoji: '🌈',
        title: 'Semangat Belajar! ⭐⭐',
        message: 'Kamu anak rajin dan baik! Yuk belajar lebih giat agar semua nilaimu meluncur ke atas!',
        color: 'bg-indigo-50 text-indigo-950 border-indigo-200',
        starColor: 'text-amber-500 font-bold'
      };
    } else {
      return {
        stars: 1,
        emoji: '🧸',
        title: 'Jangan Menyerah! ⭐',
        message: 'Setiap anak punya bakat istimewa! Yuk, belajar pelan-pelan bareng teman dan guru ya.',
        color: 'bg-rose-50 text-rose-955 border-rose-200',
        starColor: 'text-amber-505'
      };
    }
  };

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="dashboard-section" className="space-y-6">
      
      {/* 1. Playful Search Bar with Suggestions for Kids */}
      <div id="student-suggestion-panel" className="bg-white p-6 rounded-3xl border border-slate-250 shadow-sm space-y-4 relative overflow-visible">
        <div className="absolute top-2 right-4 text-3xl select-none opacity-20">🎒</div>
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Ayo Lihat Nilai Hasil Ujian Sekolah Kamu! 🎒✨</span>
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">Ketik nama lengkapmu di kolom bawah ini kemudian pilih nama kamu untuk melihat nilai hasil Ujian Sekolah lengkap ya!</p>
        </div>

        <div className="relative">
          <div className="relative">
            <Search className={`absolute left-4 top-3 h-5 w-5 ${styles.text}`} />
            <input
              type="text"
              placeholder="Ketik nama kamu di sini ya... (Contoh: Aditya)"
              value={suggestionSearch}
              onChange={(e) => {
                setSuggestionSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-505 rounded-2xl pl-11 pr-10 py-2.5 text-xs focus:outline-hidden font-bold text-slate-800 shadow-inner transition-transform duration-200 hover:scale-[1.01] focus:scale-[1.01]"
            />
            {suggestionSearch && (
              <button
                onClick={() => {
                  setSuggestionSearch('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-3 p-0.5 hover:bg-slate-200 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && studentSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-slate-200/95 rounded-2xl shadow-xl z-50 divide-y divide-slate-100 overflow-hidden max-h-60 overflow-y-auto">
              <div className="p-2 text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                Pilih Nama Kamu 👦👧
              </div>
              {studentSuggestions.map((stu) => {
                return (
                  <button
                    key={stu.id}
                    onClick={() => {
                      setSelectedStudent(stu);
                      setSuggestionSearch(stu.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-3 hover:bg-indigo-50 text-left flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-xl shrink-0 select-none">
                        {stu.average >= 80 ? '⭐' : '🎒'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 tracking-tight truncate group-hover:text-indigo-600">
                          {stu.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {stu.sheetName.split(' (')[0]} • ID: {stu.id.replace('std-', 'ID#')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all uppercase tracking-wider shrink-0">
                      Ujian {stu.average}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Fallback check empty suggestions */}
          {showSuggestions && suggestionSearch.trim() !== '' && studentSuggestions.length === 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xl z-50 text-center text-xs text-slate-500 font-medium whitespace-normal">
              🔍 Nama <strong className="text-slate-700">"{suggestionSearch}"</strong> tidak ditemukan di database rujukan sekolah. Coba ketik sebagian nama saja atau hubungi Bapak/Ibu Guru ya!
            </div>
          )}
        </div>
      </div>

      {/* CONDITIONAL RENDER: A. Student Selected */}
      {selectedStudent !== null ? (
        <div id="selected-student-report-container" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setSuggestionSearch('');
                }}
                className="p-2 hover:bg-slate-150 rounded-full text-slate-500 hover:text-slate-700 transition-colors border"
                title="Kembali ke Beranda"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <span className="text-[9px] font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">HASIL UJIAN SEKOLAH</span>
                <h3 className="text-base font-black text-slate-800 mt-0.5">Rincian Siswa: {selectedStudent.name}</h3>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedStudent(null);
                setSuggestionSearch('');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 cursor-pointer"
            >
              <span>Tutup Hasil Ujian & Kembali ke Beranda 📊</span>
            </button>
          </div>

          {/* The Kid-Friendly Rapor Card */}
          <div className="border-2 border-slate-150 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            {/* Header / Hero block with avatar */}
            <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 relative gap-4">
              <div className="absolute top-1 right-2 opacity-10 text-4xl select-none font-extrabold text-indigo-305">SD</div>
              <div className="flex items-center space-x-4">
                <div className="text-4xl bg-white p-3 text-center rounded-2xl border shadow-xs select-none shrink-0 border-slate-200">
                  {getStudentAvatar(selectedStudent.id, selectedStudent.name)}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded font-black tracking-wide uppercase">{selectedStudent.id.replace('std-', 'ID#')}</span>
                    <span className="text-[9px] font-sans text-rose-500 bg-rose-50 px-2 py-0.5 rounded font-black tracking-wider uppercase">{selectedStudent.sheetName}</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{selectedStudent.name}</h4>
                </div>
              </div>

              {/* Score displays */}
              <div className="text-left sm:text-right shrink-0">
                {config.showAverageToStudent !== false ? (
                  <>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">RATA-RATA NILAI</p>
                    <p className={`text-3xl font-black font-mono mt-0.5 ${selectedStudent.average >= config.kkm ? 'text-emerald-650' : 'text-rose-500'}`}>
                      {selectedStudent.average}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 text-xs italic font-semibold">Capaian Akademik</p>
                )}

                {config.showRankToStudent !== false ? (
                  <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                    selectedStudent.average >= config.kkm ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedStudent.average >= config.kkm ? '🎉 Lulus Tuntas' : '📚 Belum Tuntas / Remedial'}
                  </span>
                ) : (
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-100">
                    🎒 Belajar Bersama
                  </span>
                )}
              </div>
            </div>

            {/* Gauge progress bar */}
            {config.showAverageToStudent !== false && (
              <div className="px-5 pb-4 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
                  <span>Mulai Belajar (0)</span>
                  <span>Point KKM ({config.kkm})</span>
                  <span>Nilai Maksimal (100)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${selectedStudent.average >= config.kkm ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, selectedStudent.average)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* SD Kids custom Feedback Block */}
            {config.showStarsToStudent !== false && (
              <div className="px-5 pb-4">
                <div className={`p-4 rounded-2xl border-2 flex items-start space-x-3.5 ${getKidFeedback(selectedStudent.average).color}`}>
                  <span className="text-3xl pt-0.5 select-none">{getKidFeedback(selectedStudent.average).emoji}</span>
                  <div className="space-y-1">
                    <h5 className="text-[12px] font-black tracking-tight">{getKidFeedback(selectedStudent.average).title}</h5>
                    {config.showQuotesToStudent !== false && (
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">
                        "{getKidFeedback(selectedStudent.average).message}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Accordion trigger details */}
            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 flex justify-between items-center text-xs">
              {config.showDetailsToStudent !== false ? (
                <button
                  onClick={() => setExpandedStudentDetails(!expandedStudentDetails)}
                  className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-805 flex items-center space-x-1 cursor-pointer"
                >
                  <span>{expandedStudentDetails ? '🙈 Sembunyikan Nilai' : '📝 Tampilkan Nilai Detail'}</span>
                  {expandedStudentDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold italic flex items-center space-x-1">
                  <span>🔒 Rincian skor tersimpan aman dalam berkas database</span>
                </span>
              )}

              <span className="text-[10px] text-slate-500 font-bold bg-white px-2.5 py-1 rounded-md border border-slate-200">
                🎒 {Object.keys(selectedStudent.scores).length} Mata Pelajaran
              </span>
            </div>

            {/* Detailed Subject Grid */}
            {expandedStudentDetails && config.showDetailsToStudent !== false && (
              <div className="border-t border-slate-100 p-5 bg-white space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                  <span>DAFTAR NILAI DETAIL MATA PELAJARAN</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(selectedStudent.scores).map(([subject, val]) => {
                    const score = Number(val);
                    const category = getSubjectCategory(subject);
                    const passed = score >= config.kkm;

                    return (
                      <div
                        key={subject}
                        className={`p-3.5 rounded-2xl border-2 flex justify-between items-center transition-all ${
                          passed
                            ? 'bg-emerald-50/40 border-emerald-250'
                            : 'bg-rose-50/40 border-rose-250'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-extrabold text-slate-850 text-xs truncate">{subject}</p>
                          <p className="text-[8px] text-slate-400 font-black tracking-wide uppercase bg-slate-100 px-2 py-0.2 rounded-md inline-block font-mono mt-0.5">{category}</p>
                        </div>
                        <span className={`font-mono font-black px-2.5 py-1.5 rounded-xl text-[13px] ${
                          passed ? 'text-emerald-700 bg-emerald-100/60' : 'text-rose-700 bg-rose-100/60'
                        }`}>
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CONDITIONAL RENDER: B. No student selected (Homepage default) */
        <div id="default-dashboard-homepage" className="space-y-6">

          {/* CHECK ACCESS TIMER: B1. Access is CLOSED/LOCKED (Display Countdown Card) */}
          {access?.isDataVisible === false ? (
            <div id="countdown-card-homepage" className="bg-slate-950 border border-slate-800 text-white rounded-3xl overflow-hidden shadow-2xl max-w-3xl mx-auto my-6 animate-fade-in">
              {/* Giant high-impact running text with bold motivation text */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-4 select-none overflow-hidden border-b border-indigo-500/30">
                <marquee className="text-lg sm:text-2xl font-black text-amber-300 uppercase tracking-widest block whitespace-nowrap leading-none" scrollamount="6">
                  ✨ TETAP SEMANGAT KELAS 6! KELAS 6 BUKANLAH AKHIR, TETAPI AWAL DARI PERJALANAN PANJANG UNTUK MEMPERBAIKI DIRI, MERAIH MIMPI, DAN SIAP MENGHADAPI TANTANGAN HEBAT DI TINGKAT SEKOLAH LANJUTAN SELANJUTNYA! MARI TERUS BELAJAR, PERBAIKI DIRI DAN JADILAH GENERASI PENERUS BANGSA YANG BERAKHLAK MULIA! SDN NEGLASARI 02 BISA! ✨ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </marquee>
              </div>

              <div className="p-8 sm:p-12 space-y-8 text-center relative">
                <div className="absolute top-5 left-5 opacity-5 text-7xl select-none font-bold">🎒</div>
                <div className="absolute bottom-5 right-5 opacity-5 text-7xl select-none font-bold">🏫</div>
                
                <div className="mx-auto w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border-2 border-amber-400 shadow-xl shadow-amber-400/5 text-4xl select-none">
                  ⏳
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">PENGUMUMAN HASIL UJIAN SEKOLAH SEDANG BERSIAP!</h3>
                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-xl mx-auto">
                    Sabar ya anak pintar! Portal pengumuman hasil Ujian Sekolah SD Negeri Neglasari 02 sedang dipersiapkan dan akan dibuka otomatis sesuai waktu hitung mundur di bawah ini. Biasakan berdoa dan tetap optimis!
                  </p>
                </div>

                {blockedCountdown !== null && blockedCountdown > 0 ? (
                  <div className="bg-slate-900/90 inline-block px-10 py-6 rounded-3xl border border-slate-800 shadow-lg ring-1 ring-slate-800/50">
                    <span className="text-[10px] font-black tracking-widest text-white/80 uppercase block mb-1">COUNTDOWN KEMUNDURAN PEMBUKAAN:</span>
                    <div className="font-mono text-4xl sm:text-5xl font-black text-amber-450 tracking-wider animate-pulse leading-none py-1">
                      {formatCountdown(blockedCountdown)}
                    </div>
                    <div className="flex items-center justify-center space-x-1.5 text-[11px] text-white/85 mt-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                      <span>Situs Pengumuman Akan Terbuka Otomatis</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-805 text-xs text-white/90 max-w-sm mx-auto font-medium">
                    🔒 Portal sedang terkunci <strong>Manual</strong>. Akses pengumuman nilai akan segera dibuka oleh panitia sekolah setelah keputusan rapat akhir diterbitkan.
                  </div>
                )}

                <div className="pt-6 border-t border-slate-900 text-xs text-white/70 font-medium max-w-sm mx-auto leading-normal">
                  Info resmi Panitia Ujian SDN Neglasari 02. Harap tanyakan sandi admin ke wali kelas jika rekonfigurasi diperlukan.
                </div>
              </div>
            </div>
          ) : (
            /* CHECK ACCESS TIMER: B2. Access is OPEN/UNLOCKED (Display Lowest, Highest, Average per Subject Chart + general Stats) */
            <div id="unlocked-stats-homepage" className="space-y-6">
              
              {/* 2. Visual Subject Overall Chart (Nilai Terendah, Tertinggi, Rata-rata per mata pelajaran) */}
              <div id="subject-overall-chart-panel" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-850 flex items-center gap-2">
                      <span className="p-1 px-1.5 rounded-lg bg-emerald-50 text-emerald-600">📊</span>
                      <span>Grafik Analisis Capaian Nilai per Mata Pelajaran</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Menampilkan hasil nilai <strong>Tertinggi 📈</strong>, <strong>Rata-rata 👦👧</strong>, dan <strong>Terendah 📉</strong> dari seluruh siswa di database sekolah untuk tiap mata pelajaran.
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black tracking-wider uppercase rounded-full">
                    KKM Acuan: {config.kkm}
                  </div>
                </div>

                <div className="h-80 w-full text-xs">
                  <Chart type="bar" data={subjectOverallChartData} options={subjectOverallChartOptions as any} />
                </div>
              </div>

              {/* 2B. Line Chart Trend Rerata Kelas per Sync */}
              <div id="class-average-trend-panel" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-850 flex items-center gap-2">
                      <span className="p-1 px-1.5 rounded-lg bg-indigo-50 text-indigo-600">📈</span>
                      <span>Grafik Tren Nilai Rata-rata Kelas (Sync History)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Menampilkan pergerakan nilai rata-rata per-kelas dari rangkaian sinkronisasi data Google Sheets dari waktu ke waktu.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-mono">Live Tracker</span>
                  </div>
                </div>

                <div className="h-72 w-full text-xs">
                  {syncHistory && syncHistory.length > 0 ? (
                    <Chart type="line" data={syncHistoryChartData} options={syncHistoryChartOptions as any} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                      Belum ada riwayat sinkronisasi yang terekam.
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Panel Filter Interaktif for overall charts */}
              <div id="dashboard-filter-bar" className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Filter className={`h-4.5 w-4.5 ${styles.text}`} />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Penyaringan Dokumen Dinamis</h4>
                  </div>
                  {(studentSearch || categoryFilter !== 'Semua') && (
                    <button
                      onClick={() => {
                        setStudentSearch('');
                        setCategoryFilter('Semua');
                      }}
                      className="px-2.5 py-1 text-[10px] text-rose-600 bg-rose-50 hover:bg-rose-105 rounded-lg font-bold flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reset Filter</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Text search for student name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cari Nama Siswa (Filter Grafik Tambahan)</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama siswa... (Grafik kelas & rumpun ikut memfilter)"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium text-slate-850"
                      />
                    </div>
                  </div>

                  {/* Subject category drop down selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kategori Mata Pelajaran</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                    >
                      <option value="Semua">Semua Kategori Mata Pelajaran</option>
                      <option value="Sains">Matematika & Sains (Fisika, Kimia, Biologi)</option>
                      <option value="Sosial">Ilmu Pengetahuan Sosial (Ekonomi, Geografi, Sosiologi, Sejarah)</option>
                      <option value="Bahasa">Bahasa & Seni Budaya (Bahasa Indo, Inggris, Seni Budaya)</option>
                    </select>
                  </div>
                </div>

                {/* Informative Filter Feedback */}
                <div className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                  <span>Penyaringan:</span>
                  <span className="text-slate-600 font-extrabold">{studentSearch ? `"${studentSearch}"` : "Semua Siswa"}</span>
                  <span>rumpun</span>
                  <span className="text-slate-600 font-extrabold">Kategori {categoryFilter}</span>
                  {stats.totalStudents > 0 && (
                    <span className="text-emerald-600 font-bold ml-1">(Terfilter {stats.totalStudents} siswa)</span>
                  )}
                </div>
              </div>

              {/* 4. Core Visual statistics cards row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div id="stat-card-avg" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${styles.light} ${styles.text}`}>
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Rerata Umum</p>
                    <h3 className="text-2xl font-black text-slate-800">{stats.averageScore}</h3>
                    <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wide">KKM target: {config.kkm}</p>
                  </div>
                </div>

                <div id="stat-card-students" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Total Siswa</p>
                    <h3 className="text-2xl font-black text-slate-800">{stats.totalStudents}</h3>
                    <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wide">Tersebar di 3 sheet kelas</p>
                  </div>
                </div>

                <div id="stat-card-passed" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">% Ketuntasan KKM</p>
                    <h3 className="text-2xl font-black text-slate-800">{stats.passingPercentage}%</h3>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${stats.passingPercentage}%` }}></div>
                    </div>
                  </div>
                </div>

                <div id="stat-card-best" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Siswa Terbaik</p>
                    <h3 className="text-xs font-bold text-slate-850 truncate max-w-[130px]" title={stats.highestStudent ? stats.highestStudent.name : '-'}>
                      {stats.highestStudent ? stats.highestStudent.name : '-'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Rerata: {stats.highestStudent ? stats.highestStudent.score : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Classroom Visualizations & Category Radar charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div id="main-chart-container" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Visualisasi Rata-Rata per Kelas</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Menyajikan nilai rata-rata dan pencapaian KKM siswa per kelas</p>
                    </div>
                    <div className="hidden sm:flex items-center space-x-2 text-[10px] text-slate-400 font-semibold uppercase">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                      <span>KKM: {config.kkm}</span>
                    </div>
                  </div>

                  <div className="h-72 w-full text-xs">
                    <Chart type="bar" data={mainChartData} options={mainChartOptions as any} />
                  </div>
                </div>

                <div id="radar-chart-container" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>Prestasi Rumpun Pelajaran 🎒</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Penguasaan kelompok materi seluruh kelas 6</p>
                  </div>

                  <div className="space-y-3.5 py-1 flex-1 flex flex-col justify-center">
                    {categoryAveragesData.map((item) => {
                      const score = item.Nilai;
                      // Determine kid-friendly badges, stars & messages
                      let icon = '🧪';
                      let fullname = 'Sains & Eksak';
                      let desc = 'Sains, Matematika & Logika';
                      let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                      let barColor = 'bg-emerald-500';
                      let stars = '⭐⭐⭐⭐⭐';
                      let badgeText = 'Sangat Hebat! 🏆';

                      if (item.subject === 'Sains') {
                        icon = '🧪';
                        fullname = 'Sains & Eksak';
                        desc = 'Sains, IPA & Matematika';
                        if (score >= 85) {
                          badgeText = 'Sangat Hebat! 🏆';
                          badgeColor = 'bg-emerald-55 text-emerald-700 border-emerald-100';
                          barColor = 'bg-emerald-500';
                          stars = '⭐⭐⭐⭐⭐';
                        } else if (score >= config.kkm) {
                          badgeText = 'Tuntas Bagus! 👍';
                          badgeColor = 'bg-teal-50 text-teal-700 border-teal-100';
                          barColor = 'bg-teal-500';
                          stars = '⭐⭐⭐⭐';
                        } else {
                          badgeText = 'Harus Belajar! 📚';
                          badgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
                          barColor = 'bg-rose-500';
                          stars = '⭐⭐⭐';
                        }
                      } else if (item.subject === 'Sosial') {
                        icon = '🌍';
                        fullname = 'Sosial & Hum';
                        desc = 'IPS, PPKn & Karakter';
                        if (score >= 85) {
                          badgeText = 'Sangat Berbakti! 🌟';
                          badgeColor = 'bg-amber-50 text-amber-705 border-amber-100';
                          barColor = 'bg-amber-500';
                          stars = '⭐⭐⭐⭐⭐';
                        } else if (score >= config.kkm) {
                          badgeText = 'Sikap Hebat! 😊';
                          badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                          barColor = 'bg-indigo-550';
                          stars = '⭐⭐⭐⭐';
                        } else {
                          badgeText = 'Ayo Tingkatkan! 💪';
                          badgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
                          barColor = 'bg-rose-500';
                          stars = '⭐⭐⭐';
                        }
                      } else if (item.subject === 'Bahasa') {
                        icon = '🎨';
                        fullname = 'Bahasa & Seni';
                        desc = 'B. Indonesia, Inggris & Karya';
                        if (score >= 85) {
                          badgeText = 'Sangat Kreatif! 🎨';
                          badgeColor = 'bg-purple-50 text-purple-705 border-purple-100';
                          barColor = 'bg-purple-500';
                          stars = '⭐⭐⭐⭐⭐';
                        } else if (score >= config.kkm) {
                          badgeText = 'Komunikasi Lancar! 📝';
                          badgeColor = 'bg-pink-50 text-pink-700 border-pink-100';
                          barColor = 'bg-pink-500';
                          stars = '⭐⭐⭐⭐';
                        } else {
                          badgeText = 'Ayo Berlatih! 🗣️';
                          badgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
                          barColor = 'bg-rose-500';
                          stars = '⭐⭐⭐';
                        }
                      }

                      return (
                        <div key={item.subject} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-150 space-y-2 hover:bg-slate-50 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl p-1 bg-white rounded-lg shadow-2xs border border-slate-100 select-none">{icon}</span>
                              <div>
                                <h5 className="text-[11px] font-bold text-slate-800 leading-tight">{fullname}</h5>
                                <p className="text-[9px] text-slate-400 font-bold">{desc}</p>
                              </div>
                            </div>
                            <span className="font-mono font-black text-slate-800 text-xs bg-white border border-slate-150 px-2 py-0.5 rounded-lg shadow-3xs">
                              {score}
                            </span>
                          </div>

                          {/* Beautiful Progress Bar */}
                          <div className="space-y-1">
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="text-slate-400 font-bold tracking-tight">{stars}</span>
                              <span className={`px-1.5 py-0.2 rounded border font-black ${badgeColor}`}>{badgeText}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[9px]/relaxed font-semibold text-slate-400 text-center pt-2 border-t border-slate-100">
                    Nilai dihitung berdasarkan rata-rata gabungan seluruh murid SDN Neglasari 02
                  </div>
                </div>
              </div>

              {/* 6. List and Smart Insights row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Subject-wise sorting lists */}
                <div id="subject-chart-container" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Rerata Nilai Tiap Mapel (Daftar)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Diurutkan berdasarkan pencapaian skor tertinggi berdasar filter Anda</p>
                  </div>

                  <div className="h-64 overflow-y-auto pr-1 text-xs space-y-3">
                    {subjectsAveragesData.map((subj, index) => (
                      <div key={subj.name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-mono font-medium text-slate-400">#{index + 1}</span>
                            <span className="font-bold text-slate-700">{subj.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              subj.Kategori === 'Sains' ? 'bg-blue-50 text-blue-600' :
                              subj.Kategori === 'Sosial' ? 'bg-orange-50 text-orange-600' : 'bg-pink-50 text-pink-600'
                            }`}>
                              {subj.Kategori}
                            </span>
                          </div>
                          <span className="font-extrabold text-slate-850">{subj['Nilai Rata-rata']}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full">
                          <div
                            className={`h-2 rounded-full ${
                              subj['Nilai Rata-rata'] >= config.kkm ? styles.primary : 'bg-rose-500'
                            }`}
                            style={{ width: `${subj['Nilai Rata-rata']}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations insights panel */}
                <div id="recommendations-container" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-slate-750" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">Rekomendasi Pintar Pendidik</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 text-left">Ringkasan analisis yang dihitung secara dinamis dari database rujukan</p>

                    <div className="space-y-3 pt-1">
                      {insights.map((ins, i) => (
                        <div key={i} className={`p-3 rounded-2xl flex items-start space-x-2.5 text-xs ${
                          ins.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500' :
                          ins.type === 'warning' ? 'bg-amber-50 text-amber-80 *der-l-4 border-amber-505' :
                          ins.type === 'danger' ? 'bg-rose-50/70 text-rose-800 border-l-4 border-rose-500' :
                          'bg-indigo-50 text-indigo-805 border-l-4 border-indigo-500'
                        }`}>
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p className="leading-relaxed text-left">{ins.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1.5 mt-4">
                    <div className="flex justify-between">
                      <span>Nilai Tertinggi:</span>
                      <strong className="text-slate-700 font-mono">
                        {stats.highestStudent ? `${stats.highestStudent.score} (${stats.highestStudent.name})` : '-'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Nilai Terendah:</span>
                      <strong className="text-slate-700 font-mono">
                        {stats.lowestStudent ? `${stats.lowestStudent.score} (${stats.lowestStudent.name})` : '-'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Ketuntasan Belajar:</span>
                      <strong className="text-indigo-650 font-bold">{stats.passingPercentage}% Target KKM</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
