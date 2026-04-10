import React, { createContext, useContext, useState, useEffect } from 'react';
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
  authToken: string | null;
  setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
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
  const [userName, setUserName] = useState('Muhammad Hassan');
   const [authToken, setAuthToken] = useState<string | null>(() => {
     if (typeof window === 'undefined') return null;
     return localStorage.getItem('authToken');
   });
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>(initialSalaryRecords);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

   useEffect(() => {
     if (typeof window === 'undefined') return;
     if (authToken) {
       localStorage.setItem('authToken', authToken);
     } else {
       localStorage.removeItem('authToken');
     }
   }, [authToken]);

  useEffect(() => {
    const loadStudentsFromApi = async () => {
      try {
        const headers: HeadersInit = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch('http://localhost:4000/api/v1/students', { headers });
        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.students)
          ? (data as any).students
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];

        if (!Array.isArray(list)) return;

        const mapped: Student[] = list.map((item: any, index: number) => {
          const id = String(item.id ?? item._id ?? index + 1);

          const baseMonthlyFee = Number(item.monthly_fee ?? item.monthlyFee ?? 0) || 0;
          const discountLabel = typeof item.discount === 'string' ? item.discount : 'No Discount';
          let discountedFee = baseMonthlyFee;
          if (typeof item.discounted_fee === 'number') {
            discountedFee = item.discounted_fee;
          } else if (discountLabel !== 'No Discount') {
            const pct = parseInt(discountLabel);
            if (!Number.isNaN(pct)) {
              discountedFee = Math.round(baseMonthlyFee * (1 - pct / 100));
            }
          }

          const rawStatus: string = item.status ?? 'Active';
          const status: 'Active' | 'Left' = rawStatus === 'Left' ? 'Left' : 'Active';

          return {
            id,
            fullName: item.full_name ?? item.fullName ?? '',
            fatherName: item.father_name ?? item.fatherName ?? '',
            dateOfBirth: item.date_of_birth ?? item.dateOfBirth ?? '',
            gender: item.gender ?? '',
            religion: item.religion ?? 'Islam',
            nationality: item.nationality ?? 'Pakistani',
            placeOfBirth: item.place_of_birth ?? item.placeOfBirth ?? '',
            motherTongue: item.mother_tongue ?? item.motherTongue ?? '',
            studentPhone: item.student_phone ?? item.studentPhone ?? '',
            fatherPhone: item.father_phone ?? item.fatherPhone ?? '',
            motherName: item.mother_name ?? item.motherName ?? '',
            motherPhone: item.mother_phone ?? item.motherPhone ?? '',
            emergencyContactName: item.emergency_contact_name ?? '',
            emergencyContactPhone: item.emergency_contact_phone ?? '',
            homeAddress: item.home_address ?? item.homeAddress ?? '',
            district: item.district ?? '',
            tehsil: item.tehsil ?? '',
            admissionDate: item.admission_date ?? item.admissionDate ?? '',
            studentClass:
              item.student_class ??
              item.studentClass ??
              (item.class_id ? `Class ${item.class_id}` : ''),
            section: item.section ?? '',
            rollNumber:
              typeof item.roll_number === 'number'
                ? item.roll_number
                : typeof item.rollNumber === 'number'
                ? item.rollNumber
                : null,
            previousSchool: item.previous_school ?? '',
            previousClass: item.previous_class ?? '',
            previousResult: item.previous_result ?? 'N/A',
            monthlyFee: baseMonthlyFee,
            discount: discountLabel || 'No Discount',
            discountedFee,
            discountReason: item.discount_reason ?? '',
            bFormNumber: item.b_form_number ?? '',
            fatherCnic: item.father_cnic ?? '',
            previousTcNumber: item.previous_tc_number ?? '',
            medicalCondition: item.medical_condition ?? '',
            notes: item.notes ?? '',
            status,
            leavingDate: item.leaving_date,
            leavingReason: item.leaving_reason,
          };
        });

        setStudents(mapped);
      } catch {
        // If backend is unavailable, keep initial demo data
      }
    };

    loadStudentsFromApi();
  }, [authToken]);

  return (
    <AppContext.Provider value={{ students, setStudents, feeRecords, setFeeRecords, isLoggedIn, setIsLoggedIn, userRole, setUserRole, userName, setUserName, authToken, setAuthToken, staff, setStaff, salaryRecords, setSalaryRecords, expenses, setExpenses }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
};
