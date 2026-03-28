import { formatRs, formatDate } from './students';

export interface StaffMember {
  id: string;
  fullName: string;
  fatherName: string;
  role: string;
  gender: string;
  monthlySalary: number;
  joinDate: string;
  phone: string;
  cnic: string;
  dateOfBirth: string;
  qualification: string;
  address: string;
  notes: string;
  status: 'Active' | 'Inactive';
  inactiveDate?: string;
  inactiveReason?: string;
}

export interface SalaryRecord {
  id: string;
  staffId: string;
  month: string;
  year: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber: string;
  notes: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  paidTo: string;
  receiptRef: string;
  recordedBy: string;
  notes: string;
}

export const STAFF_ROLES = ['Head Teacher', 'Teacher', 'Admin Staff', 'Guard', 'Peon', 'Cook', 'Other'];
export const EXPENSE_CATEGORIES = ['Utilities', 'Maintenance', 'Supplies', 'Transport', 'Salary', 'Other'];
export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Online'];

let salaryReceiptCounter = 1;
export function generateSalaryReceipt(): string {
  const num = String(salaryReceiptCounter++).padStart(3, '0');
  return `SAL-2025-${num}`;
}

export const initialStaff: StaffMember[] = [
  { id: 's1', fullName: 'Muhammad Tariq', fatherName: 'Tariq Khan', role: 'Head Teacher', gender: 'Male', monthlySalary: 15000, joinDate: '2020-01-01', phone: '0312-1234567', cnic: '15201-1234567-1', dateOfBirth: '1985-05-15', qualification: 'M.Ed', address: 'Village Butmong, Buner', notes: '', status: 'Active' },
  { id: 's2', fullName: 'Ayesha Siddiq', fatherName: 'Siddiq Ahmad', role: 'Teacher', gender: 'Female', monthlySalary: 12000, joinDate: '2021-03-01', phone: '0333-2345678', cnic: '15201-2345678-2', dateOfBirth: '1990-08-20', qualification: 'B.Ed', address: 'Daggar, Buner', notes: '', status: 'Active' },
  { id: 's3', fullName: 'Bilal Hussain', fatherName: 'Hussain Shah', role: 'Teacher', gender: 'Male', monthlySalary: 12000, joinDate: '2022-06-15', phone: '0300-3456789', cnic: '15201-3456789-3', dateOfBirth: '1992-01-10', qualification: 'B.Ed', address: 'Butmong, Buner', notes: '', status: 'Active' },
  { id: 's4', fullName: 'Fatima Zahra', fatherName: 'Zahra Khan', role: 'Teacher', gender: 'Female', monthlySalary: 10000, joinDate: '2022-09-01', phone: '0321-4567890', cnic: '15201-4567890-4', dateOfBirth: '1993-04-05', qualification: 'B.A, B.Ed', address: 'Daggar, Buner', notes: '', status: 'Active' },
  { id: 's5', fullName: 'Abdul Rehman', fatherName: 'Rehman Gul', role: 'Admin Staff', gender: 'Male', monthlySalary: 8000, joinDate: '2021-01-01', phone: '0345-5678901', cnic: '15201-5678901-5', dateOfBirth: '1988-11-25', qualification: 'Intermediate', address: 'Butmong, Buner', notes: '', status: 'Active' },
  { id: 's6', fullName: 'Nadia Malik', fatherName: 'Malik Zaman', role: 'Teacher', gender: 'Female', monthlySalary: 10000, joinDate: '2023-02-01', phone: '0311-6789012', cnic: '15201-6789012-6', dateOfBirth: '1995-07-12', qualification: 'B.Ed', address: 'Daggar, Buner', notes: '', status: 'Active' },
  { id: 's7', fullName: 'Khalid Mehmood', fatherName: 'Mehmood Khan', role: 'Guard', gender: 'Male', monthlySalary: 6000, joinDate: '2020-04-01', phone: '0322-7890123', cnic: '15201-7890123-7', dateOfBirth: '1980-03-08', qualification: 'Primary', address: 'Butmong, Buner', notes: '', status: 'Active' },
  { id: 's8', fullName: 'Raheela Bibi', fatherName: 'Gul Zaman', role: 'Peon', gender: 'Female', monthlySalary: 5000, joinDate: '2021-07-01', phone: '0301-8901234', cnic: '15201-8901234-8', dateOfBirth: '1987-09-18', qualification: 'Middle', address: 'Butmong, Buner', notes: '', status: 'Active' },
];

