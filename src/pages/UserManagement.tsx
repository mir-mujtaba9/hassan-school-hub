import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Power } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const API_BASE_URL = 'http://localhost:4000/api/v1';

type UserRole = 'admin' | 'teacher';

type UserStatus = 'Active' | 'Inactive';

type ManagedUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  createdOn?: string;
  lastLogin?: string | null;
  notes?: string;
  assignedClasses?: string[];
};

const ROLE_OPTIONS: Array<{ label: string; value: 'Admin' | 'Teacher' }> = [
  { label: 'Admin', value: 'Admin' },
  { label: 'Teacher', value: 'Teacher' },
];

const STATUS_OPTIONS: UserStatus[] = ['Active', 'Inactive'];

const normalizeRole = (role: unknown): UserRole => {
  const raw = String(role ?? '').toLowerCase();
  return raw === 'teacher' ? 'teacher' : 'admin';
};

const parseAssignedClasses = (value: string): string[] => {
  const parts = value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
};

const isValidPassword = (password: string) => {
  if (password.length < 8) return false;
  if (!/\d/.test(password)) return false;
  return true;
};

const mapApiUser = (item: any, fallbackId: string): ManagedUser => {
  const role = normalizeRole(item?.role);
  const status: UserStatus = item?.status === 'Inactive' ? 'Inactive' : 'Active';

  return {
    id: String(item?.id ?? item?._id ?? fallbackId),
    fullName: String(item?.fullName ?? item?.full_name ?? ''),
    email: String(item?.email ?? ''),
    role,
    status,
    phone: item?.phone ?? undefined,
    createdOn: item?.createdOn ?? item?.created_on ?? item?.created_at,
    lastLogin: item?.lastLogin ?? item?.last_login ?? null,
    notes: item?.notes ?? undefined,
    assignedClasses: Array.isArray(item?.assignedClasses)
      ? item.assignedClasses.filter((c: unknown) => typeof c === 'string')
      : Array.isArray(item?.assigned_classes)
      ? item.assigned_classes.filter((c: unknown) => typeof c === 'string')
      : undefined,
  };
};

const extractErrorMessage = async (response: Response, fallback: string) => {
  let msg = fallback;
  try {
    const data = await response.json();
    if (typeof (data as any)?.error === 'string') msg = (data as any).error;
    else if (typeof (data as any)?.message === 'string') msg = (data as any).message;
  } catch {
    // ignore
  }
  return msg;
};

