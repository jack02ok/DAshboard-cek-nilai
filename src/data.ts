import { SheetData, Student } from './types';

// Subject definition categories
export const SUBJECT_CATEGORIES: Record<string, string> = {
  'Matematika': 'Sains',
  'Fisika': 'Sains',
  'Kimia': 'Sains',
  'Biologi': 'Sains',
  'Ekonomi': 'Sosial',
  'Geografi': 'Sosial',
  'Sosiologi': 'Sosial',
  'Sejarah': 'Sosial',
  'Bahasa Indonesia': 'Bahasa',
  'Bahasa Inggris': 'Bahasa',
  'Sastra Indonesia': 'Bahasa',
  'Sastra Inggris': 'Bahasa',
  'Seni Budaya': 'Bahasa',
};

export const getSubjectCategory = (subjectName: string): string => {
  return SUBJECT_CATEGORIES[subjectName] || 'Lainnya';
};

// Recalculates total and average score for a student
export const calculateStudentStats = (scores: Record<string, number>): { totalScore: number; average: number } => {
  const scoreValues = Object.values(scores);
  if (scoreValues.length === 0) return { totalScore: 0, average: 0 };
  const rawTotalScore = scoreValues.reduce((sum, val) => sum + val, 0);
  const totalScore = Math.round(rawTotalScore * 100) / 100;
  const average = Math.round((totalScore / scoreValues.length) * 100) / 100;
  return { totalScore, average };
};

