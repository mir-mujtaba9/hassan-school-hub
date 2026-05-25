import type { Student } from "@/data/students";

export type StudentFormState = Omit<Student, "id" | "monthlyFee" | "discountedFee"> & {
  monthlyFee: number | null;
  discountedFee: number | null;
};

export type StudentUpdatePayload = Record<string, unknown>;

function isBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim() === "";
}

function normalizeDateToYMD(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  const direct = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
  if (direct) return trimmed;

  const isoPrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoPrefix) return isoPrefix[1];

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shouldTreatAsNoChange(current: unknown): boolean {
  // Edge rule: cleared inputs ("" or null) are treated as no-change.
  if (current === "" || current === null) return true;
  if (isBlankString(current)) return true;
  return false;
}

function eqDate(a: unknown, b: unknown): boolean {
  const na = normalizeDateToYMD(a);
  const nb = normalizeDateToYMD(b);
  return na === nb;
}

export function buildStudentUpdatePayload(initialStudent: StudentFormState, formState: StudentFormState): StudentUpdatePayload {
  const payload: StudentUpdatePayload = {};

  const discountChanged = (formState.discount ?? "") !== (initialStudent.discount ?? "");
  const discountNow = formState.discount ?? "";

  const maybeSet = (key: string, current: unknown, initial: unknown) => {
    if (shouldTreatAsNoChange(current)) return;

    if (key === "admission_date" || key === "date_of_birth") {
      if (!eqDate(current, initial)) {
        const normalized = normalizeDateToYMD(current);
        if (normalized) payload[key] = normalized;
      }
      return;
    }

    if (current !== initial) {
      payload[key] = current;
    }
  };

  // Personal
  maybeSet("full_name", formState.fullName, initialStudent.fullName);
  maybeSet("father_name", formState.fatherName, initialStudent.fatherName);
  maybeSet("date_of_birth", formState.dateOfBirth, initialStudent.dateOfBirth);
  maybeSet("gender", formState.gender, initialStudent.gender);
  maybeSet("religion", formState.religion, initialStudent.religion);
  maybeSet("nationality", formState.nationality, initialStudent.nationality);
  maybeSet("place_of_birth", formState.placeOfBirth, initialStudent.placeOfBirth);
  maybeSet("mother_tongue", formState.motherTongue, initialStudent.motherTongue);

  // Contact
  maybeSet("student_phone", formState.studentPhone, initialStudent.studentPhone);
  maybeSet("father_phone", formState.fatherPhone, initialStudent.fatherPhone);
  maybeSet("mother_name", formState.motherName, initialStudent.motherName);
  maybeSet("mother_phone", formState.motherPhone, initialStudent.motherPhone);
  maybeSet("emergency_contact_name", formState.emergencyContactName, initialStudent.emergencyContactName);
  maybeSet("emergency_contact_phone", formState.emergencyContactPhone, initialStudent.emergencyContactPhone);
  maybeSet("home_address", formState.homeAddress, initialStudent.homeAddress);
  maybeSet("district", formState.district, initialStudent.district);
  maybeSet("tehsil", formState.tehsil, initialStudent.tehsil);

  // Academic
  maybeSet("admission_date", formState.admissionDate, initialStudent.admissionDate);

  // Prefer class_id (backend field); studentClass is display-only.
  maybeSet("class_id", formState.class_id ?? "", initialStudent.class_id ?? "");

  maybeSet("section", formState.section, initialStudent.section);

  // Clearing roll number is not supported yet.
  if (formState.rollNumber !== initialStudent.rollNumber && !shouldTreatAsNoChange(formState.rollNumber)) {
    payload["roll_number"] = formState.rollNumber;
  }

  maybeSet("previous_school", formState.previousSchool, initialStudent.previousSchool);
  maybeSet("previous_class", formState.previousClass, initialStudent.previousClass);
  maybeSet("previous_result", formState.previousResult, initialStudent.previousResult);

  // Fee
  if (formState.monthlyFee !== initialStudent.monthlyFee && !shouldTreatAsNoChange(formState.monthlyFee)) {
    if (typeof formState.monthlyFee === "number") payload["monthly_fee"] = formState.monthlyFee;
  }

  // Discount / discounted fee
  maybeSet("discount", discountNow, initialStudent.discount);

  if (formState.discountedFee !== initialStudent.discountedFee && !shouldTreatAsNoChange(formState.discountedFee)) {
    if (typeof formState.discountedFee === "number") payload["discounted_fee"] = formState.discountedFee;
  }

  // Discount reason rules
  if (discountNow === "No Discount") {
    // If discount becomes "No Discount", omit discount_reason; backend keeps it null.
  } else {
    const reasonCleared = shouldTreatAsNoChange(formState.discountReason);
    const reasonChanged = formState.discountReason !== initialStudent.discountReason;

    // If discount changed away from "No Discount", include reason (required in UI).
    if (discountChanged) {
      if (!reasonCleared) payload["discount_reason"] = formState.discountReason;
    } else if (reasonChanged && !reasonCleared) {
      payload["discount_reason"] = formState.discountReason;
    }
  }

  // Additional
  maybeSet("b_form_number", formState.bFormNumber, initialStudent.bFormNumber);
  maybeSet("father_cnic", formState.fatherCnic, initialStudent.fatherCnic);
  maybeSet("previous_tc_number", formState.previousTcNumber, initialStudent.previousTcNumber);
  maybeSet("medical_condition", formState.medicalCondition, initialStudent.medicalCondition);
  maybeSet("notes", formState.notes, initialStudent.notes);

  // Status (not currently editable in UI, but keep parity)
  maybeSet("status", formState.status, initialStudent.status);

  return payload;
}
