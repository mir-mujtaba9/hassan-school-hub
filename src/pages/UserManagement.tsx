import React, { useState, useMemo } from 'react';
import { Settings, Pencil, Trash2, ToggleLeft, ToggleRight, Plus, X, CheckCircle, Search, Users, Shield, UserCheck } from 'lucide-react';
import { CLASS_OPTIONS } from '@/data/students';

interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'Teacher';
  status: 'Active' | 'Inactive';
  phone: string;
  createdOn: string;
  lastLogin: string;
  assignedClasses: string[];
  notes: string;
}

const initialUsers: UserAccount[] = [
  { id: 'u1', fullName: 'Muhammad Hassan', email: 'admin@hassan.edu', role: 'Admin', status: 'Active', phone: '0300-1234567', createdOn: '2025-01-01', lastLogin: 'Today', assignedClasses: [], notes: '' },
  { id: 'u2', fullName: 'Ayesha Siddiq', email: 'ayesha@hassan.edu', role: 'Teacher', status: 'Active', phone: '0333-2345678', createdOn: '2025-01-15', lastLogin: 'Yesterday', assignedClasses: ['Class 1', 'Class 2', 'Class 3'], notes: '' },
  { id: 'u3', fullName: 'Bilal Hussain', email: 'bilal@hassan.edu', role: 'Teacher', status: 'Active', phone: '0300-3456789', createdOn: '2025-01-20', lastLogin: '3 days ago', assignedClasses: ['Class 4', 'Class 5', 'Class 6'], notes: '' },
  { id: 'u4', fullName: 'Fatima Zahra', email: 'fatima@hassan.edu', role: 'Teacher', status: 'Inactive', phone: '0321-4567890', createdOn: '2025-02-01', lastLogin: 'Never', assignedClasses: ['Class 7', 'Class 8'], notes: '' },
];

const CURRENT_USER_EMAIL = 'admin@hassan.edu';

