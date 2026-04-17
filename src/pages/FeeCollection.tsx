import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatRs, generateReceiptNumber, MONTHS, FeeRecord } from '@/data/students';
import { Plus, Receipt, DollarSign, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, X, CheckCircle, Search, RotateCcw } from 'lucide-react';

type ClassOption = {
  id: string;
  name: string;
};

const API_BASE_URL = 'http://localhost:4000/api/v1';

const MONTH_TO_NUM: Record<string, number> = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
  'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12,
};

const MONTHS_LOWER = MONTHS.map(m => m.toLowerCase());

const normalizeFeeRecord = (item: any, fallbackMonth: string, fallbackYear: number): FeeRecord | null => {
  if (!item) return null;
  const id = String(item?.id ?? item?._id ?? '');
  const studentId = String(item?.student_id ?? item?.studentId ?? '');
  if (!id || !studentId) return null;

  const monthVal = item?.month ?? fallbackMonth;
  let monthName = fallbackMonth;
  if (typeof monthVal === 'number') {
    monthName = MONTHS[monthVal - 1] ?? fallbackMonth;
  } else if (typeof monthVal === 'string') {
    const idx = MONTHS_LOWER.indexOf(monthVal.toLowerCase());
    monthName = idx >= 0 ? MONTHS[idx] : monthVal;
  }

  const year = Number(item?.year ?? fallbackYear);
  const monthlyFee = Number(item?.monthly_fee ?? item?.monthlyFee ?? 0);
  const paidAmount = Number(item?.paid_amount ?? item?.paidAmount ?? 0);
  const prevBalance = Number(item?.prev_balance ?? item?.prevBalance ?? 0);
  const totalDue = Number(item?.total_due ?? item?.totalDue ?? monthlyFee + prevBalance);
  const balanceRemaining = Number(item?.balance_remaining ?? item?.balanceRemaining ?? Math.max(0, totalDue - paidAmount));
  const status = (item?.status ?? 'Unpaid') as FeeRecord['status'];

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
    paymentDate: item?.payment_date ?? item?.paymentDate,
    paymentMethod: item?.payment_method ?? item?.paymentMethod,
    receiptNumber: item?.receipt_number ?? item?.receiptNumber,
    notes: item?.notes,
  };
};

const extractFeeFromResponse = (data: any): any => {
  if (!data || typeof data !== 'object') return null;
  return data.fee ?? data?.data?.fee ?? data?.data ?? data;
};

const FEE_STRUCTURE_SUMMARY = [
   { cls: 'KG', students: 0, stdFee: 1300, avgFee: 1300 },
  { cls: 'Nursery', students: 0, stdFee: 1400, avgFee: 1400 },
  { cls: 'Prep', students: 0, stdFee: 1400, avgFee: 1400 },
  { cls: 'Class 1-2', students: 0, stdFee: 1500, avgFee: 1500 },
  { cls: 'Class 3-4', students: 0, stdFee: 1600, avgFee: 1600 },
  { cls: 'Class 5-6', students: 0, stdFee: 1700, avgFee: 1700 },
  { cls: 'Class 7', students: 0, stdFee: 1800, avgFee: 1800 },
  { cls: 'Class 8', students: 0, stdFee: 2000, avgFee: 2000 },
  { cls: 'Class 9', students: 0, stdFee: 2500, avgFee: 2500 },
  { cls: 'Class 10', students: 0, stdFee: 2700, avgFee: 2700 },
];