// Initial sheet mock data
export const INITIAL_SHEETS_DATA: SheetData[] = [
  {
    id: 'sheet-1',
    name: 'Kelas 10 - IPA (Sains)',
    subjects: [
      { name: 'Matematika', category: 'Sains' },
      { name: 'Fisika', category: 'Sains' },
      { name: 'Kimia', category: 'Sains' },
      { name: 'Biologi', category: 'Sains' },
      { name: 'Bahasa Indonesia', category: 'Bahasa' },
      { name: 'Bahasa Inggris', category: 'Bahasa' }
    ],
    students: [
      {
        id: 'std-101',
        name: 'Aditya Pratama',
        scores: { 'Matematika': 85, 'Fisika': 78, 'Kimia': 82, 'Biologi': 90, 'Bahasa Indonesia': 88, 'Bahasa Inggris': 84 },
        totalScore: 507,
        average: 84.5
      },
      {
        id: 'std-102',
        name: 'Siti Rahmawati',
        scores: { 'Matematika': 92, 'Fisika': 88, 'Kimia': 90, 'Biologi': 95, 'Bahasa Indonesia': 90, 'Bahasa Inggris': 92 },
        totalScore: 547,
        average: 91.2
      },
      {
        id: 'std-103',
        name: 'Budi Santoso',
        scores: { 'Matematika': 65, 'Fisika': 70, 'Kimia': 60, 'Biologi': 68, 'Bahasa Indonesia': 75, 'Bahasa Inggris': 72 },
        totalScore: 410,
        average: 68.3
      },
      {
        id: 'std-104',
        name: 'Dewi Lestari',
        scores: { 'Matematika': 78, 'Fisika': 82, 'Kimia': 76, 'Biologi': 80, 'Bahasa Indonesia': 85, 'Bahasa Inggris': 80 },
        totalScore: 481,
        average: 80.2
      },
      {
        id: 'std-105',
        name: 'Feri Irawan',
        scores: { 'Matematika': 88, 'Fisika': 85, 'Kimia': 83, 'Biologi': 87, 'Bahasa Indonesia': 80, 'Bahasa Inggris': 82 },
        totalScore: 505,
        average: 84.2
      },
      {
        id: 'std-106',
        name: 'Riza Fauzan',
        scores: { 'Matematika': 58, 'Fisika': 62, 'Kimia': 60, 'Biologi': 64, 'Bahasa Indonesia': 70, 'Bahasa Inggris': 68 },
        totalScore: 382,
        average: 63.7
      },
      {
        id: 'std-107',
        name: 'Lia Anggraini',
        scores: { 'Matematika': 72, 'Fisika': 75, 'Kimia': 70, 'Biologi': 78, 'Bahasa Indonesia': 84, 'Bahasa Inggris': 86 },
        totalScore: 465,
        average: 77.5
      }
    ]
  },
  {
    id: 'sheet-2',
    name: 'Kelas 11 - IPS (Sosial)',
    subjects: [
      { name: 'Matematika', category: 'Sains' },
      { name: 'Ekonomi', category: 'Sosial' },
      { name: 'Geografi', category: 'Sosial' },
      { name: 'Sosiologi', category: 'Sosial' },
      { name: 'Bahasa Indonesia', category: 'Bahasa' },
      { name: 'Bahasa Inggris', category: 'Bahasa' }
    ],
    students: [
      {
        id: 'std-201',
        name: 'Rian Hidayat',
        scores: { 'Matematika': 70, 'Ekonomi': 84, 'Geografi': 80, 'Sosiologi': 82, 'Bahasa Indonesia': 85, 'Bahasa Inggris': 81 },
        totalScore: 482,
        average: 80.3
      },
      {
        id: 'std-202',
        name: 'Farhan Saputra',
        scores: { 'Matematika': 62, 'Ekonomi': 75, 'Geografi': 72, 'Sosiologi': 78, 'Bahasa Indonesia': 80, 'Bahasa Inggris': 75 },
        totalScore: 442,
        average: 73.7
      },
      {
        id: 'std-203',
        name: 'Amanda Wijaya',
        scores: { 'Matematika': 80, 'Ekonomi': 95, 'Geografi': 91, 'Sosiologi': 93, 'Bahasa Indonesia': 92, 'Bahasa Inggris': 90 },
        totalScore: 541,
        average: 90.2
      },
      {
        id: 'std-204',
        name: 'Yusuf Habibi',
        scores: { 'Matematika': 75, 'Ekonomi': 80, 'Geografi': 76, 'Sosiologi': 82, 'Bahasa Indonesia': 84, 'Bahasa Inggris': 78 },
        totalScore: 475,
        average: 79.2
      },
      {
        id: 'std-205',
        name: 'Santi Novita',
        scores: { 'Matematika': 68, 'Ekonomi': 88, 'Geografi': 84, 'Sosiologi': 85, 'Bahasa Indonesia': 88, 'Bahasa Inggris': 82 },
        totalScore: 495,
        average: 82.5
      },
      {
        id: 'std-206',
        name: 'Gilang Ramadhan',
        scores: { 'Matematika': 55, 'Ekonomi': 68, 'Geografi': 65, 'Sosiologi': 70, 'Bahasa Indonesia': 74, 'Bahasa Inggris': 66 },
        totalScore: 398,
        average: 66.3
      }
    ]
  },
  {
    id: 'sheet-3',
    name: 'Kelas 12 - Bahasa (Humaniora)',
    subjects: [
      { name: 'Sastra Indonesia', category: 'Bahasa' },
      { name: 'Sastra Inggris', category: 'Bahasa' },
      { name: 'Seni Budaya', category: 'Bahasa' },
      { name: 'Sejarah', category: 'Sosial' },
      { name: 'Bahasa Indonesia', category: 'Bahasa' },
      { name: 'Bahasa Inggris', category: 'Bahasa' }
    ],
    students: [
      {
        id: 'std-301',
        name: 'Daniel Christian',
        scores: { 'Sastra Indonesia': 85, 'Sastra Inggris': 88, 'Seni Budaya': 92, 'Sejarah': 80, 'Bahasa Indonesia': 87, 'Bahasa Inggris': 89 },
        totalScore: 521,
        average: 86.8
      },
      {
        id: 'std-302',
        name: 'Mega Utami',
        scores: { 'Sastra Indonesia': 90, 'Sastra Inggris': 92, 'Seni Budaya': 88, 'Sejarah': 84, 'Bahasa Indonesia': 91, 'Bahasa Inggris': 93 },
        totalScore: 538,
        average: 89.7
      },
      {
        id: 'std-303',
        name: 'Eko Sulistyo',
        scores: { 'Sastra Indonesia': 72, 'Sastra Inggris': 70, 'Seni Budaya': 78, 'Sejarah': 76, 'Bahasa Indonesia': 80, 'Bahasa Inggris': 74 },
        totalScore: 450,
        average: 75.0
      },
      {
        id: 'std-304',
        name: 'Nadia Safitri',
        scores: { 'Sastra Indonesia': 78, 'Sastra Inggris': 82, 'Seni Budaya': 85, 'Sejarah': 81, 'Bahasa Indonesia': 84, 'Bahasa Inggris': 83 },
        totalScore: 493,
        average: 82.2
      },
      {
        id: 'std-305',
        name: 'Reza Pahlevi',
        scores: { 'Sastra Indonesia': 60, 'Sastra Inggris': 65, 'Seni Budaya': 72, 'Sejarah': 71, 'Bahasa Indonesia': 75, 'Bahasa Inggris': 68 },
        totalScore: 411,
        average: 68.5
      }
    ]
  }
];

export const THEME_STYLES = {
  indigo: {
    primary: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    text: 'text-indigo-600',
    border: 'border-indigo-500',
    light: 'bg-indigo-50',
    gradient: 'from-indigo-500 to-blue-600',
    hex: '#4f46e5'
  },
  teal: {
    primary: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    text: 'text-teal-600',
    border: 'border-teal-500',
    light: 'bg-teal-50',
    gradient: 'from-teal-500 to-emerald-600',
    hex: '#0d9488'
  },
  amber: {
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    text: 'text-amber-600',
    border: 'border-amber-500',
    light: 'bg-amber-50',
    gradient: 'from-amber-500 to-orange-600',
    hex: '#d97706'
  },
  emerald: {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    text: 'text-emerald-600',
    border: 'border-emerald-500',
    light: 'bg-emerald-50',
    gradient: 'from-emerald-500 to-teal-600',
    hex: '#059669'
  }
};
