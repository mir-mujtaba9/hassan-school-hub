import React, { createContext, useContext, useState } from 'react';
import { Student, FeeRecord, initialStudents, initialFeeRecords } from '@/data/students';
import { StaffMember, SalaryRecord, Expense, initialStaff, initialSalaryRecords, initialExpenses } from '@/data/staff';

interface AppContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  feeRecords: FeeRecord[];
  setFeeRecords: React.Dispatch<React.SetStateAction<FeeRecord[]>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  userRole: string;
  setUserRole: React.Dispatch<React.SetStateAction<string>>;
  userName: string;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  salaryRecords: SalaryRecord[];
  setSalaryRecords: React.Dispatch<React.SetStateAction<SalaryRecord[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(initialFeeRecords);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>(initialSalaryRecords);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  return (
    <AppContext.Provider value={{ students, setStudents, feeRecords, setFeeRecords, isLoggedIn, setIsLoggedIn, userRole, setUserRole, userName, setUserName, staff, setStaff, salaryRecords, setSalaryRecords, expenses, setExpenses }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
};