const UserManagement: React.FC = () => {
  const { authToken, userId } = useAppContext();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [current, setCurrent] = useState<ManagedUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | UserStatus>('All');

  const emptyForm = {
    fullName: '',
    email: '',
    role: 'Teacher' as 'Admin' | 'Teacher',
    password: '',
    phone: '',
    assignedClasses: '',
    status: 'Active' as UserStatus,
    notes: '',
  };

  const [form, setForm] = useState(emptyForm);

  const canOperateOn = (u: ManagedUser) => {
    if (!userId) return true; // best-effort; backend will still enforce
    return u.id !== userId;
  };

  const loadUsers = async () => {
    try {
      setApiError(null);
      setIsLoading(true);

      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`${API_BASE_URL}/users`, { headers });
      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Failed to load users');
        setApiError(msg);
        return;
      }

      const data = await response.json().catch(() => ({} as any));
      const list = Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray((data as any)?.users)
        ? (data as any).users
        : Array.isArray(data)
        ? data
        : [];

      const mapped: ManagedUser[] = (Array.isArray(list) ? list : []).map((item: any, index: number) =>
        mapApiUser(item, `u-${index + 1}`)
      );

      setUsers(mapped);
    } catch {
      setApiError('Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'All' && u.role !== roleFilter) return false;
      if (statusFilter !== 'All' && u.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  const handleAdd = () => {
    setCurrent(null);
    setForm(emptyForm);
    setApiError(null);
    setAddOpen(true);
  };

  const handleEdit = (u: ManagedUser) => {
    setCurrent(u);
    setApiError(null);
    setForm({
      fullName: u.fullName,
      email: u.email,
      role: u.role === 'admin' ? 'Admin' : 'Teacher',
      password: '',
      phone: u.phone ?? '',
      assignedClasses: (u.assignedClasses ?? []).join(', '),
      status: u.status,
      notes: u.notes ?? '',
    });
    setEditOpen(true);
  };

  const handleDelete = (u: ManagedUser) => {
    setCurrent(u);
    setApiError(null);
    setDeleteOpen(true);
  };

  const handleToggleStatus = async (u: ManagedUser) => {
    if (!canOperateOn(u)) {
      setApiError('You cannot modify your own account.');
      return;
    }

    try {
      setApiError(null);
      setIsSubmitting(true);

      const nextStatus: UserStatus = u.status === 'Active' ? 'Inactive' : 'Active';

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`${API_BASE_URL}/users/${u.id}/toggle-status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Failed to update user status');
        setApiError(msg);
        return;
      }

      const result = await response.json().catch(() => ({} as any));
      const updated = mapApiUser(result?.user ?? result?.data ?? result, u.id);

      setUsers(prev => prev.map(x => (x.id === u.id ? updated : x)));
    } catch {
      setApiError('Unable to update user status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveUser = async (isEdit: boolean) => {
    if (!form.fullName.trim() || !form.email.trim() || !form.role) return;
    if (!isEdit) {
      if (!form.password) return;
      if (!isValidPassword(form.password)) {
        setApiError('Password must be at least 8 characters and contain at least one number.');
        return;
      }
    } else if (form.password && !isValidPassword(form.password)) {
      setApiError('Password must be at least 8 characters and contain at least one number.');
      return;
    }

    if (isEdit && current && !canOperateOn(current)) {
      setApiError('You cannot modify your own account.');
      return;
    }

    const assignedClasses = parseAssignedClasses(form.assignedClasses);

    const payload: Record<string, unknown> = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
    };

    if (!isEdit || form.password) payload.password = form.password;
    if (form.phone) payload.phone = form.phone;
    if (form.notes) payload.notes = form.notes;

    if (form.role === 'Teacher') {
      if (assignedClasses.length > 0) payload.assignedClasses = assignedClasses;
    } else {
      payload.assignedClasses = [];
    }

    try {
      setApiError(null);
      setIsSubmitting(true);

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const url = isEdit && current ? `${API_BASE_URL}/users/${current.id}` : `${API_BASE_URL}/users`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const msg = await extractErrorMessage(response, isEdit ? 'Failed to update user' : 'Failed to create user');
        setApiError(msg);
        return;
      }

      const result = await response.json().catch(() => ({} as any));
      const saved = mapApiUser(result?.user ?? result?.data ?? result, isEdit && current ? current.id : `u-${Date.now()}`);

      if (isEdit && current) {
        setUsers(prev => prev.map(u => (u.id === current.id ? saved : u)));
      } else {
        setUsers(prev => [...prev, saved]);
      }

      setAddOpen(false);
      setEditOpen(false);
    } catch {
      setApiError('Unable to save user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!current) return;

    if (!canOperateOn(current)) {
      setApiError('You cannot delete your own account.');
      return;
    }

    try {
      setApiError(null);
      setIsSubmitting(true);

      const headers: HeadersInit = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`${API_BASE_URL}/users/${current.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const msg = await extractErrorMessage(response, 'Failed to delete user');
        setApiError(msg);
        return;
      }

      setUsers(prev => prev.filter(u => u.id !== current.id));
      setDeleteOpen(false);
    } catch {
      setApiError('Unable to delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleBadge = (role: UserRole) =>
    role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-info text-info-foreground';

  const statusBadge = (status: UserStatus) =>
    status === 'Active' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground';

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label>Full Name *</Label>
        <Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
      </div>
      <div>
        <Label>Email *</Label>
        <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
      </div>
      <div>
        <Label>Role *</Label>
        <Select
          value={form.role}
          onValueChange={(v) =>
            setForm(p => ({
              ...p,
              role: v as any,
              assignedClasses: v === 'Teacher' ? p.assignedClasses : '',
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map(r => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Status</Label>
        <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as UserStatus }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Password {editOpen ? '(optional)' : '*'} </Label>
        <Input
          type="password"
          value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="min 8 chars + 1 number"
        />
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
      </div>

      <div className="sm:col-span-2">
        <Label>Assigned Classes {form.role === 'Teacher' ? '' : '(ignored for Admin)'}</Label>
        <Input
          value={form.assignedClasses}
          onChange={e => setForm(p => ({ ...p, assignedClasses: e.target.value }))}
          placeholder="Comma-separated, e.g. Class 4, Class 5"
          disabled={form.role !== 'Teacher'}
        />
      </div>

      <div className="sm:col-span-2">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Users</h1>
          <span className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full font-medium">
            {users.length} Accounts{isLoading ? ' (loading...)' : ''}
          </span>
        </div>
        <Button onClick={handleAdd} className="bg-teal text-teal-foreground hover:bg-teal/90">
          + Create User
        </Button>
      </div>

      {apiError && (
        <p className="text-xs text-destructive bg-destructive/5 border border-destructive/30 rounded-md px-3 py-1.5">
          {apiError}
        </p>
      )}

      {!userId && (
        <p className="text-xs text-muted-foreground bg-muted/50 border border-border rounded-md px-3 py-2">
          Note: Your login response didn’t include a user id, so self-edit protection is best-effort (server will still block it).
        </p>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Search</Label>
              <Input className="w-[220px]" placeholder="Search name/email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={roleFilter} onValueChange={v => setRoleFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setSearch(''); setRoleFilter('All'); setStatusFilter('All'); }}>
              Reset
            </Button>
            <Button size="sm" onClick={loadUsers} disabled={isLoading} className="bg-teal text-teal-foreground hover:bg-teal/90">
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Classes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    {isLoading ? 'Loading...' : 'No users found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u, idx) => {
                  const disabled = !canOperateOn(u);
                  return (
                    <TableRow key={u.id} className={disabled ? 'opacity-70' : ''}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium text-foreground">{u.fullName}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge className={roleBadge(u.role)}>{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadge(u.status)}>{u.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{u.phone || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {(u.assignedClasses ?? []).length > 0 ? (u.assignedClasses ?? []).join(', ') : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => (disabled ? setApiError('You cannot modify your own account.') : handleEdit(u))}
                            className="text-muted-foreground"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSubmitting || disabled}
                            className="text-muted-foreground"
                            title={u.status === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => (disabled ? setApiError('You cannot delete your own account.') : handleDelete(u))}
                            className="text-destructive"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Create a new admin/teacher account.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveUser(false)} disabled={isSubmitting} className="bg-teal text-teal-foreground hover:bg-teal/90">
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update account details. Password is optional.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveUser(true)} disabled={isSubmitting} className="bg-teal text-teal-foreground hover:bg-teal/90">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {current && (
            <p className="text-sm">
              Delete <strong>{current.fullName}</strong> ({current.email})?
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
