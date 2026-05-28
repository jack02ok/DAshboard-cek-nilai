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
  'Numerasi': 'Sains',
  'Literasi': 'Bahasa'
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

// Initial sheet mock data with full 62 students from SDN Neglasari 02
export const INITIAL_SHEETS_DATA: SheetData[] = [
  {
    id: 'sheet-tka',
    name: 'SDN Neglasari 02 - Hasil TKA',
    subjects: [
      { name: 'Numerasi', category: 'Sains' },
      { name: 'Literasi', category: 'Bahasa' }
    ],
    students: [
      { id: 'std-01', name: 'Muhamad Faisal', nisn: '136188801', nomorPeserta: 'T1-26-02-13-1315-0001-8', ttl: 'Bogor, 26 Desember 2013', scores: { 'Numerasi': 36.67, 'Literasi': 70.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 106.67, average: 53.34 },
      { id: 'std-02', name: 'MUHAMAD RIZKI TRIROSA PUTRA', nisn: '3131290567', nomorPeserta: 'T1-26-02-13-1315-0002-7', ttl: 'Bogor, 21 Juni 2013', scores: { 'Numerasi': 53.33, 'Literasi': 53.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 106.66, average: 53.33 },
      { id: 'std-03', name: 'MUHAMAD MAULANA HABIBI', nisn: '3148182703', nomorPeserta: 'T1-26-02-13-1315-0003-6', ttl: 'Bogor, 12 Januari 2014', scores: { 'Numerasi': 50.00, 'Literasi': 43.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 93.33, average: 46.67 },
      { id: 'std-04', name: 'MUHAMMAD AL HABSY SOFYAN', nisn: '134959191', nomorPeserta: 'T1-26-02-13-1315-0004-5', ttl: 'BOGOR, 7 September 2013', scores: { 'Numerasi': 36.67, 'Literasi': 60.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 96.67, average: 48.34 },
      { id: 'std-05', name: 'MUHAMAD MAULANA IBRAHIM', nisn: '3122871998', nomorPeserta: 'T1-26-02-13-1315-0005-4', ttl: 'BOGOR, 16 Maret 2012', scores: { 'Numerasi': 30.00, 'Literasi': 56.67 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Memadai', totalScore: 86.67, average: 43.34 },
      { id: 'std-06', name: 'WIWI', nisn: '3133165068', nomorPeserta: 'T1-26-02-13-1315-0006-3', ttl: 'Bogor, 6 Mei 2013', scores: { 'Numerasi': 53.33, 'Literasi': 73.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 126.66, average: 63.33 },
      { id: 'std-07', name: 'Siti Jahra', nisn: '139707427', nomorPeserta: 'T1-26-02-13-1315-0007-2', ttl: 'Bogor, 24 November 2013', scores: { 'Numerasi': 33.33, 'Literasi': 40.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 73.33, average: 36.67 },
      { id: 'std-08', name: 'Muhamad Sabdayagra Ibrahim', nisn: '134408197', nomorPeserta: 'T1-26-02-13-1315-0008-9', ttl: 'Bogor, 21 Agustus 2013', scores: { 'Numerasi': 40.00, 'Literasi': 43.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 83.33, average: 41.67 },
      { id: 'std-09', name: 'Muhammad Fahri Dalimunthe', nisn: '3141467581', nomorPeserta: 'T1-26-02-13-1315-0009-8', ttl: 'Mandailing Natal, 17 Juni 2014', scores: { 'Numerasi': 26.67, 'Literasi': 70.00 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Memadai', totalScore: 96.67, average: 48.34 },
      { id: 'std-10', name: 'MUHAMMAD HAIDAR AL-HAFIZH', nisn: '3135191362', nomorPeserta: 'T1-26-02-13-1315-0010-7', ttl: 'Bogor, 30 November 2013', scores: { 'Numerasi': 60.00, 'Literasi': 63.33 }, predikatNumerasi: 'Baik', predikatLiterasi: 'Memadai', totalScore: 123.33, average: 61.67 },
      { id: 'std-11', name: 'MUHAMMAD ZIDAN KHOIRUL AZAM', nisn: '3134888004', nomorPeserta: 'T1-26-02-13-1315-0011-6', ttl: 'Bogor, 15 Juli 2013', scores: { 'Numerasi': 46.67, 'Literasi': 66.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 113.34, average: 56.67 },
      { id: 'std-12', name: 'Nayla Lintang Ramadhania', nisn: '3140633912', nomorPeserta: 'T1-26-02-13-1315-0012-5', ttl: 'Bogor, 7 Juli 2014', scores: { 'Numerasi': 60.00, 'Literasi': 63.33 }, predikatNumerasi: 'Baik', predikatLiterasi: 'Memadai', totalScore: 123.33, average: 61.67 },
      { id: 'std-13', name: 'Muhamad Ruby Alfath', nisn: '141094131', nomorPeserta: 'T1-26-02-13-1315-0013-4', ttl: 'Bogor, 18 Januari 2014', scores: { 'Numerasi': 53.33, 'Literasi': 53.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 106.66, average: 53.33 },
      { id: 'std-14', name: 'Resti Wahyudi', nisn: '3142803027', nomorPeserta: 'T1-26-02-13-1315-0014-3', ttl: 'Bogor, 20 Maret 2014', scores: { 'Numerasi': 43.33, 'Literasi': 66.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 110.00, average: 55.00 },
      { id: 'std-15', name: 'Vikri Priyanto', nisn: '3147814631', nomorPeserta: 'T1-26-02-13-1315-0015-2', ttl: 'Bogor, 27 Maret 2014', scores: { 'Numerasi': 33.33, 'Literasi': 36.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 70.00, average: 35.00 },
      { id: 'std-16', name: 'Sifan Allyasin', nisn: '3131178193', nomorPeserta: 'T1-26-02-13-1315-0016-9', ttl: 'Bekasi, 18 Februari 2013', scores: { 'Numerasi': 20.00, 'Literasi': 46.67 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Kurang', totalScore: 66.67, average: 33.34 },
      { id: 'std-17', name: 'MUHAMAD ARYAN HAERULLOH', nisn: '3142589800', nomorPeserta: 'T1-26-02-13-1315-0017-8', ttl: 'BOGOR, 18 Januari 2014', scores: { 'Numerasi': 36.67, 'Literasi': 53.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 90.00, average: 45.00 },
      { id: 'std-18', name: 'RAHMA AULIA ZAHRA', nisn: '132292304', nomorPeserta: 'T1-26-02-13-1315-0018-7', ttl: 'Bogor, 26 Agustus 2013', scores: { 'Numerasi': 36.67, 'Literasi': 80.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Baik', totalScore: 116.67, average: 58.34 },
      { id: 'std-19', name: 'Muhamad Bagus', nisn: '3143910501', nomorPeserta: 'T1-26-02-13-1315-0019-6', ttl: 'Bogor, 25 Januari 2014', scores: { 'Numerasi': 40.00, 'Literasi': 36.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 76.67, average: 38.34 },
      { id: 'std-20', name: 'MUHAMMAD FAHRAN ARIZKY', nisn: '3134895447', nomorPeserta: 'T1-26-02-13-1315-0020-5', ttl: 'Bogor, 25 November 2013', scores: { 'Numerasi': 43.33, 'Literasi': 70.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 113.33, average: 56.67 },
      { id: 'std-21', name: 'Muhamad Bagus', nisn: '3143087019', nomorPeserta: 'T1-26-02-13-1315-0021-4', ttl: 'Bogor, 25 Januari 2014', scores: { 'Numerasi': 23.33, 'Literasi': 43.33 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Kurang', totalScore: 66.66, average: 33.33 },
      { id: 'std-22', name: 'SITI NAILA NURLITA', nisn: '3130417519', nomorPeserta: 'T1-26-02-13-1315-0022-3', ttl: 'BOGOR, 19 Maret 2014', scores: { 'Numerasi': 36.67, 'Literasi': 30.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 66.67, average: 33.34 },
      { id: 'std-23', name: 'Sabry Maulana Badrun', nisn: '3137140348', nomorPeserta: 'T1-26-02-13-1315-0023-2', ttl: 'Bogor, 30 November 2013', scores: { 'Numerasi': 36.67, 'Literasi': 40.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 76.67, average: 38.34 },
      { id: 'std-24', name: 'Rosa Lidyawati', nisn: '3148158903', nomorPeserta: 'T1-26-02-13-1315-0024-9', ttl: 'Bogor, 18 Januari 2014', scores: { 'Numerasi': 33.33, 'Literasi': 56.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 90.00, average: 45.00 },
      { id: 'std-25', name: 'Silvana Firzania', nisn: '3134412916', nomorPeserta: 'T1-26-02-13-1315-0025-8', ttl: 'Bogor, 19 Desember 2013', scores: { 'Numerasi': 46.67, 'Literasi': 70.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 116.67, average: 58.34 },
      { id: 'std-26', name: 'Nur Laila Aqila', nisn: '3132839146', nomorPeserta: 'T1-26-02-13-1315-0026-7', ttl: 'Bogor, 3 Desember 2013', scores: { 'Numerasi': 30.00, 'Literasi': 43.33 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Kurang', totalScore: 73.33, average: 36.67 },
      { id: 'std-27', name: 'Silfa Hoeriyah', nisn: '3145536144', nomorPeserta: 'T1-26-02-13-1315-0027-6', ttl: 'Bogor, 25 Juni 2014', scores: { 'Numerasi': 36.67, 'Literasi': 70.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 106.67, average: 53.34 },
      { id: 'std-28', name: 'Muhammad Aby Sanjaya', nisn: '149017756', nomorPeserta: 'T1-26-02-13-1315-0028-5', ttl: 'Bogor, 15 Januari 2014', scores: { 'Numerasi': 20.00, 'Literasi': 50.00 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Memadai', totalScore: 70.00, average: 35.00 },
      { id: 'std-29', name: 'RECCA AKHMAD ALFATH', nisn: '3132659755', nomorPeserta: 'T1-26-02-13-1315-0029-4', ttl: 'BOGOR, 2 Oktober 2013', scores: { 'Numerasi': 30.00, 'Literasi': 70.00 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Memadai', totalScore: 100.00, average: 50.00 },
      { id: 'std-30', name: 'MUHAMMAD RAFFAEL ADVIRANSYAH', nisn: '135787724', nomorPeserta: 'T1-26-02-13-1315-0030-3', ttl: 'Bogor, 20 November 2013', scores: { 'Numerasi': 30.00, 'Literasi': 53.33 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Memadai', totalScore: 83.33, average: 41.67 },
      { id: 'std-31', name: 'Nabillal Al-Aqso', nisn: '3139552411', nomorPeserta: 'T1-26-02-13-1315-0031-2', ttl: 'Bogor, 5 September 2013', scores: { 'Numerasi': 53.33, 'Literasi': 70.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 123.33, average: 61.67 },
      { id: 'std-32', name: 'QIRANA PUTRI', nisn: '3135315290', nomorPeserta: 'T1-26-02-13-1315-0032-9', ttl: 'BOGOR, 10 Desember 2013', scores: { 'Numerasi': 26.67, 'Literasi': 60.00 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Memadai', totalScore: 86.67, average: 43.34 },
      { id: 'std-33', name: 'Alika Pebriyanti', nisn: '3141009800', nomorPeserta: 'T1-26-02-13-1315-0033-8', ttl: 'Bogor, 25 Februari 2014', scores: { 'Numerasi': 53.33, 'Literasi': 63.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 116.66, average: 58.33 },
      { id: 'std-34', name: 'Amelia Hidayat', nisn: '3130341822', nomorPeserta: 'T1-26-02-13-1315-0034-7', ttl: 'Bogor, 30 November 2013', scores: { 'Numerasi': 36.67, 'Literasi': 70.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 106.67, average: 53.34 },
      { id: 'std-35', name: 'M. ZIDAN MANDALA PUTRA', nisn: '3149358259', nomorPeserta: 'T1-26-02-13-1315-0035-6', ttl: 'Bogor, 29 Agustus 2014', scores: { 'Numerasi': 30.00, 'Literasi': 50.00 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Memadai', totalScore: 80.00, average: 40.00 },
      { id: 'std-36', name: 'Halifah Firdasari', nisn: '3135501626', nomorPeserta: 'T1-26-02-13-1315-0036-5', ttl: 'Bogor, 23 Desember 2013', scores: { 'Numerasi': 50.00, 'Literasi': 60.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 110.00, average: 55.00 },
      { id: 'std-37', name: 'Ayu Neng Tyas', nisn: '143490585', nomorPeserta: 'T1-26-02-13-1315-0037-4', ttl: 'Bogor, 12 Juni 2014', scores: { 'Numerasi': 40.00, 'Literasi': 46.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 86.67, average: 43.34 },
      { id: 'std-38', name: 'Hafizh Umar Maulana', nisn: '3146504563', nomorPeserta: 'T1-26-02-13-1315-0038-3', ttl: 'Bogor, 20 Januari 2014', scores: { 'Numerasi': 53.33, 'Literasi': 56.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 110.00, average: 55.00 },
      { id: 'std-39', name: 'ADINDA CHEVIANA SARI', nisn: '3141991669', nomorPeserta: 'T1-26-02-13-1315-0039-2', ttl: 'Bogor, 21 Mei 2014', scores: { 'Numerasi': 33.33, 'Literasi': 66.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 100.00, average: 50.00 },
      { id: 'std-40', name: 'April Aditya Perdana', nisn: '137994127', nomorPeserta: 'T1-26-02-13-1315-0040-9', ttl: 'Bogor, 20 April 2013', scores: { 'Numerasi': 36.67, 'Literasi': 56.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 93.34, average: 46.67 },
      { id: 'std-41', name: 'Andini Fahjarani', nisn: '131846154', nomorPeserta: 'T1-26-02-13-1315-0041-8', ttl: 'Bogor, 8 September 2013', scores: { 'Numerasi': 50.00, 'Literasi': 73.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 123.33, average: 61.67 },
      { id: 'std-42', name: 'IRGI YANSYAH', nisn: '3136534089', nomorPeserta: 'T1-26-02-13-1315-0042-7', ttl: 'Bogor, 25 Maret 2013', scores: { 'Numerasi': 36.67, 'Literasi': 36.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 73.34, average: 36.67 },
      { id: 'std-43', name: 'Marwah Junitasari', nisn: '3130260509', nomorPeserta: 'T1-26-02-13-1315-0043-6', ttl: 'Bogor, 4 Juni 2013', scores: { 'Numerasi': 66.67, 'Literasi': 66.67 }, predikatNumerasi: 'Baik', predikatLiterasi: 'Memadai', totalScore: 133.34, average: 66.67 },
      { id: 'std-44', name: 'Mohamad Ikhsan Hasanudin', nisn: '3141545630', nomorPeserta: 'T1-26-02-13-1315-0044-5', ttl: 'Jakarta, 30 April 2014', scores: { 'Numerasi': 46.67, 'Literasi': 46.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 93.34, average: 46.67 },
      { id: 'std-45', name: 'Hafiz Solihin', nisn: '3149529906', nomorPeserta: 'T1-26-02-13-1315-0045-4', ttl: 'Bogor, 14 September 2014', scores: { 'Numerasi': 33.33, 'Literasi': 60.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 93.33, average: 46.67 },
      { id: 'std-46', name: 'Harun Al-Azmi', nisn: '132622978', nomorPeserta: 'T1-26-02-13-1315-0046-3', ttl: 'Bogor, 7 Oktober 2013', scores: { 'Numerasi': 40.00, 'Literasi': 66.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 106.67, average: 53.34 },
      { id: 'std-47', name: 'KEISHA DWI AGUSTIN', nisn: '3130292897', nomorPeserta: 'T1-26-02-13-1315-0047-2', ttl: 'BOGOR, 20 Desember 2013', scores: { 'Numerasi': 50.00, 'Literasi': 56.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 106.67, average: 53.34 },
      { id: 'std-48', name: 'Bayu Al Rizqi', nisn: '3148130919', nomorPeserta: 'T1-26-02-13-1315-0048-9', ttl: 'Bogor, 31 Mei 2014', scores: { 'Numerasi': 56.67, 'Literasi': 50.00 }, predikatNumerasi: 'Baik', predikatLiterasi: 'Memadai', totalScore: 106.67, average: 53.34 },
      { id: 'std-49', name: 'Ananda Mutiara Kasih', nisn: '134422777', nomorPeserta: 'T1-26-02-13-1315-0049-8', ttl: 'Bogor, 13 Desember 2013', scores: { 'Numerasi': 33.33, 'Literasi': 53.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 86.66, average: 43.33 },
      { id: 'std-50', name: 'MARIANA MAULIDA', nisn: '3133300000', nomorPeserta: 'T1-26-02-13-1315-0050-7', ttl: 'BOGOR, 22 Januari 2013', scores: { 'Numerasi': 36.67, 'Literasi': 56.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 93.34, average: 46.67 },
      { id: 'std-51', name: 'ARFAN MAULANA', nisn: '3134321183', nomorPeserta: 'T1-26-02-13-1315-0051-6', ttl: 'BOGOR, 26 Oktober 2013', scores: { 'Numerasi': 50.00, 'Literasi': 76.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Baik', totalScore: 126.67, average: 63.34 },
      { id: 'std-52', name: 'Ahmad Rizky Akbar', nisn: '3148481386', nomorPeserta: 'T1-26-02-13-1315-0052-5', ttl: 'Bogor, 10 Mei 2014', scores: { 'Numerasi': 30.00, 'Literasi': 63.33 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Memadai', totalScore: 93.33, average: 46.67 },
      { id: 'std-53', name: 'Khaisa Fitria Ramadani', nisn: '3142233297', nomorPeserta: 'T1-26-02-13-1315-0053-4', ttl: 'Bogor, 25 Juli 2014', scores: { 'Numerasi': 46.67, 'Literasi': 46.67 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 93.34, average: 46.67 },
      { id: 'std-54', name: 'Keyla Syakira Putri', nisn: '146635879', nomorPeserta: 'T1-26-02-13-1315-0054-3', ttl: 'Bogor, 9 Juni 2014', scores: { 'Numerasi': 33.33, 'Literasi': 73.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 106.66, average: 53.33 },
      { id: 'std-55', name: 'ADLI HAKIM', nisn: '3137671664', nomorPeserta: 'T1-26-02-13-1315-0055-2', ttl: 'Lebak, 10 Juni 2013', scores: { 'Numerasi': 43.33, 'Literasi': 63.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 106.66, average: 53.33 },
      { id: 'std-56', name: 'GALANG PRATAMA', nisn: '148628054', nomorPeserta: 'T1-26-02-13-1315-0056-9', ttl: 'JAMBI, 17 Mei 2014', scores: { 'Numerasi': 26.67, 'Literasi': 60.00 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Memadai', totalScore: 86.67, average: 43.34 },
      { id: 'std-57', name: 'AKRIMA YUSUP', nisn: '3134318237', nomorPeserta: 'T1-26-02-13-1315-0057-8', ttl: 'Bogor, 28 Juli 2013', scores: { 'Numerasi': 23.33, 'Literasi': 46.67 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Kurang', totalScore: 70.00, average: 35.00 },
      { id: 'std-58', name: 'Lustia Purnama', nisn: '3148133510', nomorPeserta: 'T1-26-02-13-1315-0058-7', ttl: 'Bogor, 11 Januari 2014', scores: { 'Numerasi': 43.33, 'Literasi': 70.00 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Memadai', totalScore: 113.33, average: 56.67 },
      { id: 'std-59', name: 'Galang Jidan Sabilillah', nisn: '3137153195', nomorPeserta: 'T1-26-02-13-1315-0059-6', ttl: 'Bogor, 8 Desember 2013', scores: { 'Numerasi': 56.67, 'Literasi': 63.33 }, predikatNumerasi: 'Baik', predikatLiterasi: 'Memadai', totalScore: 120.00, average: 60.00 },
      { id: 'std-60', name: 'M. RENO', nisn: '3148770455', nomorPeserta: 'T1-26-02-13-1315-0060-5', ttl: 'Bogor, 25 April 2014', scores: { 'Numerasi': 26.67, 'Literasi': 36.67 }, predikatNumerasi: 'Kurang', predikatLiterasi: 'Kurang', totalScore: 63.34, average: 31.67 },
      { id: 'std-61', name: 'Aftika Rahayu', nisn: '3145818505', nomorPeserta: 'T1-26-02-13-1315-0061-4', ttl: 'Bogor, 5 Januari 2014', scores: { 'Numerasi': 43.33, 'Literasi': 83.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Baik', totalScore: 126.66, average: 63.33 },
      { id: 'std-62', name: 'Abizar Rojak', nisn: '3141449433', nomorPeserta: 'T1-26-02-13-1315-0062-3', ttl: 'Bogor, 24 Juni 2014', scores: { 'Numerasi': 36.67, 'Literasi': 33.33 }, predikatNumerasi: 'Memadai', predikatLiterasi: 'Kurang', totalScore: 70.00, average: 35.00 }
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
