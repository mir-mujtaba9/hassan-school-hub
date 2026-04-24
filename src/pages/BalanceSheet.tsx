import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Download } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { formatRs, MONTHS } from '@/data/students';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CLASS_GROUPS = [
  { label: 'Nursery', classes: ['Nursery'], stdFee: 800 },
  { label: 'KG', classes: ['KG'], stdFee: 1000 },
  { label: 'Class 1-3', classes: ['Class 1', 'Class 2', 'Class 3'], stdFee: 1200 },
  { label: 'Class 4-6', classes: ['Class 4', 'Class 5', 'Class 6'], stdFee: 1500 },
  { label: 'Class 7-8', classes: ['Class 7', 'Class 8'], stdFee: 1800 },
  { label: 'Class 9-10', classes: ['Class 9', 'Class 10'], stdFee: 2000 },
];

type BalanceSheetReport = {
  month: string;
  year: number;
  income?: {
    total?: number;
    byClassGroup?: Array<{
      label: string;
      count: number;
      expected: number;
      collected: number;
      due: number;
    }>;
  };
  expenses?: {
    total?: number;
    byCategory?: Array<{
      category: string;
      entries?: unknown[];
      total: number;
    }>;
  };
  netBalance?: number;
};

const extractErrorMessage = async (response: Response, fallback: string) => {
  let message = fallback;
  try {
    const data = await response.json();
    if (typeof (data as any)?.error === 'string') message = (data as any).error;
    else if (typeof (data as any)?.message === 'string') message = (data as any).message;
  } catch {
    // ignore parse errors
  }
  return message;
};

