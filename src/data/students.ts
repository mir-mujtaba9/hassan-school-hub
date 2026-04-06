export interface Student {
  id: string;
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
  gender: string;
  religion: string;
  nationality: string;
  placeOfBirth: string;
  motherTongue: string;
  studentPhone: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  homeAddress: string;
  district: string;
  tehsil: string;
  admissionDate: string;
  studentClass: string;
  section: string;
  rollNumber: number | null;
  previousSchool: string;
  previousClass: string;
  previousResult: string;
  monthlyFee: number;
  discount: string;
  discountedFee: number;
  discountReason: string;
  bFormNumber: string;
  fatherCnic: string;
  previousTcNumber: string;
  medicalCondition: string;
  notes: string;
  status: 'Active' | 'Left';
  leavingDate?: string;
  leavingReason?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  month: string;
  year: number;
  monthlyFee: number;
  prevBalance: number;
  totalDue: number;
  paidAmount: number;
  balanceRemaining: number;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Advance';
  paymentDate?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
}

export const CLASS_FEE_MAP: Record<string, number> = {
  'Nursery': 800,
  'Prep': 900,
  'KG': 1000,
  'Class 1': 1200,
  'Class 2': 1200,
  'Class 3': 1200,
  'Class 4': 1500,
  'Class 5': 1500,
  'Class 6': 1500,
  'Class 7': 1800,
  'Class 8': 1800,
  'Class 9': 2000,
  'Class 10': 2000,
};

export const CLASS_OPTIONS = [
  'Nursery', 'Prep', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4',
  'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
];

