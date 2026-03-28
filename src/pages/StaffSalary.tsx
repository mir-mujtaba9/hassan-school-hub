import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, CheckCircle, Clock, DollarSign, Pencil, Trash2, Receipt } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { STAFF_ROLES, PAYMENT_METHODS, generateSalaryReceipt, StaffMember, SalaryRecord } from '@/data/staff';
import { formatRs, formatDate, MONTHS } from '@/data/students';

const StaffSalary = () => {
  const { staff, setStaff, salaryRecords, setSalaryRecords } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState('March');
  const [selectedYear, setSelectedYear] = useState(2025);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [inactiveOpen, setInactiveOpen] = useState(false);

  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<SalaryRecord | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Form state
  const emptyForm = { fullName: '', fatherName: '', role: '', gender: 'Male', monthlySalary: '', joinDate: new Date().toISOString().split('T')[0], phone: '', cnic: '', dateOfBirth: '', qualification: '', address: '', notes: '' };
  const [form, setForm] = useState(emptyForm);
  const [payForm, setPayForm] = useState({ month: 'March', year: '2025', amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: '' });
  const [inactiveForm, setInactiveForm] = useState({ date: new Date().toISOString().split('T')[0], reason: '' });

  // Derived
  const activeStaff = staff.filter(s => s.status === 'Active');
  const totalPayroll = activeStaff.reduce((s, m) => s + m.monthlySalary, 0);
  const paidThisMonth = staff.filter(s => salaryRecords.some(r => r.staffId === s.id && r.month === selectedMonth && r.year === selectedYear));
  const pendingStaff = activeStaff.filter(s => !salaryRecords.some(r => r.staffId === s.id && r.month === selectedMonth && r.year === selectedYear));

  const isPaid = (staffId: string) => salaryRecords.some(r => r.staffId === staffId && r.month === selectedMonth && r.year === selectedYear);
  const getLastPaid = (staffId: string) => {
    const recs = salaryRecords.filter(r => r.staffId === staffId).sort((a, b) => b.year - a.year || MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month));
    return recs.length > 0 ? `${recs[0].month.slice(0, 3)}-${recs[0].year}` : '—';
  };

  // Handlers
  const handleAdd = () => { setForm(emptyForm); setAddOpen(true); };
  const handleEdit = (s: StaffMember) => {
    setCurrentStaff(s);
    setForm({ fullName: s.fullName, fatherName: s.fatherName, role: s.role, gender: s.gender, monthlySalary: String(s.monthlySalary), joinDate: s.joinDate, phone: s.phone, cnic: s.cnic, dateOfBirth: s.dateOfBirth, qualification: s.qualification, address: s.address, notes: s.notes });
    setEditOpen(true);
  };

  const saveStaff = (isEdit: boolean) => {
    if (!form.fullName || !form.fatherName || !form.role || !form.monthlySalary || !form.joinDate) return;
    const data: StaffMember = {
      id: isEdit && currentStaff ? currentStaff.id : `s${Date.now()}`,
      fullName: form.fullName, fatherName: form.fatherName, role: form.role, gender: form.gender,
      monthlySalary: Number(form.monthlySalary), joinDate: form.joinDate, phone: form.phone, cnic: form.cnic,
      dateOfBirth: form.dateOfBirth, qualification: form.qualification, address: form.address, notes: form.notes,
      status: isEdit && currentStaff ? currentStaff.status : 'Active',
    };
    if (isEdit && currentStaff) {
      setStaff(prev => prev.map(s => s.id === currentStaff.id ? data : s));
    } else {
      setStaff(prev => [...prev, data]);
    }
    setAddOpen(false); setEditOpen(false);
  };

  const handlePay = (s: StaffMember) => {
    setCurrentStaff(s);
    setPayForm({ month: selectedMonth, year: String(selectedYear), amount: String(s.monthlySalary), paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', notes: '' });
    setPayOpen(true);
  };

  const confirmPay = () => {
    if (!currentStaff || !payForm.amount) return;
    const receipt = generateSalaryReceipt();
    const record: SalaryRecord = {
      id: `sal${Date.now()}`, staffId: currentStaff.id, month: payForm.month, year: Number(payForm.year),
      amount: Number(payForm.amount), paymentDate: payForm.paymentDate, paymentMethod: payForm.paymentMethod,
      receiptNumber: receipt, notes: payForm.notes,
    };
    setSalaryRecords(prev => [...prev, record]);
    setPayOpen(false);
    setSuccessData({ name: currentStaff.fullName, month: `${payForm.month} ${payForm.year}`, amount: Number(payForm.amount), receipt });
    setSuccessOpen(true);
  };

  const handleReceipt = (s: StaffMember) => {
    const rec = salaryRecords.find(r => r.staffId === s.id && r.month === selectedMonth && r.year === selectedYear);
    if (rec) { setCurrentStaff(s); setCurrentReceipt(rec); setReceiptOpen(true); }
  };

  const handleDelete = (s: StaffMember) => { setCurrentStaff(s); setDeleteOpen(true); };
  const confirmDelete = () => {
    if (!currentStaff) return;
    setStaff(prev => prev.filter(s => s.id !== currentStaff.id));
    setSalaryRecords(prev => prev.filter(r => r.staffId !== currentStaff.id));
    setDeleteOpen(false);
  };

  const handleMarkInactive = () => {
    setInactiveForm({ date: new Date().toISOString().split('T')[0], reason: '' });
    setInactiveOpen(true);
  };
  const confirmInactive = () => {
    if (!currentStaff) return;
    setStaff(prev => prev.map(s => s.id === currentStaff.id ? { ...s, status: 'Inactive' as const, inactiveDate: inactiveForm.date, inactiveReason: inactiveForm.reason } : s));
    setInactiveOpen(false); setEditOpen(false);
  };

  const stats = [
    { label: 'Total Staff', value: activeStaff.length, color: 'bg-teal text-teal-foreground', icon: Users },
    { label: 'Paid This Month', value: paidThisMonth.length, color: 'bg-success text-success-foreground', icon: CheckCircle },
    { label: 'Salary Pending', value: pendingStaff.length, color: 'bg-warning text-warning-foreground', icon: Clock },
    { label: 'Monthly Payroll', value: formatRs(totalPayroll), color: 'bg-info text-info-foreground', icon: DollarSign },
  ];

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><Label>Full Name *</Label><Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} /></div>
      <div><Label>Father Name *</Label><Input value={form.fatherName} onChange={e => setForm(p => ({ ...p, fatherName: e.target.value }))} /></div>
      <div><Label>Role *</Label>
        <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
          <SelectContent>{STAFF_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Gender</Label>
        <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
        </Select>
      </div>
      <div><Label>Monthly Salary (Rs.) *</Label><Input type="number" value={form.monthlySalary} onChange={e => setForm(p => ({ ...p, monthlySalary: e.target.value }))} /></div>
      <div><Label>Join Date *</Label><Input type="date" value={form.joinDate} onChange={e => setForm(p => ({ ...p, joinDate: e.target.value }))} /></div>
      <div><Label>Phone Number</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
      <div><Label>CNIC</Label><Input placeholder="00000-0000000-0" value={form.cnic} onChange={e => setForm(p => ({ ...p, cnic: e.target.value }))} /></div>
      <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} /></div>
      <div><Label>Qualification</Label><Input value={form.qualification} onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))} /></div>
      <div className="sm:col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
      <div className="sm:col-span-2"><Label>Notes / Remarks</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
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
          <Button onClick={handleAdd} className="bg-teal text-teal-foreground hover:bg-teal/90">+ Add Staff</Button>
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead><TableHead>Staff Name</TableHead><TableHead>Role</TableHead><TableHead>Monthly Salary</TableHead><TableHead className="hidden md:table-cell">Phone</TableHead><TableHead className="hidden lg:table-cell">Join Date</TableHead><TableHead>Last Paid</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.filter(s => s.status === 'Active').map((s, i) => {
                const paid = isPaid(s.id);
                return (
                  <TableRow key={s.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell>{s.role}</TableCell>
                    <TableCell className="font-semibold text-teal">{formatRs(s.monthlySalary)}</TableCell>
                    <TableCell className="hidden md:table-cell">{s.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(s.joinDate)}</TableCell>
                    <TableCell>{getLastPaid(s.id)}</TableCell>
                    <TableCell><Badge className={paid ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>{paid ? 'Paid' : 'Pending'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {paid ? (
                          <Button variant="ghost" size="sm" onClick={() => handleReceipt(s)} className="text-muted-foreground"><Receipt size={16} /></Button>
                        ) : (
                          <Button size="sm" onClick={() => handlePay(s)} className="bg-teal text-teal-foreground hover:bg-teal/90 text-xs">Pay Salary</Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(s)} className="text-muted-foreground"><Pencil size={16} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s)} className="text-destructive"><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Staff Member</DialogTitle><DialogDescription>Fill in the staff member details below.</DialogDescription></DialogHeader>
          {formFields}
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={() => saveStaff(false)} className="bg-teal text-teal-foreground hover:bg-teal/90">Save Staff Member</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Staff — {currentStaff?.fullName}</DialogTitle><DialogDescription>Update staff member details.</DialogDescription></DialogHeader>
          {formFields}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleMarkInactive}>Mark as Inactive</Button>
            <div className="flex gap-2 ml-auto"><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={() => saveStaff(true)} className="bg-teal text-teal-foreground hover:bg-teal/90">Update Staff</Button></div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Inactive */}
      <Dialog open={inactiveOpen} onOpenChange={setInactiveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as Inactive</DialogTitle><DialogDescription>Provide details for marking {currentStaff?.fullName} as inactive.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Date</Label><Input type="date" value={inactiveForm.date} onChange={e => setInactiveForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div><Label>Reason</Label><Input value={inactiveForm.reason} onChange={e => setInactiveForm(p => ({ ...p, reason: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setInactiveOpen(false)}>Cancel</Button><Button variant="destructive" onClick={confirmInactive}>Confirm</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Salary Modal */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Pay Salary — {currentStaff?.fullName}</DialogTitle><DialogDescription>Record salary payment details.</DialogDescription></DialogHeader>
          {currentStaff && (
            <div className="bg-teal/10 border border-teal/20 rounded-lg p-4 space-y-1">
              <p className="font-semibold text-foreground">{currentStaff.fullName} — {currentStaff.role}</p>
              <p className="text-sm text-muted-foreground">Monthly Salary: <span className="font-semibold text-teal">{formatRs(currentStaff.monthlySalary)}</span></p>
              <p className="text-sm text-muted-foreground">Last Paid: {getLastPaid(currentStaff.id)}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Month</Label>
              <Select value={payForm.month} onValueChange={v => setPayForm(p => ({ ...p, month: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Year</Label>
              <Select value={payForm.year} onValueChange={v => setPayForm(p => ({ ...p, year: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Amount (Rs.)</Label><Input type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} /></div>
          {payForm.amount && <p className="text-sm text-muted-foreground">Paying: <span className="font-semibold text-teal">{formatRs(Number(payForm.amount))}</span> for {payForm.month}-{payForm.year}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Payment Date</Label><Input type="date" value={payForm.paymentDate} onChange={e => setPayForm(p => ({ ...p, paymentDate: e.target.value }))} /></div>
            <div><Label>Payment Method</Label>
              <Select value={payForm.paymentMethod} onValueChange={v => setPayForm(p => ({ ...p, paymentMethod: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button><Button onClick={confirmPay} className="bg-teal text-teal-foreground hover:bg-teal/90">Confirm Payment</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Salary Paid ✓</DialogTitle><DialogDescription>Payment recorded successfully.</DialogDescription></DialogHeader>
          {successData && (
            <div className="space-y-2 text-sm">
              <p>Staff: <strong>{successData.name}</strong></p>
              <p>Month: <strong>{successData.month}</strong></p>
              <p>Amount: <strong className="text-teal">{formatRs(successData.amount)}</strong></p>
              <p>Receipt: <strong>{successData.receipt}</strong></p>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setSuccessOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Salary Receipt</DialogTitle><DialogDescription>Print or save this receipt.</DialogDescription></DialogHeader>
          {currentStaff && currentReceipt && (
            <div className="border-2 border-foreground/20 rounded-lg p-6 space-y-3 text-center font-mono text-sm">
              <div className="border-b border-foreground/20 pb-3">
                <p className="font-bold text-lg">HASSAN PUBLIC SCHOOL</p>
                <p className="text-muted-foreground">BUTMONG</p>
                <p className="text-xs italic text-teal">I Shall Rise and Shine</p>
              </div>
              <p className="font-bold">SALARY RECEIPT</p>
              <div className="text-left space-y-1">
                <p>Receipt No: <strong>{currentReceipt.receiptNumber}</strong></p>
                <p>Date: <strong>{formatDate(currentReceipt.paymentDate)}</strong></p>
                <div className="border-t border-foreground/20 my-2" />
                <p>Staff Name: <strong>{currentStaff.fullName}</strong></p>
                <p>Role: <strong>{currentStaff.role}</strong></p>
                <p>Salary Month: <strong>{currentReceipt.month} {currentReceipt.year}</strong></p>
                <p>Amount Paid: <strong className="text-teal">{formatRs(currentReceipt.amount)}</strong></p>
                <p>Payment Method: <strong>{currentReceipt.paymentMethod}</strong></p>
                <div className="border-t border-foreground/20 my-2" />
                <p className="mt-4">Authorized Signature: ___________</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
            <Button variant="outline" onClick={() => setReceiptOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          <p className="text-sm">Are you sure you want to remove <strong>{currentStaff?.fullName}</strong>?</p>
          <p className="text-sm text-muted-foreground">All salary records for this staff will be deleted.</p>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={confirmDelete}>Yes, Remove</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffSalary;
