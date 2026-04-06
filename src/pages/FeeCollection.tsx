import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatRs, formatDate, generateReceiptNumber, MONTHS, FeeRecord, CLASS_OPTIONS } from '@/data/students';
import { Plus, Receipt, DollarSign, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, X, CheckCircle, Search, RotateCcw } from 'lucide-react';

const FEE_STRUCTURE_SUMMARY = [
  { cls: 'Nursery', students: 3, stdFee: 800, avgFee: 800 },
  { cls: 'KG', students: 4, stdFee: 1000, avgFee: 950 },
  { cls: 'Class 1-3', students: 8, stdFee: 1200, avgFee: 1100 },
  { cls: 'Class 4-6', students: 7, stdFee: 1500, avgFee: 1350 },
  { cls: 'Class 7-8', students: 6, stdFee: 1800, avgFee: 1575 },
  { cls: 'Class 9-10', students: 4, stdFee: 2000, avgFee: 2000 },
];

const FeeCollection: React.FC = () => {
  const { students, feeRecords, setFeeRecords, userRole } = useAppContext();
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
  const [classFilter, setClassFilter] = useState('All Classes');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Payment modal filters
  const [paymentClassFilter, setPaymentClassFilter] = useState('All Classes');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');

  const allRecordsForMonth = useMemo(() => {
    return feeRecords.filter(r => r.month === selectedMonth && r.year === selectedYear);
  }, [feeRecords, selectedMonth, selectedYear]);

  const currentRecords = useMemo(() => {
    return allRecordsForMonth.filter(r => {
      const student = students.find(s => s.id === r.studentId);
      if (!student) return false;
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!student.fullName.toLowerCase().includes(q) && !student.fatherName.toLowerCase().includes(q)) return false;
      }
      // Class filter
      if (classFilter !== 'All Classes' && student.studentClass !== classFilter) return false;
      // Status filter
      if (statusFilter !== 'All Status' && r.status !== statusFilter) return false;
      return true;
    });
  }, [allRecordsForMonth, students, searchQuery, classFilter, statusFilter]);

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

  const hasActiveFilters = searchQuery || classFilter !== 'All Classes' || statusFilter !== 'All Status';

  const resetFilters = () => {
    setSearchQuery('');
    setClassFilter('All Classes');
    setStatusFilter('All Status');
  };

  const selectedStudent = students.find(s => s.id === paymentStudentId);
  const existingRecord = feeRecords.find(r => r.studentId === paymentStudentId && r.month === paymentMonth && r.year === paymentYear);
  const totalDue = selectedStudent ? (selectedStudent.discountedFee + (existingRecord?.prevBalance || 0) - (isBalancePayment ? (existingRecord?.paidAmount || 0) : 0)) : 0;
  const payingNow = parseInt(paymentAmount) || 0;
  const balanceAfter = totalDue - payingNow;

  const filteredPaymentStudents = useMemo(() => {
    return activeStudents.filter(s => {
      if (paymentClassFilter !== 'All Classes' && s.studentClass !== paymentClassFilter) return false;
      if (paymentSearchQuery) {
        const q = paymentSearchQuery.toLowerCase();
        if (!s.fullName.toLowerCase().includes(q) && !s.fatherName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [activeStudents, paymentClassFilter, paymentSearchQuery]);

  const openPayment = (studentId?: string, balance?: boolean) => {
    setPaymentStudentId(studentId || '');
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setPaymentMonth(selectedMonth);
    setPaymentYear(selectedYear);
    setIsBalancePayment(!!balance);
    setPaymentClassFilter('All Classes');
    setPaymentSearchQuery('');
    setShowPaymentModal(true);

    if (balance && studentId) {
      const rec = feeRecords.find(r => r.studentId === studentId && r.month === selectedMonth && r.year === selectedYear);
      if (rec) setPaymentAmount(String(rec.balanceRemaining));
    }
  };

  const savePayment = () => {
    if (!paymentStudentId || payingNow <= 0) return;
    const student = students.find(s => s.id === paymentStudentId)!;
    const receiptNum = generateReceiptNumber();

    if (existingRecord && isBalancePayment) {
      const newPaid = existingRecord.paidAmount + payingNow;
      const newBalance = existingRecord.totalDue - newPaid;
      const newStatus: FeeRecord['status'] = newBalance <= 0 ? (newPaid > existingRecord.totalDue ? 'Advance' : 'Paid') : 'Partial';
      setFeeRecords(prev => prev.map(r => r.id === existingRecord.id ? {
        ...r, paidAmount: newPaid, balanceRemaining: Math.max(0, newBalance), status: newStatus,
        paymentDate: paymentDate, paymentMethod: paymentMethod, receiptNumber: receiptNum, notes: paymentNotes || r.notes,
      } : r));
      setLastReceipt({ name: student.fullName, amount: payingNow, balance: Math.max(0, newBalance), receipt: receiptNum });
    } else {
      const prevBal = existingRecord?.prevBalance || 0;
      const due = student.discountedFee + prevBal;
      const bal = due - payingNow;
      const status: FeeRecord['status'] = bal <= 0 ? (payingNow > due ? 'Advance' : 'Paid') : payingNow > 0 ? 'Partial' : 'Unpaid';
      const newRecord: FeeRecord = {
        id: `f-${Date.now()}`, studentId: paymentStudentId, month: paymentMonth, year: paymentYear,
        monthlyFee: student.discountedFee, prevBalance: prevBal, totalDue: due,
        paidAmount: payingNow, balanceRemaining: Math.max(0, bal), status,
        paymentDate, paymentMethod, receiptNumber: receiptNum, notes: paymentNotes,
      };
      if (existingRecord) {
        setFeeRecords(prev => prev.map(r => r.id === existingRecord.id ? newRecord : r));
      } else {
        setFeeRecords(prev => [...prev, newRecord]);
      }
      setLastReceipt({ name: student.fullName, amount: payingNow, balance: Math.max(0, bal), receipt: receiptNum });
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
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none">
              <option>All Classes</option>
              {CLASS_OPTIONS.map(c => <option key={c}>{c}</option>)}
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
                <select value={paymentClassFilter} onChange={e => { setPaymentClassFilter(e.target.value); setPaymentStudentId(''); }} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1">
                  <option>All Classes</option>
                  {CLASS_OPTIONS.map(c => <option key={c}>{c}</option>)}
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