export const DISCOUNT_OPTIONS = ['No Discount', '25%', '50%', '75%', '100%'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function calcDiscountedFee(baseFee: number, discount: string): number {
  if (discount === 'No Discount' || !discount) return baseFee;
  const pct = parseInt(discount) / 100;
  return Math.round(baseFee * (1 - pct));
}

export function formatRs(amount: number): string {
  return `Rs.${amount.toLocaleString('en-PK')}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

let receiptCounter = 1;
export function generateReceiptNumber(): string {
  const num = String(receiptCounter++).padStart(3, '0');
  return `RCP-2025-${num}`;
}

export const initialStudents: Student[] = [
  { id: '1', fullName: 'Muhammad Ali', fatherName: 'Ali Khan', dateOfBirth: '2012-03-15', gender: 'Male', religion: 'Islam', nationality: 'Pakistani', placeOfBirth: 'Butmong', motherTongue: 'Pashto', studentPhone: '', fatherPhone: '0301-1234567', motherName: 'Bibi Amina', motherPhone: '', emergencyContactName: '', emergencyContactPhone: '', homeAddress: 'Village Butmong, District Buner', district: 'Buner', tehsil: 'Daggar', admissionDate: '2024-04-01', studentClass: 'Class 4', section: 'A', rollNumber: 1, previousSchool: '', previousClass: '', previousResult: 'N/A', monthlyFee: 1500, discount: 'No Discount', discountedFee: 1500, discountReason: '', bFormNumber: '', fatherCnic: '15201-1234567-1', previousTcNumber: '', medicalCondition: '', notes: '', status: 'Active' },
  { id: '2', fullName: 'Ahmed Khan', fatherName: 'Khan Bahadur', dateOfBirth: '2010-07-22', gender: 'Male', religion: 'Islam', nationality: 'Pakistani', placeOfBirth: 'Daggar', motherTongue: 'Pashto', studentPhone: '0312-9876543', fatherPhone: '0312-9876540', motherName: 'Nazia Begum', motherPhone: '', emergencyContactName: '', emergencyContactPhone: '', homeAddress: 'Daggar Bazaar, Buner', district: 'Buner', tehsil: 'Daggar', admissionDate: '2024-04-01', studentClass: 'Class 7', section: 'A', rollNumber: 2, previousSchool: 'Govt Primary School', previousClass: 'Class 6', previousResult: 'Good', monthlyFee: 1800, discount: '25%', discountedFee: 1350, discountReason: 'Staff child', bFormNumber: '', fatherCnic: '15201-7654321-1', previousTcNumber: '', medicalCondition: '', notes: '', status: 'Active' },
  { id: '3', fullName: 'Fatima Raza', fatherName: 'Raza Mehmood', dateOfBirth: '2015-01-10', gender: 'Female', religion: 'Islam', nationality: 'Pakistani', placeOfBirth: 'Butmong', motherTongue: 'Urdu', studentPhone: '', fatherPhone: '0333-1112233', motherName: 'Shabana Raza', motherPhone: '0333-4445566', emergencyContactName: '', emergencyContactPhone: '', homeAddress: 'Mohalla Qazi, Butmong', district: 'Buner', tehsil: 'Daggar', admissionDate: '2025-01-15', studentClass: 'Class 2', section: 'B', rollNumber: 3, previousSchool: '', previousClass: '', previousResult: 'N/A', monthlyFee: 1200, discount: 'No Discount', discountedFee: 1200, discountReason: '', bFormNumber: '', fatherCnic: '', previousTcNumber: '', medicalCondition: '', notes: '', status: 'Active' },
  { id: '4', fullName: 'Sara Bibi', fatherName: 'Bibi Gul', dateOfBirth: '2009-11-05', gender: 'Female', religion: 'Islam', nationality: 'Pakistani', placeOfBirth: 'Swat', motherTongue: 'Pashto', studentPhone: '', fatherPhone: '0345-6789012', motherName: 'Gulshan Bibi', motherPhone: '', emergencyContactName: '', emergencyContactPhone: '', homeAddress: 'Village Koga, Buner', district: 'Buner', tehsil: 'Daggar', admissionDate: '2023-04-01', studentClass: 'Class 9', section: 'A', rollNumber: 4, previousSchool: 'Govt Girls School', previousClass: 'Class 8', previousResult: 'Excellent', monthlyFee: 2000, discount: '50%', discountedFee: 1000, discountReason: 'Financial hardship', bFormNumber: '', fatherCnic: '', previousTcNumber: '', medicalCondition: '', notes: '', status: 'Left', leavingDate: '2025-02-15', leavingReason: 'Family relocated' },
  { id: '5', fullName: 'Usman Tariq', fatherName: 'Tariq Hussain', dateOfBirth: '2013-06-18', gender: 'Male', religion: 'Islam', nationality: 'Pakistani', placeOfBirth: 'Butmong', motherTongue: 'Pashto', studentPhone: '', fatherPhone: '0300-5554433', motherName: 'Rukhsana Tariq', motherPhone: '', emergencyContactName: '', emergencyContactPhone: '', homeAddress: 'Main Road Butmong', district: 'Buner', tehsil: 'Daggar', admissionDate: '2024-04-01', studentClass: 'Class 6', section: 'A', rollNumber: 5, previousSchool: '', previousClass: '', previousResult: 'N/A', monthlyFee: 1500, discount: 'No Discount', discountedFee: 1500, discountReason: '', bFormNumber: '', fatherCnic: '', previousTcNumber: '', medicalCondition: '', notes: '', status: 'Active' },
  { id: '6', fullName: 'Zainab Malik', fatherName: 'Malik Usman', dateOfBirth: '2016-09-25', gender: 'Female', religion: 'Islam', nationality: 'Pakistani', placeOfBirth: 'Butmong', motherTongue: 'Pashto', studentPhone: '', fatherPhone: '0321-1122334', motherName: 'Nasreen Malik', motherPhone: '', emergencyContactName: '', emergencyContactPhone: '', homeAddress: 'Near Masjid, Butmong', district: 'Buner', tehsil: 'Daggar', admissionDate: '2025-03-01', studentClass: 'Class 1', section: 'A', rollNumber: 6, previousSchool: '', previousClass: '', previousResult: 'N/A', monthlyFee: 1200, discount: 'No Discount', discountedFee: 1200, discountReason: '', bFormNumber: '', fatherCnic: '', previousTcNumber: '', medicalCondition: '', notes: '', status: 'Active' },
  { id: '7', fullName: 'Hassan Raza', fatherName: 'Raza Ahmed', dateOfBirth: '2010-12-03', gender: 'Male', religion: 'Islam', nationality: 'Pakistani', placeOfBirth: 'Daggar', motherTongue: 'Pashto', studentPhone: '0315-7778899', fatherPhone: '0315-7778800', motherName: 'Saima Raza', motherPhone: '', emergencyContactName: '', emergencyContactPhone: '', homeAddress: 'Daggar City, Buner', district: 'Buner', tehsil: 'Daggar', admissionDate: '2024-04-01', studentClass: 'Class 8', section: 'B', rollNumber: 7, previousSchool: 'Private School Daggar', previousClass: 'Class 7', previousResult: 'Good', monthlyFee: 1800, discount: '25%', discountedFee: 1350, discountReason: 'Merit scholarship', bFormNumber: '', fatherCnic: '', previousTcNumber: '', medicalCondition: '', notes: '', status: 'Active' },
  { id: '8', fullName: 'Ayesha Noor', fatherName: 'Noor Bakhsh', dateOfBirth: '2014-04-12', gender: 'Female', religion: 'Islam', nationality: 'Pakistani', placeOfBirth: 'Butmong', motherTongue: 'Urdu', studentPhone: '', fatherPhone: '0346-2233445', motherName: 'Noor Jahan', motherPhone: '', emergencyContactName: '', emergencyContactPhone: '', homeAddress: 'Mohalla Noor, Butmong', district: 'Buner', tehsil: 'Daggar', admissionDate: '2024-06-01', studentClass: 'Class 3', section: 'A', rollNumber: 8, previousSchool: '', previousClass: '', previousResult: 'N/A', monthlyFee: 1200, discount: 'No Discount', discountedFee: 1200, discountReason: '', bFormNumber: '', fatherCnic: '', previousTcNumber: '', medicalCondition: '', notes: '', status: 'Left', leavingDate: '2025-01-10', leavingReason: 'Transferred to another school' },
  { id: '9', fullName: 'Bilal Ahmed', fatherName: 'Ahmed Jan', dateOfBirth: '2013-08-30', gender: 'Male', religion: 'Islam', nationality: 'Pakistani', placeOfBirth: 'Butmong', motherTongue: 'Pashto', studentPhone: '', fatherPhone: '0300-9988776', motherName: 'Farzana Ahmed', motherPhone: '', emergencyContactName: '', emergencyContactPhone: '', homeAddress: 'Village Butmong', district: 'Buner', tehsil: 'Daggar', admissionDate: '2024-04-01', studentClass: 'Class 5', section: 'A', rollNumber: 9, previousSchool: '', previousClass: '', previousResult: 'N/A', monthlyFee: 1500, discount: '75%', discountedFee: 375, discountReason: 'Orphan', bFormNumber: '', fatherCnic: '', previousTcNumber: '', medicalCondition: '', notes: '', status: 'Active' },
  { id: '10', fullName: 'Huma Shah', fatherName: 'Shah Zaman', dateOfBirth: '2009-02-14', gender: 'Female', religion: 'Islam', nationality: 'Pakistani', placeOfBirth: 'Swat', motherTongue: 'Pashto', studentPhone: '0311-5566778', fatherPhone: '0311-5566770', motherName: 'Shah Bibi', motherPhone: '', emergencyContactName: '', emergencyContactPhone: '', homeAddress: 'Main Bazaar, Butmong', district: 'Buner', tehsil: 'Daggar', admissionDate: '2023-04-01', studentClass: 'Class 10', section: 'A', rollNumber: 10, previousSchool: 'Govt High School', previousClass: 'Class 9', previousResult: 'Excellent', monthlyFee: 2000, discount: 'No Discount', discountedFee: 2000, discountReason: '', bFormNumber: '', fatherCnic: '', previousTcNumber: '', medicalCondition: '', notes: '', status: 'Active' },
];

export const initialFeeRecords: FeeRecord[] = [
  { id: 'f1', studentId: '1', month: 'March', year: 2025, monthlyFee: 1500, prevBalance: 0, totalDue: 1500, paidAmount: 1500, balanceRemaining: 0, status: 'Paid', paymentDate: '2025-03-05', paymentMethod: 'Cash', receiptNumber: 'RCP-2025-001' },
  { id: 'f2', studentId: '2', month: 'March', year: 2025, monthlyFee: 1350, prevBalance: 0, totalDue: 1350, paidAmount: 800, balanceRemaining: 550, status: 'Partial', paymentDate: '2025-03-10', paymentMethod: 'Cash', receiptNumber: 'RCP-2025-002' },
  { id: 'f3', studentId: '3', month: 'March', year: 2025, monthlyFee: 1200, prevBalance: 400, totalDue: 1600, paidAmount: 1600, balanceRemaining: 0, status: 'Paid', paymentDate: '2025-03-08', paymentMethod: 'Cash', receiptNumber: 'RCP-2025-003' },
  { id: 'f4', studentId: '4', month: 'March', year: 2025, monthlyFee: 1000, prevBalance: 0, totalDue: 1000, paidAmount: 0, balanceRemaining: 1000, status: 'Unpaid' },
  { id: 'f5', studentId: '5', month: 'March', year: 2025, monthlyFee: 1500, prevBalance: 0, totalDue: 1500, paidAmount: 1000, balanceRemaining: 500, status: 'Partial', paymentDate: '2025-03-12', paymentMethod: 'Cash', receiptNumber: 'RCP-2025-004' },
  { id: 'f6', studentId: '6', month: 'March', year: 2025, monthlyFee: 1200, prevBalance: 200, totalDue: 1400, paidAmount: 1400, balanceRemaining: 0, status: 'Paid', paymentDate: '2025-03-03', paymentMethod: 'Bank Transfer', receiptNumber: 'RCP-2025-005' },
  { id: 'f7', studentId: '7', month: 'March', year: 2025, monthlyFee: 1350, prevBalance: 0, totalDue: 1350, paidAmount: 0, balanceRemaining: 1350, status: 'Unpaid' },
  { id: 'f8', studentId: '8', month: 'March', year: 2025, monthlyFee: 1200, prevBalance: 0, totalDue: 1200, paidAmount: 1500, balanceRemaining: 0, status: 'Advance', paymentDate: '2025-03-01', paymentMethod: 'Cash', receiptNumber: 'RCP-2025-006', notes: 'Paid in advance for next month' },
  { id: 'f9', studentId: '9', month: 'March', year: 2025, monthlyFee: 375, prevBalance: 500, totalDue: 875, paidAmount: 500, balanceRemaining: 375, status: 'Partial', paymentDate: '2025-03-15', paymentMethod: 'Cash', receiptNumber: 'RCP-2025-007' },
  { id: 'f10', studentId: '10', month: 'March', year: 2025, monthlyFee: 2000, prevBalance: 0, totalDue: 2000, paidAmount: 2000, balanceRemaining: 0, status: 'Paid', paymentDate: '2025-03-02', paymentMethod: 'Cash', receiptNumber: 'RCP-2025-008' },
];

receiptCounter = 9;
