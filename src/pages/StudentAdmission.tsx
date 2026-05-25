import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Student, CLASS_FEE_MAP, DISCOUNT_OPTIONS, calcDiscountedFee, formatRs } from '@/data/students';
import { buildStudentUpdatePayload, type StudentFormState } from '@/lib/studentUpdate';
import { CalendarIcon, RotateCcw, Save, CheckCircle } from 'lucide-react';

type ClassOption = {
  id: string;
  name: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL;

const emptyStudent: Omit<Student, 'id'> = {
  fullName: '', fatherName: '', dateOfBirth: '', gender: '', religion: 'Islam', nationality: 'Pakistani',
  placeOfBirth: '', motherTongue: '', studentPhone: '', fatherPhone: '', motherName: '', motherPhone: '',
  emergencyContactName: '', emergencyContactPhone: '', homeAddress: '', district: '', tehsil: '',
  admissionDate: new Date().toISOString().split('T')[0], studentClass: '', section: '', rollNumber: null,
  previousSchool: '', previousClass: '', previousResult: 'N/A', monthlyFee: 0, discount: 'No Discount',
  discountedFee: 0, discountReason: '', bFormNumber: '', fatherCnic: '', previousTcNumber: '',
  medicalCondition: '', notes: '', status: 'Active',
};

const FEE_STRUCTURE = [
  { label: 'PG', fee: 1300 }, { label: 'Nursery', fee: 1400 }, { label: 'Prep', fee: 1500 },
  { label: 'Class 1 - 2', fee: 1600 }, { label: 'Class 3 - 4', fee: 1700 },
  { label: 'Class 5 - 6', fee: 1800 }, { label: 'Class 7', fee: 1900 }, { label: 'Class 8', fee: 2000 },
  { label: 'Class 9', fee: 2500 }, { label: 'Class 10', fee: 2800 },
];

const StudentAdmission: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { students, setStudents, authToken } = useAppContext();
  const isEdit = !!id;
  const existingStudent = isEdit ? students.find(s => s.id === id) : null;

  const [form, setForm] = useState<StudentFormState>(emptyStudent);
  const [initialStudent, setInitialStudent] = useState<StudentFormState | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ name: '', cls: '', fee: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const normalizeDateToYMD = (value: string): string => {
    const trimmed = value?.trim?.() ?? '';
    if (!trimmed) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const isoPrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/);
    if (isoPrefix) return isoPrefix[1];
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const extractStudentFromResponse = (data: any): any => {
    if (!data) return null;
    if (Array.isArray(data)) return data[0] ?? null;
    if (typeof data !== 'object') return null;
    if (Array.isArray((data as any).students)) return (data as any).students[0] ?? null;
    if (Array.isArray((data as any).data)) return (data as any).data[0] ?? null;
    if ((data as any).student && typeof (data as any).student === 'object') return (data as any).student;
    if ((data as any).data && typeof (data as any).data === 'object') return (data as any).data;
    return data;
  };

  const mapApiStudentToFormState = (item: any): StudentFormState | null => {
    if (!item || typeof item !== 'object') return null;

    const baseMonthlyFee = Number(item.monthly_fee ?? item.monthlyFee ?? 0) || 0;
    const discountLabel = typeof item.discount === 'string' ? item.discount : 'No Discount';
    let discountedFee = baseMonthlyFee;
    if (typeof item.discounted_fee === 'number') {
      discountedFee = item.discounted_fee;
    } else if (typeof item.discountedFee === 'number') {
      discountedFee = item.discountedFee;
    } else if (discountLabel !== 'No Discount') {
      const pct = parseInt(discountLabel);
      if (!Number.isNaN(pct)) {
        discountedFee = Math.round(baseMonthlyFee * (1 - pct / 100));
      }
    }

    const rawStatus: string = item.status ?? 'Active';
    const status: 'Active' | 'Left' = rawStatus === 'Left' ? 'Left' : 'Active';

    const classId = item.class_id != null ? String(item.class_id) : undefined;

    return {
      fullName: item.full_name ?? item.fullName ?? '',
      fatherName: item.father_name ?? item.fatherName ?? '',
      dateOfBirth: normalizeDateToYMD(item.date_of_birth ?? item.dateOfBirth ?? ''),
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
      admissionDate: normalizeDateToYMD(item.admission_date ?? item.admissionDate ?? ''),
      studentClass:
        item.student_class ??
        item.studentClass ??
        item.class_name ??
        item.className ??
        item.class?.name ??
        item.class?.class_name ??
        item.class?.title ??
        item.class?.label ??
        (classId ? `Class ${classId}` : ''),
      class_id: classId,
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
  };

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
    if (!classes.length) return;
    if (selectedClassId) {
      const cls = classes.find(c => c.id === selectedClassId);
      if (cls && form.studentClass !== cls.name) {
        setForm(prev => ({ ...prev, studentClass: cls.name, class_id: cls.id }));
        setErrors(prev => ({ ...prev, studentClass: false }));
      }
      return;
    }

    if (!form.studentClass) return;

    const matchByName = classes.find(c => c.name === form.studentClass);
    if (matchByName) {
      setSelectedClassId(matchByName.id);
      setForm(prev => ({ ...prev, class_id: matchByName.id }));
      return;
    }

    const idMatch = form.studentClass.match(/^Class\s+(\d+)$/);
    if (!idMatch) return;
    const matchById = classes.find(c => c.id === idMatch[1]);
    if (matchById) {
      setSelectedClassId(matchById.id);
      setForm(prev => ({ ...prev, studentClass: matchById.name, class_id: matchById.id }));
      setErrors(prev => ({ ...prev, studentClass: false }));
    }
  }, [classes, form.studentClass, selectedClassId]);

  useEffect(() => {
    // Fast local prefill while API request runs.
    if (!isEdit) return;
    if (!existingStudent) return;
    if (initialStudent) return;

    const { id: _id, ...rest } = existingStudent;
    setForm(rest);
    setInitialStudent(rest);
    if (existingStudent.class_id) setSelectedClassId(String(existingStudent.class_id));
  }, [existingStudent, initialStudent, isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;

    const controller = new AbortController();
    const loadStudent = async () => {
      try {
        setIsLoadingStudent(true);
        setApiError(null);

        const headers: HeadersInit = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch(`${API_BASE_URL}/students/${id}`, { signal: controller.signal, headers });
        if (!response.ok) {
          return;
        }

        const data = await response.json().catch(() => null);
        const raw = extractStudentFromResponse(data);
        const mapped = mapApiStudentToFormState(raw);
        if (!mapped) return;

        setForm(mapped);
        setInitialStudent(mapped);
        if (mapped.class_id) setSelectedClassId(String(mapped.class_id));
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
      } finally {
        setIsLoadingStudent(false);
      }
    };

    loadStudent();
    return () => controller.abort();
  }, [authToken, id, isEdit]);

  const update = (field: string, value: string | number | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const validate = (): boolean => {
    const required: (keyof StudentFormState)[] = ['fullName', 'fatherName', 'dateOfBirth', 'gender', 'fatherPhone', 'homeAddress', 'admissionDate', 'studentClass'];
    const newErrors: Record<string, boolean> = {};

    required.forEach(f => {
      const current = (form as any)[f];
      const initial = initialStudent ? (initialStudent as any)[f] : undefined;
      const hasCurrent = !!current;
      const clearedButInitialExists = isEdit && (current === '' || current === null) && !!initial;
      if (!hasCurrent && !clearedButInitialExists) newErrors[String(f)] = true;
    });

    const discountChanged = initialStudent ? form.discount !== initialStudent.discount : true;
    if (form.discount !== 'No Discount' && discountChanged && !String(form.discountReason ?? '').trim()) {
      newErrors['discountReason'] = true;
    }

    setErrors(newErrors);
    setApiError(null);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError(null);

    const baseUrl = `${API_BASE_URL}/students`;
    try {
      if (isEdit && id) {
        const snapshot = initialStudent ?? (existingStudent ? (({ id: _id, ...rest }) => rest)(existingStudent) : null);
        if (!snapshot) {
          setApiError('Unable to load student details. Please go back and try again.');
          return;
        }

        const patch = buildStudentUpdatePayload(snapshot, form);
        if (Object.keys(patch).length === 0) {
          navigate('/students');
          return;
        }

        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch(`${baseUrl}/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(patch),
        });

        if (!response.ok) {
          let message = 'Failed to update student';
          try {
            const errorData = await response.json();
            if (typeof errorData?.message === 'string') {
              message = errorData.message;
            }
          } catch {
            // ignore parse error
          }
          setApiError(message);
          return;
        }

        const updatedResponse = await response.json().catch(() => null);
        const raw = extractStudentFromResponse(updatedResponse);
        const mapped = mapApiStudentToFormState(raw);
        if (mapped) {
          const updatedStudent: Student = {
            ...mapped,
            id: String(raw?.id ?? raw?._id ?? id),
            monthlyFee: mapped.monthlyFee ?? 0,
            discountedFee: mapped.discountedFee ?? 0,
          };
          setStudents(prev => prev.map(s => (s.id === id ? updatedStudent : s)));
        } else {
          setStudents(prev =>
            prev.map(s =>
              s.id === id
                ? { ...s, ...form, id, monthlyFee: form.monthlyFee ?? s.monthlyFee, discountedFee: form.discountedFee ?? s.discountedFee }
                : s,
            ),
          );
        }
        navigate('/students');
      } else {
        // Generate admission number like ADM2026-00123
        const now = new Date();
        const year = now.getFullYear();
        const unique = String(now.getTime()).slice(-5);
        const admissionNo = `ADM${year}-${unique}`;

        const basePayload: Record<string, unknown> = {
          full_name: form.fullName,
          father_name: form.fatherName,
          date_of_birth: form.dateOfBirth,
          religion: form.religion,
          gender: form.gender,
          father_phone: form.fatherPhone,
          home_address: form.homeAddress,
          admission_date: form.admissionDate,
          discount: form.discount,
          discount_reason: form.discountReason || '',
        };

        const classId = selectedClassId || form.class_id || (() => {
          const idMatch = form.studentClass.match(/^Class\s+(\d+)$/);
          return idMatch ? idMatch[1] : '';
        })();
        if (classId) basePayload.class_id = classId;

        const payload: Record<string, unknown> = {
          ...basePayload,
          admission_no: admissionNo,
        };

        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let message = 'Failed to register student';
          try {
            const errorData = await response.json();
            if (typeof errorData?.message === 'string') {
              message = errorData.message;
            } else if (typeof errorData?.error === 'string') {
              message = errorData.error;
            }
          } catch {
            // ignore parse error
          }
          setApiError(message);
          return;
        }

        const data = await response.json().catch(() => ({} as any));

        // Try to locate the created student object from common API response shapes
        let created: any = null;
        if (Array.isArray(data)) {
          created = data[0] ?? null;
        } else if (data && typeof data === 'object') {
          if (Array.isArray((data as any).students)) {
            created = (data as any).students[0] ?? null;
          } else if (Array.isArray((data as any).data)) {
            created = (data as any).data[0] ?? null;
          } else if ((data as any).student && typeof (data as any).student === 'object') {
            created = (data as any).student;
          } else if ((data as any).data && typeof (data as any).data === 'object') {
            created = (data as any).data;
          } else {
            created = data;
          }
        }

        const backendId = created?.id ?? created?._id ?? created?.student_id;
        if (!backendId) {
          console.error('Student created but response did not contain an ID field. Raw response:', data);
          setApiError('Student created but server did not return an ID. Please contact support.');
          return;
        }

        const newId = String(backendId);
        setStudents(prev => [
          ...prev,
          {
            ...form,
            id: newId,
            monthlyFee: form.monthlyFee ?? 0,
            discountedFee: form.discountedFee ?? 0,
          },
        ]);

        setSuccessInfo({ name: form.fullName, cls: form.studentClass, fee: form.discountedFee ?? 0 });
        setShowSuccess(true);
      }
    } catch (err) {
      setApiError('Unable to connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setForm(emptyStudent);
    setErrors({});
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card ${errors[field] ? 'border-destructive' : 'border-input'}`;

  const selectClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-card appearance-none ${errors[field] ? 'border-destructive' : 'border-input'}`;

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex items-center gap-2 mb-4 mt-6 first:mt-0">
      <div className="w-1 h-6 bg-primary rounded-full" />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
  );

  const ErrorMsg: React.FC<{ field: string }> = ({ field }) =>
    errors[field] ? <p className="text-destructive text-xs mt-1">This field is required</p> : null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">
          {isEdit ? `Edit Student — ${form.fullName || existingStudent?.fullName || ''}` : 'New Student Admission'}
          {isEdit && isLoadingStudent ? ' (loading...)' : ''}
        </h1>
        <p className="text-sm text-muted-foreground">Hassan Public School — Butmong</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main form */}
        <div className="flex-1 bg-card rounded-xl shadow-sm border border-border p-6">
          {apiError && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm">
              {apiError}
            </div>
          )}
          {/* Personal Information */}
          <SectionHeader title="Personal Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Full Name *</label>
              <input value={form.fullName} onChange={e => update('fullName', e.target.value)} className={inputClass('fullName')} placeholder="Student full name" />
              <ErrorMsg field="fullName" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Father Name *</label>
              <input value={form.fatherName} onChange={e => update('fatherName', e.target.value)} className={inputClass('fatherName')} placeholder="Father's name" />
              <ErrorMsg field="fatherName" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Date of Birth *</label>
              <input type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} className={inputClass('dateOfBirth')} />
              <ErrorMsg field="dateOfBirth" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Gender *</label>
              <select value={form.gender} onChange={e => update('gender', e.target.value)} className={selectClass('gender')}>
                <option value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
              <ErrorMsg field="gender" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Religion</label>
              <select value={form.religion} onChange={e => update('religion', e.target.value)} className={selectClass('')}>
                <option>Islam</option>
                <option>Christianity</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Nationality</label>
              <input value={form.nationality} onChange={e => update('nationality', e.target.value)} className={inputClass('')} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Place of Birth</label>
              <input value={form.placeOfBirth} onChange={e => update('placeOfBirth', e.target.value)} className={inputClass('')} placeholder="City / Village" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Mother Tongue</label>
              <select value={form.motherTongue} onChange={e => update('motherTongue', e.target.value)} className={selectClass('')}>
                <option value="">Select</option>
                <option>Urdu</option>
                <option>Punjabi</option>
                <option>Pashto</option>
                <option>Sindhi</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <SectionHeader title="Contact Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Student Phone</label>
              <input value={form.studentPhone} onChange={e => update('studentPhone', e.target.value)} className={inputClass('')} placeholder="03XX-XXXXXXX" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Father Phone *</label>
              <input value={form.fatherPhone} onChange={e => update('fatherPhone', e.target.value)} className={inputClass('fatherPhone')} placeholder="03XX-XXXXXXX" />
              <ErrorMsg field="fatherPhone" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Mother Name</label>
              <input value={form.motherName} onChange={e => update('motherName', e.target.value)} className={inputClass('')} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Mother Phone</label>
              <input value={form.motherPhone} onChange={e => update('motherPhone', e.target.value)} className={inputClass('')} placeholder="03XX-XXXXXXX" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Emergency Contact Name</label>
              <input value={form.emergencyContactName} onChange={e => update('emergencyContactName', e.target.value)} className={inputClass('')} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Emergency Contact Phone</label>
              <input value={form.emergencyContactPhone} onChange={e => update('emergencyContactPhone', e.target.value)} className={inputClass('')} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">Home Address *</label>
              <textarea value={form.homeAddress} onChange={e => update('homeAddress', e.target.value)} className={`${inputClass('homeAddress')} resize-none`} rows={2} placeholder="Full home address" />
              <ErrorMsg field="homeAddress" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">District</label>
              <input value={form.district} onChange={e => update('district', e.target.value)} className={inputClass('')} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tehsil</label>
              <input value={form.tehsil} onChange={e => update('tehsil', e.target.value)} className={inputClass('')} />
            </div>
          </div>

          {/* Academic Information */}
          <SectionHeader title="Academic Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Admission Date *</label>
              <input type="date" value={form.admissionDate} onChange={e => update('admissionDate', e.target.value)} className={inputClass('admissionDate')} />
              <ErrorMsg field="admissionDate" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Class *</label>
              <select
                value={selectedClassId}
                onChange={e => {
                  const newId = e.target.value;
                  setSelectedClassId(newId);
                  const cls = classes.find(c => c.id === newId);
                  const name = cls?.name ?? '';
                  const baseFee = CLASS_FEE_MAP[name] || 0;
                  setForm(prev => ({
                    ...prev,
                    studentClass: name,
                    class_id: newId || undefined,
                    monthlyFee: baseFee,
                    discountedFee: calcDiscountedFee(baseFee, prev.discount),
                  }));
                  setErrors(prev => ({ ...prev, studentClass: false }));
                }}
                className={selectClass('studentClass')}
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ErrorMsg field="studentClass" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Section</label>
              <select value={form.section} onChange={e => update('section', e.target.value)} className={selectClass('')}>
                <option value="">Select</option>
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Roll Number</label>
              <input type="number" value={form.rollNumber ?? ''} onChange={e => update('rollNumber', e.target.value ? parseInt(e.target.value) : null)} className={inputClass('')} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Previous School Name</label>
              <input value={form.previousSchool} onChange={e => update('previousSchool', e.target.value)} className={inputClass('')} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Previous Class</label>
              <input value={form.previousClass} onChange={e => update('previousClass', e.target.value)} className={inputClass('')} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Previous School Result</label>
              <select value={form.previousResult} onChange={e => update('previousResult', e.target.value)} className={selectClass('')}>
                <option>N/A</option>
                <option>Excellent</option>
                <option>Good</option>
                <option>Average</option>
                <option>Poor</option>
              </select>
            </div>
          </div>

          {/* Fee Information */}
          <SectionHeader title="Fee & Discount Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Monthly Fee (Rs.)</label>
              <input
                type="number"
                value={form.monthlyFee ?? ''}
                onChange={e => {
                  const raw = e.target.value;
                  if (raw === '') {
                    update('monthlyFee', null);
                    return;
                  }
                  const next = parseInt(raw);
                  update('monthlyFee', Number.isNaN(next) ? 0 : next);
                }}
                className={inputClass('')}
              />
              {form.studentClass && <p className="text-xs text-muted-foreground mt-1">Standard fee for {form.studentClass}: {formatRs(CLASS_FEE_MAP[form.studentClass] || 0)}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Fee Discount</label>
              <select
                value={form.discount}
                onChange={e => {
                  const newDiscount = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    discount: newDiscount,
                    discountedFee: calcDiscountedFee(prev.monthlyFee ?? 0, newDiscount),
                  }));
                  setErrors(prev => ({ ...prev, discountReason: false }));
                }}
                className={selectClass('')}
              >
                {DISCOUNT_OPTIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Final Monthly Fee (Rs.)</label>
              <input
                type="number"
                value={form.discountedFee ?? ''}
                onChange={e => {
                  const raw = e.target.value;
                  if (raw === '') {
                    update('discountedFee', null);
                    return;
                  }
                  const next = parseInt(raw);
                  update('discountedFee', Number.isNaN(next) ? 0 : next);
                }}
                className={inputClass('')}
              />
              {form.discount !== 'No Discount' && (
                <p className="text-xs text-muted-foreground mt-1">After {form.discount} discount</p>
              )}
            </div>
            {form.discount !== 'No Discount' && (
              <div>
                <label className="text-sm font-medium text-foreground">Reason for Discount *</label>
                <input value={form.discountReason} onChange={e => update('discountReason', e.target.value)} className={inputClass('discountReason')} placeholder="e.g. Orphan / Staff child / Financial hardship / Merit" />
                <ErrorMsg field="discountReason" />
              </div>
            )}
            <div className="md:col-span-2">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Final Monthly Fee</p>
                <p className="text-2xl font-bold text-primary">{formatRs(form.discountedFee ?? 0)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <SectionHeader title="Additional Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">B-Form Number</label>
              <input value={form.bFormNumber} onChange={e => update('bFormNumber', e.target.value)} className={inputClass('')} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Father CNIC</label>
              <input value={form.fatherCnic} onChange={e => update('fatherCnic', e.target.value)} className={inputClass('')} placeholder="00000-0000000-0" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Previous TC Number</label>
              <input value={form.previousTcNumber} onChange={e => update('previousTcNumber', e.target.value)} className={inputClass('')} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Medical Condition</label>
              <input value={form.medicalCondition} onChange={e => update('medicalCondition', e.target.value)} className={inputClass('')} placeholder="If any" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">Notes / Remarks</label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className={`${inputClass('')} resize-none`} rows={3} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button onClick={handleClear} className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">
              <RotateCcw size={16} /> Clear Form
            </button>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">
                <Save size={16} /> Save as Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} /> {isEdit ? (isSubmitting ? 'Updating...' : 'Update Student') : (isSubmitting ? 'Registering...' : 'Register Student')}
              </button>
            </div>
          </div>
        </div>

        {/* Fee Structure Card */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-card rounded-xl shadow-sm border border-border sticky top-4">
            <div className="bg-primary text-primary-foreground px-4 py-3 rounded-t-xl">
              <h3 className="font-semibold text-sm">Fee Structure — 2026</h3>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-foreground">Class</th>
                    <th className="text-right py-2 font-medium text-foreground">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {FEE_STRUCTURE.map(f => (
                    <tr key={f.label} className="border-b border-border last:border-0">
                      <td className="py-2 text-muted-foreground">{f.label}</td>
                      <td className="py-2 text-right font-medium text-foreground">{formatRs(f.fee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="text-success" size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Student Registered Successfully!</h3>
            </div>
            <div className="bg-muted rounded-lg p-4 mb-4 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{successInfo.name}</span></p>
              <p><span className="text-muted-foreground">Class:</span> <span className="font-medium text-foreground">{successInfo.cls}</span></p>
              <p><span className="text-muted-foreground">Monthly Fee:</span> <span className="font-bold text-primary">{formatRs(successInfo.fee)}</span></p>
              <p className="text-muted-foreground text-xs mt-2">Receipt will be generated on first fee payment</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowSuccess(false); handleClear(); }} className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors">
                Register Another
              </button>
              <button onClick={() => { setShowSuccess(false); navigate('/students'); }} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                View Students List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAdmission;