export const initialSalaryRecords: SalaryRecord[] = [
  { id: 'sal1', staffId: 's1', month: 'March', year: 2025, amount: 15000, paymentDate: '2025-03-05', paymentMethod: 'Cash', receiptNumber: 'SAL-2025-001', notes: '' },
  { id: 'sal2', staffId: 's2', month: 'March', year: 2025, amount: 12000, paymentDate: '2025-03-05', paymentMethod: 'Cash', receiptNumber: 'SAL-2025-002', notes: '' },
  { id: 'sal5', staffId: 's5', month: 'March', year: 2025, amount: 8000, paymentDate: '2025-03-05', paymentMethod: 'Cash', receiptNumber: 'SAL-2025-003', notes: '' },
  { id: 'sal6', staffId: 's6', month: 'March', year: 2025, amount: 10000, paymentDate: '2025-03-05', paymentMethod: 'Bank Transfer', receiptNumber: 'SAL-2025-004', notes: '' },
  { id: 'sal8', staffId: 's8', month: 'March', year: 2025, amount: 5000, paymentDate: '2025-03-05', paymentMethod: 'Cash', receiptNumber: 'SAL-2025-005', notes: '' },
];

salaryReceiptCounter = 6;

export const initialExpenses: Expense[] = [
  { id: 'e1', date: '2025-03-01', category: 'Utilities', description: 'Electricity bill', amount: 8500, paymentMethod: 'Cash', paidTo: 'WAPDA', receiptRef: '', recordedBy: 'Admin', notes: '' },
  { id: 'e2', date: '2025-03-03', category: 'Maintenance', description: 'Classroom chair repair', amount: 3200, paymentMethod: 'Cash', paidTo: 'Local carpenter', receiptRef: '', recordedBy: 'Admin', notes: '' },
  { id: 'e3', date: '2025-03-05', category: 'Supplies', description: 'Stationery for staff', amount: 1800, paymentMethod: 'Bank Transfer', paidTo: 'Stationery shop', receiptRef: '', recordedBy: 'Admin', notes: '' },
  { id: 'e4', date: '2025-03-07', category: 'Utilities', description: 'Water bill', amount: 2000, paymentMethod: 'Cash', paidTo: 'TMA', receiptRef: '', recordedBy: 'Admin', notes: '' },
  { id: 'e5', date: '2025-03-10', category: 'Transport', description: 'Van fuel', amount: 5000, paymentMethod: 'Cash', paidTo: 'Petrol station', receiptRef: '', recordedBy: 'Admin', notes: '' },
  { id: 'e6', date: '2025-03-12', category: 'Maintenance', description: 'Whiteboard replacement', amount: 4000, paymentMethod: 'Bank Transfer', paidTo: 'Furniture shop', receiptRef: '', recordedBy: 'Admin', notes: '' },
  { id: 'e7', date: '2025-03-15', category: 'Supplies', description: 'Cleaning supplies', amount: 1500, paymentMethod: 'Cash', paidTo: 'General store', receiptRef: '', recordedBy: 'Admin', notes: '' },
  { id: 'e8', date: '2025-03-18', category: 'Other', description: 'Miscellaneous', amount: 2500, paymentMethod: 'Cash', paidTo: 'Various', receiptRef: '', recordedBy: 'Admin', notes: '' },
];
