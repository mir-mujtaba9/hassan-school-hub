import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown, Calendar, BarChart3, Hash, Pencil, Trash2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, Expense } from '@/data/staff';
import { formatRs, formatDate, MONTHS } from '@/data/students';

const CATEGORY_COLORS: Record<string, string> = {
  Utilities: 'bg-teal text-teal-foreground',
  Maintenance: 'bg-warning text-warning-foreground',
  Supplies: 'bg-success text-success-foreground',
  Transport: 'bg-info text-info-foreground',
  Salary: 'bg-primary text-primary-foreground',
  Other: 'bg-muted-foreground text-card',
};
const CATEGORY_DOTS: Record<string, string> = {
  Utilities: 'bg-teal', Maintenance: 'bg-warning', Supplies: 'bg-success', Transport: 'bg-info', Salary: 'bg-primary', Other: 'bg-muted-foreground',
};

const Expenses = () => {
  const { expenses, setExpenses } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState('March');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<Expense | null>(null);

  // Filters
  const [filterCat, setFilterCat] = useState('All');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [search, setSearch] = useState('');

  const emptyForm = { date: new Date().toISOString().split('T')[0], category: '', description: '', amount: '', paymentMethod: 'Cash', paidTo: '', receiptRef: '', recordedBy: 'Admin', notes: '' };
  const [form, setForm] = useState(emptyForm);

  const monthExpenses = useMemo(() => {
    const monthIdx = MONTHS.indexOf(selectedMonth);
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === monthIdx && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const filtered = useMemo(() => {
    return monthExpenses.filter(e => {
      if (filterCat !== 'All' && e.category !== filterCat) return false;
      if (filterFrom && e.date < filterFrom) return false;
      if (filterTo && e.date > filterTo) return false;
      if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.paidTo.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [monthExpenses, filterCat, filterFrom, filterTo, search]);

  const thisMonthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  // "Last month" — simple approximation
  const lastMonthTotal = 31200;
  const thisYearTotal = 89700;

  const catTotals = useMemo(() => {
    const m: Record<string, number> = {};
    monthExpenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
    return m;
  }, [monthExpenses]);

  const handleAdd = () => { setForm(emptyForm); setAddOpen(true); };
  const handleEdit = (e: Expense) => {
    setCurrent(e);
    setForm({ date: e.date, category: e.category, description: e.description, amount: String(e.amount), paymentMethod: e.paymentMethod, paidTo: e.paidTo, receiptRef: e.receiptRef, recordedBy: e.recordedBy, notes: e.notes });
    setEditOpen(true);
  };
  const handleDelete = (e: Expense) => { setCurrent(e); setDeleteOpen(true); };

  const saveExpense = (isEdit: boolean) => {
    if (!form.description || !form.amount || !form.category || !form.date) return;
    const data: Expense = {
      id: isEdit && current ? current.id : `e${Date.now()}`,
      date: form.date, category: form.category, description: form.description, amount: Number(form.amount),
      paymentMethod: form.paymentMethod, paidTo: form.paidTo, receiptRef: form.receiptRef, recordedBy: form.recordedBy, notes: form.notes,
    };
    if (isEdit && current) {
      setExpenses(prev => prev.map(e => e.id === current.id ? data : e));
    } else {
      setExpenses(prev => [...prev, data]);
    }
    setAddOpen(false); setEditOpen(false);
  };

  const confirmDelete = () => {
    if (!current) return;
    setExpenses(prev => prev.filter(e => e.id !== current.id));
    setDeleteOpen(false);
  };

  const resetFilters = () => { setFilterCat('All'); setFilterFrom(''); setFilterTo(''); setSearch(''); };

  const stats = [
    { label: 'This Month', value: formatRs(thisMonthTotal), color: 'bg-destructive text-destructive-foreground', icon: TrendingDown },
    { label: 'Last Month', value: formatRs(lastMonthTotal), color: 'bg-teal text-teal-foreground', icon: Calendar },
    { label: 'This Year', value: formatRs(thisYearTotal), color: 'bg-info text-info-foreground', icon: BarChart3 },
    { label: 'Total Entries', value: monthExpenses.length, color: 'bg-muted text-muted-foreground', icon: Hash },
  ];

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
      <div><Label>Category *</Label>
        <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Description *</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
      <div><Label>Amount (Rs.) *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
      <div><Label>Payment Method</Label>
        <Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Paid To</Label><Input value={form.paidTo} onChange={e => setForm(p => ({ ...p, paidTo: e.target.value }))} /></div>
      <div><Label>Receipt / Reference Number</Label><Input value={form.receiptRef} onChange={e => setForm(p => ({ ...p, receiptRef: e.target.value }))} /></div>
      <div><Label>Recorded By</Label><Input value={form.recordedBy} onChange={e => setForm(p => ({ ...p, recordedBy: e.target.value }))} /></div>
      <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
    </div>
  );

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
          <Button onClick={handleAdd} className="bg-teal text-teal-foreground hover:bg-teal/90">+ Add Expense</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}><s.icon size={20} /></div>
              <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-xl font-bold text-foreground">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {EXPENSE_CATEGORIES.filter(c => c !== 'Salary').map(cat => (
          <Card key={cat}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${CATEGORY_DOTS[cat]}`} />
              <div><p className="text-xs text-muted-foreground">{cat}</p><p className="font-semibold text-foreground">{formatRs(catTotals[cat] || 0)}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="All">All Categories</SelectItem>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">From</Label><Input type="date" className="w-[150px]" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To</Label><Input type="date" className="w-[150px]" value={filterTo} onChange={e => setFilterTo(e.target.value)} /></div>
            <div><Label className="text-xs">Search</Label><Input className="w-[200px]" placeholder="Search description..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Button size="sm" className="bg-teal text-teal-foreground hover:bg-teal/90" onClick={() => {}}>Apply Filter</Button>
            <Button size="sm" variant="outline" onClick={resetFilters}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead className="hidden md:table-cell">Payment Method</TableHead><TableHead className="hidden lg:table-cell">Recorded By</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e, i) => (
                <TableRow key={e.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{formatDate(e.date)}</TableCell>
                  <TableCell><Badge className={CATEGORY_COLORS[e.category] || 'bg-muted'}>{e.category}</Badge></TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell className="font-semibold text-destructive">{formatRs(e.amount)}</TableCell>
                  <TableCell className="hidden md:table-cell">{e.paymentMethod}</TableCell>
                  <TableCell className="hidden lg:table-cell">{e.recordedBy}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(e)} className="text-muted-foreground"><Pencil size={16} /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(e)} className="text-destructive"><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Expense</DialogTitle><DialogDescription>Record a new expense entry.</DialogDescription></DialogHeader>
          {formFields}
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={() => saveExpense(false)} className="bg-teal text-teal-foreground hover:bg-teal/90">Save Expense</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Expense</DialogTitle><DialogDescription>Update expense details.</DialogDescription></DialogHeader>
          {formFields}
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={() => saveExpense(true)} className="bg-teal text-teal-foreground hover:bg-teal/90">Update Expense</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          {current && <p className="text-sm">Are you sure you want to delete this expense?<br /><strong>{current.description} — {formatRs(current.amount)}</strong> on {formatDate(current.date)}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={confirmDelete}>Yes, Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