const formatDateSimple = (dateStr: string): string => {
  if (!dateStr || dateStr === 'Today' || dateStr === 'Yesterday' || dateStr.includes('days')) return dateStr;
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserAccount | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastCreated, setLastCreated] = useState({ name: '', email: '', role: '' });

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'Teacher'>('Teacher');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formClasses, setFormClasses] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'Admin').length,
    teachers: users.filter(u => u.role === 'Teacher').length,
  }), [users]);

  const statCards = [
    { label: 'Total Users', value: stats.total, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Admins', value: stats.admins, icon: Shield, color: 'bg-info/10 text-info' },
    { label: 'Teachers', value: stats.teachers, icon: UserCheck, color: 'bg-success/10 text-success' },
  ];

  const resetForm = () => {
    setFormName(''); setFormEmail(''); setFormRole('Teacher'); setFormPhone('');
    setFormPassword(''); setFormConfirmPassword(''); setFormClasses([]);
    setFormNotes(''); setFormActive(true); setFormErrors({});
  };

  const openCreate = () => {
    resetForm();
    setEditingUser(null);
    setShowModal(true);
  };

  const openEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormName(user.fullName);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPhone(user.phone);
    setFormPassword('');
    setFormConfirmPassword('');
    setFormClasses(user.assignedClasses);
    setFormNotes(user.notes);
    setFormActive(user.status === 'Active');
    setFormErrors({});
    setShowModal(true);
  };

  const passHasMinLength = formPassword.length >= 8;
  const passHasNumber = /\d/.test(formPassword);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Full name is required';
    if (!formEmail.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errors.email = 'Invalid email format';
    if (!editingUser) {
      if (!formPassword) errors.password = 'Password is required';
      else if (!passHasMinLength || !passHasNumber) errors.password = 'Password does not meet requirements';
      if (formPassword !== formConfirmPassword) errors.confirm = 'Passwords do not match';
    } else {
      if (formPassword && formPassword !== formConfirmPassword) errors.confirm = 'Passwords do not match';
      if (formPassword && (!passHasMinLength || !passHasNumber)) errors.password = 'Password does not meet requirements';
    }
    if (!formRole) errors.role = 'Role is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveUser = () => {
    if (!validate()) return;
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u, fullName: formName, email: formEmail, role: formRole, phone: formPhone,
        assignedClasses: formRole === 'Teacher' ? formClasses : [], notes: formNotes,
        status: formActive ? 'Active' : 'Inactive',
      } : u));
    } else {
      const newUser: UserAccount = {
        id: `u-${Date.now()}`, fullName: formName, email: formEmail, role: formRole,
        status: formActive ? 'Active' : 'Inactive', phone: formPhone,
        createdOn: new Date().toISOString().split('T')[0], lastLogin: 'Never',
        assignedClasses: formRole === 'Teacher' ? formClasses : [], notes: formNotes,
      };
      setUsers(prev => [...prev, newUser]);
      setLastCreated({ name: formName, email: formEmail, role: formRole });
      setShowModal(false);
      setShowSuccess(true);
      return;
    }
    setShowModal(false);
  };

  const toggleClassSelection = (cls: string) => {
    setFormClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    setUsers(prev => prev.map(u => u.id === deactivateTarget.id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } as UserAccount : u));
    setDeactivateTarget(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage admin and teacher accounts</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Create Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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

      {/* Users Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {['#', 'Full Name', 'Email', 'Role', 'Status', 'Created On', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isSelf = u.email === CURRENT_USER_EMAIL;
                return (
                  <tr key={u.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{u.fullName}</td>
                    <td className="px-4 py-3 text-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'Admin' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'Active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDateSimple(u.createdOn)}</td>
                    <td className="px-4 py-3 text-foreground">{u.lastLogin}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => !isSelf && openEdit(u)} className={`p-1.5 rounded-lg transition-colors ${isSelf ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-primary hover:bg-primary/10'}`} title={isSelf ? 'Cannot modify your own account' : 'Edit'}>
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => !isSelf && setDeactivateTarget(u)} className={`p-1.5 rounded-lg transition-colors ${isSelf ? 'text-muted-foreground/40 cursor-not-allowed' : u.status === 'Active' ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'}`} title={isSelf ? 'Cannot modify your own account' : u.status === 'Active' ? 'Deactivate' : 'Activate'}>
                          {u.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => !isSelf && setDeleteTarget(u)} className={`p-1.5 rounded-lg transition-colors ${isSelf ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-destructive hover:bg-destructive/10'}`} title={isSelf ? 'Cannot modify your own account' : 'Delete'}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-lg w-full animate-fade-in max-h-[90vh] overflow-auto">
            <div className="bg-primary px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary-foreground">{editingUser ? `Edit Account — ${editingUser.fullName}` : 'Create New Account'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-primary-foreground/20 rounded-lg text-primary-foreground"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Full Name *</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1 ${formErrors.name ? 'border-destructive' : 'border-input'}`} placeholder="Full name" />
                  {formErrors.name && <p className="text-destructive text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Role *</label>
                  <select value={formRole} onChange={e => setFormRole(e.target.value as 'Admin' | 'Teacher')} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1">
                    <option>Admin</option><option>Teacher</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Email Address *</label>
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1 ${formErrors.email ? 'border-destructive' : 'border-input'}`} placeholder="email@hassan.edu" />
                  {formErrors.email && <p className="text-destructive text-xs mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <input value={formPhone} onChange={e => setFormPhone(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1" placeholder="0300-1234567" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">{editingUser ? 'New Password' : 'Password *'}</label>
                  <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1 ${formErrors.password ? 'border-destructive' : 'border-input'}`} placeholder={editingUser ? 'Leave blank to keep' : 'Min 8 characters'} />
                  {formErrors.password && <p className="text-destructive text-xs mt-1">{formErrors.password}</p>}
                  {!editingUser && (
                    <div className="mt-1.5 space-y-0.5">
                      <p className={`text-xs ${passHasMinLength ? 'text-primary' : 'text-muted-foreground'}`}>✓ Minimum 8 characters</p>
                      <p className={`text-xs ${passHasNumber ? 'text-primary' : 'text-muted-foreground'}`}>✓ At least one number</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Confirm Password{editingUser ? '' : ' *'}</label>
                  <input type="password" value={formConfirmPassword} onChange={e => setFormConfirmPassword(e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1 ${formErrors.confirm ? 'border-destructive' : 'border-input'}`} placeholder="Confirm password" />
                  {formErrors.confirm && <p className="text-destructive text-xs mt-1">{formErrors.confirm}</p>}
                </div>
              </div>

              {formRole === 'Teacher' && (
                <div>
                  <label className="text-sm font-medium text-foreground">Which classes can this teacher access?</label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {CLASS_OPTIONS.map(cls => (
                      <label key={cls} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={formClasses.includes(cls)} onChange={() => toggleClassSelection(cls)} className="rounded border-input text-primary focus:ring-primary" />
                        <span className="text-foreground">{cls}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Teacher will only see students and fees from their assigned classes</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground">Notes / Remarks</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card focus:ring-2 focus:ring-primary outline-none mt-1 resize-none" rows={2} placeholder="Optional notes" />
              </div>

              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <span className="text-sm font-medium text-foreground">Account Active</span>
                <button onClick={() => setFormActive(!formActive)} className={`w-11 h-6 rounded-full transition-colors relative ${formActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-card rounded-full transition-transform shadow ${formActive ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">Cancel</button>
                <button onClick={saveUser} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  {editingUser ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center"><CheckCircle className="text-success" size={24} /></div>
              <h3 className="text-lg font-bold text-foreground">Account Created ✓</h3>
            </div>
            <div className="bg-muted rounded-lg p-4 text-sm space-y-2 mb-4">
              <p><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{lastCreated.name}</span></p>
              <p><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{lastCreated.email}</span></p>
              <p><span className="text-muted-foreground">Role:</span> <span className="font-medium text-foreground">{lastCreated.role}</span></p>
              <p><span className="text-muted-foreground">Temporary Password:</span> <span className="font-medium text-foreground">••••••••</span></p>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">Copy Password</button>
              <button onClick={() => setShowSuccess(false)} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation */}
      {deactivateTarget && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-foreground mb-2">
              {deactivateTarget.status === 'Active' ? 'Deactivate' : 'Activate'} {deactivateTarget.fullName}'s account?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {deactivateTarget.status === 'Active'
                ? 'They will not be able to login until reactivated.'
                : 'They will be able to login again.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeactivateTarget(null)} className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">Cancel</button>
              <button onClick={handleDeactivate} className="flex-1 px-4 py-2.5 bg-warning text-warning-foreground rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors">
                Yes, {deactivateTarget.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-foreground mb-2">Permanently delete {deleteTarget.fullName}'s account?</h3>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
