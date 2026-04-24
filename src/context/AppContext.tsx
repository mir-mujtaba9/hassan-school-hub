import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, FeeRecord, initialStudents, initialFeeRecords } from '@/data/students';
import { StaffMember, SalaryRecord, Expense, STAFF_ROLES, initialStaff, initialSalaryRecords, initialExpenses } from '@/data/staff';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface AppContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  feeRecords: FeeRecord[];
  setFeeRecords: React.Dispatch<React.SetStateAction<FeeRecord[]>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  userId: string | null;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
  userEmail: string;
  setUserEmail: React.Dispatch<React.SetStateAction<string>>;
  userRole: string;
  setUserRole: React.Dispatch<React.SetStateAction<string>>;
  userName: string;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  authToken: string | null;
  setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  staffRoles: string[];
  setStaffRoles: React.Dispatch<React.SetStateAction<string[]>>;
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
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('admin');
  const [userName, setUserName] = useState('Muhammad Hassan');
   const [authToken, setAuthToken] = useState<string | null>(() => {
     if (typeof window === 'undefined') return null;
     return localStorage.getItem('authToken');
   });
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [staffRoles, setStaffRoles] = useState<string[]>(STAFF_ROLES);
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

        const response = await fetch(`${API_BASE_URL}/students`, { headers });
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
              item.class_name ??
              item.className ??
              item.class?.name ??
              item.class?.class_name ??
              item.class?.title ??
              item.class?.label ??
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

  useEffect(() => {
    const loadStaffFromApi = async () => {
      try {
        const headers: HeadersInit = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/staff`, { headers });
        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray((data as any)?.staff)
          ? (data as any).staff
          : Array.isArray(data)
          ? data
          : [];

        if (Array.isArray((data as any)?.staffRoles)) {
          const roles = (data as any).staffRoles.filter((r: unknown) => typeof r === 'string');
          if (roles.length > 0) {
            setStaffRoles(roles);
          }
        }

        if (!Array.isArray(list)) return;

        const mapped: StaffMember[] = list.map((item: any, index: number) => {
          const statusRaw = String(item?.status ?? 'Active');
          const status: 'Active' | 'Inactive' = statusRaw === 'Inactive' ? 'Inactive' : 'Active';

          return {
            id: String(item?.id ?? item?._id ?? `s-${index + 1}`),
            fullName: item?.full_name ?? item?.fullName ?? '',
            fatherName: item?.father_name ?? item?.fatherName ?? '',
            role: item?.role ?? 'Other',
            gender: item?.gender ?? 'Male',
            monthlySalary: Number(item?.monthly_salary ?? item?.monthlySalary ?? 0) || 0,
            joinDate: item?.join_date ?? item?.joinDate ?? '',
            phone: item?.phone ?? '',
            cnic: item?.cnic ?? '',
            dateOfBirth: item?.date_of_birth ?? item?.dateOfBirth ?? '',
            qualification: item?.qualification ?? '',
            address: item?.address ?? '',
            notes: item?.notes ?? '',
            status,
            inactiveDate: item?.inactive_date ?? item?.inactiveDate,
            inactiveReason: item?.inactive_reason ?? item?.inactiveReason,
          };
        });

        setStaff(mapped);
      } catch {
        // If backend is unavailable, keep initial demo data
      }
    };

    loadStaffFromApi();
  }, [authToken]);

  useEffect(() => {
    const loadSalariesFromApi = async () => {
      try {
        const headers: HeadersInit = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/salaries`, { headers });
        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray((data as any)?.salaries)
          ? (data as any).salaries
          : Array.isArray((data as any)?.salary)
          ? (data as any).salary
          : Array.isArray(data)
          ? data
          : [];

        if (!Array.isArray(list)) return;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const mapped: SalaryRecord[] = list.map((item: any, index: number) => {
          const rawMonth = item?.month;
          const month =
            typeof rawMonth === 'number'
              ? monthNames[rawMonth - 1] ?? 'January'
              : typeof rawMonth === 'string'
              ? rawMonth
              : 'January';

          const rawStatus = item?.status;
          const status: 'Payable' | 'Paid' =
            rawStatus === 'Payable' || rawStatus === 'Paid'
              ? rawStatus
              : item?.payment_date || item?.paymentDate
              ? 'Paid'
              : 'Payable';

          return {
            id: String(item?.id ?? item?._id ?? `sal-${index + 1}`),
            staffId: String(item?.staff_id ?? item?.staffId ?? ''),
            month,
            year: Number(item?.year ?? new Date().getFullYear()),
            amount: Number(item?.amount ?? 0),
            status,
            paymentDate: item?.payment_date ?? item?.paymentDate ?? '',
            paymentMethod: item?.payment_method ?? item?.paymentMethod ?? 'Cash',
            receiptNumber: item?.receipt_number ?? item?.receiptNumber ?? '',
            notes: item?.notes ?? '',
          };
        }).filter(r => !!r.staffId);

        setSalaryRecords(mapped);
      } catch {
        // If backend is unavailable, keep initial demo data
      }
    };

    loadSalariesFromApi();
  }, [authToken]);

  useEffect(() => {
    const loadExpensesFromApi = async () => {
      try {
        const headers: HeadersInit = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/expenses`, { headers });
        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray((data as any)?.expenses)
          ? (data as any).expenses
          : Array.isArray(data)
          ? data
          : [];

        if (!Array.isArray(list)) return;

        const mapped: Expense[] = list.map((item: any, index: number) => ({
          id: String(item?.id ?? item?._id ?? `exp-${index + 1}`),
          date: item?.date ?? '',
          category: item?.category ?? 'Other',
          description: item?.description ?? '',
          amount: Number(item?.amount ?? 0) || 0,
          paymentMethod: item?.payment_method ?? item?.paymentMethod ?? 'Cash',
          paidTo: item?.paid_to ?? item?.paidTo ?? '',
          receiptRef: item?.receipt_ref ?? item?.receiptRef ?? '',
          recordedBy: item?.recorded_by_name ?? item?.recorded_by ?? item?.recordedBy ?? 'Admin',
          notes: item?.notes ?? '',
        }));

        setExpenses(mapped);
      } catch {
        // If backend is unavailable, keep initial demo data
      }
    };

    loadExpensesFromApi();
  }, [authToken]);

  useEffect(() => {
    const loadFeesFromApi = async () => {
      try {
        const headers: HeadersInit = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/fees`, { headers });
        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.fees)
          ? (data as any).fees
          : Array.isArray((data as any)?.data?.fees)
          ? (data as any).data.fees
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : (data as any)?.fee
          ? [(data as any).fee]
          : [];

        if (!Array.isArray(list)) return;

        const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const mapped: FeeRecord[] = list.map((item: any) => {
          const id = String(item.id ?? item._id ?? `f-${Date.now()}`);
          const studentId = String(item.student_id ?? item.studentId ?? '');
          const monthVal = item.month ?? item.month_num ?? 3;
          const monthName = typeof monthVal === 'number' ? (MONTHS[monthVal - 1] ?? 'Unknown') : monthVal;
          const year = Number(item.year ?? 2025);
          const monthlyFee = Number(item.monthly_fee ?? item.monthlyFee ?? 0);
          const prevBalance = Number(item.prev_balance ?? item.prevBalance ?? 0);
          const totalDue = Number(item.total_due ?? item.totalDue ?? monthlyFee + prevBalance);
          const paidAmount = Number(item.paid_amount ?? item.paidAmount ?? 0);
          const balanceRemaining = Number(item.balance_remaining ?? item.balanceRemaining ?? Math.max(0, totalDue - paidAmount));
          const status = (item.status ?? 'Unpaid') as FeeRecord['status'];

          return {
            id,
            studentId,
            month: monthName,
            year,
            monthlyFee,
            prevBalance,
            totalDue,
            paidAmount,
            balanceRemaining,
            status,
            paymentDate: item.payment_date ?? item.paymentDate,
            paymentMethod: item.payment_method ?? item.paymentMethod,
            receiptNumber: item.receipt_number ?? item.receiptNumber,
            notes: item.notes,
          };
        });

        setFeeRecords(mapped);
      } catch {
        // If backend is unavailable, keep initial demo data
      }
    };

    loadFeesFromApi();
  }, [authToken]);

  return (
    <AppContext.Provider value={{ students, setStudents, feeRecords, setFeeRecords, isLoggedIn, setIsLoggedIn, userId, setUserId, userEmail, setUserEmail, userRole, setUserRole, userName, setUserName, authToken, setAuthToken, staff, setStaff, staffRoles, setStaffRoles, salaryRecords, setSalaryRecords, expenses, setExpenses }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
};