const BalanceSheet = () => {
  const { students, feeRecords, staff, salaryRecords, expenses, authToken } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState('March');
  const [selectedYear, setSelectedYear] = useState(2025);

  const [report, setReport] = useState<BalanceSheetReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);

  const monthIdx = MONTHS.indexOf(selectedMonth);

  const loadReport = async (signal?: AbortSignal) => {
    try {
      setIsReportLoading(true);
      setReportError(null);

      const params = new URLSearchParams();
      params.set('month', selectedMonth);
      params.set('year', String(selectedYear));

      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`${API_BASE_URL}/reports/balance-sheet?${params.toString()}`, {
        headers,
        signal,
      });

      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Failed to load balance sheet report');
        setReportError(msg);
        setCacheStatus(null);
        setReport(null);
        return;
      }

      const xCache = response.headers.get('X-Cache');
      setCacheStatus(xCache);

      const data = (await response.json().catch(() => null)) as BalanceSheetReport | null;
      if (!data || typeof data !== 'object') {
        setReportError('Invalid report response');
        setReport(null);
        return;
      }

      setReport(data);
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return;
      setReportError('Unable to connect to server. Showing local calculations.');
      setCacheStatus(null);
      setReport(null);
    } finally {
      setIsReportLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadReport(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, authToken]);

  // Fee income by class group
  const incomeData = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'Active');
    return CLASS_GROUPS.map(g => {
      const groupStudents = activeStudents.filter(s => g.classes.includes(s.studentClass));
      const count = groupStudents.length;
      const expected = groupStudents.reduce((s, st) => s + st.discountedFee, 0);
      const collected = groupStudents.reduce((s, st) => {
        const rec = feeRecords.find(r => r.studentId === st.id && r.month === selectedMonth && r.year === selectedYear);
        return s + (rec?.paidAmount || 0);
      }, 0);
      return { label: g.label, count, feePerStudent: formatRs(g.stdFee), expected, collected, due: expected - collected };
    });
  }, [students, feeRecords, selectedMonth, selectedYear]);

  const reportIncomeData = useMemo(() => {
    const list = report?.income?.byClassGroup;
    if (!Array.isArray(list)) return null;
    return list.map((d) => ({
      label: String(d.label ?? ''),
      count: Number(d.count ?? 0) || 0,
      feePerStudent: '—',
      expected: Number(d.expected ?? 0) || 0,
      collected: Number(d.collected ?? 0) || 0,
      due: Number(d.due ?? (Number(d.expected ?? 0) - Number(d.collected ?? 0))) || 0,
    }));
  }, [report]);

  const displayedIncomeData = reportIncomeData ?? incomeData;

  const totalExpected = displayedIncomeData.reduce((s, d) => s + d.expected, 0);
  const totalCollected = displayedIncomeData.reduce((s, d) => s + d.collected, 0);
  const totalDue = totalExpected - totalCollected;
  const totalStudents = displayedIncomeData.reduce((s, d) => s + d.count, 0);

  // Salary expenses
  const salaryData = useMemo(() => {
    return staff.filter(s => s.status === 'Active').map(s => {
      const rec = salaryRecords.find(
        r => r.staffId === s.id && r.month === selectedMonth && r.year === selectedYear && (r.status ?? 'Paid') === 'Paid'
      );
      return { ...s, paid: !!rec, paidMonth: rec ? `${selectedMonth.slice(0, 3)}-${selectedYear}` : '—' };
    });
  }, [staff, salaryRecords, selectedMonth, selectedYear]);

  const totalSalary = salaryData.reduce((s, d) => s + d.monthlySalary, 0);
  const paidSalary = salaryData.filter(d => d.paid).reduce((s, d) => s + d.monthlySalary, 0);
  const pendingSalary = totalSalary - paidSalary;

  // Other expenses
  const otherExpenses = useMemo(() => {
    const byCategory = report?.expenses?.byCategory;
    if (Array.isArray(byCategory)) {
      return byCategory
        .filter(c => String(c.category) !== 'Salary')
        .map(c => ({
          category: String(c.category ?? 'Other'),
          entries: Array.isArray(c.entries) ? c.entries.length : 0,
          total: Number(c.total ?? 0) || 0,
        }));
    }

    const monthExp = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === monthIdx && d.getFullYear() === selectedYear;
    });
    const cats: Record<string, { entries: number; total: number }> = {};
    monthExp.forEach(e => {
      if (!cats[e.category]) cats[e.category] = { entries: 0, total: 0 };
      cats[e.category].entries++;
      cats[e.category].total += e.amount;
    });
    return Object.entries(cats).map(([cat, data]) => ({ category: cat, ...data }));
  }, [expenses, monthIdx, selectedYear]);

  const totalOtherExpenses = otherExpenses.reduce((s, d) => s + d.total, 0);

  const reportSalaryTotal = useMemo(() => {
    const byCategory = report?.expenses?.byCategory;
    if (!Array.isArray(byCategory)) return null;
    const salaryRow = byCategory.find(c => String(c.category) === 'Salary');
    if (!salaryRow) return 0;
    return Number((salaryRow as any)?.total ?? 0) || 0;
  }, [report]);

  const displayedSalaryTotal = reportSalaryTotal == null ? paidSalary : reportSalaryTotal;
  const totalExpenses = report?.expenses?.total != null ? Number(report.expenses.total) || 0 : displayedSalaryTotal + totalOtherExpenses;
  const netBalance = report?.netBalance != null ? Number(report.netBalance) || 0 : totalCollected - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div />
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          {isReportLoading && <Badge className="bg-muted text-muted-foreground">Loading…</Badge>}
          {cacheStatus === 'HIT' && <Badge className="bg-success text-success-foreground">Cached</Badge>}
          <Button variant="outline" onClick={() => window.print()}><Printer size={16} className="mr-1" />Print</Button>
          <Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Download size={16} className="mr-1" />Export</Button>
        </div>
      </div>

      {reportError && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-destructive/5 border border-destructive/30 rounded-md px-3 py-2">
          <p className="text-xs text-destructive">{reportError}</p>
          <Button size="sm" variant="outline" onClick={() => loadReport()} disabled={isReportLoading}>
            Retry
          </Button>
        </div>
      )}

      {/* Net Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-success text-success-foreground border-0">
          <CardContent className="p-6 text-center">
            <p className="text-sm opacity-80">TOTAL INCOME</p>
            <p className="text-3xl font-bold">{formatRs(totalCollected)}</p>
            <p className="text-sm opacity-80">Fee Collection — {selectedMonth} {selectedYear}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive text-destructive-foreground border-0">
          <CardContent className="p-6 text-center">
            <p className="text-sm opacity-80">TOTAL EXPENSES</p>
            <p className="text-3xl font-bold">{formatRs(totalExpenses)}</p>
            <p className="text-sm opacity-80">Salary {formatRs(displayedSalaryTotal)} + Other {formatRs(totalOtherExpenses)}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 ${netBalance >= 0 ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
          <CardContent className="p-6 text-center">
            <p className="text-sm opacity-80">NET BALANCE</p>
            <p className="text-3xl font-bold">{formatRs(Math.abs(netBalance))}</p>
            <p className="text-sm opacity-80">{netBalance >= 0 ? 'Surplus' : 'Deficit'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Income Details */}
      <Card>
        <CardHeader className="border-l-4 border-l-teal">
          <CardTitle className="text-lg">Income Details</CardTitle>
        </CardHeader>
        <CardContent>
          <h4 className="font-semibold text-foreground mb-3">Fee Collection</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead><TableHead>Total Students</TableHead><TableHead>Fee/Student</TableHead><TableHead>Expected</TableHead><TableHead>Collected</TableHead><TableHead>Balance Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedIncomeData.map(d => (
                <TableRow key={d.label}>
                  <TableCell className="font-medium">{d.label}</TableCell>
                  <TableCell>{d.count}</TableCell>
                  <TableCell>{d.feePerStudent}</TableCell>
                  <TableCell>{formatRs(d.expected)}</TableCell>
                  <TableCell className="text-success font-semibold">{formatRs(d.collected)}</TableCell>
                  <TableCell className={d.due > 0 ? 'text-destructive font-semibold' : ''}>{formatRs(d.due)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>Totals</TableCell>
                <TableCell>{totalStudents}</TableCell>
                <TableCell />
                <TableCell>{formatRs(totalExpected)}</TableCell>
                <TableCell className="text-success">{formatRs(totalCollected)}</TableCell>
                <TableCell className="text-destructive">{formatRs(totalDue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="bg-success/10 border border-success/20 rounded-lg px-4 py-2">
              <p className="text-sm text-muted-foreground">Total Fee Income</p>
              <p className="text-lg font-bold text-success">{formatRs(totalCollected)}</p>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">
              <p className="text-sm text-muted-foreground">Pending Collection</p>
              <p className="text-lg font-bold text-destructive">{formatRs(totalDue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Details */}
      <Card>
        <CardHeader className="border-l-4 border-l-destructive">
          <CardTitle className="text-lg">Expenses Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Staff Salaries */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Staff Salaries</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead><TableHead>Role</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead><TableHead>Month</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryData.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell>{s.role}</TableCell>
                    <TableCell>{formatRs(s.monthlySalary)}</TableCell>
                    <TableCell><Badge className={s.paid ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>{s.paid ? 'Paid' : 'Pending'}</Badge></TableCell>
                    <TableCell>{s.paidMonth}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2}>Total Salary</TableCell>
                  <TableCell>{formatRs(totalSalary)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="bg-success/10 border border-success/20 rounded-lg px-4 py-2">
                <p className="text-sm text-muted-foreground">Paid so far</p>
                <p className="font-bold text-success">{formatRs(paidSalary)}</p>
              </div>
              <div className="bg-warning/10 border border-warning/20 rounded-lg px-4 py-2">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="font-bold text-warning">{formatRs(pendingSalary)}</p>
              </div>
            </div>
          </div>

          {/* Other Expenses */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Other Expenses</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead><TableHead>Entries</TableHead><TableHead>Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherExpenses.map(d => (
                  <TableRow key={d.category}>
                    <TableCell className="font-medium">{d.category}</TableCell>
                    <TableCell>{d.entries}</TableCell>
                    <TableCell>{formatRs(d.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell>{otherExpenses.reduce((s, d) => s + d.entries, 0)}</TableCell>
                  <TableCell>{formatRs(totalOtherExpenses)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Income</h4>
              <div className="flex justify-between text-sm"><span>Fee Collection Received:</span><span className="font-semibold">{formatRs(totalCollected)}</span></div>
              <div className="flex justify-between text-sm"><span>Pending Fee Collection:</span><span className="font-semibold text-destructive">{formatRs(totalDue)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-bold"><span>Total Expected Income:</span><span>{formatRs(totalExpected)}</span></div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Expenses</h4>
              <div className="flex justify-between text-sm"><span>Salaries Paid:</span><span className="font-semibold">{formatRs(paidSalary)}</span></div>
              <div className="flex justify-between text-sm"><span>Salaries Pending:</span><span className="font-semibold text-warning">{formatRs(pendingSalary)}</span></div>
              <div className="flex justify-between text-sm"><span>Other Expenses:</span><span className="font-semibold">{formatRs(totalOtherExpenses)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-bold"><span>Total Expenses:</span><span>{formatRs(paidSalary + pendingSalary + totalOtherExpenses)}</span></div>
            </div>
          </div>
          <div className={`mt-6 p-4 rounded-lg text-center ${netBalance >= 0 ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
            <p className="text-sm text-muted-foreground">Current Cash Position (Received - Paid)</p>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {netBalance < 0 ? '-' : ''}{formatRs(Math.abs(netBalance))}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceSheet;
