import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Student, formatRs, formatDate } from '@/data/students';
import { Eye, Pencil, Trash2, Search, Plus, X, ChevronLeft, ChevronRight, Users, UserCheck, UserX, UserPlus } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const StudentsList: React.FC = () => {
  const { students, setStudents, feeRecords, userRole } = useAppContext();
  const navigate = useNavigate();
  const isTeacher = userRole === 'teacher';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [viewTab, setViewTab] = useState('personal');
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !search || s.fullName.toLowerCase().includes(search.toLowerCase()) || s.fatherName.toLowerCase().includes(search.toLowerCase()) || s.studentClass.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [students, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter(s => s.status === 'Active').length,
    left: students.filter(s => s.status === 'Left').length,
    newThisMonth: students.filter(s => { const d = new Date(s.admissionDate); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length,
  }), [students]);

  const handleDelete = (student: Student) => {
    setStudents(prev => prev.filter(s => s.id !== student.id));
    setDeleteTarget(null);
  };

  const studentFeeHistory = (studentId: string) => feeRecords.filter(r => r.studentId === studentId);
  const totalPaid = (studentId: string) => feeRecords.filter(r => r.studentId === studentId).reduce((sum, r) => sum + r.paidAmount, 0);
  const totalBalance = (studentId: string) => feeRecords.filter(r => r.studentId === studentId).reduce((sum, r) => sum + r.balanceRemaining, 0);

  const statCards = [
    { label: 'Total Students', value: stats.total, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Active Students', value: stats.active, icon: UserCheck, color: 'bg-success/10 text-success' },
    { label: 'Left Students', value: stats.left, icon: UserX, color: 'bg-destructive/10 text-destructive' },
    { label: 'New This Month', value: stats.newThisMonth, icon: UserPlus, color: 'bg-info/10 text-info' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Teacher info banner */}
      {isTeacher && (
        <div className="bg-muted border border-border rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
          <span className="text-muted-foreground text-sm">ℹ️ You have view-only access to student records</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Students</h1>
          <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full font-medium">{students.length} Students</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 pr-3 py-2 border border-input rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card" placeholder="Search by name, class or father name" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none">
            <option>All</option>
            <option>Active</option>
            <option>Left</option>
          </select>
          {!isTeacher && (
            <button onClick={() => navigate('/admission')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
              <Plus size={16} /> New Admission
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
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Father Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Class</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Monthly Fee</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Discount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">DOB</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Admission</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Search size={24} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No records match your search</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your filters or search term</p>
                      {(search || statusFilter !== 'All') && (
                        <button onClick={() => { setSearch(''); setStatusFilter('All'); }} className="mt-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : paged.map((s, i) => (
                <tr key={s.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{(page - 1) * ITEMS_PER_PAGE + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{s.fullName}</td>
                  <td className="px-4 py-3 text-foreground">{s.fatherName}</td>
                  <td className="px-4 py-3 text-foreground">{s.studentClass}</td>
                  <td className="px-4 py-3">
                    {s.discount !== 'No Discount' ? (
                      <div>
                        <span className="line-through text-muted-foreground text-xs">{formatRs(s.monthlyFee)}</span>
                        <br />
                        <span className="font-bold text-primary">{formatRs(s.discountedFee)}</span>
                        <span className="text-xs text-muted-foreground ml-1">({s.discount} off)</span>
                      </div>
                    ) : (
                      <span className="text-foreground">{formatRs(s.monthlyFee)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground">{s.discount === 'No Discount' ? 'None' : s.discount}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDate(s.dateOfBirth)}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDate(s.admissionDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'Active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setViewStudent(s); setViewTab('personal'); }} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View"><Eye size={16} /></button>
                      {!isTeacher && (
                        <>
                          <button onClick={() => navigate(`/edit/${s.id}`)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit"><Pencil size={16} /></button>
                          <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">Showing {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} students</p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 border border-input rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"><ChevronLeft size={16} /></button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 border border-input rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* View Student Drawer */}
      {viewStudent && (
        <>
          <div className="fixed inset-0 bg-foreground/50 z-40" onClick={() => setViewStudent(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card shadow-xl z-50 animate-slide-in-right overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{viewStudent.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{viewStudent.fatherName} • {viewStudent.studentClass}</p>
                </div>
                <button onClick={() => setViewStudent(null)} className="p-1 hover:bg-muted rounded-lg"><X size={20} /></button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border mb-4">
                {['personal', 'academic', 'fee', 'history'].map(tab => (
                  <button key={tab} onClick={() => setViewTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${viewTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    {tab === 'fee' ? 'Fee Info' : tab}
                  </button>
                ))}
              </div>

              {viewTab === 'personal' && (
                <div className="space-y-3">
                  {[
                    ['Full Name', viewStudent.fullName], ['Father Name', viewStudent.fatherName],
                    ['Date of Birth', formatDate(viewStudent.dateOfBirth)], ['Gender', viewStudent.gender],
                    ['Religion', viewStudent.religion], ['Nationality', viewStudent.nationality],
                    ['Place of Birth', viewStudent.placeOfBirth], ['Mother Tongue', viewStudent.motherTongue],
                    ['Phone', viewStudent.studentPhone || '—'], ['Father Phone', viewStudent.fatherPhone],
                    ['Mother Name', viewStudent.motherName || '—'], ['Address', viewStudent.homeAddress],
                    ['District', viewStudent.district || '—'], ['Tehsil', viewStudent.tehsil || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {viewTab === 'academic' && (
                <div className="space-y-3">
                  {[
                    ['Class', viewStudent.studentClass], ['Section', viewStudent.section || '—'],
                    ['Roll Number', viewStudent.rollNumber?.toString() || '—'],
                    ['Admission Date', formatDate(viewStudent.admissionDate)],
                    ['Previous School', viewStudent.previousSchool || '—'],
                    ['Previous Class', viewStudent.previousClass || '—'],
                    ['Previous Result', viewStudent.previousResult],
                    ['Status', viewStudent.status],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium text-foreground">{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {viewTab === 'fee' && (
                <div className="space-y-3">
                  {[
                    ['Monthly Fee', formatRs(viewStudent.monthlyFee)],
                    ['Discount', viewStudent.discount === 'No Discount' ? 'None' : `${viewStudent.discount} — ${formatRs(viewStudent.monthlyFee - viewStudent.discountedFee)} off`],
                    ['Final Fee', formatRs(viewStudent.discountedFee) + '/month'],
                    ['Reason', viewStudent.discountReason || '—'],
                    ['Total Paid (this year)', formatRs(totalPaid(viewStudent.id))],
                    ['Balance Due', formatRs(totalBalance(viewStudent.id))],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className={`text-sm font-medium ${label === 'Final Fee' ? 'text-primary' : 'text-foreground'}`}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {viewTab === 'history' && (
                <div className="space-y-2">
                  {studentFeeHistory(viewStudent.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No fee records found</p>
                  ) : (
                    studentFeeHistory(viewStudent.id).map(r => (
                      <div key={r.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-foreground">{r.month} {r.year}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === 'Paid' ? 'bg-success/10 text-success' :
                            r.status === 'Partial' ? 'bg-warning/10 text-warning' :
                            r.status === 'Advance' ? 'bg-primary/10 text-primary' :
                            'bg-destructive/10 text-destructive'
                          }`}>{r.status}</span>
                        </div>
                        <p className="text-muted-foreground mt-1">Paid: {formatRs(r.paidAmount)} / {formatRs(r.totalDue)}</p>
                        {r.receiptNumber && <p className="text-muted-foreground text-xs">{r.receiptNumber} • {formatDate(r.paymentDate || '')}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-foreground mb-2">Remove Student?</h3>
            <p className="text-sm text-muted-foreground mb-4">Are you sure you want to remove <span className="font-medium text-foreground">{deleteTarget.fullName}</span>? This will delete all fee records for this student.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">Yes, Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsList;