const FeeCollection: React.FC = () => {
  const { students, feeRecords, setFeeRecords, userRole, authToken } = useAppContext();
  const activeStudents = students.filter(s => s.status === 'Active');
  const isTeacher = userRole === 'teacher';

  const [selectedMonth, setSelectedMonth] = useState('March');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFeeStructure, setShowFeeStructure] = useState(false);
  const [paymentStudentId, setPaymentStudentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentMonth, setPaymentMonth] = useState('March');
  const [paymentYear, setPaymentYear] = useState(2025);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState({ name: '', amount: 0, balance: 0, receipt: '' });
  const [isBalancePayment, setIsBalancePayment] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilterId, setClassFilterId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Payment modal filters
  const [paymentClassId, setPaymentClassId] = useState<string>('');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isFeesLoading, setIsFeesLoading] = useState(false);

  const classNameById = useMemo(() => new Map(classes.map(c => [c.id, c.name] as const)), [classes]);
  const selectedClassName = classFilterId ? classNameById.get(classFilterId) : undefined;
  const paymentClassName = paymentClassId ? classNameById.get(paymentClassId) : undefined;

  useEffect(() => {
    const controller = new AbortController();

    const loadClasses = async () => {
      try {
        const headers: HeadersInit = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch(`${API_BASE_URL}/classes`, { signal: controller.signal, headers });
        if (!response.ok) {
          setClasses([]);
          return;
        }

        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.classes)
          ? (data as any).classes
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];

        const mapped: ClassOption[] = (Array.isArray(list) ? list : [])
          .map((item: any) => {
            const rawId = item?.id ?? item?._id ?? item?.class_id ?? item?.value;
            if (rawId == null) return null;
            const id = String(rawId);
            const name =
              item?.name ??
              item?.class_name ??
              item?.title ??
              item?.label ??
              (typeof item?.class_number === 'number' ? `Class ${item.class_number}` : undefined) ??
              (typeof item?.class === 'string' ? item.class : undefined) ??
              `Class ${id}`;
            return { id, name: String(name) };
          })
          .filter(Boolean) as ClassOption[];

        setClasses(mapped);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        setClasses([]);
      }
    };

    loadClasses();
    return () => controller.abort();
  }, [authToken]);

  useEffect(() => {
    const controller = new AbortController();

    const loadFeesForMonth = async () => {
      try {
        setIsFeesLoading(true);
        const monthNum = MONTH_TO_NUM[selectedMonth] ?? new Date().getMonth() + 1;
        const params = new URLSearchParams();
        params.set('month', String(monthNum));
        params.set('year', String(selectedYear));

        const headers: HeadersInit = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch(`${API_BASE_URL}/fees?${params.toString()}`, {
          signal: controller.signal,
          headers,
        });

        if (!response.ok) {
          setIsFeesLoading(false);
          return;
        }

        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.fees)
          ? (data as any).fees
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];

        const mapped: FeeRecord[] = (Array.isArray(list) ? list : [])
          .map((item: any) => normalizeFeeRecord(item, selectedMonth, selectedYear))
          .filter(Boolean) as FeeRecord[];

        setFeeRecords(mapped);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
      } finally {
        setIsFeesLoading(false);
      }
    };

    loadFeesForMonth();
    return () => controller.abort();
  }, [selectedMonth, selectedYear, authToken]);

  const [studentFilterIds, setStudentFilterIds] = useState<Set<string> | null>(null);
  const [isStudentFilterLoading, setIsStudentFilterLoading] = useState(false);
  const [studentFilterError, setStudentFilterError] = useState<string | null>(null);

  const allRecordsForMonth = useMemo(() => {
    return feeRecords.filter(r => r.month === selectedMonth && r.year === selectedYear);
  }, [feeRecords, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!searchQuery && !classFilterId) {
      setStudentFilterIds(null);
      setStudentFilterError(null);
      return;
    }

    const controller = new AbortController();

    const fetchFilteredStudents = async () => {
      try {
        setIsStudentFilterLoading(true);
        setStudentFilterError(null);

        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);

        if (classFilterId) params.set('class_id', classFilterId);

        const qs = params.toString();
        if (!qs) {
          setStudentFilterIds(null);
          return;
        }

        const url = `${API_BASE_URL}/students?${qs}`;
        const headers: HeadersInit = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch(url, { signal: controller.signal, headers });
        if (!response.ok) {
          setStudentFilterError('Unable to apply server-side student filters. Showing local results.');
          setStudentFilterIds(null);
          return;
        }

        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.students)
          ? (data as any).students
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];

        if (!Array.isArray(list)) {
          setStudentFilterIds(null);
          return;
        }

        const ids = new Set<string>();
        list.forEach((item: any) => {
          const id = item?.id ?? item?._id;
          if (id != null) ids.add(String(id));
        });

        setStudentFilterIds(ids.size > 0 ? ids : null);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        setStudentFilterError('Unable to apply server-side student filters. Showing local results.');
        setStudentFilterIds(null);
      } finally {
        setIsStudentFilterLoading(false);
      }
    };

    fetchFilteredStudents();

    return () => controller.abort();
  }, [searchQuery, classFilterId, authToken]);

  const currentRecords = useMemo(() => {
    return allRecordsForMonth.filter(r => {
      const student = students.find(s => s.id === r.studentId);
      if (!student) return false;
      if (studentFilterIds && !studentFilterIds.has(student.id)) return false;
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!student.fullName.toLowerCase().includes(q) && !student.fatherName.toLowerCase().includes(q)) return false;
      }
      // Class filter (best-effort local match; the server-filtered ID set is the source of truth)
      if (selectedClassName && student.studentClass && student.studentClass !== selectedClassName) return false;
      // Status filter
      if (statusFilter !== 'All Status' && r.status !== statusFilter) return false;
      return true;
    });
  }, [allRecordsForMonth, students, studentFilterIds, searchQuery, selectedClassName, statusFilter]);

  const stats = useMemo(() => {
    const expected = allRecordsForMonth.reduce((s, r) => s + r.monthlyFee, 0);
    const collected = allRecordsForMonth.reduce((s, r) => s + r.paidAmount, 0);
    const outstanding = allRecordsForMonth.filter(r => r.status === 'Unpaid').reduce((s, r) => s + r.totalDue, 0);
    const pending = allRecordsForMonth.filter(r => r.status === 'Partial').reduce((s, r) => s + r.balanceRemaining, 0);
    return { expected, collected, outstanding, pending };
  }, [allRecordsForMonth]);

  const filteredStatusCounts = useMemo(() => {
    const paid = currentRecords.filter(r => r.status === 'Paid').length;
    const partial = currentRecords.filter(r => r.status === 'Partial').length;
    const unpaid = currentRecords.filter(r => r.status === 'Unpaid').length;
    return { paid, partial, unpaid };
  }, [currentRecords]);

  const hasActiveFilters = searchQuery || !!classFilterId || statusFilter !== 'All Status';

  const resetFilters = () => {
    setSearchQuery('');
    setClassFilterId('');
    setStatusFilter('All Status');
  };

  const selectedStudent = students.find(s => s.id === paymentStudentId);
  const existingRecord = feeRecords.find(r => r.studentId === paymentStudentId && r.month === paymentMonth && r.year === paymentYear);
  const totalDue = selectedStudent ? (selectedStudent.discountedFee + (existingRecord?.prevBalance || 0) - (isBalancePayment ? (existingRecord?.paidAmount || 0) : 0)) : 0;
  const payingNow = parseInt(paymentAmount) || 0;
  const balanceAfter = totalDue - payingNow;

  const filteredPaymentStudents = useMemo(() => {
    return activeStudents.filter(s => {
      if (paymentClassName && s.studentClass !== paymentClassName) return false;
      if (paymentSearchQuery) {
        const q = paymentSearchQuery.toLowerCase();
        if (!s.fullName.toLowerCase().includes(q) && !s.fatherName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [activeStudents, paymentClassName, paymentSearchQuery]);

  const openPayment = (studentId?: string, balance?: boolean) => {
    setPaymentStudentId(studentId || '');
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setPaymentMonth(selectedMonth);
    setPaymentYear(selectedYear);
    setIsBalancePayment(!!balance);
    setPaymentClassId('');
    setPaymentSearchQuery('');
    setShowPaymentModal(true);

    if (balance && studentId) {
      const rec = feeRecords.find(r => r.studentId === studentId && r.month === selectedMonth && r.year === selectedYear);
      if (rec) setPaymentAmount(String(rec.balanceRemaining));
    }
  };

  const savePayment = async () => {
    if (isTeacher) return;
    if (!paymentStudentId || payingNow <= 0) return;
    const student = students.find(s => s.id === paymentStudentId)!;
    const receiptNum = generateReceiptNumber();

    const monthNum = MONTH_TO_NUM[paymentMonth] ?? new Date().getMonth() + 1;

    try {
      if (existingRecord) {
        const newPaid = existingRecord.paidAmount + payingNow;
        const newBalance = existingRecord.totalDue - newPaid;
        const newStatus: FeeRecord['status'] = newBalance <= 0 ? 'Paid' : 'Partial';

        const payload = {
          paidAmount: payingNow,
          paymentDate: paymentDate,
          paymentMethod: paymentMethod,
          notes: paymentNotes || existingRecord.notes,
        };

        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch(`${API_BASE_URL}/fees/${existingRecord.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const updated = await response.json().catch(() => ({} as any));
          const normalized = normalizeFeeRecord(extractFeeFromResponse(updated), paymentMonth, paymentYear);
          const convertedRecord: FeeRecord = normalized ?? {
            ...existingRecord,
            paidAmount: newPaid,
            balanceRemaining: Math.max(0, newBalance),
            status: newStatus,
            paymentDate: paymentDate,
            paymentMethod: paymentMethod,
            receiptNumber: existingRecord.receiptNumber ?? receiptNum,
            notes: paymentNotes || existingRecord.notes,
          };
          setFeeRecords(prev => prev.map(r => r.id === existingRecord.id ? convertedRecord : r));
          setLastReceipt({ name: student.fullName, amount: payingNow, balance: convertedRecord.balanceRemaining, receipt: convertedRecord.receiptNumber || receiptNum });
        } else {
          setFeeRecords(prev => prev.map(r => r.id === existingRecord.id ? {
            ...r, paidAmount: newPaid, balanceRemaining: Math.max(0, newBalance), status: newStatus,
            paymentDate: paymentDate, paymentMethod: paymentMethod, receiptNumber: receiptNum, notes: paymentNotes || r.notes,
          } : r));
          setLastReceipt({ name: student.fullName, amount: payingNow, balance: Math.max(0, newBalance), receipt: receiptNum });
        }
      } else {
        const prevBal = existingRecord?.prevBalance || 0;
        const due = student.discountedFee + prevBal;
        const bal = due - payingNow;
        const status: FeeRecord['status'] = bal <= 0 ? (payingNow > due ? 'Advance' : 'Paid') : payingNow > 0 ? 'Partial' : 'Unpaid';

        const payload = {
          studentId: paymentStudentId,
          month: monthNum,
          year: paymentYear,
          paidAmount: payingNow,
          paymentDate: paymentDate,
          paymentMethod: paymentMethod,
          notes: paymentNotes,
        };

        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch(`${API_BASE_URL}/fees`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const created = await response.json().catch(() => ({} as any));
          const normalized = normalizeFeeRecord(extractFeeFromResponse(created), paymentMonth, paymentYear);
          if (normalized) {
            setFeeRecords(prev => {
              const withoutDuplicate = prev.filter(r => !(r.studentId === normalized.studentId && r.month === normalized.month && r.year === normalized.year));
              return [...withoutDuplicate, normalized];
            });
            setLastReceipt({ name: student.fullName, amount: payingNow, balance: normalized.balanceRemaining, receipt: normalized.receiptNumber || receiptNum });
          } else {
            const newRecord: FeeRecord = {
              id: `f-${Date.now()}`,
              studentId: paymentStudentId,
              month: paymentMonth,
              year: paymentYear,
              monthlyFee: student.discountedFee,
              prevBalance: prevBal,
              totalDue: due,
              paidAmount: payingNow,
              balanceRemaining: Math.max(0, bal),
              status,
              paymentDate,
              paymentMethod,
              receiptNumber: receiptNum,
              notes: paymentNotes,
            };
            setFeeRecords(prev => [...prev, newRecord]);
            setLastReceipt({ name: student.fullName, amount: payingNow, balance: Math.max(0, bal), receipt: receiptNum });
          }
        } else {
          const newRecord: FeeRecord = {
            id: `f-${Date.now()}`,
            studentId: paymentStudentId,
            month: paymentMonth,
            year: paymentYear,
            monthlyFee: student.discountedFee,
            prevBalance: prevBal,
            totalDue: due,
            paidAmount: payingNow,
            balanceRemaining: Math.max(0, bal),
            status,
            paymentDate,
            paymentMethod,
            receiptNumber: receiptNum,
            notes: paymentNotes,
          };
          setFeeRecords(prev => [...prev, newRecord]);
          setLastReceipt({ name: student.fullName, amount: payingNow, balance: Math.max(0, bal), receipt: receiptNum });
        }
      }
    } catch (err) {
      console.error('Error saving payment:', err);
      const prevBal = existingRecord?.prevBalance || 0;
      const due = student.discountedFee + prevBal;
      const bal = due - payingNow;
      const status: FeeRecord['status'] = bal <= 0 ? (payingNow > due ? 'Advance' : 'Paid') : payingNow > 0 ? 'Partial' : 'Unpaid';
      
      if (existingRecord && isBalancePayment) {
        const newPaid = existingRecord.paidAmount + payingNow;
        const newBalance = existingRecord.totalDue - newPaid;
        const newStatus: FeeRecord['status'] = newBalance <= 0 ? (newPaid > existingRecord.totalDue ? 'Advance' : 'Paid') : 'Partial';
        setFeeRecords(prev => prev.map(r => r.id === existingRecord.id ? {
          ...r, paidAmount: newPaid, balanceRemaining: Math.max(0, newBalance), status: newStatus,
          paymentDate: paymentDate, paymentMethod: paymentMethod, receiptNumber: receiptNum, notes: paymentNotes || r.notes,
        } : r));
        setLastReceipt({ name: student.fullName, amount: payingNow, balance: Math.max(0, newBalance), receipt: receiptNum });
      } else if (existingRecord) {
        const newRecord: FeeRecord = {
          ...existingRecord,
          monthlyFee: student.discountedFee,
          prevBalance: prevBal,
          totalDue: due,
          paidAmount: payingNow,
          balanceRemaining: Math.max(0, bal),
          status,
          paymentDate,
          paymentMethod,
          receiptNumber: receiptNum,
          notes: paymentNotes,
        };
        setFeeRecords(prev => prev.map(r => r.id === existingRecord.id ? newRecord : r));
        setLastReceipt({ name: student.fullName, amount: payingNow, balance: Math.max(0, bal), receipt: receiptNum });
      } else {
        const newRecord: FeeRecord = {
          id: `f-${Date.now()}`,
          studentId: paymentStudentId,
          month: paymentMonth,
          year: paymentYear,
          monthlyFee: student.discountedFee,
          prevBalance: prevBal,
          totalDue: due,
          paidAmount: payingNow,
          balanceRemaining: Math.max(0, bal),
          status,
          paymentDate,
          paymentMethod,
          receiptNumber: receiptNum,
          notes: paymentNotes,
        };
        setFeeRecords(prev => [...prev, newRecord]);
        setLastReceipt({ name: student.fullName, amount: payingNow, balance: Math.max(0, bal), receipt: receiptNum });
      }
    }

    setShowPaymentModal(false);
    setShowReceipt(true);
  };

  const statCards = [
    { label: 'Expected This Month', value: stats.expected, icon: DollarSign, color: 'bg-primary/10 text-primary' },
    { label: 'Collected', value: stats.collected, icon: TrendingUp, color: 'bg-success/10 text-success' },
    { label: 'Outstanding', value: stats.outstanding, icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
    { label: 'Pending Balances', value: stats.pending, icon: Receipt, color: 'bg-warning/10 text-warning' },
  ];

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Paid: 'bg-success/10 text-success', Partial: 'bg-warning/10 text-warning',
      Unpaid: 'bg-destructive/10 text-destructive', Advance: 'bg-primary/10 text-primary',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>{status}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Teacher info banner */}
      {isTeacher && (
        <div className="bg-muted border border-border rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
          <span className="text-muted-foreground text-sm">ℹ️ You have view-only access to fee records</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-foreground">Fee Collection</h1>
        <div className="flex flex-wrap gap-2">
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none">
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none">
            <option>2024</option><option>2025</option><option>2026</option>
          </select>
          {!isTeacher && (
            <button onClick={() => openPayment()} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus size={16} /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{formatRs(s.value)}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none"
              placeholder="Search student name or father name..."
            />
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select value={classFilterId} onChange={e => setClassFilterId(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none">
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none">
              <option>All Status</option>
              <option>Paid</option>
              <option>Partial</option>
              <option>Unpaid</option>
              <option>Advance</option>
            </select>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">
                <RotateCcw size={14} /> Reset Filters
              </button>
            )}
          </div>
        </div>
        {/* Results summary */}
        <p className="text-xs text-muted-foreground mt-3">
          Showing {currentRecords.length} of {allRecordsForMonth.length} students — {filteredStatusCounts.paid} Paid, {filteredStatusCounts.partial} Partial, {filteredStatusCounts.unpaid} Unpaid
        </p>
        {isStudentFilterLoading && (
          <p className="text-[11px] text-muted-foreground mt-1">Applying server filters...</p>
        )}
        {studentFilterError && (
          <p className="text-[11px] text-destructive mt-1">{studentFilterError}</p>
        )}
      </div>

      {/* Fee Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {['#', 'Student', 'Father', 'Monthly Fee', 'Prev Balance', 'Total Due', 'Paid', 'Balance', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-3 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Search size={24} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No records match your search</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your filters or search term</p>
                      {hasActiveFilters && (
                        <button onClick={resetFilters} className="mt-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : currentRecords.map((r, i) => {
                const student = students.find(s => s.id === r.studentId);
                if (!student) return null;
                return (
                  <tr key={r.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-3">
                      <span className="font-medium text-foreground">{student.fullName}</span>
                      <br /><span className="text-xs text-muted-foreground">{student.studentClass}</span>
                    </td>
                    <td className="px-3 py-3 text-foreground">{student.fatherName}</td>
                    <td className="px-3 py-3 font-medium text-primary">{formatRs(r.monthlyFee)}</td>
                    <td className="px-3 py-3"><span className={r.prevBalance > 0 ? 'text-warning font-medium' : 'text-muted-foreground'}>{formatRs(r.prevBalance)}</span></td>
                    <td className="px-3 py-3 font-medium text-foreground">{formatRs(r.totalDue)}</td>
                    <td className="px-3 py-3 text-foreground">{formatRs(r.paidAmount)}</td>
                    <td className="px-3 py-3">
                      <span className={r.balanceRemaining > 0 ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                        {formatRs(r.balanceRemaining)}
                      </span>
                    </td>
                    <td className="px-3 py-3">{statusBadge(r.status)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {!isTeacher && r.status === 'Unpaid' && (
                          <button onClick={() => openPayment(r.studentId)} className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors">Collect Fee</button>
                        )}
                        {!isTeacher && r.status === 'Partial' && (
                          <button onClick={() => openPayment(r.studentId, true)} className="px-2 py-1 bg-warning text-warning-foreground rounded text-xs hover:bg-warning/90 transition-colors">Pay Balance</button>
                        )}
                        {r.status === 'Advance' && (
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">Advance</span>
                        )}
                        {r.receiptNumber && (
                          <button className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs hover:bg-muted/80 transition-colors">Receipt</button>
                        )}
                        {isTeacher && !r.receiptNumber && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">View</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Structure Collapsible */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <button onClick={() => setShowFeeStructure(!showFeeStructure)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors">
          Class Fee Structure 2025
          {showFeeStructure ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showFeeStructure && (
          <div className="px-4 pb-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">Class</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Students</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Std Fee</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Avg After Discount</th>
              </tr></thead>
              <tbody>
                {FEE_STRUCTURE_SUMMARY.map(f => (
                  <tr key={f.cls} className="border-b border-border"><td className="py-2 text-foreground">{f.cls}</td><td className="py-2 text-right text-foreground">{f.students}</td><td className="py-2 text-right text-foreground">{formatRs(f.stdFee)}</td><td className="py-2 text-right text-primary font-medium">{formatRs(f.avgFee)}</td></tr>
                ))}
                <tr className="font-bold"><td className="py-2 text-foreground">Total</td><td className="py-2 text-right text-foreground">32</td><td colSpan={2} className="py-2 text-right text-primary">Expected: {formatRs(42000)}/month</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{isBalancePayment ? `Collect Remaining Balance` : 'Record Fee Payment'}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-muted rounded-lg"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Filter by Class</label>
                  <select
                    value={paymentClassId}
                    onChange={e => {
                      setPaymentClassId(e.target.value);
                      setPaymentStudentId('');
                    }}
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Search by Name</label>
                <div className="relative mt-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={paymentSearchQuery} onChange={e => { setPaymentSearchQuery(e.target.value); setPaymentStudentId(''); }} placeholder="Student or father name..." className="w-full pl-8 pr-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Student <span className="text-muted-foreground font-normal">({filteredPaymentStudents.length} found)</span></label>
                <select value={paymentStudentId} onChange={e => setPaymentStudentId(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1">
                  <option value="">Select Student</option>
                  {filteredPaymentStudents.map(s => <option key={s.id} value={s.id}>{s.fullName} — {s.studentClass}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Month</label>
                  <select value={paymentMonth} onChange={e => setPaymentMonth(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1">
                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Year</label>
                  <select value={paymentYear} onChange={e => setPaymentYear(parseInt(e.target.value))} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1">
                    <option>2024</option><option>2025</option><option>2026</option>
                  </select>
                </div>
              </div>

              {selectedStudent && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm space-y-1">
                  <p className="font-semibold text-foreground">{selectedStudent.fullName} — {selectedStudent.studentClass}</p>
                  <p className="text-muted-foreground">Father: {selectedStudent.fatherName}</p>
                  <p className="text-muted-foreground">Monthly Fee: <span className="text-primary font-medium">{formatRs(selectedStudent.discountedFee)}</span></p>
                  <p className="text-muted-foreground">Previous Balance: <span className={existingRecord?.prevBalance ? 'text-warning font-medium' : ''}>{formatRs(existingRecord?.prevBalance || 0)}</span></p>
                  <p className="font-medium text-foreground">Total Due: {formatRs(totalDue)}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground">Amount Receiving (Rs.)</label>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full px-3 py-3 border border-input rounded-lg text-lg font-bold bg-card focus:ring-2 focus:ring-primary outline-none mt-1" placeholder="0" />
              </div>

              {selectedStudent && payingNow > 0 && (
                <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Due:</span><span className="text-foreground">{formatRs(totalDue)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Paying Now:</span><span className="text-foreground font-medium">{formatRs(payingNow)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1">
                    <span className="text-muted-foreground">{balanceAfter > 0 ? 'Balance After:' : balanceAfter < 0 ? 'Advance Credit:' : 'Balance After:'}</span>
                    <span className={`font-bold ${balanceAfter > 0 ? 'text-destructive' : balanceAfter < 0 ? 'text-primary' : 'text-success'}`}>
                      {balanceAfter > 0 ? formatRs(balanceAfter) : balanceAfter < 0 ? formatRs(Math.abs(balanceAfter)) : `${formatRs(0)} — Fully Paid`}
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${balanceAfter > 0 ? 'text-warning' : balanceAfter < 0 ? 'text-primary' : 'text-success'}`}>
                    {balanceAfter > 0 ? 'Partial Payment' : balanceAfter < 0 ? 'Advance Payment' : 'Full Payment'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Payment Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1">
                    <option>Cash</option><option>Bank Transfer</option><option>Online</option><option>Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Notes</label>
                <textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1 resize-none" rows={2} placeholder="e.g. Will pay remaining next week" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">Cancel</button>
                <button onClick={savePayment} disabled={!paymentStudentId || payingNow <= 0} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40">Save Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center"><CheckCircle className="text-success" size={24} /></div>
              <h3 className="text-lg font-bold text-foreground">Payment Recorded ✓</h3>
            </div>
            <div className="bg-muted rounded-lg p-4 text-sm space-y-2 mb-4">
              <p><span className="text-muted-foreground">Student:</span> <span className="font-medium text-foreground">{lastReceipt.name}</span></p>
              <p><span className="text-muted-foreground">Amount Paid:</span> <span className="font-bold text-primary">{formatRs(lastReceipt.amount)}</span></p>
              <p><span className="text-muted-foreground">Balance Due:</span> <span className={`font-medium ${lastReceipt.balance > 0 ? 'text-destructive' : 'text-success'}`}>{formatRs(lastReceipt.balance)}</span></p>
              <p><span className="text-muted-foreground">Receipt:</span> <span className="font-medium text-foreground">{lastReceipt.receipt}</span></p>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">Print Receipt</button>
              <button onClick={() => setShowReceipt(false)} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCollection;
